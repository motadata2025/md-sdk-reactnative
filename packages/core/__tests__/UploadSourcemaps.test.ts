/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { spawnSync } from 'child_process';

it.skip('M call motadata-ci W android uploadReleaseSourcemaps', () => {
    // TODO this test requires the setup for the sample app and
    // creating motadata-sourcemaps.properties file. Should be automated in the future.
    // WHEN
    const { stdout } = spawnSync('./gradlew uploadReleaseSourcemaps --info', {
        cwd: 'example/android',
        shell: true
    });
    const result = stdout.toString('utf-8');

    // THEN
    expect(result).toContain(
        'yarn motadata-ci react-native upload --platform android' +
            ' --service com.example.ddsdkreactnative'
    );
    expect(result).toContain(
        'app/build/generated/assets/react/release/index.android.bundle'
    );
    expect(result).toContain(
        'app/build/generated/sourcemaps/react/release/index.android.bundle.map'
    );
});
