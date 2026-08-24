/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import { InternalLog } from './InternalLog';
import { MdSdkReactNative } from './MdSdkReactNative';
import { FileBasedConfiguration } from './config/FileBasedConfiguration';
import { MotadataProviderConfiguration } from './config/MotadataProviderConfiguration';
import type { AutoInstrumentationConfiguration } from './config/async/AutoInstrumentationConfiguration';
import type { PartialInitializationConfiguration } from './config/async/PartialInitializationConfiguration';
import type { CoreConfigurationOptions } from './config/features/CoreConfiguration.type';
import { CoreConfiguration } from './config/features/CoreConfiguration';
import type { LogsConfigurationOptions } from './config/features/LogsConfiguration.type';
import { LogsConfiguration } from './config/features/LogsConfiguration';
import type { RumConfigurationOptions } from './config/features/RumConfiguration.type';
import { RumConfiguration } from './config/features/RumConfiguration';
import type { TraceConfigurationOptions } from './config/features/TraceConfiguration.type';
import { TraceConfiguration } from './config/features/TraceConfiguration';
import {
    ProxyConfiguration,
    ProxyType
} from './config/types/ProxyConfiguration';
import { SdkVerbosity } from './config/types/SdkVerbosity';
import { TrackingConsent } from './config/types/TrackingConsent';
import {
    BatchProcessingLevel,
    BatchSize,
    InitializationMode,
    UploadFrequency,
    VitalsUpdateFrequency
} from './config/types';
import { MdRum } from './rum/MdRum';
import { MdBabelInteractionTracking } from './rum/instrumentation/interactionTracking/MdBabelInteractionTracking';
import { __ddExtractText } from './rum/instrumentation/interactionTracking/ddBabelUtils';
import { MotadataTracingContext } from './rum/instrumentation/resourceTracking/distributedTracing/MotadataTracingContext';
import { MotadataTracingIdentifier } from './rum/instrumentation/resourceTracking/distributedTracing/MotadataTracingIdentifier';
import {
    TracingIdFormat,
    TracingIdType
} from './rum/instrumentation/resourceTracking/distributedTracing/TracingIdentifier';
import {
    MOTADATA_GRAPH_QL_OPERATION_NAME_HEADER,
    MOTADATA_GRAPH_QL_OPERATION_TYPE_HEADER,
    MOTADATA_GRAPH_QL_VARIABLES_HEADER,
    MOTADATA_GRAPH_QL_PAYLOAD_HEADER,
    MOTADATA_GRAPH_QL_ERROR_HEADER
} from './rum/instrumentation/resourceTracking/graphql/graphqlHeaders';
import type { FirstPartyHost } from './rum/types';
import { PropagatorType, RumActionType } from './rum/types';
import { MdSdk } from './sdk/MdSdk';
import { MotadataProvider } from './sdk/MotadataProvider/MotadataProvider';
import { MdTrace } from './trace/MdTrace';
import { ErrorSource, FeatureOperationFailure } from './types';
import { DefaultTimeProvider } from './utils/time-provider/DefaultTimeProvider';
import type { Timestamp } from './utils/time-provider/TimeProvider';
import { TimeProvider } from './utils/time-provider/TimeProvider';

export {
    MotadataProvider,
    MotadataProviderConfiguration,
    FileBasedConfiguration,
    InitializationMode,
    MdTrace,
    MdRum,
    RumActionType,
    ErrorSource,
    FeatureOperationFailure,
    CoreConfiguration,
    RumConfiguration,
    LogsConfiguration,
    TraceConfiguration,
    MdSdkReactNative,
    MdSdk,
    InternalLog,
    ProxyConfiguration,
    ProxyType,
    TrackingConsent,
    SdkVerbosity,
    VitalsUpdateFrequency,
    PropagatorType,
    UploadFrequency,
    BatchSize,
    BatchProcessingLevel,
    TimeProvider,
    DefaultTimeProvider,
    MOTADATA_GRAPH_QL_OPERATION_TYPE_HEADER,
    MOTADATA_GRAPH_QL_OPERATION_NAME_HEADER,
    MOTADATA_GRAPH_QL_VARIABLES_HEADER,
    MOTADATA_GRAPH_QL_PAYLOAD_HEADER,
    MOTADATA_GRAPH_QL_ERROR_HEADER,
    TracingIdType,
    TracingIdFormat,
    MotadataTracingIdentifier,
    MotadataTracingContext,
    MdBabelInteractionTracking,
    __ddExtractText
};
export type {
    Timestamp,
    FirstPartyHost,
    AutoInstrumentationConfiguration,
    PartialInitializationConfiguration,
    CoreConfigurationOptions,
    RumConfigurationOptions,
    LogsConfigurationOptions,
    TraceConfigurationOptions
};
