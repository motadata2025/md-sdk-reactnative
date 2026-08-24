/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import React from 'react';

import { InternalLog } from '../../../InternalLog';
import { SdkVerbosity } from '../../../config/types/SdkVerbosity';
import { getErrorMessage } from '../../../sdk/AttributesEncoding/errorUtils';
import { NativeMdSdk } from '../../../sdk/MdSdkInternal';
import { BABEL_PLUGIN_TELEMETRY } from '../../constants';

import type { EventsInterceptor } from './EventsInterceptor';
import { MdBabelInteractionTracking } from './MdBabelInteractionTracking';
import type { MdEventsInterceptorOptions } from './MdEventsInterceptor';
import { MdEventsInterceptor } from './MdEventsInterceptor';
import { NoOpEventsInterceptor } from './NoOpEventsInterceptor';
import { areObjectShallowEqual } from './ShallowObjectEqualityChecker';
import { getJsxRuntimes } from './getJsxRuntime';

/**
 * Provides RUM auto-instrumentation feature to track user interaction as RUM events.
 * For now we are only covering the "onPress" events.
 *
 * @deprecated since 3.0.0 – Use `@motadata/mobile-react-native-babel-plugin` instead.
 */
export class MdRumUserInteractionTracking {
    private static isTracking = false;
    private static eventsInterceptor: EventsInterceptor = new NoOpEventsInterceptor();
    private static originalCreateElement = React.createElement;
    private static originalMemo = React.memo;
    private static originalJsx = null;
    private static originalDevJsx = null;

    private static patchCreateElementFunction = (
        originalFunction: typeof React.createElement,
        [element, props, ...rest]: Parameters<typeof React.createElement>
    ): ReturnType<typeof React.createElement> => {
        if (
            props &&
            typeof (props as Record<string, unknown>).onPress === 'function'
        ) {
            const originalOnPress = (props as Record<string, unknown>) // eslint-disable-next-line @typescript-eslint/ban-types
                .onPress as Function;
            (props as Record<string, unknown>).onPress = (...args: any[]) => {
                MdRumUserInteractionTracking.eventsInterceptor.interceptOnPress(
                    ...args
                );
                return originalOnPress(...args);
            };
            // we store the original onPress prop so we can keep memoization working
            (props as Record<
                string,
                unknown
            >).__MOTADATA_INTERNAL_ORIGINAL_ON_PRESS__ = originalOnPress;
        }
        return originalFunction(element, props, ...rest);
    };

    /**
     * Starts tracking user interactions and sends a RUM Action event every time a new interaction was detected.
     * Please note that we are only considering as valid - for - tracking only the user interactions that have
     * a visible output (either an UI state change or a Resource request)
     *
     * @deprecated since version 3.0.0
     */
    static startTracking(options: MdEventsInterceptorOptions): void {
        InternalLog.log(
            '[DEPRECATED] Interaction tracking via the core React Native SDK has been deprecated since v3.0.0. ' +
                'Please migrate to @motadata/mobile-react-native-babel-plugin: https://www.npmjs.com/package/@motadata/mobile-react-native-babel-plugin.',
            SdkVerbosity.WARN
        );

        // extra safety to avoid wrapping more than 1 time this function
        if (MdRumUserInteractionTracking.isTracking) {
            InternalLog.log(
                'Motadata SDK is already tracking interactions',
                SdkVerbosity.WARN
            );
            return;
        }

        NativeMdSdk?.sendTelemetryLog(
            BABEL_PLUGIN_TELEMETRY,
            MdBabelInteractionTracking.getTelemetryConfig(),
            { onlyOnce: true }
        );

        MdRumUserInteractionTracking.eventsInterceptor = new MdEventsInterceptor(
            options
        );

        const original = React.createElement;
        React.createElement = (
            ...args: Parameters<typeof React.createElement>
        ): any => {
            return this.patchCreateElementFunction(original, args);
        };

        try {
            const [jsxRuntime, jsxDevRuntime] = getJsxRuntimes();
            const originalJsx = jsxRuntime?.jsx;
            const originalDevJsx = jsxDevRuntime?.jsxDEV;

            this.originalJsx = originalJsx;
            this.originalDevJsx = originalDevJsx;

            if (originalJsx) {
                jsxRuntime.jsx = (
                    ...args: Parameters<typeof React.createElement>
                ): ReturnType<typeof React.createElement> => {
                    return this.patchCreateElementFunction(originalJsx, args);
                };
            }

            if (originalDevJsx) {
                jsxRuntime.jsxDEV = (
                    ...args: Parameters<typeof React.createElement>
                ): ReturnType<typeof React.createElement> => {
                    return this.patchCreateElementFunction(
                        originalDevJsx,
                        args
                    );
                };
            }
        } catch (e) {
            NativeMdSdk.telemetryDebug(getErrorMessage(e));
        }

        const originalMemo = React.memo;

        React.memo = (
            component: any,
            propsAreEqual?: (prevProps: any, newProps: any) => boolean
        ) => {
            return originalMemo(component, (prev, next) => {
                if (!next.onPress || !prev.onPress) {
                    return propsAreEqual
                        ? propsAreEqual(prev, next)
                        : areObjectShallowEqual(prev, next);
                }
                // we replace "our" onPress from the props by the original for comparison
                const { onPress: _prevOnPress, ...partialPrevProps } = prev;
                const prevProps = {
                    ...partialPrevProps,
                    onPress: prev.__MOTADATA_INTERNAL_ORIGINAL_ON_PRESS__
                };

                const { onPress: _nextOnPress, ...partialNextProps } = next;
                const nextProps = {
                    ...partialNextProps,
                    onPress: next.__MOTADATA_INTERNAL_ORIGINAL_ON_PRESS__
                };

                // if no comparison function is provided we do shallow comparison
                return propsAreEqual
                    ? propsAreEqual(prevProps, nextProps)
                    : areObjectShallowEqual(nextProps, prevProps);
            });
        };

        MdRumUserInteractionTracking.isTracking = true;
        InternalLog.log(
            'Motadata SDK is tracking interactions',
            SdkVerbosity.INFO
        );
    }

    /**
     * @deprecated since version 3.0.0
     */
    static stopTracking() {
        React.createElement = this.originalCreateElement;
        React.memo = this.originalMemo;
        MdRumUserInteractionTracking.isTracking = false;
        if (this.originalJsx || this.originalDevJsx) {
            const [jsxRuntime, jsxDevRuntime] = getJsxRuntimes();

            jsxRuntime.jsx = this.originalJsx;
            jsxDevRuntime.jsxDEV = this.originalDevJsx;

            this.originalJsx = null;
            this.originalDevJsx = null;
        }
    }
}
