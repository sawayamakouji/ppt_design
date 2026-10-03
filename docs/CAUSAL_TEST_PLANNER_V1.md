# Causal Test Planner v1

## Purpose

Driver Explorer can surface plausible drivers and associations. It must **not** convert them directly into causal claims.

Causal Test Planner answers the next question:

> What design would be needed to test this hypothesis, and is the available data structurally capable of supporting that design?

```text
SOURCE-BUNDLE + BRIEF causalQuestion
  -> Causal Test Planner
  -> CAUSAL-TEST-PLAN-v1
  -> assumption / readiness review
  -> PRESENTATION-PLAN-v1
  -> A/B/C design directions
  -> Pattern Resolver / Scene Graph
  -> PPT / HTML
```

A hypothesis may originate from Driver Explorer, business knowledge, or an explicit intervention. Association alone never becomes treatment automatically.

## Method selection

The planner uses declared data structure, not stylistic preference.

Priority examples:

- randomized assignment -> A/B / RCT
- threshold assignment -> Regression Discontinuity
- valid instrument declared -> IV
- treated + untreated units with repeated pre/post observations -> DiD
- enough pre-periods -> Event Study as a diagnostic / dynamic extension
- treatment + control + measured covariates -> AIPW / IPW sensitivity analysis
- all units treated with a long pre-series -> Interrupted Time Series, with weaker identification unless a credible comparison series exists

Simple pre/post is retained as descriptive evidence, not the default causal design when a comparison group exists.

## Diagnostics

v1 computes lightweight readiness diagnostics before any confirmatory effect claim:

- panel completeness
- treated / control unit counts
- pre / post period counts
- pre-trend slope difference
- baseline covariate SMD
- exploratory unit-level-change DiD preview with a simple 95% interval

The DiD preview is explicitly labelled exploratory. It is not promoted to a confirmed effect until identification assumptions are reviewed.

## Causal guardrails

- `contribution` is accounting decomposition, not causality
- `correlation` / `association` is not treatment effect
- DiD requires a comparison group and a parallel-trends check
- AIPW/IPW require overlap / common support and measured confounders
- PSM is not the default when weighting or doubly robust estimation is feasible
- all-treated interventions cannot use standard DiD without a comparison series
- point estimates are reported together with assumptions, uncertainty, and robustness checks

## Output contract

`CAUSAL-TEST-PLAN-v1` contains:

- hypothesis and estimand
- data readiness
- primary / secondary / rejected methods
- diagnostic results
- assumptions and failure actions
- exploratory effect preview where feasible
- execution plan
- GREEN / YELLOW / RED decision rules

## Files

- `schemas/causal-test-plan.v1.json`
- `causal/causal-test-planner-rules.v1.json`
- `tools/plan_causal_test.js`
- `tools/build_causal_test_review_html.js`
- `tools/build_causal_presentation_plan.js`
- `tools/resolve_brief_with_causal_test.js`
- `samples/generate_causal_test_sample.js`
- `samples/brief.causal-test.sample.v1.json`
- `qa/test_causal_test_planner.js`
