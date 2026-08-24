/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { version as reactNativeVersion } from 'react-native/package.json';
import { InteractionManager } from 'react-native';

import { InternalLog } from './InternalLog';
import type { MotadataProviderConfiguration } from './config/MotadataProviderConfiguration';
import { FileBasedConfiguration } from './config/FileBasedConfiguration';
import type {
    AutoInstrumentationConfiguration,
    AutoInstrumentationParameters
} from './config/async/AutoInstrumentationConfiguration';
import { addDefaultValuesToAutoInstrumentationConfiguration } from './config/async/AutoInstrumentationConfiguration';
import type { PartialInitializationConfiguration } from './config/async/PartialInitializationConfiguration';
import { buildConfigurationFromPartialConfiguration } from './config/async/asyncInitializationHelper';
import { MdSdkNativeConfiguration } from './config/features/CoreConfigurationNative';
import { CoreConfiguration } from './config/features/CoreConfiguration';
import type { LogsNativeConfiguration } from './config/features/LogsConfigurationNative';
import type { RumNativeConfiguration } from './config/features/RumConfigurationNative';
import { RUM_DEFAULTS } from './config/features/RumConfiguration';
import type { TraceNativeConfiguration } from './config/features/TraceConfigurationNative';
import type { InitializationModeForTelemetry } from './config/types/InitializationModeForTelemetry';
import { SdkVerbosity } from './config/types/SdkVerbosity';
import type { TrackingConsent } from './config/types/TrackingConsent';
import { InitializationMode } from './config/types';
import { MdRum } from './rum/MdRum';
import { MdRumErrorTracking } from './rum/instrumentation/MdRumErrorTracking';
import { MdBabelInteractionTracking } from './rum/instrumentation/interactionTracking/MdBabelInteractionTracking';
import { MdRumUserInteractionTracking } from './rum/instrumentation/interactionTracking/MdRumUserInteractionTracking';
import { MdRumResourceTracking } from './rum/instrumentation/resourceTracking/MdRumResourceTracking';
import { AccountInfoSingleton } from './sdk/AccountInfoSingleton/AccountInfoSingleton';
import { AttributesSingleton } from './sdk/AttributesSingleton/AttributesSingleton';
import type { Attributes } from './sdk/AttributesSingleton/types';
import { registerNativeBridge } from './sdk/MotadataInternalBridge/MdSdkInternalNativeBridge';
import { BufferSingleton } from './sdk/MotadataProvider/Buffer/BufferSingleton';
import { NativeMdSdk } from './sdk/MdSdkInternal';
import { GlobalState } from './sdk/GlobalState/GlobalState';
import { UserInfoSingleton } from './sdk/UserInfoSingleton/UserInfoSingleton';
import type { UserInfo } from './sdk/UserInfoSingleton/types';
import { adaptLongTaskThreshold } from './utils/longTasksUtils';
import { version as sdkVersion } from './version';

/**
 * This class initializes the Motadata SDK, and sets up communication with the server.
 */
export class MdSdkReactNative {
    private static readonly MD_SOURCE_KEY = '_dd.source';
    private static readonly MD_SDK_VERSION = '_dd.sdk_version';
    private static readonly MD_VERSION = '_dd.version';
    private static readonly MD_VERSION_SUFFIX = '_dd.version_suffix';
    private static readonly MD_REACT_NATIVE_VERSION =
        '_dd.react_native_version';

    private static wasAutoInstrumented = false;
    private static features?: AutoInstrumentationConfiguration;

    /**
     * Initializes the Motadata SDK.
     * @param configuration the configuration for the SDK library
     * @returns a Promise.
     */
    static initialize = async (
        configuration: CoreConfiguration
    ): Promise<void> => {
        await MdSdkReactNative.initializeNativeSDK(configuration, {
            initializationModeForTelemetry: 'LEGACY'
        });

        MdSdkReactNative.enableFeatures(configuration);
    };

