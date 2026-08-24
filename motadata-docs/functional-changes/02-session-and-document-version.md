# 02 — session.created & _md.document_version

**Both backend-consumed. Both fully inherited from native — no RN code.**

## session.created
Epoch milliseconds, absolute wall-clock time the RUM session started. Emitted automatically by the native
`motadata-rum-android` SDK inside the `session` object:

```json
"session": { "id": "…", "type": "user", "has_replay": false, "created": 1749470400000 }
```

## _md.document_version
Per-view monotonic latest-state key. It is the rebrand of upstream `_dd.document_version` and rides inside
the `_md` envelope automatically once `_dd`→`_md` is applied in the native SDK (already done in 1.0.1).

## RN-side responsibilities
None beyond running RUM sessions normally. **Verify** both appear on the wire in Phase 2.
