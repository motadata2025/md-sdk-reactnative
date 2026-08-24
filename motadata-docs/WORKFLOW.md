# CI Runbook (the golden rule)

**Nothing compiles on the laptop.** Editing files and reading repos is free; *compiling* (yarn build,
Metro, gradle, pod, xcodebuild) is offloaded to **GitHub Actions**, triggered and inspected via `gh`.

Repo: `motadata2025/md-sdk-reactnative` · Branch: `motadata-dev` · Runners: `ubuntu-latest`.

## Toolchain the CI assumes
- Node 20, Yarn **3.4.1** (committed at `.yarn/releases/`, `nodeLinker: node-modules`).
- JDK **17** (Gradle 8.3, AGP 7.3.1, Kotlin 1.8.21).
- Android compileSdk 33 / build-tools 33.0.0 (installed via `sdkmanager` in CI); `minSdk` overridden to 24.

## Workflows (`.github/workflows/`)
| File | Trigger | What it does |
|---|---|---|
| `motadata-build.yml` | push `motadata-dev` + dispatch | JS `yarn prepare`; Android core `assembleRelease` → AAR |
| `motadata-test.yml` | push `motadata-dev` + dispatch | JS `yarn lint` + `yarn test` (jest); Android core `testReleaseUnitTest` |
| `motadata-nodatadog.yml` | dispatch (→ push in Phase 1) | Grep shipped surfaces for datadog; whitelist Apache header only |
| `motadata-apidump.yml` | dispatch | `npm pack` core, snapshot shipped contents (artifact) |
| `motadata-publish.yml` | dispatch | `npm publish` core to npmjs (needs `NPM_TOKEN`; `dry_run` input) |
| `codeql-analysis.yml` | push `motadata-dev` + dispatch | CodeQL JS security scan |

## Common commands
```bash
# always target the Motadata repo (the clone also has an 'upstream' DataDog remote)
gh workflow run motadata-build.yml    -R motadata2025/md-sdk-reactnative --ref motadata-dev
gh workflow run motadata-test.yml     -R motadata2025/md-sdk-reactnative --ref motadata-dev
gh workflow run motadata-nodatadog.yml -R motadata2025/md-sdk-reactnative --ref motadata-dev

# watch
gh run list  -R motadata2025/md-sdk-reactnative -L 10
gh run watch <run-id> -R motadata2025/md-sdk-reactnative
gh run view  <run-id> -R motadata2025/md-sdk-reactnative --log-failed

# publish (Phase 2) — dry run first
gh workflow run motadata-publish.yml -R motadata2025/md-sdk-reactnative --ref motadata-dev -f dry_run=true
```

## Secrets the CI needs
- `NPM_TOKEN` — npmjs automation token (for `motadata-publish.yml`). **User-provided.** Not needed for build/test.

## Phase gate
Each phase ends with build + test green, a short report, then **STOP for go-ahead** before the next phase.
