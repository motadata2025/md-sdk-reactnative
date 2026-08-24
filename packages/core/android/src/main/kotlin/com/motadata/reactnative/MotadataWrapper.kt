/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.motadata.reactnative

import android.content.Context
import com.motadata.android.core.configuration.Configuration
import com.motadata.android.privacy.TrackingConsent
import com.motadata.android.rum.RumConfiguration
import com.motadata.android.rum.RumMonitor
import com.motadata.android.trace.TraceConfiguration
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import java.lang.IllegalArgumentException

/**
 * Wrapper around [com.motadata.android.Motadata].
 */
@Suppress("ComplexInterface", "TooManyFunctions")
interface MotadataWrapper {
    /**
     * Sets the verbosity of the Motadata library.
     *
     * Messages with a priority level equal or above the given level will be sent to Android's
     * Logcat.
     *
     * @param level one of the Android [android.util.Log] constants
     * ([android.util.Log.VERBOSE], [android.util.Log.DEBUG], [android.util.Log.INFO],
     * [android.util.Log.WARN], [android.util.Log.ERROR], [android.util.Log.ASSERT]).
     */
    fun setVerbosity(level: Int)

    /**
     * Initializes the Motadata SDK.
     * @param context your application context
     * @param configuration the configuration for the SDK library
     * @param consent as the initial state of the tracking consent flag.
     * @see [Configuration]
     * @see [TrackingConsent]
     * @throws IllegalArgumentException if the env name is using illegal characters and your
     * application is in debug mode otherwise returns false and stops initializing the SDK
     */
    fun initialize(
        context: Context,
        configuration: Configuration,
        consent: TrackingConsent
    )

    /**
     * Sets the user information.
     *
     * @param id a unique user identifier (relevant to your business domain)
     * @param name (nullable) the user name or alias
     * @param email (nullable) the user email
     * @param extraInfo additional information. An extra information can be
     * nested up to 8 levels deep. Keys using more than 8 levels will be sanitized by SDK.
     */
    fun setUserInfo(
        id: String,
        name: String?,
        email: String?,
        extraInfo: Map<String, Any?>
    )

    /**
     * Sets the user information.
     * @param extraInfo: The additional information. (To set the id, name or email please user setUserInfo).
     */
    fun addUserExtraInfo(
        extraInfo: Map<String, Any?>
    )

    /**
     * Clears the user information.
     */
    fun clearUserInfo()

    /**
     * Sets the account information.
     *
     * @param id a unique account identifier (relevant to your business domain)
     * @param name (nullable) the account name
     * @param extraInfo additional information. An extra information can be
     * nested up to 8 levels deep. Keys using more than 8 levels will be sanitized by SDK.
     */
    fun setAccountInfo(
        id: String,
        name: String?,
        extraInfo: Map<String, Any?>
    )

    /**
     * Sets the account information.
     * @param extraInfo: The additional information. (To set the id or name please use setAccountInfo).
     */
    fun addAccountExtraInfo(
        extraInfo: Map<String, Any?>
    )

    /**
     * Clears the account information.
     */
    fun clearAccountInfo()


    /** Adds a global attribute.
     *
     * @param key: Key that identifies the attribute.
     * @param value: Value linked to the attribute.
     */
    fun addRumGlobalAttribute(key: String, value: Any?)

    /**
     * Removes a global attribute.
     *
     * @param key: Key that identifies the attribute.
     */
    fun removeRumGlobalAttribute(key: String)

    /**
     * Adds global attributes.
     *
     * @param attributes Attributes to add
     */
    fun addRumGlobalAttributes(attributes: Map<String, Any?>)

    /**
     * Removes global attributes.
     *
     * @param keys Keys linked to the attributes to be removed
     */
    fun removeRumGlobalAttributes(keys: Array<String>)

    /**
     * Sets tracking consent.
     */
    fun setTrackingConsent(trackingConsent: TrackingConsent)

    /**
     * Returns whether the SDK is initialized.
     */
    fun isInitialized(): Boolean

    /**
     * Returns the RUM Monitor for the default SDK core.
     */
    fun getRumMonitor(): RumMonitor

    /**
     * Clears all data that has not already been sent to Motadata servers.
     */
    fun clearAllData()
}