    private static initializeNativeSDK = async (
        configuration: CoreConfiguration,
        params: {
            initializationModeForTelemetry: InitializationModeForTelemetry;
        }
    ): Promise<void> => {
        if (GlobalState.isInitialized) {
            InternalLog.log(
                "Can't initialize Motadata, SDK was already initialized",
                SdkVerbosity.WARN
            );
            if (!__DEV__) {
                NativeMdSdk.telemetryDebug(
                    'RN SDK was already initialized in javascript'
                );
            }
            return new Promise(resolve => resolve());
        }

        InternalLog.verbosity = configuration.verbosity;

        registerNativeBridge();

        await NativeMdSdk.initialize(
            MdSdkReactNative.buildConfiguration(configuration, params)
        );

        InternalLog.log('Motadata SDK was initialized', SdkVerbosity.INFO);
        GlobalState.isInitialized = true;
        BufferSingleton.onInitialization();
    };

    /**
     * FOR INTERNAL USE ONLY.
     */
    static _initializeFromMotadataProvider = async (
        configuration: MotadataProviderConfiguration
    ): Promise<void> => {
        MdSdkReactNative.enableFeatures(configuration);
        if (configuration instanceof FileBasedConfiguration) {
            return MdSdkReactNative.initializeNativeSDK(configuration, {
                initializationModeForTelemetry: 'FILE'
            });
        }
        if (configuration.initializationMode === InitializationMode.SYNC) {
            return MdSdkReactNative.initializeNativeSDK(configuration, {
                initializationModeForTelemetry: 'SYNC'
            });
        }
        if (configuration.initializationMode === InitializationMode.ASYNC) {
            const initNative = () =>
                MdSdkReactNative.initializeNativeSDK(configuration, {
                    initializationModeForTelemetry: 'ASYNC'
                });

            // We rely on requestIdleCallback for RN >= 0.76 to make sure that the SDK initialization
            // happens after rendering has finished
            if ((globalThis as Record<string, unknown>).requestIdleCallback) {
                return new Promise<void>((resolve, reject) => {
                    ((globalThis as unknown) as {
                        requestIdleCallback: (cb: () => void) => void;
                    }).requestIdleCallback(() => {
                        initNative().then(resolve, reject);
                    });
                });
            }

            // On RN below 0.76 we use runAfterInteractions, which initializes the SDK after animations are done
            return InteractionManager.runAfterInteractions(() => {
                return initNative();
            });
        }
        // TODO: Remove when MdSdkReactNativeConfiguration is deprecated
        if (configuration instanceof CoreConfiguration) {
            return MdSdkReactNative.initializeNativeSDK(configuration, {
                initializationModeForTelemetry: 'SYNC'
            });
        }
    };

    /**
     * FOR INTERNAL USE ONLY.
     */
    static _enableFeaturesFromMotadataProvider = (
        features: AutoInstrumentationConfiguration
    ): void => {
        MdSdkReactNative._enableFeaturesFromMotadataProviderAsync(features);
    };

    static _enableFeaturesFromMotadataProviderAsync = async (
        features: AutoInstrumentationConfiguration
    ): Promise<void> => {
        MdSdkReactNative.features = features;
        MdSdkReactNative.enableFeatures(
            addDefaultValuesToAutoInstrumentationConfiguration(features)
        );
    };
    /**
     * FOR INTERNAL USE ONLY.
     */
    static _initializeFromMotadataProviderWithConfigurationAsync = async (
        configuration: PartialInitializationConfiguration
    ): Promise<void> => {
        if (!MdSdkReactNative.features) {
            InternalLog.log(
                "Can't initialize Motadata, make sure the MotadataProvider component is mounted before calling this function",
                SdkVerbosity.WARN
            );
            return new Promise(resolve => resolve());
        }

        const builtConfiguration = buildConfigurationFromPartialConfiguration(
            MdSdkReactNative.features,
            configuration
        );

        // The XHRProxy was installed at provider mount with the features'
        // default resourceTraceSampleRate; re-apply the resolved value so a
        // resourceTraceSampleRate supplied via MotadataProvider.initialize
        // takes effect on subsequent fetch/XHR calls.
        MdRumResourceTracking.updateTrackingContext({
            resourceTraceSampleRate:
                builtConfiguration.rumConfiguration?.resourceTraceSampleRate ??
                RUM_DEFAULTS.resourceTraceSampleRate
        });

        return MdSdkReactNative.initializeNativeSDK(builtConfiguration, {
            initializationModeForTelemetry: 'PARTIAL'
        });
    };

