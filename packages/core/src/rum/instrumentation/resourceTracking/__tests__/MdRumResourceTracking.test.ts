/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import { BufferSingleton } from '../../../../sdk/MotadataProvider/Buffer/BufferSingleton';
import { PropagatorType } from '../../../types';
import { MdRumResourceTracking } from '../MdRumResourceTracking';
import { SAMPLING_PRIORITY_HEADER_KEY } from '../distributedTracing/headers';

import { XMLHttpRequestMock } from './__utils__/XMLHttpRequestMock';

const MdRum = NativeModules.MdRum;

const flushPromises = () =>
    new Promise(jest.requireActual('timers').setImmediate);

beforeEach(() => {
    MdRum.startResource.mockClear();
    MdRum.stopResource.mockClear();
    BufferSingleton.onInitialization();
    global.XMLHttpRequest = XMLHttpRequestMock;
});

afterEach(() => {
    global.XMLHttpRequest = undefined;
});

const executeRequest = (url: string = 'https://api.example.com/v2/user') => {
    const xhr = new XMLHttpRequestMock();
    xhr.open('GET', url);
    xhr.send();
    xhr.notifyResponseArrived();
    xhr.complete(200, 'ok');
};

describe('MdRumResourceTracking', () => {
    it('removes all side effects when tracking is stopped', async () => {
        // GIVEN
        global.XMLHttpRequest = XMLHttpRequestMock;
        MdRumResourceTracking.startTracking({
            resourceTraceSampleRate: 100,
            firstPartyHosts: [
                {
                    match: 'example.com',
                    propagatorTypes: [PropagatorType.MOTADATA]
                }
            ]
        });

        // WHEN
        executeRequest();
        await flushPromises();

        // THEN
        expect(MdRum.startResource).toHaveBeenCalledTimes(1);
        expect(MdRum.stopResource).toHaveBeenCalledTimes(1);

        // WHEN
        MdRum.startResource.mockClear();
        MdRum.stopResource.mockClear();
        MdRumResourceTracking.stopTracking();
        executeRequest();

        // THEN
        expect(MdRum.startResource).toHaveBeenCalledTimes(0);
        expect(MdRum.stopResource).toHaveBeenCalledTimes(0);
    });

    it('does not report the resource when it is an internal resource', async () => {
        // GIVEN
        global.XMLHttpRequest = XMLHttpRequestMock;
        MdRumResourceTracking.startTracking({
            resourceTraceSampleRate: 100,
            firstPartyHosts: [
                {
                    match: 'example.com',
                    propagatorTypes: [PropagatorType.MOTADATA]
                }
            ]
        });

        // WHEN
        executeRequest('http://192.168.1.20:8081/logs');
        await flushPromises();

        // THEN
        expect(MdRum.startResource).not.toHaveBeenCalled();
        expect(MdRum.stopResource).not.toHaveBeenCalled();
    });

    describe('updateTrackingContext', () => {
        beforeEach(() => {
            MdRumResourceTracking.stopTracking();
        });

        afterEach(() => {
            MdRumResourceTracking.stopTracking();
        });

        it('is a no-op when called before startTracking', async () => {
            // GIVEN tracking was never started

            // WHEN
            MdRumResourceTracking.updateTrackingContext({
                resourceTraceSampleRate: 100
            });

            executeRequest('https://api.example.com/v2/user');
            await flushPromises();

            // THEN: no XHR proxy was installed; no resource events captured
            expect(MdRum.startResource).not.toHaveBeenCalled();
            expect(MdRum.stopResource).not.toHaveBeenCalled();
        });

        it('applies the updated sampling rate to subsequent requests', () => {
            // GIVEN tracking installed with rate=0
            MdRumResourceTracking.startTracking({
                resourceTraceSampleRate: 0,
                firstPartyHosts: [
                    {
                        match: 'api.example.com',
                        propagatorTypes: [PropagatorType.MOTADATA]
                    }
                ]
            });

            // pre-update request gets sampling priority '0'
            const xhrBeforeUpdate = new XMLHttpRequestMock();
            xhrBeforeUpdate.open('GET', 'https://api.example.com/v2/user');
            xhrBeforeUpdate.send();
            expect(
                xhrBeforeUpdate.requestHeaders.get(SAMPLING_PRIORITY_HEADER_KEY)
            ).toBe('0');

            // WHEN
            MdRumResourceTracking.updateTrackingContext({
                resourceTraceSampleRate: 100
            });

            // THEN: post-update request uses the new rate
            const xhrAfterUpdate = new XMLHttpRequestMock();
            xhrAfterUpdate.open('GET', 'https://api.example.com/v2/user');
            xhrAfterUpdate.send();
            expect(
                xhrAfterUpdate.requestHeaders.get(SAMPLING_PRIORITY_HEADER_KEY)
            ).toBe('1');
        });

        it('is a no-op after tracking has been stopped', async () => {
            // GIVEN
            MdRumResourceTracking.startTracking({
                resourceTraceSampleRate: 100,
                firstPartyHosts: [
                    {
                        match: 'api.example.com',
                        propagatorTypes: [PropagatorType.MOTADATA]
                    }
                ]
            });
            MdRumResourceTracking.stopTracking();

            // WHEN
            MdRumResourceTracking.updateTrackingContext({
                resourceTraceSampleRate: 100
            });

            executeRequest('https://api.example.com/v2/user');
            await flushPromises();

            // THEN: tracking remains stopped, nothing captured
            expect(MdRum.startResource).not.toHaveBeenCalled();
            expect(MdRum.stopResource).not.toHaveBeenCalled();
        });
    });
});
