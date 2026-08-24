/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type { ResourceKind } from '../../../../types';
import type { MdRumResourceTracingAttributes } from '../../distributedTracing/distributedTracingAttributes';

export interface RUMResource {
    key: string;
    request: {
        method: string;
        url: string;
        kind: ResourceKind;
    };
    tracingAttributes: MdRumResourceTracingAttributes;
    graphqlAttributes?: MdRumResourceGraphqlAttributes;
    response: {
        statusCode: number;
        size: number;
    };
    timings: {
        startTime: number;
        stopTime: number;
        responseStartTime?: number;
    };
    resourceContext?: XMLHttpRequest;
}

export type MdRumResourceGraphqlError = {
    message: string;
    code?: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
};

export type MdRumResourceGraphqlAttributes = {
    operationType?: string;
    operationName?: string;
    variables?: string;
    payload?: string;
    errors?: MdRumResourceGraphqlError[];
};
