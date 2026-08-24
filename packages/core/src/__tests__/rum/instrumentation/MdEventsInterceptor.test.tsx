/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { InternalLog } from '../../../InternalLog';
import { SdkVerbosity } from '../../../config/types';
import { MdRum } from '../../../rum/MdRum';
import {
    MdEventsInterceptor,
    UNKNOWN_TARGET_NAME
} from '../../../rum/instrumentation/interactionTracking/MdEventsInterceptor';
import { RumActionType } from '../../../rum/types';

jest.mock('../../../rum/MdRum', () => {
    return {
        MdRum: {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            addAction: jest.fn().mockImplementation(() => {})
        }
    };
});

jest.mock('../../../InternalLog', () => {
    return {
        InternalLog: {
            log: jest.fn()
        }
    };
});

// Silence the warning https://github.com/facebook/react-native/issues/11094#issuecomment-263240420
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.useFakeTimers();

let testedEventsInterceptor: MdEventsInterceptor;

beforeEach(() => {
    testedEventsInterceptor = new MdEventsInterceptor();
    jest.setTimeout(20000);
    InternalLog.log.mockReset();
    MdRum.addAction.mockReset();
});

it('M send a RUM Action event W interceptOnPress { arguments with dd-action-name } ', async () => {
    // GIVEN
    const fakeAccessibilityLabel = 'target_name';
    const fakeMdActionLabel = 'MdActionLabel';
    const fakeArguments = {
        _targetInst: {
            memoizedProps: {
                accessibilityLabel: fakeAccessibilityLabel,
                'dd-action-name': fakeMdActionLabel
            }
        }
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeMdActionLabel);
    expect(MdRum.addAction.mock.calls[0][4]).toBe(fakeArguments);
});

it('M send a RUM Action event W interceptOnPress { arguments with actionNameAttribute } ', async () => {
    // GIVEN
    const eventsInterceptor = new MdEventsInterceptor({
        actionNameAttribute: 'testID'
    });
    const fakeAccessibilityLabel = 'target_name';
    const fakeTestId = 'testID';
    const fakeArguments = {
        _targetInst: {
            memoizedProps: {
                accessibilityLabel: fakeAccessibilityLabel,
                testID: fakeTestId
            }
        }
    };

    // WHEN
    eventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeTestId);
    expect(MdRum.addAction.mock.calls[0][4]).toBe(fakeArguments);
});

it('M send a RUM Action event W interceptOnPress { arguments with dd-action-name over actionNameAttribute } ', async () => {
    // GIVEN
    const eventsInterceptor = new MdEventsInterceptor({
        actionNameAttribute: 'testID'
    });
    const fakeAccessibilityLabel = 'target_name';
    const fakeTestId = 'testID';
    const fakeMdActionLabel = 'MdActionLabel';
    const fakeArguments = {
        _targetInst: {
            memoizedProps: {
                accessibilityLabel: fakeAccessibilityLabel,
                'dd-action-name': fakeMdActionLabel,
                testID: fakeTestId
            }
        }
    };

    // WHEN
    eventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeMdActionLabel);
    expect(MdRum.addAction.mock.calls[0][4]).toBe(fakeArguments);
});

it('M send a RUM Action event W interceptOnPress { arguments with dd-action-name on a parent node} ', async () => {
    // GIVEN
    const fakeAccessibilityLabel = 'target_name';
    const fakeMdActionLabel = 'MdActionLabel';
    const fakeArguments = {
        _targetInst: {
            memoizedProps: {
                accessibilityLabel: fakeAccessibilityLabel
            },
            return: {
                memoizedProps: {
                    accessibilityLabel: fakeAccessibilityLabel,
                    'dd-action-name': fakeMdActionLabel
                }
            }
        }
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeMdActionLabel);
});

it('M send a RUM Action event W interceptOnPress { arguments with accessibilityLabel } ', async () => {
    // GIVEN
    const fakeAccessibilityLabel = 'target_name';
    const fakeArguments = {
        _targetInst: {
            memoizedProps: { accessibilityLabel: fakeAccessibilityLabel }
        }
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeAccessibilityLabel);
});

it('M send only one RUM Action event W interceptOnPress { called multiple times for same target } ', async () => {
    // GIVEN
    const fakeAccessibilityLabel = 'target_name';
    const fakeArguments = {
        _targetInst: {
            memoizedProps: { accessibilityLabel: fakeAccessibilityLabel }
        }
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);
    testedEventsInterceptor.interceptOnPress(fakeArguments);
    testedEventsInterceptor.interceptOnPress(fakeArguments);
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeAccessibilityLabel);
});

