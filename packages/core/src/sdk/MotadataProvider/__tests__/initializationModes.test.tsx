/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { fireEvent } from '@testing-library/react-native';
import { InteractionManager, NativeModules } from 'react-native';

import { MdSdkReactNative } from '../../../MdSdkReactNative';
import { InitializationMode } from '../../../config/types';
import { MdRumUserInteractionTracking } from '../../../rum/instrumentation/interactionTracking/MdRumUserInteractionTracking';
import { XMLHttpRequestMock } from '../../../rum/instrumentation/resourceTracking/__tests__/__utils__/XMLHttpRequestMock';
import { PropagatorType } from '../../../rum/types';
import { DefaultTimeProvider } from '../../../utils/time-provider/DefaultTimeProvider';
import { GlobalState } from '../../GlobalState/GlobalState';
import { BufferSingleton } from '../Buffer/BufferSingleton';
import {
    MotadataProvider,
    __internalResetIsInitializedForTesting
} from '../MotadataProvider';

import {
    getDefaultConfiguration,
    mockIdleCallback,
    renderWithProvider,
    renderWithProviderAndAnimation
} from './__utils__/renderWithProvider';

jest.mock('../../../utils/time-provider/DefaultTimeProvider', () => {
    const now = jest.fn();
    return {
        DefaultTimeProvider: jest.fn().mockImplementation(() => {
            return { now };
        })
    };
});
const nowMock = new DefaultTimeProvider().now;

const flushPromises = () =>
    new Promise<void>(jest.requireActual('timers').setImmediate);

describe('MotadataProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        GlobalState.isInitialized = false;
        MdSdkReactNative['wasAutoInstrumented'] = false;
        __internalResetIsInitializedForTesting();
        BufferSingleton.reset();
        MdRumUserInteractionTracking.stopTracking();
        (nowMock as any).mockReturnValue('timestamp_not_specified');
        global.XMLHttpRequest = XMLHttpRequestMock as any;
    });

    describe('initializationMode SYNC', () => {
        it('starts auto-instrumentation', async () => {
            const { getByText } = renderWithProvider();
            await flushPromises();

            expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(1);

            const button = getByText('test button');
            fireEvent(button, 'press', {
                _targetInst: {
                    props: {
                        'dd-action-name': 'press button'
                    }
                }
            });

            expect(NativeModules.MdRum.addAction).toHaveBeenCalledTimes(1);
        });
        it('initializes the SDK without waiting for idle callback', async () => {
            const idle = mockIdleCallback();
            try {
                const configuration = getDefaultConfiguration();
                configuration.initializationMode = InitializationMode.SYNC;
                renderWithProvider({ configuration });

                await flushPromises();

                expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(1);

                idle.flushIdleCallbacks();
                await flushPromises();

                expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(1);
            } finally {
                idle.restore();
            }
        });
    });

    describe('initializationMode ASYNC', () => {
        it('initializes the SDK when the idle callback fires', async () => {
            const idle = mockIdleCallback();
            try {
                const configuration = getDefaultConfiguration();
                configuration.initializationMode = InitializationMode.ASYNC;

                const { getByText } = renderWithProvider({ configuration });
                await flushPromises();
                expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(0);

                idle.flushIdleCallbacks();
                await flushPromises();

                expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(1);
                const button = getByText('test button');
                fireEvent(button, 'press', {
                    _targetInst: {
                        props: {
                            'dd-action-name': 'press button'
                        }
                    }
                });
                expect(NativeModules.MdRum.addAction).toHaveBeenCalledTimes(1);
            } finally {
                idle.restore();
            }
        });

        it('defers initialization while animations are running', async () => {
            const idle = mockIdleCallback();
            try {
                const configuration = getDefaultConfiguration();
                configuration.initializationMode = InitializationMode.ASYNC;

                renderWithProviderAndAnimation({ configuration });
                await flushPromises();
                expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(0);

                idle.flushIdleCallbacks();
                await flushPromises();

                expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(1);
            } finally {
                idle.restore();
            }
        });

        it('falls back to InteractionManager when requestIdleCallback is unavailable', async () => {
            const original = (globalThis as Record<string, unknown>)
                .requestIdleCallback;
            (globalThis as Record<
                string,
                unknown
            >).requestIdleCallback = undefined;
            try {
                const configuration = getDefaultConfiguration();
                configuration.initializationMode = InitializationMode.ASYNC;

                const handle = InteractionManager.createInteractionHandle();
                renderWithProvider({ configuration });
                await flushPromises();
                expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(0);

                InteractionManager.clearInteractionHandle(handle);
                await flushPromises();

                expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(1);
            } finally {
                (globalThis as Record<
                    string,
                    unknown
                >).requestIdleCallback = original;
            }
        });
    });

    describe('partial initialization', () => {
        it('does not start reporting auto-instrumentation', async () => {
            const { getByText } = renderWithProvider({
                configuration: {
                    rumConfiguration: {
                        trackErrors: true,
                        trackResources: true,
                        trackInteractions: true,
                        resourceTraceSampleRate: 100,
                        firstPartyHosts: [
                            {
                                match: 'api.com',
                                propagatorTypes: [
                                    PropagatorType.MOTADATA,
                                    PropagatorType.TRACECONTEXT
                                ]
                            }
                        ]
                    },
                    traceConfiguration: {},
                    logsConfiguration: {}
                }
            });
            await flushPromises();

            const button = getByText('test button');
            fireEvent(button, 'press', {
                _targetInst: {
                    props: {
                        'dd-action-name': 'press button'
                    }
                }
            });

            expect(NativeModules.MdSdk.initialize).not.toHaveBeenCalled();
            expect(NativeModules.MdRum.addAction).not.toHaveBeenCalled();

            await MotadataProvider.initialize({
                clientToken: 'fake-client-token',
                env: 'fake-env',
                rumConfiguration: {
                    applicationId: 'fake-application-id'
                }
            });
            await flushPromises();

            expect(NativeModules.MdSdk.initialize).toHaveBeenCalledTimes(1);
            expect(
                NativeModules.MdSdk.initialize.mock.calls[0][0].rumConfiguration
                    .firstPartyHosts
            ).toEqual([
                {
                    match: 'api.com',
                    propagatorTypes: ['motadata', 'tracecontext']
                }
            ]);
            expect(NativeModules.MdRum.addAction).toHaveBeenCalledTimes(1);
        });
    });
});
