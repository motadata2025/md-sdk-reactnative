/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import { InternalLog } from '../../InternalLog';
import { SdkVerbosity } from '../../config/types/SdkVerbosity';
import { setCachedSessionId } from '../../rum/helper';
import { MotadataDefaultEventEmitter } from '../MotadataEventEmitter/MotadataDefaultEventEmitter';
import type { MotadataEventEmitter } from '../MotadataEventEmitter/MotadataEventEmitter';

import { MdSdkInternalNativeBridgeEvent as BridgeEvent } from './MdSdkInternalNativeBridgeEvent';

const DEFAULT_EVENTS = [
    new BridgeEvent<string>('RUMSessionStarted', (sessionId: string) => {
        setCachedSessionId(sessionId);
    })
];

const defaultErrorHandler = (err: any) => {
    InternalLog.log(err, SdkVerbosity.DEBUG);
};

export class MdSdkInternalNativeBridge {
    private eventEmitter: MotadataEventEmitter;
    private errorHandler: (err: any) => void;
    private _isInitialized: boolean = false;

    private static _instance?: MdSdkInternalNativeBridge;
    public static get isInitialized(): boolean {
        return this._instance?._isInitialized ?? false;
    }

    static initialize(
        eventEmitter: MotadataEventEmitter,
        errorHandler: (err: any) => void = defaultErrorHandler
    ): MdSdkInternalNativeBridge {
        this._instance = new MdSdkInternalNativeBridge(
            eventEmitter,
            errorHandler
        );
        this._instance._isInitialized =
            eventEmitter.initialize() &&
            this._instance.registerDefaultListeners();
        return this._instance;
    }

    private constructor(
        eventEmitter: MotadataEventEmitter,
        errorHandler: (err: any) => void
    ) {
        this.eventEmitter = eventEmitter;
        this.errorHandler = errorHandler;
    }

    private registerDefaultListeners(): boolean {
        try {
            DEFAULT_EVENTS.forEach(event => {
                this.eventEmitter.addListener(event.eventName, event.callback);
            });
            return true;
        } catch (err) {
            this.errorHandler(
                `An error occured while registering default listeners for event emitter: ${err}`
            );
            return false;
        }
    }
}

export const registerNativeBridge = (
    eventEmitter?: MotadataEventEmitter,
    errorHandler: (err: any) => void = defaultErrorHandler
) => {
    const nativeEventEmitter =
        eventEmitter ?? new MotadataDefaultEventEmitter(errorHandler);
    MdSdkInternalNativeBridge.initialize(nativeEventEmitter);
    if (!MdSdkInternalNativeBridge.isInitialized) {
        errorHandler('ERROR: Native Bridge initialization failed.');
    }
};

export const hasNativeBridge = () => MdSdkInternalNativeBridge.isInitialized;
