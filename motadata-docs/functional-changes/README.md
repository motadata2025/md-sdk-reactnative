# Functional changes — implement / skip / inherited

The RN Android bridge depends on the already-functionally-changed native `com.motadata:motadata-rum-android*:1.0.1`,
so most Motadata wire behavior is **inherited**. RN-side work is config wiring + verification.

| # | Change | Backend uses? | Status for RN | Action |
|---|---|---|---|---|
| 01 | Auth / wire contract (`md-api-key`) | ✅ | Inherited (native) | Pass `clientToken`; don't strip. Verify. |
| — | `mdsource` value | ✅ | RN-owned | Keep RN source override → `mdsource=react-native` (backend confirmed). |
| 02 | `session.created` (epoch ms) | ✅ | Inherited (native) | Verify on wire. No code. |
| —  | `_md.document_version` | ✅ | Inherited (`_dd`→`_md`) | Verify on wire. No code. |
| 03 | `context._timing` | ❌ ignored | **Skip** | Not ported. Rides along if native emits it. |
| 04 | `view.is_view_completed` | ❌ ignored | **Skip** | Not ported. Rides along if native emits it. |

See [01-authentication-and-wire-contract.md](01-authentication-and-wire-contract.md) and
[02-session-and-document-version.md](02-session-and-document-version.md). Changes 03/04 are intentionally
not ported — documented here for completeness only.

## Phase 2 verification result (2026-08-24) — CODE-VERIFIED
- `md-api-key` (clientToken) and `mdsource=react-native` (`_dd.source`) are asserted by the green jest suite
  (`MdSdkReactNative.test.tsx`); custom endpoint flows JS→Kotlin→native `useCustomEndpoint`.
- `session.created` and `_md.document_version` are inherited from the frozen native SDK (no RN code).
- `context._timing` and `view.is_view_completed` are **NOT ported** (backend ignores them); no logic added.
- No functional RN code change was required — the native SDK does the heavy lifting; RN only supplies config.
See EVENT_TYPES.md "Verification (Phase 2)" for the detailed chain.
