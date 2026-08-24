# Wire format & backend contract (RN Android)

The Motadata RN SDK's Android path emits RUM wire produced by the **native** `com.motadata:motadata-rum-android*:1.0.1`
artifacts. Most of the Motadata wire contract is therefore **inherited** from the native SDK; the RN layer
mainly supplies config (client token, endpoint, source) and must not strip Motadata fields.

## Backend-consumed (must reach the wire)
| Field / param | Where | Notes |
|---|---|---|
| `md-api-key` (query param) | intake URL | Carries the client token; native builds it from the JS `clientToken`. |
| `mdsource=react-native` (query param) | intake URL | **This project's chosen source value.** RN keeps its distinct source override, rebranded `ddsource`→`mdsource`. Backend confirmed to accept `react-native`. |
| `session.created` (epoch ms) | `session.created` | Absolute wall-clock session start. Emitted automatically by native RUM. |
| `_md.document_version` | `_md` envelope | Per-view latest-state key; rebrand of `_dd.document_version`, rides in `_md` automatically. |

Event types carrying these: `view`, `action`, `resource`, `error`, `long_task`.

## Rebrand token map (shipped surfaces)
`_dd`→`_md` · `ddsource`→`mdsource` · `ddtags`→`mdtags` · `DD-*` headers→`MD-*` ·
`@datadog/*`→`@motadata/*` · `com.datadog.reactnative`→`com.motadata.reactnative` ·
`com.datadoghq:dd-sdk-android-*`→`com.motadata:motadata-rum-android*`. Source **value** = `react-native`
(unchanged intent, rebranded param name).

## NOT ported (backend ignores)
- `context._timing` — backend ignores; not implemented on the RN side.
- `view.is_view_completed` — backend ignores; not implemented on the RN side.
- Unused extras (`MD-API-KEY` header, `MD-EVP-ORIGIN-VERSION`, `MD-REQUEST-ID`, `MD-IDEMPOTENCY-KEY`, `mdtags`)
  — debrand renames may survive from the native SDK; no new RN logic added.

## Not shipped this round (no Motadata native artifact)
Logs (DdLogs on Android), Session Replay, WebView tracking, NDK crash reporting, Feature Flags.
The Motadata Android SDK is RUM-focused (rum + trace + okhttp resource tracking + core + internal).

## Verification (Phase 2)
Run the example app against a custom endpoint and confirm on the wire: `mdsource=react-native`,
`md-api-key=<token>`, `session.created`, `_md.document_version`, and **zero** `datadog`/`dd-`/`_dd` tokens.
