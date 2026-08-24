/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.motadata.reactnative

import android.content.pm.PackageInfo
import com.motadata.android.rum.RumMonitor
import com.motadata.tools.unit.GenericAssert.Companion.assertThat
import com.motadata.tools.unit.forge.BaseConfigurator
import com.facebook.react.bridge.ReactApplicationContext
import fr.xgouchet.elmyr.annotation.Forgery
import fr.xgouchet.elmyr.junit5.ForgeConfiguration
import fr.xgouchet.elmyr.junit5.ForgeExtension
import java.net.InetSocketAddress
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.extension.Extensions
import org.mockito.Answers
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.isNull
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness

@Extensions(
    ExtendWith(MockitoExtension::class),
    ExtendWith(ForgeExtension::class)
)
@MockitoSettings(strictness = Strictness.LENIENT)
@ForgeConfiguration(value = BaseConfigurator::class)
internal class MdSdkNativeInitializationTest {

    lateinit var testedNativeInitialization: MdSdkNativeInitialization

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    lateinit var mockContext: ReactApplicationContext

    @Forgery
    lateinit var mockPackageInfo: PackageInfo

    @Mock
    lateinit var mockMotadata: MotadataWrapper

    @Mock
    lateinit var mockMdTelemetry: MdTelemetry

    @Mock
    lateinit var mockJSONFileReader: JSONFileReader

    @BeforeEach
    fun `set up`() {
        whenever(mockContext.packageName) doReturn "packageName"
        whenever(
            mockContext.packageManager.getPackageInfo(
                "packageName",
                0
            )
        ) doReturn mockPackageInfo

        testedNativeInitialization = MdSdkNativeInitialization(
            mockContext,
            mockMotadata,
            mockMdTelemetry,
            mockJSONFileReader
        )

        MdSdkSessionStartedListener.invalidate()
        MdSdkSessionStartedListener.resetIsRnSdkInitialized()
    }

    // region getConfigurationFromJSONFile

    @Test
    fun `𝕄 parse configuration file 𝕎 getConfigurationFromJSONFile() {file with all data}`() {
        // Given
        whenever(
            mockJSONFileReader.parseAssetsJSONFile(mockContext, "motadata-configuration.json")
        ) doReturn javaClass.getResource(
            "/input/complete-configuration.json"
        ).readText()

        // When
        val configuration = testedNativeInitialization.getConfigurationFromJSONFile()

        // Then
        assertThat(configuration.clientToken).isEqualTo("fake-client-token")
        assertThat(configuration.env).isEqualTo("fake-env")
        assertThat(configuration.site).isEqualTo("US3")
        assertThat(configuration.trackingConsent).isEqualTo("NOT_GRANTED")
        assertThat(configuration.uploadFrequency).isEqualTo("FREQUENT")
        assertThat(configuration.batchSize).isEqualTo("SMALL")
        assertThat(configuration.verbosity).isEqualTo("WARN")
        assertThat(configuration.service).isEqualTo("my.app")
        assertThat(configuration.additionalConfiguration?.get("_dd.source")).isEqualTo(
            "react-native"
        )
        assertThat(configuration.additionalConfiguration?.get("_dd.sdk_version")).isEqualTo(
            SDK_VERSION
        )
        assertThat(configuration.rumConfiguration?.applicationId).isEqualTo("fake-app-id")
        assertThat(configuration.rumConfiguration?.longTaskThresholdMs).isEqualTo(44.0)
        assertThat(configuration.rumConfiguration?.sessionSampleRate).isEqualTo(80.0)
        assertThat(configuration.rumConfiguration?.telemetrySampleRate).isEqualTo(60.0)
        assertThat(configuration.rumConfiguration?.vitalsUpdateFrequency).isEqualTo("NEVER")
        assertThat(configuration.rumConfiguration?.trackFrustrations).isEqualTo(false)
        assertThat(configuration.rumConfiguration?.nativeCrashReportEnabled).isEqualTo(true)
        assertThat(configuration.rumConfiguration?.nativeLongTaskThresholdMs).isEqualTo(333.0)
        assertThat(configuration.rumConfiguration?.nativeViewTracking).isEqualTo(true)
        assertThat(configuration.rumConfiguration?.nativeInteractionTracking).isEqualTo(true)
        assertThat(configuration.rumConfiguration?.trackBackgroundEvents).isEqualTo(true)
        assertThat(configuration.rumConfiguration?.customEndpoint).isEqualTo(
            "https://rum.example.com"
        )
        assertThat(configuration.traceConfiguration?.customEndpoint).isEqualTo(
            "https://trace.example.com"
        )
        assertThat(configuration.configurationForTelemetry).isNull()
        assertThat(configuration.proxyConfiguration?.first?.type().toString()).isEqualTo("HTTP")
        val address = configuration.proxyConfiguration?.first?.address()
        assertThat(address).isNotNull
        (address as InetSocketAddress).let {
            assertThat(it.port).isEqualTo(4444)
            assertThat(it.address.hostAddress).isEqualTo("1.1.1.1")
        }
        assertThat(configuration.proxyConfiguration?.second?.username).isEqualTo("proxyusername")
        assertThat(configuration.proxyConfiguration?.second?.password).isEqualTo("proxypassword")
        val firstPartyHosts = configuration.rumConfiguration?.firstPartyHosts?.get("example.com")
        assertThat(firstPartyHosts.toString()).isEqualTo(
            "[B3MULTI, TRACECONTEXT]"
        )
        assertThat(configuration.rumConfiguration?.initialResourceThreshold).isEqualTo(0.5)
    }