    /**
     * Adds a specific attribute to the global context attached with all future Logs, Spans and RUM.
     * @param key: Key that identifies the attribute.
     * @param value: Value linked to the attribute.
     */
    static addAttribute = async (
        key: string,
        value: unknown
    ): Promise<void> => {
        InternalLog.log(
            `Adding attribute ${JSON.stringify(value)} for key ${key}`,
            SdkVerbosity.DEBUG
        );
        await NativeMdSdk.addAttribute(key, { value });
        AttributesSingleton.getInstance().addAttribute(key, value);
    };

    /**
     * Removes an attribute from the context attached with all future Logs, Spans and RUM events.
     * @param key: They key associated with the attribute to be removed.
     */
    static removeAttribute = async (key: string): Promise<void> => {
        InternalLog.log(
            `Removing attribute for key ${key}`,
            SdkVerbosity.DEBUG
        );
        await NativeMdSdk.removeAttribute(key);
        AttributesSingleton.getInstance().removeAttribute(key);
    };

    /**
     * Adds a set of attributes to the global context attached with all future Logs, Spans and RUM events.
     * @param attributes: The global context attributes.
     * @returns a Promise.
     */
    static addAttributes = async (attributes: Attributes): Promise<void> => {
        InternalLog.log(
            `Adding attributes ${JSON.stringify(attributes)}`,
            SdkVerbosity.DEBUG
        );
        await NativeMdSdk.addAttributes(attributes);
        AttributesSingleton.getInstance().addAttributes(attributes);
    };

    /**
     * Removes a set of attributes from the context attached with all future Logs, Spans and RUM events.
     * @param keys: They keys associated with the attributes to be removed.
     */
    static removeAttributes = async (keys: string[]): Promise<void> => {
        InternalLog.log(
            `Removing attributes for keys ${JSON.stringify(keys)}`,
            SdkVerbosity.DEBUG
        );
        await NativeMdSdk.removeAttributes(keys);
        AttributesSingleton.getInstance().removeAttributes(keys);
    };

    /**
     * Sets the user information. Requires a user ID — setting user properties
     * like name or email implies a known user, so an ID must be provided.
     * To add custom attributes without setting a user ID, use {@link addUserExtraInfo} instead.
     * @param userInfo: The user object (id is required, name, email and extraInfo are optional).
     * @returns a Promise.
     */
    static setUserInfo = async (
        userInfo: UserInfo & { id: string }
    ): Promise<void> => {
        if (typeof userInfo.id !== 'string' || userInfo.id.length === 0) {
            InternalLog.log(
                'setUserInfo requires a valid user ID. Please provide a non-empty string as the id field.',
                SdkVerbosity.WARN
            );
            return;
        }

        InternalLog.log(
            `Setting user ${JSON.stringify(userInfo)}`,
            SdkVerbosity.DEBUG
        );

        await NativeMdSdk.setUserInfo(userInfo);
        UserInfoSingleton.getInstance().setUserInfo(userInfo);
    };

    /**
     * Clears the user information.
     * @returns a Promise.
     */
    static clearUserInfo = async (): Promise<void> => {
        InternalLog.log('Clearing user info', SdkVerbosity.DEBUG);
        await NativeMdSdk.clearUserInfo();
        UserInfoSingleton.getInstance().clearUserInfo();
    };

    /**
     * Set the user information.
     * @param extraUserInfo: The additional information. (To set the id, name or email please user setUserInfo).
     * @returns a Promise.
     */
    static addUserExtraInfo = async (
        extraUserInfo: Record<string, unknown>
    ): Promise<void> => {
        InternalLog.log(
            `Adding extra user info ${JSON.stringify(extraUserInfo)}`,
            SdkVerbosity.DEBUG
        );

        await NativeMdSdk.addUserExtraInfo(extraUserInfo);
        UserInfoSingleton.getInstance().addUserExtraInfo(extraUserInfo);
    };

    /**
     * Sets the account information.
     * @param id: A mandatory unique account identifier (relevant to your business domain).
     * @param name: The account name.
     * @param extraInfo: Additional information.
     * @returns a Promise.
     */
    static setAccountInfo = async (accountInfo: {
        id: string;
        name?: string;
        extraInfo?: Record<string, unknown>;
    }): Promise<void> => {
        InternalLog.log(
            `Setting account ${JSON.stringify(accountInfo)}`,
            SdkVerbosity.DEBUG
        );

        await NativeMdSdk.setAccountInfo(accountInfo);
        AccountInfoSingleton.getInstance().setAccountInfo(accountInfo);
    };

