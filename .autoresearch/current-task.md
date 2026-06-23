# Current Task

Phase: Phase 2C — Unusual Spend Detector

Status: Ready

Mode: Plan Only

Source of truth:
research-loop/test-suite/reports/latest-metrics.json

Goal:
Detect unusually high spend locally using transaction history and baseline aggregations.

Scope:
- insights-engine only

Allowed:
- detector.ts
- detector.test.ts

Not Allowed:
- DB schema changes
- parser changes
- dedupe changes
- AI/external APIs

Requirements:
- Plan the unusual spend detector algorithm using local transaction history and statistical parameters (e.g. standard deviation).

Success Gates:
- Plan created and approved