    @Test
    fun `𝕄 add defaults to config 𝕎 getConfigurationFromJSONFile() {file with minimal data}`() {
        // Given
        whenever(
            mockJSONFileReader.parseAssetsJSONFile(mockContext, "motadata-configuration.json")
        ) doReturn javaClass.getResource(
            "/input/minimal-configuration.json"
        ).readText()

        // When
        val configuration = testedNativeInitialization.getConfigurationFromJSONFile()

        // Then
        assertThat(configuration.clientToken).isEqualTo("fake-client-token")
        assertThat(configuration.env).isEqualTo("fake-env")
        assertThat(configuration.verbosity).isNull()
        assertThat(configuration.service).isNull()
        assertThat(configuration.proxyConfiguration).isNull()

        assertThat(configuration.site).isEqualTo("US1")
        assertThat(configuration.uploadFrequency).isEqualTo("AVERAGE")
        assertThat(configuration.batchSize).isEqualTo("MEDIUM")
        assertThat(configuration.trackingConsent).isEqualTo("GRANTED")
        assertThat(configuration.additionalConfiguration?.get("_dd.source")).isEqualTo(
            "react-native"
        )
        assertThat(configuration.additionalConfiguration?.get("_dd.sdk_version")).isEqualTo(
            SDK_VERSION
        )
        assertThat(configuration.configurationForTelemetry).isNull()
        assertThat(configuration.rumConfiguration?.initialResourceThreshold).isEqualTo(0.1)
        assertThat(configuration.rumConfiguration?.applicationId).isEqualTo("fake-app-id")
        assertThat(configuration.rumConfiguration?.longTaskThresholdMs).isEqualTo(0.0)
        assertThat(configuration.rumConfiguration?.sessionSampleRate).isEqualTo(100.0)
        assertThat(configuration.rumConfiguration?.telemetrySampleRate).isEqualTo(20.0)
        assertThat(configuration.rumConfiguration?.vitalsUpdateFrequency).isEqualTo("AVERAGE")
        assertThat(configuration.rumConfiguration?.trackFrustrations).isEqualTo(true)
        assertThat(configuration.rumConfiguration?.trackBackgroundEvents).isEqualTo(false)
        assertThat(configuration.rumConfiguration?.customEndpoint).isNull()
        assertThat(configuration.rumConfiguration?.nativeCrashReportEnabled).isEqualTo(false)
        assertThat(configuration.rumConfiguration?.nativeLongTaskThresholdMs).isEqualTo(200.0)
        assertThat(configuration.rumConfiguration?.nativeViewTracking).isEqualTo(false)
        assertThat(configuration.rumConfiguration?.nativeInteractionTracking).isEqualTo(false)
        assertThat(configuration.rumConfiguration?.firstPartyHosts).isNull()
        assertThat(configuration.traceConfiguration?.customEndpoint).isNull()
    }

    @Test
    fun `𝕄 throw error 𝕎 getConfigurationFromJSONFile() {incorrect file}`() {
        // Given
        whenever(
            mockJSONFileReader.parseAssetsJSONFile(mockContext, "motadata-configuration.json")
        ) doReturn javaClass.getResource(
            "/input/malformed-configuration.json"
        ).readText()

        // Then
        assertThrows<BadConfigurationException> {
            testedNativeInitialization.getConfigurationFromJSONFile()
        }
    }

    // endregion

    // region initialize()

    @Test
    fun `𝕄 mark RN SDK initialized and catch up session 𝕎 initialize() { isCalledFromJs=true, motadata already initialized }`() { // ktlint-disable-line max-line-length
        // Given
        val mockRumMonitor: RumMonitor = mock()
        whenever(mockMotadata.isInitialized()) doReturn true
        whenever(mockMotadata.getRumMonitor()) doReturn mockRumMonitor

        // When
        testedNativeInitialization.initialize(
            ddSdkConfiguration = minimalConfiguration(),
            isCalledFromJs = true
        )

        // Then
        assertThat(MdSdkSessionStartedListener.isRnSdkInitializedForTests()).isTrue()
        verify(mockRumMonitor).getCurrentSessionId(any())
    }

    @Test
    fun `𝕄 mark RN SDK initialized without catch up 𝕎 initialize() { isCalledFromJs=true, motadata not initialized }`() { // ktlint-disable-line max-line-length
        // Given
        whenever(mockMotadata.isInitialized()) doReturn false

        // When
        testedNativeInitialization.initialize(
            ddSdkConfiguration = minimalConfiguration(),
            isCalledFromJs = true
        )

        // Then
        assertThat(MdSdkSessionStartedListener.isRnSdkInitializedForTests()).isTrue()
        verify(mockMotadata, never()).getRumMonitor()
    }

    @Test
    fun `𝕄 not mark RN SDK initialized or catch up 𝕎 initialize() { isCalledFromJs=false }`() {
        // Given
        whenever(mockMotadata.isInitialized()) doReturn true

        // When
        testedNativeInitialization.initialize(
            ddSdkConfiguration = minimalConfiguration(),
            isCalledFromJs = false
        )

        // Then
        assertThat(MdSdkSessionStartedListener.isRnSdkInitializedForTests()).isFalse()
        verify(mockMotadata, never()).getRumMonitor()
    }

    // endregion

    private fun minimalConfiguration(): MdSdkConfiguration = MdSdkConfiguration(
        clientToken = "fake-client-token",
        env = "fake-env",
        additionalConfiguration = emptyMap()
    )
}
