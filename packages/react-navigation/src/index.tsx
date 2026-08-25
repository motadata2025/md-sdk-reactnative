/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type {
    NavigationTrackingOptions,
    ViewNamePredicate,
    ViewTrackingPredicate,
    ParamsTrackingPredicate
} from './rum/instrumentation/MdRumReactNavigationTracking';
import { MdRumReactNavigationTracking } from './rum/instrumentation/MdRumReactNavigationTracking';

export { MdRumReactNavigationTracking };

export type {
    NavigationTrackingOptions,
    ViewNamePredicate,
    ViewTrackingPredicate,
    ParamsTrackingPredicate
};
