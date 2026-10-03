# Insight Engine v1

Insight Engine v1 is the discovery layer before Content Planner.

```text
SOURCE-BUNDLE-v1
  -> Insight Engine
  -> INSIGHT-BUNDLE-v1
  -> source/brief enrichment
  -> CONTENT-PLAN-v1
  -> Brief Resolver / Pattern Resolver / Scene Graph
  -> Design Lab / PPTX / HTML
```

## What it discovers

- period delta: first vs latest value
- trend: OLS slope and R²
- change-point candidate: maximum standardized mean shift
- anomaly: robust z-score using median / MAD
- ranking: top/bottom and spread across a dimension
- concentration: Top-20% share, HHI, Gini
- contribution: Top-3 share for additive metrics
- correlation: Pearson r with sample count
- segment gap: largest difference across area/region/segment-like dimensions

## Guardrails

The engine deliberately separates **interesting statistical structure** from **business causality**.

- Correlation is always labeled association, never causation.
- Small-n findings receive lower confidence.
- Change points are candidates and must be checked against business events.
- Anomalies may be data-quality issues or local events; they are not automatically problems.
- Inputs marked sample/illustrative stay marked in all derived insights.
- Action recommendations are not inferred from statistics alone.

## Output contract

Each insight contains:

- `type`
- `message`
- `score` 0–100
- `confidence` 0–1
- `priority` HIGH / MED / LOW
- metric / dimension / unit / n
- evidence and method parameters
- source lineage (`sourceRefs`)
- warnings

The engine also emits a conservative `briefPatch` containing top evidence, a headline candidate, points, and a line chart when a trend is available.

## Integration

`enrich_source_bundle_with_insights.js` converts top insights into explicit derived facts while preserving the raw tables. `apply_insight_bundle_to_brief.js` adds the top evidence to the brief. The normal Content Planner still decides what evidence belongs on each story role.

This keeps responsibilities separate:

- Insight Engine: **what is statistically notable?**
- Content Planner: **what belongs in this deck?**
- Pattern Resolver: **how should it be shown?**

## Current v1 limits

- No causal inference.
- No seasonal decomposition.
- No forecast model.
- No automatic scatter rendering until HTML/PPT parity is guaranteed.
- Change-point detection is a deterministic mean-shift heuristic, not a full Bayesian or PELT implementation.
