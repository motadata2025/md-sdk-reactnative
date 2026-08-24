/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

const mockBatchedBridge = {
    registerCallableModule: jest.fn()
};

const mockNativeMdSdkSpec = {
    onRUMSessionStarted: jest.fn()
};

const mockEventEmitter = {
    initialize: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn()
};

const mockErrorHandler = jest.fn();

const mockNativeEventEmitter = {
    initialize: jest.fn().mockReturnValue(true),
    addListener: jest.fn(),
    removeAllListeners: jest.fn()
};

const mockBatchedBridgeEventEmitter = {
    initialize: jest.fn().mockReturnValue(true),
    addListener: jest.fn(),
    removeAllListeners: jest.fn()
};

describe('MdSdkNativeBridge', () => {
    beforeEach(() => {
        jest.mock('../../MdSdk', () => ({
            MdSdk: {
                initialize: jest.fn()
            }
        }));

        jest.mock(
            'react-native/Libraries/BatchedBridge/BatchedBridge',
            () => mockBatchedBridge
        );

        jest.mock(
            '../../MotadataEventEmitter/MotadataNativeEventEmitter',
            () => ({
                MotadataNativeEventEmitter: jest
                    .fn()
                    .mockImplementation(() => mockNativeEventEmitter)
            })
        );

        jest.mock(
            '../../MotadataEventEmitter/MotadataBatchedBridgeEventEmitter',
            () => ({
                MotadataBatchedBridgeEventEmitter: jest
                    .fn()
                    .mockImplementation(() => mockBatchedBridgeEventEmitter)
            })
        );

        jest.mock('../../../specs/NativeMdSdk', () => mockNativeMdSdkSpec);
    });

    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
        delete (global as any).RN$Bridgeless;
    });

    describe('new architecture implementation', () => {
        beforeEach(() => {
            (global as any).RN$Bridgeless = true;
        });

        it('does not try to register the batched bridge when index is imported', () => {
            const ddBridge = require('../MdSdkInternalNativeBridge');
            const defaultEventEmitter = require('../../MotadataEventEmitter/MotadataDefaultEventEmitter');
            mockNativeEventEmitter.initialize.mockReturnValueOnce(true);
            ddBridge.registerNativeBridge(
                new defaultEventEmitter.MotadataDefaultEventEmitter(
                    mockErrorHandler
                )
            );
            expect(
                mockBatchedBridge.registerCallableModule
            ).not.toHaveBeenCalled();
            expect(mockErrorHandler).not.toHaveBeenCalled();
            expect(ddBridge.hasNativeBridge()).toBe(true);
        });

        it('catches errors when native event emitter init fails', () => {
            jest.mock('../../../specs/NativeMdSdk', () => undefined);

            const ddBridge = require('../MdSdkInternalNativeBridge');
            const defaultEventEmitter = require('../../MotadataEventEmitter/MotadataDefaultEventEmitter');
            mockNativeEventEmitter.initialize.mockReturnValueOnce(false);

            ddBridge.registerNativeBridge(
                new defaultEventEmitter.MotadataDefaultEventEmitter(
                    mockErrorHandler
                ),
                mockErrorHandler
            );

            expect(mockErrorHandler).toHaveBeenCalledWith(
                'ERROR: Native Bridge initialization failed.'
            );
        });
    });

    describe('old architecture implementation', () => {
        beforeEach(() => {
            (global as any).RN$Bridgeless = false;
        });

        it('does not try to register the event listener when index is imported', () => {
            const ddBridge = require('../MdSdkInternalNativeBridge');
            const defaultEventEmitter = require('../../MotadataEventEmitter/MotadataDefaultEventEmitter');
            mockBatchedBridgeEventEmitter.initialize.mockReturnValueOnce(true);

            ddBridge.registerNativeBridge(
                new defaultEventEmitter.MotadataDefaultEventEmitter(
                    mockErrorHandler
                )
            );

            expect(mockNativeEventEmitter.initialize).not.toHaveBeenCalled();
            expect(mockBatchedBridgeEventEmitter.initialize).toHaveBeenCalled();
            expect(mockErrorHandler).not.toHaveBeenCalled();
            expect(ddBridge.hasNativeBridge()).toBe(true);
        });

        it('hasBatchedBridge is false when batched bridge init fails', () => {
            const ddBridge = require('../MdSdkInternalNativeBridge');
            const defaultEventEmitter = require('../../MotadataEventEmitter/MotadataDefaultEventEmitter');
            mockBatchedBridgeEventEmitter.initialize.mockReturnValueOnce(false);

            ddBridge.registerNativeBridge(
                new defaultEventEmitter.MotadataDefaultEventEmitter(
                    mockErrorHandler
                ),
                mockErrorHandler
            );
            ddBridge.registerNativeBridge(mockEventEmitter);
            expect(ddBridge.hasNativeBridge()).toBe(false);
            expect(mockErrorHandler).toHaveBeenCalledWith(
                'ERROR: Native Bridge initialization failed.'
            );
        });
    });
});
