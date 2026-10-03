# ppt_design Scope Boundary v1

## Core purpose

`ppt_design` converts already-available evidence into a clear, editable, visually coherent presentation.

It is **not** the canonical place to run domain analysis, causal estimation, forecasting, or business-specific statistical pipelines.

## Core input contract

The presentation system starts from one or more of:

- a natural-language brief
- a structured evidence bundle
- a table / chart / image / excerpt supplied by an external analysis system
- explicit claims, caveats, and provenance prepared upstream

The core pipeline is:

```text
BRIEF + EVIDENCE
  -> Content Planner
  -> Presentation Editor
  -> Deck Director
  -> A/B/C design directions
  -> Pattern Resolver
  -> Scene Graph
  -> Design Lab
  -> PPT / HTML
  -> Design Lint / PPT-SAFE / Golden QA
```

## Responsibility split

### Inside ppt_design

- determine slide purpose and story order
- compress evidence into presentation-safe claims
- preserve provenance / caveats / causal status supplied by upstream systems
- choose page pattern, density, theme and composition
- create deck-level visual rhythm and emphasis
- prevent repeated silhouettes / duplicated messages
- render editable PPTX and fixed-canvas HTML
- run layout, readability and presentation QA

### Outside ppt_design

- BigQuery / SQL analysis
- exploratory statistics
- anomaly detection
- contribution decomposition
- forecasting
- clustering / segmentation
- causal design selection
- DiD / Event Study / PSM / IPW / AIPW / IV / RD estimation
- confidence-interval / p-value calculation
- business-specific KPI derivation

External systems may provide the *results* of those analyses to `ppt_design` through the evidence contract.

## Existing analytical modules

The repository currently contains Insight Engine, Driver Explorer and Causal Test Planner prototypes created during development.

They are retained as **experimental adapters / historical prototypes**, not as the core presentation pipeline. New presentation work must not depend on them unless a caller explicitly opts in.

The presentation architecture should remain usable when all analytical prototypes are absent.

## Boundary rule

> `ppt_design` may judge whether evidence is presentation-ready; it must not become the system of record that computes the evidence.

When evidence is insufficient, incompatible, or ambiguous, the correct output is an unresolved presentation requirement or a request for upstream evidence — not a new statistical analysis implementation inside the design core.
