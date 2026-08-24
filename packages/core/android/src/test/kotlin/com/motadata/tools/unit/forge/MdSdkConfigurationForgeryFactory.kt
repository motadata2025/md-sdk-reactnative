/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.motadata.tools.unit.forge

import com.motadata.reactnative.ConfigurationForTelemetry
import com.motadata.reactnative.MdSdkConfiguration
import com.motadata.reactnative.RumConfiguration
import com.motadata.reactnative.TraceConfiguration
import fr.xgouchet.elmyr.Forge
import fr.xgouchet.elmyr.ForgeryFactory
import java.util.UUID

class MdSdkConfigurationForgeryFactory : ForgeryFactory<MdSdkConfiguration> {

    override fun getForgery(forge: Forge): MdSdkConfiguration {
        return MdSdkConfiguration(
            additionalConfiguration = forge.aMap {
                forge.anAsciiString() to forge.anElementFrom(
                    forge.aMap { forge.anAsciiString() to forge.aString() },
                    forge.aString(),
                    null
                )
            },
            clientToken = forge.aStringMatching("pub[a-f0-9]{32}"),
            env = forge.anAlphabeticalString(),
            site = forge.aNullable { anElementFrom("US", "EU", "GOV") },
            service = forge.aNullable { forge.anAlphabeticalString() },
            verbosity = forge.aNullable { anElementFrom("debug", "info", "warn", "error") },
            trackingConsent = forge.aNullable {
                anElementFrom("pending", "granted", "not_granted")
            },
            uploadFrequency = forge.aNullable {
                anElementFrom(
                    "RARE",
                    "FREQUENT",
                    "AVERAGE"
                )
            },
            batchSize = forge.aNullable {
                anElementFrom(
                    "SMALL",
                    "MEDIUM",
                    "LARGE"
                )
            },
            batchProcessingLevel = forge.aNullable {
                anElementFrom(
                    "LOW",
                    "MEDIUM",
                    "HIGH"
                )
            },
            proxyConfiguration = null,
            rumConfiguration = RumConfiguration(
                applicationId = forge.getForgery<UUID>().toString(),
                trackFrustrations = forge.aNullable { aBool() },
                longTaskThresholdMs = forge.aNullable { aDouble(0.0, 100.0) },
                sessionSampleRate = forge.aNullable { aDouble(0.0, 100.0) },
                resourceTraceSampleRate = forge.aNullable { aDouble(0.0, 100.0) },
                vitalsUpdateFrequency = forge.aNullable {
                    anElementFrom("RARE", "NEVER", "FREQUENT", "AVERAGE")
                },
                trackBackgroundEvents = forge.aNullable { forge.aBool() },
                nativeCrashReportEnabled = forge.aNullable { aBool() },
                nativeLongTaskThresholdMs = forge.aNullable { aDouble(100.0, 5000.0) },
                nativeViewTracking = forge.aNullable { aBool() },
                nativeInteractionTracking = forge.aNullable { aBool() },
                firstPartyHosts = null,
                trackNonFatalAnrs = forge.aNullable { aBool() },
                initialResourceThreshold = forge.aNullable { aDouble(0.0, 2.0) },
                telemetrySampleRate = forge.aNullable { aDouble(0.0, 100.0) },
                customEndpoint = forge.aNullable { aString() }
            ),
            traceConfiguration = TraceConfiguration(
                customEndpoint = forge.aNullable { aString() }
            ),
            configurationForTelemetry = ConfigurationForTelemetry(
                initializationType = forge.anAlphabeticalString(),
                trackErrors = forge.aBool(),
                trackInteractions = forge.aBool(),
                trackNetworkRequests = forge.aBool(),
                reactVersion = forge.aString(),
                reactNativeVersion = forge.aString()
            )
        )
    }
}
