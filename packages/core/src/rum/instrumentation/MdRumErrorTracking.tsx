/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type { ErrorHandlerCallback } from 'react-native';

import { InternalLog } from '../../InternalLog';
import { SdkVerbosity } from '../../config/types/SdkVerbosity';
import { errorEncoder } from '../../sdk/AttributesEncoding/defaultEncoders';
import {
    ERROR_DEFAULT_NAME,
    ERROR_EMPTY_STACKTRACE,
    getErrorMessage,
    getErrorName,
    getErrorStackTrace
} from '../../sdk/AttributesEncoding/errorUtils';
import { ErrorSource } from '../../types';
import { executeWithDelay } from '../../utils/jsUtils';
import { MdRum } from '../MdRum';

/**
 * Provides RUM auto-instrumentation feature to track errors as RUM events.
 */
export class MdRumErrorTracking {
    private static isTracking = false;

    private static isInDefaultErrorHandler = false;

    // eslint-disable-next-line
    private static defaultErrorHandler: ErrorHandlerCallback = (_error: any, _isFatal?: boolean) => { }

    // eslint-disable-next-line
    private static defaultConsoleError = (..._params: unknown[]) => { }

    /**
     * Starts tracking errors and sends a RUM Error event every time an error is detected.
     */
    static startTracking(): void {
        // extra safety to avoid wrapping the Error handler twice
        if (MdRumErrorTracking.isTracking) {
            InternalLog.log(
                'Motadata SDK is already tracking errors',
                SdkVerbosity.WARN
            );
            return;
        }

        if (ErrorUtils) {
            MdRumErrorTracking.defaultErrorHandler = ErrorUtils.getGlobalHandler();
            MdRumErrorTracking.defaultConsoleError = console.error;

            ErrorUtils.setGlobalHandler(MdRumErrorTracking.onGlobalError);
            console.error = MdRumErrorTracking.onConsoleError;

            MdRumErrorTracking.isTracking = true;
            InternalLog.log(
                'Motadata SDK is tracking errors',
                SdkVerbosity.INFO
            );
        } else {
            InternalLog.log(
                'Motadata SDK cannot track errors, ErrorUtils is not defined',
                SdkVerbosity.ERROR
            );
        }
    }

    static onGlobalError = (error: any, isFatal?: boolean): void => {
        const message = getErrorMessage(error);
        const stacktrace = getErrorStackTrace(error);
        this.reportError(message, ErrorSource.SOURCE, stacktrace, {
            '_dd.error.is_crash': isFatal,
            '_dd.error.raw': errorEncoder.encode(error)
        }).then(async () => {
            MdRumErrorTracking.isInDefaultErrorHandler = true;
            try {
                // On real iOS devices, the crash context is not updated soon
                // enough for the view update to contain the crash.
                // Waiting for 50ms has low impact and ensures the crash context
                // is updated before actually crashing the app.
                await executeWithDelay(
                    () =>
                        MdRumErrorTracking.defaultErrorHandler(error, isFatal),
                    50
                );
            } finally {
                MdRumErrorTracking.isInDefaultErrorHandler = false;
            }
        });
    };

    static onConsoleError = (...params: unknown[]): void => {
        if (MdRumErrorTracking.isInDefaultErrorHandler) {
            return;
        }

        let stack: string = ERROR_EMPTY_STACKTRACE;
        let errorName: string = ERROR_DEFAULT_NAME;
        for (let i = 0; i < params.length; i += 1) {
            const param = params[i];

            const paramStack = getErrorStackTrace(param);
            if (paramStack !== ERROR_EMPTY_STACKTRACE) {
                stack = paramStack;
            }

            const paramErrorName = getErrorName(param);
            if (paramErrorName !== ERROR_DEFAULT_NAME) {
                errorName = paramErrorName;
            }

            if (
                errorName !== ERROR_DEFAULT_NAME &&
                stack !== ERROR_EMPTY_STACKTRACE
            ) {
                break;
            }
        }

        const message = params
            .map(param => {
                if (typeof param === 'string') {
                    return param;
                } else {
                    return getErrorMessage(param);
                }
            })
            .join(' ');

        this.reportError(message, ErrorSource.CONSOLE, stack).then(() => {
            MdRumErrorTracking.defaultConsoleError.apply(console, params);
        });
    };

    private static reportError = (
        message: string,
        source: ErrorSource,
        stacktrace: string,
        context: object = {}
    ): Promise<void> => {
        return MdRum.addError(message, source, stacktrace, context);
    };
}
