/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.motadata.reactnative

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import com.motadata.android.Motadata
import com.motadata.android.MotadataSite
import com.motadata.android.core.configuration.BatchProcessingLevel
import com.motadata.android.core.configuration.BatchSize
import com.motadata.android.core.configuration.Configuration
import com.motadata.android.core.configuration.UploadFrequency
import com.motadata.android.event.EventMapper
import com.motadata.android.privacy.TrackingConsent
import com.motadata.android.rum.Rum
import com.motadata.android.rum.RumConfiguration
import com.motadata.android._InternalProxy
import com.motadata.android.rum._RumInternalProxy
import com.motadata.android.rum.configuration.VitalsUpdateFrequency
import com.motadata.android.rum.metric.networksettled.TimeBasedInitialResourceIdentifier
import com.motadata.android.rum.model.ActionEvent
import com.motadata.android.rum.model.ResourceEvent
import com.motadata.android.rum.tracking.ActivityViewTrackingStrategy
import com.motadata.android.telemetry.model.TelemetryConfigurationEvent
import com.motadata.android.trace.Trace
import com.motadata.android.trace.TraceConfiguration
import com.google.gson.Gson
import java.util.Locale
import kotlin.time.Duration.Companion.seconds


/**
 * Initializes the Android Motadata SDK.
 */