    /**
     * Clears the account information.
     * @returns a Promise.
     */
    static clearAccountInfo = async (): Promise<void> => {
        InternalLog.log('Clearing account info', SdkVerbosity.DEBUG);
        await NativeMdSdk.clearAccountInfo();
        AccountInfoSingleton.getInstance().clearAccountInfo();
    };

    /**
     * Set the account information.
     * @param extraAccountInfo: The additional information. (To set the id or name please use setAccountInfo).
     * @returns a Promise.
     */
    static addAccountExtraInfo = async (
        extraAccountInfo: Record<string, unknown>
    ): Promise<void> => {
        InternalLog.log(
            `Adding extra account info ${JSON.stringify(extraAccountInfo)}`,
            SdkVerbosity.DEBUG
        );

        const accountInfo = AccountInfoSingleton.getInstance().getAccountInfo();
        if (!accountInfo) {
            InternalLog.log(
                'Skipped adding Account Extra Info: Account Info is currently undefined. An account ID must be set before adding extra info. Please call setAccountInfo() first.',
                SdkVerbosity.WARN
            );

            return;
        }

        const extraInfo = {
            ...accountInfo.extraInfo,
            ...extraAccountInfo
        };

        await NativeMdSdk.addAccountExtraInfo(extraInfo);
        AccountInfoSingleton.getInstance().addAccountExtraInfo(
            extraAccountInfo
        );
    };

    /**
     * Set the tracking consent regarding the data collection.
     * @param trackingConsent: One of TrackingConsent values.
     * @returns a Promise.
     */
    static setTrackingConsent = (consent: TrackingConsent): Promise<void> => {
        InternalLog.log(`Setting consent ${consent}`, SdkVerbosity.DEBUG);
        return NativeMdSdk.setTrackingConsent(consent);
    };

    /**
     * Clears all data that has not already been sent to Motadata servers
     * @returns a Promise
     */
    static clearAllData = (): Promise<void> => {
        InternalLog.log('Clearing all data', SdkVerbosity.DEBUG);
        return NativeMdSdk.clearAllData();
    };

    private static buildConfiguration = (
        configuration: CoreConfiguration,
        params: {
            initializationModeForTelemetry: InitializationModeForTelemetry;
        }
    ): MdSdkNativeConfiguration => {
        if (configuration.additionalConfiguration === undefined) {
            configuration.additionalConfiguration = {};
        }
        configuration.additionalConfiguration[MdSdkReactNative.MD_SOURCE_KEY] =
            'react-native';
        configuration.additionalConfiguration[
            MdSdkReactNative.MD_SDK_VERSION
        ] = sdkVersion;

        if (configuration.version) {
            configuration.additionalConfiguration[
                MdSdkReactNative.MD_VERSION
            ] = `${configuration.version}${
                configuration.versionSuffix
                    ? `-${configuration.versionSuffix}`
                    : ''
            }`;
        }
        // If both version and version suffix are provided, we merge them into the version field.
        // To avoid adding it in again the native part, we only set it if the version isn't set.
        if (configuration.versionSuffix && !configuration.version) {
            configuration.additionalConfiguration[
                MdSdkReactNative.MD_VERSION_SUFFIX
            ] = `-${configuration.versionSuffix}`;
        }

        if (reactNativeVersion) {
            configuration.additionalConfiguration[
                MdSdkReactNative.MD_REACT_NATIVE_VERSION
            ] = `${reactNativeVersion}`;
        }

        const rumConfiguration = configuration.rumConfiguration;
        if (rumConfiguration) {
            const longTaskThresholdMs =
                rumConfiguration.longTaskThresholdMs ||
                RUM_DEFAULTS.longTaskThresholdMs;
            rumConfiguration.longTaskThresholdMs = adaptLongTaskThreshold(
                longTaskThresholdMs
            );

            const nativeLongTaskThresholdMs =
                configuration.rumConfiguration?.nativeLongTaskThresholdMs ??
                RUM_DEFAULTS.nativeLongTaskThresholdMs;
            rumConfiguration.nativeLongTaskThresholdMs = adaptLongTaskThreshold(
                nativeLongTaskThresholdMs
            );
        }

        const trackInteractions =
            configuration.rumConfiguration?.trackInteractions ||
            RUM_DEFAULTS.trackInteractions;
        const trackResources =
            configuration.rumConfiguration?.trackResources ||
            RUM_DEFAULTS.trackResources;
        const trackErrors =
            configuration.rumConfiguration?.trackErrors ||
            RUM_DEFAULTS.trackErrors;

        return new MdSdkNativeConfiguration(
            configuration.additionalConfiguration,
            configuration.clientToken,
            configuration.env,
            configuration.site,
            configuration.service,
            configuration.verbosity,
            configuration.trackingConsent,
            configuration.uploadFrequency,
            configuration.batchSize,
            configuration.batchProcessingLevel,
            configuration.proxyConfiguration,
            configuration.attributeEncoders,
            rumConfiguration as RumNativeConfiguration,
            configuration.logsConfiguration as LogsNativeConfiguration,
            configuration.traceConfiguration as TraceNativeConfiguration,
            {
                initializationType: params.initializationModeForTelemetry,
                trackErrors,
                trackInteractions,
                trackNetworkRequests: trackResources,
                // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
                reactNativeVersion: require('react-native/package.json')
                    .version,
                // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
                reactVersion: require('react/package.json').version
            }
        );
    };

