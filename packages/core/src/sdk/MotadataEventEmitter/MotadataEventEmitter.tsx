/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
export type MotadataEventEmitterCallback = (data: any) => void;

export interface MotadataEventEmitter {
    initialize(): boolean;
    addListener(eventName: string, callback: MotadataEventEmitterCallback): void;
    removeAllListeners(eventName: string): void;
}
