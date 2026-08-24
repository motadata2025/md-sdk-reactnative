/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import React from 'react';
import type { PropsWithChildren } from 'react';

import { MdSdkReactNative } from '../../MdSdkReactNative';
import { InternalLog } from '../../InternalLog';
import { MotadataProviderConfiguration } from '../../config/MotadataProviderConfiguration';
import type { FileBasedConfiguration } from '../../config/FileBasedConfiguration';
import type { AutoInstrumentationConfiguration } from '../../config/async/AutoInstrumentationConfiguration';
import type { PartialInitializationConfiguration } from '../../config/async/PartialInitializationConfiguration';
import { CoreConfiguration } from '../../config/features/CoreConfiguration';
import { SdkVerbosity } from '../../config/types/SdkVerbosity';

import { MotadataProviderState } from './MotadataProviderState';

type Props = PropsWithChildren<{
    /**
     * If a `MotadataProviderConfiguration` instance is passed, the SDK will start tracking errors, resources and actions and sending events.
     *
     * If a `AutoInstrumentationConfiguration` object is passed, the SDK will start tracking errors, resources and actions. To start sending events, call `MotadataProvider.initialize`.
     */
    configuration:
        | MotadataProviderConfiguration
        | AutoInstrumentationConfiguration
        | FileBasedConfiguration;
    /**
     * Callback to be run once the SDK starts sending events.
     */
    onInitialization?: () => void;
}>;

type StaticProperties = {
    initialize: (
        configuration: PartialInitializationConfiguration
    ) => Promise<void>;
    onInitialization?: () => void;
};

const isConfigurationPartial = (
    configuration:
        | MotadataProviderConfiguration
        | AutoInstrumentationConfiguration
): configuration is AutoInstrumentationConfiguration => {
    if (configuration instanceof MotadataProviderConfiguration) {
        return false;
    }
    if (configuration instanceof CoreConfiguration) {
        // Not using InternalLog here as it is not yet instantiated
        console.warn(
            'A CoreConfiguration was passed to MotadataProvider. Please use MotadataProviderConfiguration instead.'
        );
        return false;
    }
    return true;
};

const initializeMotadata = async (
    configuration: MotadataProviderConfiguration,
    onInitialization?: () => void
) => {
    await MdSdkReactNative._initializeFromMotadataProvider(configuration);
    if (onInitialization) {
        try {
            onInitialization();
        } catch (error) {
            InternalLog.log(
                `Error running onInitialization callback ${error}`,
                SdkVerbosity.WARN
            );
        }
    }
};

/**
 * Set up the Motadata React Native SDK.
 */
export const MotadataProvider: React.FC<Props> & StaticProperties = ({
    children,
    configuration,
    onInitialization
}) => {
    if (!MotadataProviderState.isInitialized) {
        // Here we cannot use a useEffect hook since it would be called after
        // the first render. Thus, we wouldn't enable auto-instrumentation on
        // the elements rendered in this first render and what happens during
        // the first render.
        if (isConfigurationPartial(configuration)) {
            MdSdkReactNative._enableFeaturesFromMotadataProvider(configuration);
            MotadataProvider.onInitialization = onInitialization;
        } else {
            initializeMotadata(configuration, onInitialization);
        }
        MotadataProviderState.setInitialized();
    }

    return <>{children}</>;
};

/**
 * Initialize the Motadata SDK to start sending RUM events, logs and traces,
 * then execute onInitialization callback if any was provided.
 */
MotadataProvider.initialize = async (
    configuration: PartialInitializationConfiguration
) => {
    await MdSdkReactNative._initializeFromMotadataProviderWithConfigurationAsync(
        configuration
    );
    if (MotadataProvider.onInitialization) {
        MotadataProvider.onInitialization();
    }
};

export const __internalResetIsInitializedForTesting = () => {
    MotadataProviderState._reset();
};