it('M send a RUM Action event W interceptOnPress { no accessibilityLabel arguments, elementType is string } ', async () => {
    // GIVEN
    const fakeElementType = 'element_type';
    const fakeArguments = { _targetInst: { elementType: fakeElementType } };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeElementType);
});

it('M send a RUM Action event W interceptOnPress { no accessibilityLabel arguments, elementType is object with name property } ', async () => {
    // GIVEN
    const fakeElementType = 'element_type';
    const fakeArguments = {
        _targetInst: { elementType: { name: fakeElementType } }
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeElementType);
});

it('M send a RUM Action event W interceptOnPress { no accessibilityLabel, no elementType } ', async () => {
    // GIVEN
    const fakeArguments = { _targetInst: {} };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(UNKNOWN_TARGET_NAME);
});

it('M send a RUM Action event W interceptOnPress { event nested in props wrapper (react-native-ui-lib pattern) } ', async () => {
    // GIVEN
    const fakeAccessibilityLabel = 'wrapped_target';
    const fakeEvent = {
        _targetInst: {
            memoizedProps: {
                accessibilityLabel: fakeAccessibilityLabel
            }
        }
    };
    const fakeArguments = {
        onPress: jest.fn(),
        someOtherProp: 'value',
        event: fakeEvent
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeAccessibilityLabel);
    expect(MdRum.addAction.mock.calls[0][4]).toBe(fakeEvent);
});

it('M send a RUM Action event W interceptOnPress { event nested in props wrapper with dd-action-name } ', async () => {
    // GIVEN
    const fakeMdActionLabel = 'WrappedMdActionLabel';
    const fakeEvent = {
        _targetInst: {
            memoizedProps: {
                'dd-action-name': fakeMdActionLabel
            }
        }
    };
    const fakeArguments = {
        onPress: jest.fn(),
        event: fakeEvent
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(1);
    expect(MdRum.addAction.mock.calls[0][0]).toBe(RumActionType.TAP);
    expect(MdRum.addAction.mock.calls[0][1]).toBe(fakeMdActionLabel);
    expect(MdRum.addAction.mock.calls[0][4]).toBe(fakeEvent);
});

it('M do nothing W interceptOnPress { props wrapper without nested event (incubator pattern) } ', async () => {
    // GIVEN - react-native-ui-lib Incubator passes props without event
    const fakeArguments = {
        onPress: jest.fn(),
        someOtherProp: 'value'
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});

it('M do nothing W interceptOnPress { props wrapper with event that has no _targetInst } ', async () => {
    // GIVEN - event property exists but is not a valid native event
    const fakeArguments = {
        onPress: jest.fn(),
        event: { nativeEvent: { pageX: 0, pageY: 0 } }
    };

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});

it('M do nothing W interceptOnPress { invalid arguments - empty object } ', async () => {
    // GIVEN
    const fakeArguments = {};

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});

it('M do nothing W interceptOnPress { invalid arguments - array } ', async () => {
    // GIVEN
    const fakeArguments = [];

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});

it('M do nothing W interceptOnPress { invalid arguments - nested array } ', async () => {
    // GIVEN
    const fakeArguments = [[]];

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});

it('M do nothing W interceptOnPress { invalid arguments - undefined } ', async () => {
    // GIVEN
    const fakeArguments = undefined;

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});

it('M do nothing W interceptOnPress { invalid arguments - null } ', async () => {
    // GIVEN
    const fakeArguments = null;

    // WHEN
    testedEventsInterceptor.interceptOnPress(fakeArguments);

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});

it('M do nothing W interceptOnPress { invalid arguments - wrong object } ', async () => {
    // WHEN
    testedEventsInterceptor.interceptOnPress({ a: 'b' });

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});

it('M do nothing W interceptOnPress { no arguments call } ', async () => {
    // WHEN
    testedEventsInterceptor.interceptOnPress();

    // THEN
    expect(MdRum.addAction.mock.calls.length).toBe(0);
    expect(InternalLog.log.mock.calls.length).toBe(1);
    expect(InternalLog.log.mock.calls[0][0]).toBe(
        MdEventsInterceptor.ACTION_EVENT_DROPPED_DEBUG_MESSAGE
    );
    expect(InternalLog.log.mock.calls[0][1]).toBe(SdkVerbosity.DEBUG);
});
