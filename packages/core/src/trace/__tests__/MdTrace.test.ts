/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import { InternalLog } from '../../InternalLog';
import { SdkVerbosity } from '../../config/types';
import { BufferSingleton } from '../../sdk/MotadataProvider/Buffer/BufferSingleton';
import { MdTrace } from '../MdTrace';

jest.mock('../../utils/time-provider/DefaultTimeProvider', () => {
    return {
        DefaultTimeProvider: jest.fn().mockImplementation(() => {
            return { now: jest.fn().mockReturnValue(456) };
        })
    };
});

jest.mock('../../InternalLog', () => {
    return {
        InternalLog: {
            log: jest.fn()
        },
        MOTADATA_MESSAGE_PREFIX: 'MOTADATA:'
    };
});

describe('MdTrace', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        BufferSingleton.onInitialization();
    });

    describe('Context validation', () => {
        describe('MdTrace.startSpan', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await MdTrace.startSpan('operation', context);

                expect(NativeModules.MdTrace.startSpan).toHaveBeenCalledWith(
                    'operation',
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await MdTrace.startSpan('operation', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.MdTrace.startSpan).toHaveBeenCalledWith(
                    'operation',
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await MdTrace.startSpan('operation', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    1,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.MdTrace.startSpan).toHaveBeenCalledWith(
                    'operation',
                    { context },
                    expect.anything()
                );
            });
        });

        describe('MdTrace.finishSpan', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };

                const spanId = await MdTrace.startSpan('operation', {});
                await MdTrace.finishSpan(spanId, context);

                expect(NativeModules.MdTrace.finishSpan).toHaveBeenCalledWith(
                    spanId,
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await MdTrace.startSpan('operation', context);

                const spanId = await MdTrace.startSpan('operation', {});
                await MdTrace.finishSpan(spanId, context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(NativeModules.MdTrace.finishSpan).toHaveBeenCalledWith(
                    spanId,
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];

                const spanId = await MdTrace.startSpan('operation', {});
                await MdTrace.finishSpan(spanId, context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.MdTrace.finishSpan).toHaveBeenCalledWith(
                    spanId,
                    { context },
                    expect.anything()
                );
            });
        });
    });
});