class MdSdkNativeInitialization internal constructor(
    private val appContext: Context,
    private val motadata: MotadataWrapper = MotadataSDKWrapper(),
    private val ddTelemetry: MdTelemetry = MdTelemetry(),
    private val jsonFileReader: JSONFileReader = JSONFileReader()
) {
    @Suppress("CyclomaticComplexMethod")
    internal fun initialize(ddSdkConfiguration: MdSdkConfiguration, isCalledFromJs: Boolean = true) {
        val sdkConfiguration = buildSdkConfiguration(ddSdkConfiguration)
        val trackingConsent = buildTrackingConsent(ddSdkConfiguration.trackingConsent)
        var rumConfiguration: RumConfiguration? = null
        var traceConfiguration: TraceConfiguration? = null

        if (ddSdkConfiguration.rumConfiguration != null) {
             rumConfiguration = buildRumConfiguration(ddSdkConfiguration)
        }

        if (ddSdkConfiguration.traceConfiguration != null) {
            traceConfiguration = buildTraceConfiguration(ddSdkConfiguration)
        }

        configureSdkVerbosity(ddSdkConfiguration)

        if (isCalledFromJs) {
            MdSdkSessionStartedListener.getInstance().onRnSdkInitialized()
            // Handles the case in which the SDK was already initialized with initFromNative.
            if (motadata.isInitialized()) {
                motadata.getRumMonitor().getCurrentSessionId {
                    it?.let { sessionId ->
                        MdSdkSessionStartedListener.getInstance().onSessionStarted(sessionId, false)
                    }
                }
            }
        }

        motadata.initialize(appContext, sdkConfiguration, trackingConsent)

        if (rumConfiguration != null) {
            Rum.enable(rumConfiguration, Motadata.getInstance())
        }

        if (traceConfiguration != null) {
            Trace.enable(traceConfiguration, Motadata.getInstance())
        }
    }

    private fun configureSdkVerbosity(configuration: MdSdkConfiguration) {
        val verbosity =
            when (configuration.verbosity?.lowercase(Locale.US)) {
                "debug" -> Log.DEBUG
                "info" -> Log.INFO
                "warn" -> Log.WARN
                "error" -> Log.ERROR
                else -> null
            }
        if (verbosity != null) {
            motadata.setVerbosity(verbosity)
        }
    }

    private fun getDefaultAppVersion(): String {
        val packageName = appContext.packageName
        val packageInfo =
            try {
                appContext.packageManager.getPackageInfo(packageName, 0)
            } catch (e: PackageManager.NameNotFoundException) {
                ddTelemetry.telemetryError(e.message ?: MdSdkImplementation.PACKAGE_INFO_NOT_FOUND_ERROR_MESSAGE, e)
                return MdSdkImplementation.DEFAULT_APP_VERSION
            }

        return packageInfo?.let {
            // we need to use the deprecated method because getLongVersionCode method is only
            // available from API 28 and above
            @Suppress("DEPRECATION")
            it.versionName ?: it.versionCode.toString()
        }
            ?: MdSdkImplementation.DEFAULT_APP_VERSION
    }

    @Suppress("CyclomaticComplexMethod")
    private fun buildRumConfiguration(configuration: MdSdkConfiguration): RumConfiguration {
        val configBuilder =
            RumConfiguration.Builder(
                applicationId = configuration.rumConfiguration?.applicationId ?: ""
            )
        if (configuration.rumConfiguration?.sessionSampleRate != null) {
            configBuilder.setSessionSampleRate(configuration.rumConfiguration.sessionSampleRate.toFloat())
        }

        configBuilder.trackFrustrations(configuration.rumConfiguration?.trackFrustrations ?: true)
        configBuilder.trackBackgroundEvents(configuration.rumConfiguration?.trackBackgroundEvents ?: false)

        configBuilder.setVitalsUpdateFrequency(
            buildVitalUpdateFrequency(configuration.rumConfiguration?.vitalsUpdateFrequency)
        )

        val telemetrySampleRate = (configuration.rumConfiguration?.telemetrySampleRate as? Number)?.toFloat()
        telemetrySampleRate?.let { configBuilder.setTelemetrySampleRate(it) }

        val longTask = (configuration.rumConfiguration?.nativeLongTaskThresholdMs as? Number)?.toLong()
        if (longTask != null) {
            configBuilder.trackLongTasks(longTask)
        }

        if (configuration.rumConfiguration?.nativeViewTracking == true) {
            // Use sensible default
            configBuilder.useViewTrackingStrategy(ActivityViewTrackingStrategy(false))
        } else {
            configBuilder.useViewTrackingStrategy(NoOpViewTrackingStrategy)
        }

        if (configuration.rumConfiguration?.nativeInteractionTracking == false) {
            configBuilder.disableUserInteractionTracking()
        }

        configBuilder.setResourceEventMapper(
            object : EventMapper<ResourceEvent> {
                override fun map(event: ResourceEvent): ResourceEvent? {
                    if (event.context?.additionalProperties?.containsKey(MdSdkImplementation.MD_DROP_RESOURCE) ==
                        true
                    ) {
                        return null
                    }
                    return event
                }
            }
        )

        configBuilder.setActionEventMapper(
            object : EventMapper<ActionEvent> {
                override fun map(event: ActionEvent): ActionEvent? {
                    if (event.context?.additionalProperties?.containsKey(MdSdkImplementation.MD_DROP_ACTION) == true
                    ) {
                        return null
                    }
                    return event
                }
            }
        )

        _RumInternalProxy.setTelemetryConfigurationEventMapper(
            configBuilder,
            object : EventMapper<TelemetryConfigurationEvent> {
                override fun map(
                    event: TelemetryConfigurationEvent
                ): TelemetryConfigurationEvent? {
                    event.telemetry.configuration.trackNativeErrors =
                        configuration.rumConfiguration?.nativeCrashReportEnabled
                    // trackCrossPlatformLongTasks will be deprecated for trackLongTask
                    event.telemetry.configuration.trackCrossPlatformLongTasks =
                        configuration.rumConfiguration?.longTaskThresholdMs != 0.0
                    event.telemetry.configuration.trackLongTask =
                        configuration.rumConfiguration?.longTaskThresholdMs != 0.0
                    event.telemetry.configuration.trackNativeLongTasks =
                        configuration.rumConfiguration?.nativeLongTaskThresholdMs != 0.0

                    event.telemetry.configuration.initializationType =
                        configuration.configurationForTelemetry?.initializationType
                    event.telemetry.configuration.trackInteractions =
                        configuration.configurationForTelemetry?.trackInteractions
                    event.telemetry.configuration.trackErrors =
                        configuration.configurationForTelemetry?.trackErrors
                    event.telemetry.configuration.trackResources =
                        configuration.configurationForTelemetry?.trackNetworkRequests
                    event.telemetry.configuration.trackNetworkRequests =
                        configuration.configurationForTelemetry?.trackNetworkRequests
                    event.telemetry.configuration.reactVersion =
                        configuration.configurationForTelemetry?.reactVersion
                    event.telemetry.configuration.reactNativeVersion =
                        configuration.configurationForTelemetry?.reactNativeVersion

                    return event
                }
            }
        )

        configuration.rumConfiguration?.customEndpoint?.let {
            configBuilder.useCustomEndpoint(it)
        }

        configuration.rumConfiguration?.trackNonFatalAnrs?.let {
            configBuilder.trackNonFatalAnrs(it)
        }

        configuration.rumConfiguration?.initialResourceThreshold?.let {
            val milliseconds = it.seconds.inWholeMilliseconds
            configBuilder.setInitialResourceIdentifier(TimeBasedInitialResourceIdentifier(milliseconds))
        }

        configBuilder.setSessionListener(MdSdkSessionStartedListener.getInstance())

        return configBuilder.build()
    }

    private fun buildTraceConfiguration(configuration: MdSdkConfiguration): TraceConfiguration {
        val configBuilder = TraceConfiguration.Builder()
        configuration.traceConfiguration?.customEndpoint?.let {
            configBuilder.useCustomEndpoint(it)
        }

        return configBuilder.build()
    }

    private fun buildSdkConfiguration(configuration: MdSdkConfiguration): Configuration {
        val configBuilder = Configuration.Builder(
            clientToken = configuration.clientToken,
            env = configuration.env,
            variant = "",
            service = configuration.service
        )

        val additionalConfig = configuration.additionalConfiguration?.toMutableMap()
        val versionSuffix = configuration.additionalConfiguration?.get(MdSdkImplementation.MD_VERSION_SUFFIX) as? String
        if (versionSuffix != null && additionalConfig != null) {
            val defaultVersion = getDefaultAppVersion()
            additionalConfig.put(MdSdkImplementation.MD_VERSION, defaultVersion + versionSuffix)
        }
        configBuilder.setAdditionalConfiguration(
            additionalConfig?.filterValues { it != null }?.mapValues {
                it.value
            } as Map<String, Any>? ?: emptyMap()
        )

        configBuilder.setCrashReportsEnabled(configuration.rumConfiguration?.nativeCrashReportEnabled ?: false)
        configBuilder.useSite(buildSite(configuration.site))
        configBuilder.setUploadFrequency(
            buildUploadFrequency(configuration.uploadFrequency)
        )
        configBuilder.setBatchSize(
            buildBatchSize(configuration.batchSize)
        )


        configuration.proxyConfiguration?.let { (proxy, authenticator) ->
            configBuilder.setProxy(proxy, authenticator)
        }

        val firstPartyHosts = configuration.rumConfiguration?.firstPartyHosts
        if (firstPartyHosts != null) {
            configBuilder.setFirstPartyHostsWithHeaderType(firstPartyHosts)
        }

        configBuilder.setBatchProcessingLevel(buildBatchProcessingLevel(configuration.batchProcessingLevel))

        if (additionalConfig?.get(MdSdkImplementation.MD_NEEDS_CLEAR_TEXT_HTTP) == true) {
            _InternalProxy.allowClearTextHttp(configBuilder)
        }

        return configBuilder.build()
    }

    private fun buildTrackingConsent(trackingConsent: String?): TrackingConsent {
        return when (trackingConsent?.lowercase(Locale.US)) {
            "pending" -> TrackingConsent.PENDING
            "granted" -> TrackingConsent.GRANTED
            "not_granted" -> TrackingConsent.NOT_GRANTED
            else -> {
                Log.w(
                    MdSdk::class.java.canonicalName,
                    "Unknown consent given: $trackingConsent, " +
                            "using ${TrackingConsent.PENDING} as default"
                )
                TrackingConsent.PENDING
            }
        }
    }

    private fun buildSite(site: String?): MotadataSite {
        val siteLower = site?.lowercase(Locale.US)
        return when (siteLower) {
            "us1", "us" -> MotadataSite.US1
            "eu1", "eu" -> MotadataSite.EU1
            "us3" -> MotadataSite.US3
            "us5" -> MotadataSite.US5
            "us1_fed", "gov" -> MotadataSite.US1_FED
            "us2_fed" -> MotadataSite.US2_FED
            "ap1" -> MotadataSite.AP1
            "ap2" -> MotadataSite.AP2
            else -> MotadataSite.US1
        }
    }

    private fun buildVitalUpdateFrequency(vitalsUpdateFrequency: String?): VitalsUpdateFrequency {
        val vitalUpdateFrequencyLower = vitalsUpdateFrequency?.lowercase(Locale.US)
        return when (vitalUpdateFrequencyLower) {
            "never" -> VitalsUpdateFrequency.NEVER
            "rare" -> VitalsUpdateFrequency.RARE
            "average" -> VitalsUpdateFrequency.AVERAGE
            "frequent" -> VitalsUpdateFrequency.FREQUENT
            else -> VitalsUpdateFrequency.AVERAGE
        }
    }

    private fun buildUploadFrequency(uploadFrequency: String?): UploadFrequency {
        return when (uploadFrequency?.lowercase(Locale.US)) {
            "rare" -> UploadFrequency.RARE
            "average" -> UploadFrequency.AVERAGE
            "frequent" -> UploadFrequency.FREQUENT
            else -> UploadFrequency.AVERAGE
        }
    }

    private fun buildBatchSize(batchSize: String?): BatchSize {
        return when (batchSize?.lowercase(Locale.US)) {
            "small" -> BatchSize.SMALL
            "medium" -> BatchSize.MEDIUM
            "large" -> BatchSize.LARGE
            else -> BatchSize.MEDIUM
        }
    }


    private fun buildBatchProcessingLevel(batchProcessingLevel: String?): BatchProcessingLevel {
        return when (batchProcessingLevel?.lowercase(Locale.US)) {
            "low" -> BatchProcessingLevel.LOW
            "medium" -> BatchProcessingLevel.MEDIUM
            "high" -> BatchProcessingLevel.HIGH
            else -> BatchProcessingLevel.MEDIUM
        }
    }

    internal fun getConfigurationFromJSONFile(): MdSdkConfiguration {
        try {
            val jsonString = jsonFileReader.parseAssetsJSONFile(appContext, "motadata-configuration.json")

            val configuration = Gson().fromJson(jsonString, JSONConfigurationFile::class.java).configuration

            return configuration.asMdSdkConfiguration()
        } catch (@Suppress("TooGenericExceptionCaught") exception: Exception) {
            throw BadConfigurationException(exception)
        }
    }

    @Suppress("UndocumentedPublicClass")
    companion object {
        /**
         * Initializes the Motadata React Native SDK from your MainApplication.
         *
         * @param appContext: The application context of your React Native application.
         */
        @JvmStatic
        fun initFromNative(appContext: Context) {
            val nativeInitialization = MdSdkNativeInitialization(appContext.applicationContext)
            try {
                nativeInitialization.initialize(
                    ddSdkConfiguration = nativeInitialization.getConfigurationFromJSONFile(),
                    isCalledFromJs = false
                )
            } catch (@Suppress("TooGenericExceptionCaught") error: Exception) {
                Log.w(
                    MdSdkNativeInitialization::class.java.canonicalName,
                    "Failed to initialize the Motadata SDK: $error"
                )
            }
        }
    }
}

internal class BadConfigurationException(exception: Exception) : RuntimeException(exception)
