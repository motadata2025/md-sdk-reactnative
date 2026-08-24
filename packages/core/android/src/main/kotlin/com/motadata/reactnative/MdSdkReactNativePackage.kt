/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.motadata.reactnative

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Package of native motadata-rum-reactnative native modules.
 */
class MdSdkReactNativePackage : TurboReactPackage() {
    private val sdkWrapper = MotadataSDKWrapper()
    private val ddTelemetry = MdTelemetry()
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            MdSdkImplementation.NAME -> MdSdk(reactContext, sdkWrapper, ddTelemetry)
            MdRumImplementation.NAME -> MdRum(reactContext, sdkWrapper)
            MdTraceImplementation.NAME -> MdTrace(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val isTurboModule: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            val moduleInfos = listOf(
                MdSdkImplementation.NAME,
                MdRumImplementation.NAME,
                MdTraceImplementation.NAME
            ).associateWith {
                ReactModuleInfo(
                    it,
                    it,
                    false,  // canOverrideExistingModule
                    false,  // needsEagerInit
                    true,  // hasConstants
                    false,  // isCxxModule
                    isTurboModule // isTurboModule
                )
            }

            moduleInfos
        }
    }
}
