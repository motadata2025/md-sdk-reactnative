# Motadata React Native RUM SDK — docs

Motadata-branded React Native RUM SDK, forked from `DataDog/dd-sdk-reactnative` (Apache-2.0) and
repointed to the frozen, published Motadata Android SDK (`com.motadata:motadata-rum-android*:1.0.1`).

**Scope this round:** Android only (iOS deferred), RUM-focused.

| Doc | Purpose |
|---|---|
| [MOTADATA_REACTNATIVE_SDK_REBRAND_PLAN.md](MOTADATA_REACTNATIVE_SDK_REBRAND_PLAN.md) | Master plan: findings, dependency mapping, phases, decisions, risks |
| [PROGRESS.md](PROGRESS.md) | Execution log (phase by phase) |
| [WORKFLOW.md](WORKFLOW.md) | CI runbook — the golden rule + `gh` commands |
| [EVENT_TYPES.md](EVENT_TYPES.md) | Wire format & what reaches the Motadata backend |
| [MOTADATA_REACTNATIVE_RUM_ONBOARDING.md](MOTADATA_REACTNATIVE_RUM_ONBOARDING.md) | How an app developer installs & configures the SDK |
| [MOTADATA_REACTNATIVE_CLIENT_SOP.md](MOTADATA_REACTNATIVE_CLIENT_SOP.md) | Client standard operating procedure |
| [functional-changes/](functional-changes/README.md) | Implement / skip / inherited analysis |

## Non-negotiables
- **Golden rule:** nothing compiles on the laptop — all build/test/publish run on GitHub Actions via `gh`.
- **Android SDK is FROZEN** — we only *depend on* `com.motadata:motadata-rum-android*:1.0.1`; never rebuild it.
- **Single branch `motadata-dev`** — rebrand + functional both land here.
- **Apache-2.0 attribution header** is the only whitelisted "Datadog" string on shipped surfaces.
