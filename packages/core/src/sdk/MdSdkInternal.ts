/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type { MdSdkNativeConfiguration } from '../config/features/CoreConfigurationNative';
import type { MdNativeSdkType } from '../nativeModulesTypes';

import type { AttributeEncoder } from './AttributesEncoding/types';

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const NativeMdSdk: MdNativeSdkType = require('../specs/NativeMdSdk').default;

export type MdSdkType = {
    readonly attributeEncoders: AttributeEncoder<any>[];

    /**
     * Initializes Motadata's features.
     * @param configuration: The configuration to use.
     */
    initialize(configuration: MdSdkNativeConfiguration): Promise<void>;
};

export class MdSdkWrapper implements MdNativeSdkType {
    get attributeEncoders(): AttributeEncoder<any>[] {
        return this._attributeEncoders;
    }
    private _attributeEncoders: AttributeEncoder<any>[] = [];

    initialize(configuration: MdSdkNativeConfiguration): Promise<void> {
        this._attributeEncoders = [...configuration.attributeEncoders];
        return NativeMdSdk.initialize(configuration);
    }

    getConstants() {
        return NativeMdSdk.getConstants();
    }

    setUserInfo(user: object): Promise<object> {
        return NativeMdSdk.setUserInfo(user);
    }

    clearUserInfo(): Promise<void> {
        return NativeMdSdk.clearUserInfo();
    }

    addUserExtraInfo(extraInfo: object): Promise<object> {
        return NativeMdSdk.addUserExtraInfo(extraInfo);
    }

    addAttribute(key: string, value: object): Promise<void> {
        return NativeMdSdk.addAttribute(key, value);
    }
    removeAttribute(key: string): Promise<void> {
        return NativeMdSdk.removeAttribute(key);
    }
    addAttributes(attributes: object): Promise<void> {
        return NativeMdSdk.addAttributes(attributes);
    }
    removeAttributes(keys: string[]): Promise<void> {
        return NativeMdSdk.removeAttributes(keys);
    }
    setAccountInfo(account: object): Promise<object> {
        return NativeMdSdk.setAccountInfo(account);
    }
    clearAccountInfo(): Promise<void> {
        return NativeMdSdk.clearAccountInfo();
    }
    addAccountExtraInfo(extraInfo: object): Promise<object> {
        return NativeMdSdk.addAccountExtraInfo(extraInfo);
    }

    setTrackingConsent(trackingConsent: string): Promise<void> {
        return NativeMdSdk.setTrackingConsent(trackingConsent);
    }

    sendTelemetryLog(
        message: string,
        attributes: object,
        config: object
    ): Promise<void> {
        return NativeMdSdk.sendTelemetryLog(message, attributes, config);
    }

    telemetryDebug(message: string): Promise<void> {
        return NativeMdSdk.telemetryDebug(message);
    }

    telemetryError(
        message: string,
        stack: string,
        kind: string
    ): Promise<void> {
        return NativeMdSdk.telemetryError(message, stack, kind);
    }

    clearAllData(): Promise<void> {
        return NativeMdSdk.clearAllData();
    }

    addListener(eventType: string): void {
        return NativeMdSdk.addListener(eventType);
    }

    removeListeners(count: number): void {
        return NativeMdSdk.removeListeners(count);
    }

    _setAttributeEncodersForTesting(
        attributeEncoders: AttributeEncoder<any>[]
    ) {
        this._attributeEncoders = [...attributeEncoders];
    }
}

export { NativeMdSdk };
