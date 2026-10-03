# Insight Engine v2 — Driver Explorer

Driver Explorer is the **diagnostic decomposition layer** after Insight Engine v1 and before Content Planner.

```text
BRIEF-v1 + SOURCE-BUNDLE-v1
  -> Insight Engine v1
  -> INSIGHT-BUNDLE-v1
  -> Driver Explorer
  -> DRIVER-BUNDLE-v1
  -> source / brief enrichment
  -> CONTENT-PLAN-v1
  -> Brief Resolver / Pattern Resolver / Scene Graph
  -> Design Lab / PPTX / HTML
```

## Responsibility

Insight Engine v1 answers:

> What changed or looks unusual?

Driver Explorer answers:

> Where is the observed change concentrated, and what variables move with it?

It **does not claim business causality**. The output deliberately distinguishes accounting decomposition, descriptive differences, statistical association, and validation checks.

## Driver families

### 1. Hierarchical contribution

For an additive target metric, baseline-to-current change is decomposed through a declared or inferred hierarchy such as:

`Area -> Store -> Department -> Category -> Product`

Example wording:

> Total markdown amount increased by +35.5. East area contributed +27.2, equal to 76.7% of the change at that level.

This is an accounting decomposition of the observed delta, not proof that the segment caused the change.

### 2. Change concentration

Measures how much of the absolute target change is concentrated in the top segments. Useful for identifying whether a problem is broad or localized.

### 3. Segment gap

Compares latest-period target levels across dimensions and surfaces the largest descriptive gaps.

### 4. Delta association

Screens whether segment-level target changes move with changes in another metric using Pearson correlation.

Every result is labeled `association_only` and carries an explicit non-causal warning.

### 5. Level association

Cross-sectional latest-period association. Lower priority than delta association because mix effects and common causes are more likely.

### 6. Subgroup stability

Checks whether an overall association keeps the same sign inside higher-level segments. This acts as a counterexample / Simpson-risk check.

An unstable relationship is a reason **not** to use a global explanation.

## Target selection

Preferred order:

1. `brief.analysisTarget.metric`
2. `brief.content.focusMetric`
3. top metric-bearing Insight Engine v1 finding

`brief.analysisTarget.preferredDirection` can be `up`, `down`, or neutral and is carried into the result for interpretation.

## Guardrails

- Contribution wording uses `contributed to observed change`, never `caused`.
- Correlation is always `association_only`.
- Cross-sectional associations are explicitly warned for mix/common-cause risk.
- Subgroup instability is surfaced rather than hidden.
- Small-n findings receive lower confidence.
- Sample / illustrative source flags propagate.
- No Action recommendation is generated directly from a statistical association.
- Recommended next step is validation against business events, inventory, price, assortment, execution, and data quality.

## Main files

- `schemas/driver-bundle.v1.json`
- `driver/driver-explorer-rules.v1.json`
- `tools/analyze_drivers.js`
- `tools/build_driver_review_html.js`
- `tools/enrich_source_bundle_with_drivers.js`
- `tools/apply_driver_bundle_to_brief.js`
- `tools/resolve_brief_with_drivers.js`
- `qa/test_driver_explorer.js`

## Validation sample

The deterministic retail sample targets `markdown_amount` and contains a 4-level hierarchy:

`area -> store -> department -> category`

The sample intentionally concentrates deterioration in selected branches and makes inventory / correction-rate changes co-move with the target. This lets QA verify:

- hierarchical contribution
- change concentration
- segment gaps
- delta associations
- subgroup stability
- causal-status labeling
- end-to-end Design Lab / editable PPT generation

All sample values are illustrative.

## v1 limits

- No causal identification (no randomized experiment, DiD, IV, RD, synthetic control, etc.).
- No Shapley attribution for arbitrary model outputs.
- No automatic multiplicative price-volume-mix decomposition without an explicit metric identity contract.
- Hierarchy is inferred from dimension order unless `table.hierarchy` is supplied.
- Driver screening uses deterministic descriptive statistics; domain meaning still requires human validation.
