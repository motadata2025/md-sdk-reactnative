/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import { NativeModules } from 'react-native';

import { MotadataBatchedBridgeEventEmitter } from './MotadataBatchedBridgeEventEmitter';
import type { MotadataEventEmitter } from './MotadataEventEmitter';
import { MotadataNativeEventEmitter } from './MotadataNativeEventEmitter';

export class MotadataDefaultEventEmitter implements MotadataEventEmitter {
    private eventEmitter?: MotadataEventEmitter;

    private get isNewArchitecture(): boolean {
        return (global as any).RN$Bridgeless;
    }

    constructor(errorHandler: (err: any) => void) {
        try {
            const ddSdkModule =
                NativeModules.MdSdk ||
                // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
                require('../../specs/NativeMdSdk').default;
            this.eventEmitter = this.isNewArchitecture
                ? new MotadataNativeEventEmitter(ddSdkModule, errorHandler)
                : new MotadataBatchedBridgeEventEmitter(errorHandler);
        } catch (err) {
            errorHandler(
                `ERROR: failed to initialize MotadataDefaultEventEmitter: ${err}`
            );
        }
    }

    initialize(): boolean {
        return this.eventEmitter?.initialize() ?? false;
    }

    public addListener(eventName: string, callback: (data: any) => void) {
        this.eventEmitter?.addListener(eventName, callback);
    }

    public removeAllListeners(eventName: string) {
        this.eventEmitter?.removeAllListeners(eventName);
    }
}
