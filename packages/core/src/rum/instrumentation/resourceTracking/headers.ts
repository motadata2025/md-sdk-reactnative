/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

export const MOTADATA_CUSTOM_HEADER_PREFIX = '_dd-custom-header';
export const MOTADATA_BAGGAGE_HEADER = `${MOTADATA_CUSTOM_HEADER_PREFIX}-baggage`;

export const isMotadataCustomHeader = (header: string) => {
    return header.match(new RegExp(`^${MOTADATA_CUSTOM_HEADER_PREFIX}`));
};
