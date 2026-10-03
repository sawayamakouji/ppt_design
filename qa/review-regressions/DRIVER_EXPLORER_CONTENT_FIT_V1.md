# Driver Explorer Content-Fit Regression v1

## Trigger

The Driver Explorer demo exposed a semantic layout failure:

- KPI cards received full explanatory sentences as their primary values.
- consecutive slides repeated the same four findings with nearly the same card silhouette.
- raw system-analysis metadata such as `score ranking` / `subgroup_stability` could become user-facing slide content.
- time-series candidates were generated from row-level data without aggregating repeated period keys, producing repeated x-axis categories.

The PPT renderer was technically within bounds, but the slide was not presentation-quality. This is a content-model failure, not merely a font-size or geometry problem.

## System corrections

1. Driver findings now emit presentation-safe structured facts: `label`, compact `displayValue`, `detail`, `presentationKind`, lineage, confidence and causal status.
2. The target delta is explicitly emitted as a first-class fact.
3. KPI selection uses semantic diversity, preferring target delta → top contribution → concentration → association instead of four near-duplicate findings.
4. Driver-system tables are marked `presentationEligible: false` and excluded from ordinary slide candidate generation.
5. Repeated time keys are aggregated according to the metric aggregation rule before a chart candidate is created.
6. Analysis-target metrics receive a selection boost so the report charts the metric under investigation rather than a convenient but secondary measure.
7. Driver analysis provides `OBSERVED / CONTRIBUTION / NEXT CHECK` diagnostic semantics and validation actions without claiming causality.
8. ED06 accepts explicit semantic labels instead of always forcing `PROBLEM / CAUSE / SOLUTION`.
9. Compare slides can carry a period-comparison title and numeric delta instead of pretending baseline/current are `CURRENT / IDEAL`.
10. KPI rendering includes a defensive prose-to-token fail-safe, but upstream structured facts remain the primary fix.

## New lint rule

`L11 semanticContentFit` blocks prose in KPI values, unaggregated duplicate time keys, internal metadata leakage, and repeated evidence/card silhouettes.

## Validation

Corrected Driver Explorer sample:

- slide 2: `+35.5百万円 / +27.2百万円 / 82.2% / r=0.96`
- slide 3: aggregated 12-period target-metric line chart
- slide 4: `OBSERVED / CONTRIBUTION / NEXT CHECK`
- slide 5: baseline/current period comparison
- slide 6: evidence-driven validation steps
- `slides_test.py`: PASS, no overflow

All sample values are illustrative.
