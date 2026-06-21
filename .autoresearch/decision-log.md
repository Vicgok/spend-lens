# Decision Log

## Phase 0 — Machine-Readable Test Outputs

Decision: KEEP

Reason:
The test-suite now emits normalized latest-metrics.json artifacts for parser, dedupe, and the combined all run.

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Commands verified:

- npm run test:research parser: PASS
- npm run test:research dedupe: PASS
- npm run test:research all: PASS
- npm test: PASS

Behavior changed:
Yes. Test-suite reporting changed to support orchestration.

Code behavior changed:
No app/runtime/parser/dedupe engine behavior should have changed.

Notes:
The built-in patch tool was blocked by the Windows sandbox wrapper, so escalated file writes were used for test-suite-only changes.

Next phase:
Phase 1A — SMS Reader Comparator-V2 Minimal Runtime Integration
