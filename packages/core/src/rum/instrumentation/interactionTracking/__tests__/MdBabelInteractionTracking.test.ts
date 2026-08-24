/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { RumActionType } from '../../../types';
import { MdBabelInteractionTracking } from '../MdBabelInteractionTracking';

jest.mock('../../../../specs/NativeMdSdk', () => ({
    __esModule: true,
    default: {
        sendTelemetryLog: jest.fn(),
        telemetryError: jest.fn()
    }
}));

jest.mock('../../../../utils/time-provider/DefaultTimeProvider', () => ({
    DefaultTimeProvider: jest.fn().mockImplementation(() => ({
        now: jest.fn().mockReturnValue(456)
    }))
}));

const mockTargetObject = {
    getContent: undefined,
    options: { useContent: true, useNamePrefix: true },
    handlerArgs: [],
    componentName: 'Button',
    'dd-action-name': [],
    accessibilityLabel: []
};

describe('MdBabelInteractionTracking.wrapRumAction', () => {
    it('should not crash when func is undefined', () => {
        const wrapped = MdBabelInteractionTracking.wrapRumAction(
            undefined as any,
            RumActionType.TAP,
            mockTargetObject
        );

        expect(() => wrapped()).not.toThrow();
        expect(wrapped()).toBeUndefined();
    });

    it('should not crash when func is null', () => {
        const wrapped = MdBabelInteractionTracking.wrapRumAction(
            null as any,
            RumActionType.TAP,
            mockTargetObject
        );

        expect(() => wrapped()).not.toThrow();
        expect(wrapped()).toBeUndefined();
    });

    it('should call func when it is defined', () => {
        const func = jest.fn().mockReturnValue('result');
        const wrapped = MdBabelInteractionTracking.wrapRumAction(
            func,
            RumActionType.TAP,
            mockTargetObject
        );

        const result = wrapped('arg1', 'arg2');

        expect(func).toHaveBeenCalledWith('arg1', 'arg2');
        expect(result).toBe('result');
    });

    it('should forward the first handler argument as actionContext to MdRum.addAction', () => {
        const mockAddAction = jest.fn().mockResolvedValue(undefined);
        MdBabelInteractionTracking.config = { trackInteractions: true };
        MdBabelInteractionTracking.attachRumInstance({
            addAction: mockAddAction
        } as any);

        const func = jest.fn();
        const wrapped = MdBabelInteractionTracking.wrapRumAction(
            func,
            RumActionType.TAP,
            mockTargetObject
        );

        const event = {
            nativeEvent: { target: 42, locationX: 10, locationY: 20 }
        };
        wrapped(event);

        expect(mockAddAction).toHaveBeenCalledWith(
            RumActionType.TAP,
            expect.any(String),
            expect.anything(),
            expect.any(Number),
            event
        );
    });
});
