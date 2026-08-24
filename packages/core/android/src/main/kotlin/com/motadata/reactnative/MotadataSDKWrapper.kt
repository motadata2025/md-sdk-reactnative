/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
@file:Suppress("TooManyFunctions")

package com.motadata.reactnative

import android.content.Context
import com.motadata.android.Motadata
import com.motadata.android.api.InternalLogger
import com.motadata.android.api.feature.FeatureSdkCore
import com.motadata.android.core.InternalSdkCore
import com.motadata.android.core.configuration.Configuration
import com.motadata.android.privacy.TrackingConsent
import com.motadata.android.rum.GlobalRumMonitor
import com.motadata.android.rum.RumMonitor
import com.facebook.react.bridge.ReadableMap

/**
 * Internal object used to add internal testing.
 */
object MotadataSDKWrapperStorage {
    internal val onInitializedListeners: MutableList<(InternalSdkCore) -> Unit> = mutableListOf()
    private var core: InternalSdkCore? = null

    /**
     * Adds a Listener called when the core is initialized.
     */
    fun addOnInitializedListener(listener: (InternalSdkCore) -> Unit) {
        onInitializedListeners.add(listener)
    }

    /**
     * Exposed for testing purposes only.
     */
    fun notifyOnInitializedListeners(ddCore: InternalSdkCore) {
        for (listener in onInitializedListeners) {
            listener(ddCore)
        }
    }
}

internal class MotadataSDKWrapper : MotadataWrapper {
    override fun setVerbosity(level: Int) {
        Motadata.setVerbosity(level)
    }

    override fun initialize(
        context: Context,
        configuration: Configuration,
        consent: TrackingConsent
    ) {
        val core = Motadata.initialize(context, configuration, consent)
        MotadataSDKWrapperStorage.notifyOnInitializedListeners(core as InternalSdkCore)
    }

    override fun setUserInfo(
        id: String,
        name: String?,
        email: String?,
        extraInfo: Map<String, Any?>
    ) {
        Motadata.setUserInfo(id, name, email, extraInfo)
    }

    override fun addUserExtraInfo(
        extraInfo: Map<String, Any?>
    ) {
        Motadata.addUserProperties(extraInfo)
    }

    override fun clearUserInfo() {
        Motadata.clearUserInfo()
    }

    override fun setAccountInfo(
        id: String,
        name: String?,
        extraInfo: Map<String, Any?>
    ) {
        Motadata.setAccountInfo(id, name, extraInfo)
    }

    override fun addAccountExtraInfo(
        extraInfo: Map<String, Any?>
    ) {
        Motadata.addAccountExtraInfo(extraInfo)
    }

    override fun clearAccountInfo() {
        Motadata.clearAccountInfo()
    }

    override fun addRumGlobalAttribute(key: String, value: Any?) {
        this.getRumMonitor().addAttribute(key, value)
    }

    override fun removeRumGlobalAttribute(key: String) {
        this.getRumMonitor().removeAttribute(key)
    }

    override fun addRumGlobalAttributes(attributes: Map<String, Any?>) {
        for (attribute in attributes) {
            this.addRumGlobalAttribute(attribute.key, attribute.value)
        }
    }

    override fun removeRumGlobalAttributes(keys: Array<String>) {
        for (key in keys) {
            this.removeRumGlobalAttribute(key)
        }
    }

    override fun setTrackingConsent(trackingConsent: TrackingConsent) {
        Motadata.setTrackingConsent(trackingConsent)
    }

    override fun isInitialized(): Boolean {
        return Motadata.isInitialized()
    }

    override fun getRumMonitor(): RumMonitor {
        return GlobalRumMonitor.get(Motadata.getInstance())
    }

    override fun clearAllData() {
        return Motadata.clearAllData(Motadata.getInstance())
    }
}

