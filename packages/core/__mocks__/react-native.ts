/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type { MdNativeSdkType } from '../src/nativeModulesTypes';
import type { MdRumType } from '../src/rum/types';
import type { MdTraceType } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actualRN = require('react-native');

actualRN.NativeModules.MdSdk = {
    initialize: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['initialize']>,
    setUserInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['setUserInfo']>,
    addUserExtraInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['addUserExtraInfo']>,
    clearUserInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['clearUserInfo']>,
    addAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['addAttribute']>,
    removeAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['removeAttribute']>,
    addAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['addAttributes']>,
    removeAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['removeAttributes']>,
    setTrackingConsent: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['setTrackingConsent']>,
    sendTelemetryLog: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['sendTelemetryLog']>,
    telemetryDebug: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['telemetryDebug']>,
    telemetryError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['telemetryError']>,
    clearAllData: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdNativeSdkType['clearAllData']>,
    addListener: jest.fn().mockImplementation((_: string) => {
        /* empty */
    }) as jest.MockedFunction<MdNativeSdkType['addListener']>,
    removeListeners: jest.fn().mockImplementation((_: number) => {
        /* empty */
    }) as jest.MockedFunction<MdNativeSdkType['removeListeners']>,
    onRUMSessionStarted: jest.fn().mockImplementation((_: string) => {
        /* empty */
    }) as jest.MockedFunction<MdNativeSdkType['onRUMSessionStarted']>
};


actualRN.NativeModules.MdTrace = {
    startSpan: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdTraceType['startSpan']>,
    finishSpan: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdTraceType['finishSpan']>
};

actualRN.NativeModules.MdRum = {
    startView: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['startView']>,
    stopView: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['stopView']>,
    startAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['startAction']>,
    stopAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['stopAction']>,
    addAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['addAction']>,
    startResource: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['startResource']>,
    stopResource: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['stopResource']>,
    addError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['addError']>,
    addTiming: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['addTiming']>,
    addViewAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['addViewAttribute']>,
    removeViewAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['removeViewAttribute']>,
    addViewAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['addViewAttributes']>,
    removeViewAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['removeViewAttributes']>,
    addViewLoadingTime: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['addViewLoadingTime']>,
    stopSession: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['stopSession']>,
    getCurrentSessionId: jest.fn().mockImplementation(
        () =>
            new Promise<string | undefined>(resolve =>
                resolve('test-session-id')
            )
    ) as jest.MockedFunction<MdRumType['getCurrentSessionId']>,
    startFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['startFeatureOperation']>,
    succeedFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['startFeatureOperation']>,
    failFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<MdRumType['failFeatureOperation']>
};


module.exports = actualRN;
