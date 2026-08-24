/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

/**
 * In the tests, performance.now sometimes does not change as fast as Date.now.
 * This results in short intervals sometimes having a duration of 0ms and flaky tests.
 */
global.performance.now = () => {
    return Date.now();
};

/**
 * Native module mocks (previously provided via jestSetup.js.override copied into
 * react-native-gesture-handler). Inlined here so the RUM-only core package does not
 * depend on react-native-gesture-handler.
 */
const { NativeModules: RNNativeModules } = require('react-native');

RNNativeModules.RNGestureHandlerModule = RNNativeModules.RNGestureHandlerModule || {
    State: { BEGAN: 'BEGAN', FAILED: 'FAILED', ACTIVE: 'ACTIVE', END: 'END' },
    attachGestureHandler: jest.fn(),
    createGestureHandler: jest.fn(),
    dropGestureHandler: jest.fn(),
    updateGestureHandler: jest.fn()
};

RNNativeModules.PlatformConstants = RNNativeModules.PlatformConstants || {
    forceTouchAvailable: false
};
