/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type { MotadataTracingContext } from '../../instrumentation/resourceTracking/distributedTracing/MotadataTracingContext';
import { TracingIdFormat } from '../../instrumentation/resourceTracking/distributedTracing/TracingIdentifier';
import { TracingIdentifierUtils } from '../../instrumentation/resourceTracking/distributedTracing/__tests__/__utils__/TracingIdentifierUtils';

type Header = { header: string; value: string };

export const verifyRumResourceContext = (
    tracingContext: MotadataTracingContext,
    resourceContext?: Record<string, string | number>
) => {
    const rumResourceContext =
        resourceContext ?? tracingContext.getRumResourceContext();
    const traceId = rumResourceContext['_dd.trace_id'];
    const spanId = rumResourceContext['_dd.span_id'];

    expect(traceId).toBe(
        tracingContext.traceId?.toString(TracingIdFormat.paddedHex)
    );

    expect(spanId).toBe(
        tracingContext.spanId?.toString(TracingIdFormat.decimal)
    );
};

export const verifyMotadataHeaders = (
    headersArray: Header[],
    isSampled: boolean
) => {
    const headers = getHeadersMapFromArray(headersArray);

    // x-motadata-origin
    const originHeader = headers.get('x-motadata-origin') as string;
    expect(originHeader).toBeDefined();
    expect(originHeader).toBe('rum');

    // x-motadata-sampling-priority
    const samplingPriorityHeader = headers.get(
        'x-motadata-sampling-priority'
    ) as string;
    expect(samplingPriorityHeader).toBeDefined();
    expect(samplingPriorityHeader).toBe(isSampled ? '1' : '0');

    // x-motadata-trace-id
    const traceIdHeader = headers.get('x-motadata-trace-id') as string;
    expect(traceIdHeader).toBeDefined();
    expect(traceIdHeader).toMatch(/^(?:\d+|\d*\.\d+)$/);
    expect(TracingIdentifierUtils.isWithin64Bits(traceIdHeader)).toBe(true);

    // x-motadata-parent-id
    const parentIdHeader = headers.get('x-motadata-parent-id') as string;
    expect(parentIdHeader).toBeDefined();
    expect(parentIdHeader).toMatch(/^(?:\d+|\d*\.\d+)$/);
    expect(TracingIdentifierUtils.isWithin64Bits(parentIdHeader)).toBe(true);

    // x-motadata-tags
    const tagsHeader = headers.get('x-motadata-tags') as string;
    expect(tagsHeader).toBeDefined();
    expect(tagsHeader).toMatch(/^_dd\.p\.tid=[0-9a-fA-F]{16}$/);
    expect(
        TracingIdentifierUtils.isWithin64Bits(tagsHeader.split('=')[1])
    ).toBe(true);
};

export const verifyTraceContextHeaders = (
    headersArray: Header[],
    isSampled: boolean
) => {
    const headers = getHeadersMapFromArray(headersArray);

    // traceparent (example: 00-67a9ce4b00000000566c8ec4106d55b4-b69743e07c0f3fb5-01)
    const traceParentHeader = headers.get('traceparent') as string;
    expect(traceParentHeader).toBeDefined();

    const traceParentParts = traceParentHeader.split('-');
    expect(traceParentParts).toHaveLength(4);

    const version = traceParentParts[0];
    expect(version).toBe('00');

    const traceId = traceParentParts[1];
    expect(traceId).toMatch(/^[0-9a-fA-F]{32}$/);
    expect(TracingIdentifierUtils.isWithin128Bits(traceId, 16)).toBe(true);

    const parentId = traceParentParts[2];
    expect(parentId).toMatch(/^[0-9a-fA-F]{16}$/);
    expect(TracingIdentifierUtils.isWithin64Bits(parentId, 16)).toBe(true);

    const flags = traceParentParts[3];
    expect(flags).toBe(isSampled ? '01' : '00');

    // tracestate (example: dd=s:1;o:rum;p:b69743e07c0f3fb5)
    const traceStateHeader = headers.get('tracestate') as string;
    expect(traceStateHeader).toBeDefined();

    const traceStateParts = traceStateHeader.split(';');
    expect(traceStateParts).toHaveLength(3);

    const motadataFlags = traceStateParts[0];
    expect(motadataFlags.split('=')[1]).toBe(`s:${isSampled ? 1 : 0}`);

    const origin = traceStateParts[1];
    expect(origin.split(':')[1]).toBe('rum');

    const parent = traceStateParts[2];
    expect(parent.split(':')[1]).toMatch(/^[0-9a-fA-F]{16}$/);
    expect(
        TracingIdentifierUtils.isWithin64Bits(parent.split(':')[1], 16)
    ).toBe(true);
};

export const verifyB3Headers = (headersArray: Header[], isSampled: boolean) => {
    const headers = getHeadersMapFromArray(headersArray);

    // b3 (example: 67a9d1b800000000b83b034110cf109f-934634763188a363-1)
    const b3Header = headers.get('b3') as string;
    expect(b3Header).toBeDefined();

    const parts = b3Header.split('-');
    expect(parts).toHaveLength(3);

    const traceId = parts[0];
    expect(traceId).toMatch(/^[0-9a-fA-F]{32}$/);
    expect(TracingIdentifierUtils.isWithin128Bits(traceId, 16)).toBe(true);

    const parentId = parts[1];
    expect(parentId).toMatch(/^[0-9a-fA-F]{16}$/);
    expect(TracingIdentifierUtils.isWithin64Bits(parentId, 16)).toBe(true);

    const samplingFlag = parts[2];
    expect(samplingFlag).toBe(isSampled ? '1' : '0');
};

export const verifyB3MultiHeaders = (
    headersArray: Header[],
    isSampled: boolean
) => {
    const headers = getHeadersMapFromArray(headersArray);

    // X-B3-TraceId (example: 67a9d2cc00000000f1118fc009a8ea2f)
    const traceIdHeader = headers.get('X-B3-TraceId') as string;
    expect(traceIdHeader).toBeDefined();
    expect(traceIdHeader).toMatch(/^[0-9a-fA-F]{32}$/);
    expect(TracingIdentifierUtils.isWithin128Bits(traceIdHeader, 16));

    // X-B3-SpanId (example: 64765d396cb90802)
    const spanIdHeader = headers.get('X-B3-SpanId') as string;
    expect(spanIdHeader).toBeDefined();
    expect(spanIdHeader).toMatch(/^[0-9a-fA-F]{16}$/);
    expect(TracingIdentifierUtils.isWithin64Bits(traceIdHeader, 16));

    // X-B3-Sampled
    const samplingHeader = headers.get('X-B3-Sampled') as string;
    expect(samplingHeader).toBeDefined();
    expect(samplingHeader).toBe(isSampled ? '1' : '0');
};

const getHeadersMapFromArray = (headers: Header[]): Map<string, string> => {
    return new Map(headers.map(({ header, value }) => [header, value]));
};
