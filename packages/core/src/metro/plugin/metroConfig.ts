/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import type { MetroConfig } from 'metro';

import {
    createMotadataMetroSerializer,
    unstable_beforeAssetSerializationPlugin
} from './metroSerializer';
import type {
    MotadataExpoConfigOptions,
    DefaultConfigOptions
} from './types/expoTypes';
import type { MotadataMetroSerializer } from './types/metroTypes';
import { getDefaultExpoConfig } from './utils';

/**
 * Custom Motadata Metro Configuration.
 */
export type MotadataMetroConfigOptions = {
    /**
     * Determines whether a Debug ID should be injected into bundles and sourcemaps.
     *
     * The Debug ID establishes a unique connection between a bundle and its corresponding sourcemap.
     * It is highly recommended to keep this enabled unless you have a specific reason to disable it.
     *
     * Default: `true`
     */
    useDebugId?: boolean;
};

/**
 * Extends the Metro bundler configuration to integrate with Motadata.
 *
 * *Note: If a custom serializer is used and `config.useDebugId` is set to `true` (as it is by default),
 * you must manually invoke `options.motadataBundleCallback` within the serializer.*
 */
export function withMotadataMetroConfig(
    config: MetroConfig & MotadataMetroConfigOptions
): MetroConfig {
    let newConfig = config;

    if (config.useDebugId ?? true) {
        newConfig = withMotadataDebugId(config);
    }

    return {
        ...newConfig,
        transformer: {
            ...newConfig.transformer
        }
    };
}

/**
 * Extends the Expo configuration to integrate with Motadata.
 * @param config
 * @returns
 */
export function getMotadataExpoConfig(
    projectRoot: string,
    options: DefaultConfigOptions & MotadataExpoConfigOptions = {}
): DefaultConfigOptions {
    const plugins = options.unstable_beforeAssetSerializationPlugins ?? [];
    const motadataOptions: DefaultConfigOptions = {
        ...options,
        unstable_beforeAssetSerializationPlugins: [
            ...plugins,
            unstable_beforeAssetSerializationPlugin
        ]
    };

    return (options.getDefaultConfig ?? getDefaultExpoConfig)(
        projectRoot,
        motadataOptions
    );
}

/**
 * Extends the Metro bundler configuration by enabling Debug ID injection.
 * Ref: https://github.com/tc39/ecma426/blob/main/proposals/debug-id.md
 */
export function withMotadataDebugId(config: MetroConfig): MetroConfig {
    const customSerializer = createMotadataMetroSerializer(
        config.serializer?.customSerializer || undefined
    ) as MotadataMetroSerializer;

    return {
        ...config,
        serializer: {
            ...config.serializer,
            customSerializer
        }
    };
}
