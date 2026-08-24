/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { InternalLog } from '../../../../../InternalLog';
import { SdkVerbosity } from '../../../../../config/types';
import { Timer } from '../../../../../utils/Timer';
import {
    getCachedAccountId,
    getCachedSessionId,
    getCachedUserId
} from '../../../../helper';
import type { MdRumResourceTracingAttributes } from '../../distributedTracing/distributedTracingAttributes';
import { getTracingHeadersFromAttributes } from '../../distributedTracing/distributedTracingHeaders';
import { getTracingAttributes } from '../../distributedTracing/distributedTracing';
import {
    BAGGAGE_HEADER_KEY,
    TRACKED_BY_HEADER_KEY,
    TRACKED_BY_HEADER_VALUE
} from '../../distributedTracing/headers';
import {
    MOTADATA_GRAPH_QL_ERROR_HEADER,
    MOTADATA_GRAPH_QL_OPERATION_NAME_HEADER,
    MOTADATA_GRAPH_QL_OPERATION_TYPE_HEADER,
    MOTADATA_GRAPH_QL_PAYLOAD_HEADER,
    MOTADATA_GRAPH_QL_VARIABLES_HEADER
} from '../../graphql/graphqlHeaders';
import { extractGraphQLErrors } from '../../graphql/graphqlUtils';
import { MOTADATA_BAGGAGE_HEADER, isMotadataCustomHeader } from '../../headers';
import type { RequestProxyOptions } from '../interfaces/RequestProxy';
import { RequestProxy } from '../interfaces/RequestProxy';
import type { MdRumResourceGraphqlAttributes } from '../interfaces/RumResource';

import { ResourceReporter } from './MotadataRumResource/ResourceReporter';
import { filterDevResource } from './MotadataRumResource/internalDevResourceBlocklist';
import { URLHostParser } from './URLHostParser';
import { formatBaggageHeader } from './baggageHeaderUtils';
import { calculateResponseSize } from './responseSize';
import { getErrorData, readXhrJsonBody } from './xhrUtils';

const RESPONSE_START_LABEL = 'response_start';

interface MdRumXhr extends XMLHttpRequest {
    _motadata_xhr: MdRumXhrContext;
}

interface MdRumXhrContext {
    graphql: MdRumResourceGraphqlAttributes & {
        trackErrors?: boolean;
    };
    method: string;
    url: string;
    reported: boolean;
    timer: Timer;
    tracingAttributes: MdRumResourceTracingAttributes;
    baggageHeaderEntries: Set<string>;
}

interface XHRProxyProviders {
    xhrType: typeof XMLHttpRequest;
    resourceReporter: ResourceReporter;
}

/**
 * Proxies XMLHttpRequest to track resources.
 */
export class XHRProxy extends RequestProxy {
    private providers: XHRProxyProviders;
    private context: RequestProxyOptions | null = null;
    private static originalXhrOpen: typeof XMLHttpRequest.prototype.open;
    private static originalXhrSend: typeof XMLHttpRequest.prototype.send;
    private static originalXhrSetRequestHeader: typeof XMLHttpRequest.prototype.setRequestHeader;

    constructor(providers: XHRProxyProviders) {
        super();
        this.providers = providers;
    }

    static createWithResourceReporter() {
        return new XHRProxy({
            xhrType: XMLHttpRequest,
            resourceReporter: new ResourceReporter([filterDevResource])
        });
    }

    onTrackingStart = (context: RequestProxyOptions) => {
        XHRProxy.originalXhrOpen = this.providers.xhrType.prototype.open;
        XHRProxy.originalXhrSend = this.providers.xhrType.prototype.send;
        XHRProxy.originalXhrSetRequestHeader = this.providers.xhrType.prototype.setRequestHeader;
        this.context = context;
        proxyRequests(this.providers, context);
    };

    onTrackingStop = () => {
        this.providers.xhrType.prototype.open = XHRProxy.originalXhrOpen;
        this.providers.xhrType.prototype.send = XHRProxy.originalXhrSend;
        this.providers.xhrType.prototype.setRequestHeader =
            XHRProxy.originalXhrSetRequestHeader;
        this.context = null;
    };

    onTrackingUpdate = (options: { tracingSamplingRate: number }) => {
        if (this.context === null) {
            return;
        }
        this.context.tracingSamplingRate = options.tracingSamplingRate;
    };
}

const proxyRequests = (
    providers: XHRProxyProviders,
    context: RequestProxyOptions
): void => {
    proxyOpen(providers, context);
    proxySend(providers);
    proxySetRequestHeader(providers);
};

const proxyOpen = (
    { xhrType }: XHRProxyProviders,
    context: RequestProxyOptions
): void => {
    const originalXhrOpen = xhrType.prototype.open;

    xhrType.prototype.open = function open(
        this: MdRumXhr,
        method: string,
        url: string
    ) {
        const hostname = URLHostParser(url);
        // Keep track of the method and url
        // start time is tracked by the `send` method
        this._motadata_xhr = {
            method,
            url,
            reported: false,
            timer: new Timer(),
            graphql: {},
            tracingAttributes: getTracingAttributes({
                hostname,
                firstPartyHostsRegexMap: context.firstPartyHostsRegexMap,
                tracingSamplingRate: context.tracingSamplingRate,
                rumSessionId: getCachedSessionId(),
                userId: getCachedUserId(),
                accountId: getCachedAccountId()
            }),
            baggageHeaderEntries: new Set<string>()
        };
        // eslint-disable-next-line prefer-rest-params
        return originalXhrOpen.apply(this, arguments as any);
    };
};