    private static enableFeatures(
        configuration: AutoInstrumentationParameters
    ) {
        const firstPartyHosts =
            configuration.rumConfiguration?.firstPartyHosts ||
            RUM_DEFAULTS.getFirstPartyHosts();
        const trackInteractions =
            configuration.rumConfiguration?.trackInteractions ||
            RUM_DEFAULTS.trackInteractions;
        const trackResources =
            configuration.rumConfiguration?.trackResources ||
            RUM_DEFAULTS.trackResources;
        const trackErrors =
            configuration.rumConfiguration?.trackErrors ||
            RUM_DEFAULTS.trackErrors;
        const actionNameAttribute =
            configuration.rumConfiguration?.actionNameAttribute;
        const resourceTraceSampleRate =
            configuration.rumConfiguration?.resourceTraceSampleRate ||
            RUM_DEFAULTS.resourceTraceSampleRate;
        const errorEventMapper =
            configuration.rumConfiguration?.errorEventMapper;
        const resourceEventMapper =
            configuration.rumConfiguration?.resourceEventMapper;
        const actionEventMapper =
            configuration.rumConfiguration?.actionEventMapper;

        if (globalThis.__MD_RN_BABEL_PLUGIN_ENABLED__) {
            MdBabelInteractionTracking.config = {
                trackInteractions,
                useAccessibilityLabel:
                    configuration.rumConfiguration?.useAccessibilityLabel ||
                    RUM_DEFAULTS.useAccessibilityLabel
            };

            MdBabelInteractionTracking.attachRumInstance(MdRum);
        }

        if (MdSdkReactNative.wasAutoInstrumented) {
            InternalLog.log(
                "Can't auto instrument Motadata, SDK was already instrumented",
                SdkVerbosity.WARN
            );
            return;
        }

        if (trackInteractions && !globalThis.__MD_RN_BABEL_PLUGIN_ENABLED__) {
            MdRumUserInteractionTracking.startTracking({
                actionNameAttribute,
                useAccessibilityLabel:
                    configuration.rumConfiguration?.useAccessibilityLabel
            });
        }

        if (trackResources) {
            MdRumResourceTracking.startTracking({
                resourceTraceSampleRate,
                firstPartyHosts
            });
        }

        if (trackErrors) {
            MdRumErrorTracking.startTracking();
        }

        if (errorEventMapper) {
            MdRum.registerErrorEventMapper(errorEventMapper);
        }

        if (resourceEventMapper) {
            MdRum.registerResourceEventMapper(resourceEventMapper);
        }

        if (actionEventMapper) {
            MdRum.registerActionEventMapper(actionEventMapper);
        }

        MdSdkReactNative.wasAutoInstrumented = true;
    }
}
