# SpendLens Orchestration Rules

## Phase Lifecycle

planned
→ implemented
→ validating
→ keep | revert | investigate

---

## Precondition Check

Before planning a new phase, verify the previous phase status.

A new phase can start only if the previous phase is:
- KEEP
- KEEP / NO-OP

If previous phase is not KEEP:
- stop
- report current state
- do not create next implementation prompt

Check:
- .autoresearch/state.json
- .autoresearch/decision-log.md
- research-loop/test-suite/reports/latest-metrics.json

---

## Source Of Truth Hierarchy

1. Actual codebase
2. research-loop/test-suite/reports/latest-metrics.json
3. .autoresearch/*
4. docs/*

If docs conflict with code:
- trust code
- report documentation drift
- do not assume docs are correct

If docs are older than implementation:
- ignore docs for decision making
- optionally generate documentation refresh plan

---

## Metrics Files

research-loop/test-suite/reports/latest-metrics.json
- overwritten by test-suite runs
- current run snapshot only
- never manually append
- never manually edit from orchestration prompts

.autoresearch/metrics-history.json
- append only after KEEP / KEEP_NO_OP
- historical phase evidence
- stores copied summary from latest-metrics.json

---

## Validation Gates

Required:
- npm test
- npm run test:research all

Source of Truth:
research-loop/test-suite/reports/latest-metrics.json

KEEP if:
- parser accuracy >= 97
- dedupe precision = 100
- dedupe recall = 100
- falseMerge = 0
- npm test passes
- phase-specific tests pass

REVERT if:
- parser accuracy drops
- dedupe precision drops
- dedupe recall drops
- falseMerge > 0
- npm test fails

INVESTIGATE if:
- metrics unavailable
- conflicting results
- implementation tests fail but metrics pass

---

## Memory Update Rule

DO NOT update:
- state.json
- current-task.md
- metrics-history.json
- decision-log.md

until validation completes.

DO NOT manually update:
- research-loop/test-suite/reports/latest-metrics.json

Only after KEEP or Plan md created:
- update current-task.md

Only after KEEP:
- update state.json
- append metrics-history.json
- append decision-log.md
- create next phase prompt

If REVERT:
- do not advance phase
- keep current phase active
- append failure reason to decision-log.md
- create remediation prompt

If INVESTIGATE:
- do not advance phase
- keep current phase active
- record conflicting metrics / missing evidence
- create investigation prompt

---

## Scope Drift Prevention

Every phase prompt must include:
- In scope
- Out of scope
- Allowed read files
- Allowed write files
- Forbidden files
- Expected implementation targets

If the agent needs another file:
- stop
- ask before continuing

---

## No Feature Expansion During Integration

Integration phases must not introduce new product features.

Out of scope unless explicitly approved:
- new insight types
- new detectors
- new screens
- new dashboard sections
- visual redesign
- analytics enhancements
- DB schema changes
- parser changes
- dedupe changes

Integration means:
- connect already-built logic
- preserve existing UX/design
- adapt types only when required

---

## UI Preservation Rule

For UI integration phases:

Do not:
- change colors
- change typography
- change spacing
- change navigation
- redesign layout
- create new screens
- rewrite existing components

Only:
- connect data source
- render existing data using existing visual patterns
- preserve current UI behavior

---

## Plan-Only Rule

For PLAN ONLY phases:

Do not:
- edit code
- update .autoresearch state files
- create next phase prompt
- change tests
- change docs

Return only:
- findings
- risks
- recommended implementation scope
- exact next implementation prompt