const proxySend = (providers: XHRProxyProviders): void => {
    const xhrType = providers.xhrType;
    const originalXhrSend = xhrType.prototype.send;

    xhrType.prototype.send = function send(this: MdRumXhr) {
        if (this._motadata_xhr) {
            // keep track of start time
            this._motadata_xhr.timer.start();

            // Tracing Headers
            const tracingHeaders = getTracingHeadersFromAttributes(
                this._motadata_xhr.tracingAttributes
            );

            tracingHeaders.forEach(({ header, value }) => {
                this.setRequestHeader(header, value);
            });

            // Join all baggage header entries
            const baggageHeader = formatBaggageHeader(
                this._motadata_xhr.baggageHeaderEntries
            );
            if (baggageHeader) {
                this.setRequestHeader(MOTADATA_BAGGAGE_HEADER, baggageHeader);
            }

            this.setRequestHeader(
                TRACKED_BY_HEADER_KEY,
                TRACKED_BY_HEADER_VALUE
            );
        }

        proxyOnReadyStateChange(this, providers);

        // eslint-disable-next-line prefer-rest-params
        return originalXhrSend.apply(this, arguments as any);
    };
};

const proxyOnReadyStateChange = (
    xhrProxy: MdRumXhr,
    providers: XHRProxyProviders
): void => {
    const xhrType = providers.xhrType;
    const originalOnreadystatechange = xhrProxy.onreadystatechange;

    xhrProxy.onreadystatechange = function onreadystatechange() {
        if (xhrProxy.readyState === xhrType.DONE) {
            if (!xhrProxy._motadata_xhr.reported) {
                reportXhr(xhrProxy, providers.resourceReporter).catch(error => {
                    const errorData = getErrorData(error);
                    if (errorData) {
                        InternalLog.log(
                            `reportXhr failed: ${errorData}`,
                            SdkVerbosity.WARN
                        );
                    }
                });
                xhrProxy._motadata_xhr.reported = true;
            }
        } else if (xhrProxy.readyState === xhrType.HEADERS_RECEIVED) {
            xhrProxy._motadata_xhr.timer.recordTick(RESPONSE_START_LABEL);
        }

        if (originalOnreadystatechange) {
            // eslint-disable-next-line prefer-rest-params
            originalOnreadystatechange.apply(xhrProxy, arguments as any);
        }
    };
};

const reportXhr = async (
    xhrProxy: MdRumXhr,
    resourceReporter: ResourceReporter
): Promise<void> => {
    const responseSize = calculateResponseSize(xhrProxy);

    const context = xhrProxy._motadata_xhr;

    const key = `${context.timer.startTime}/${context.method}`;

    context.timer.stop();

    // Only extract GraphQL errors if operationType is set AND error tracking is enabled
    if (context.graphql.operationType && context.graphql.trackErrors) {
        try {
            const body = await readXhrJsonBody(xhrProxy);

            const errors = body?.errors;
            if (Array.isArray(errors) && errors.length > 0) {
                const filtered = extractGraphQLErrors(errors);

                if (filtered.length > 0) {
                    context.graphql.errors = filtered;
                }
            }
        } catch (error) {
            const errorData = getErrorData(error);
            if (errorData) {
                InternalLog.log(`reportXhr: ${errorData}`, SdkVerbosity.WARN);
            }
        }
    }

    resourceReporter.reportResource({
        key,
        request: {
            method: context.method,
            url: context.url,
            kind: 'xhr'
        },
        graphqlAttributes: context.graphql,
        tracingAttributes: context.tracingAttributes,
        response: {
            statusCode: xhrProxy.status,
            size: responseSize
        },
        timings: {
            startTime: context.timer.startTime,
            stopTime: context.timer.stopTime,
            responseStartTime: context.timer.hasTickFor(RESPONSE_START_LABEL)
                ? context.timer.timeAt(RESPONSE_START_LABEL)
                : undefined
        },
        resourceContext: xhrProxy
    });
};

const proxySetRequestHeader = (providers: XHRProxyProviders): void => {
    const xhrType = providers.xhrType;
    const originalXhrSetRequestHeader = xhrType.prototype.setRequestHeader;

    xhrType.prototype.setRequestHeader = function sendRequestHeader(
        this: MdRumXhr,
        header: string,
        value: string
    ) {
        const key = header.toLowerCase();
        if (isMotadataCustomHeader(key)) {
            switch (key) {
                case MOTADATA_GRAPH_QL_OPERATION_NAME_HEADER:
                    this._motadata_xhr.graphql.operationName = value;
                    break;
                case MOTADATA_GRAPH_QL_OPERATION_TYPE_HEADER:
                    this._motadata_xhr.graphql.operationType = value;
                    break;
                case MOTADATA_GRAPH_QL_VARIABLES_HEADER:
                    this._motadata_xhr.graphql.variables = value;
                    break;
                case MOTADATA_GRAPH_QL_PAYLOAD_HEADER:
                    this._motadata_xhr.graphql.payload = value;
                    break;
                case MOTADATA_GRAPH_QL_ERROR_HEADER:
                    this._motadata_xhr.graphql.trackErrors =
                        value === 'true' || value === '1';
                    break;
                case MOTADATA_BAGGAGE_HEADER:
                    // Apply Baggage Header only if pre-processed by Motadata
                    return originalXhrSetRequestHeader.apply(this, [
                        BAGGAGE_HEADER_KEY,
                        value
                    ]);
                default:
                    return originalXhrSetRequestHeader.apply(
                        this,
                        // eslint-disable-next-line prefer-rest-params
                        arguments as any
                    );
            }
        } else if (key === BAGGAGE_HEADER_KEY) {
            // Intercept User Baggage Header entries to apply them later
            this._motadata_xhr.baggageHeaderEntries?.add(value);
        } else {
            // eslint-disable-next-line prefer-rest-params
            return originalXhrSetRequestHeader.apply(this, arguments as any);
        }
    };
};
