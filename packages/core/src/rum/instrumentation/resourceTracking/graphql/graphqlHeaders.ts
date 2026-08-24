/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import { MOTADATA_CUSTOM_HEADER_PREFIX } from '../headers';

export const MOTADATA_GRAPH_QL_OPERATION_NAME_HEADER = `${MOTADATA_CUSTOM_HEADER_PREFIX}-graph-ql-operation-name`;
export const MOTADATA_GRAPH_QL_VARIABLES_HEADER = `${MOTADATA_CUSTOM_HEADER_PREFIX}-graph-ql-variables`;
export const MOTADATA_GRAPH_QL_OPERATION_TYPE_HEADER = `${MOTADATA_CUSTOM_HEADER_PREFIX}-graph-ql-operation-type`;
export const MOTADATA_GRAPH_QL_PAYLOAD_HEADER = `${MOTADATA_CUSTOM_HEADER_PREFIX}-graph-ql-payload`;
export const MOTADATA_GRAPH_QL_ERROR_HEADER = `${MOTADATA_CUSTOM_HEADER_PREFIX}-graph-ql-error`;
