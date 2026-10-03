# ppt_design

Presentation design system repository for the **Editorial 90/8/2** style.

## Core design language

- Base: warm white / off-white
- Ink: near-black
- Primary accent: vermilion / red-orange
- Signal accent: yellow, used sparingly
- Color composition guide: **72 / 19 / 7 / 2**
- Neutral vs accent guide: **90 / 8 / 2**
- Bold sans-serif typography
- Strong size contrast, limited type scale
- Large whitespace and asymmetric composition
- Rectangular cards, minimal rounding/shadows
- 8px spacing system
- 12-column layout grid

## Slide pattern IDs

- `ED01-*` HERO / opening
- `ED02-*` ONE MESSAGE
- `ED03-*` KEY NUMBER
- `ED04-*` THREE POINTS
- `ED05-*` COMPARE
- `ED06-*` PROBLEM → SOLUTION
- `ED07-*` FLOW / STRUCTURE
- `ED08-*` DATA STORY
- `ED09-*` MATRIX
- `ED10-*` TIMELINE
- `ED11-*` ACTION
- `ED12-*` EVIDENCE / APPENDIX

Example instruction:

> `ED08-C / MED / TH01 / CM02 / PPT-SAFE-v1.3`

## Text density

- `LOW` — cover pages, strong messages, single KPI
- `MED` — analysis, comparison, roadmaps
- `HIGH` — methodology, assumptions, detailed process explanations

Principle:

> 結論は短く。理由は文章で。詳細は構造化する。

## End-to-end generation pipeline

The current system separates analysis, content selection, design choice, geometry and rendering into explicit layers:

```text
Natural-language brief + Excel / CSV / JSON / BigQuery result
  -> BRIEF-v1 + SOURCE-BUNDLE-v1
  -> Insight Engine: statistically notable changes / gaps / anomalies / concentration
  -> INSIGHT-BUNDLE-v1
  -> Content Planner: which evidence belongs in this deck
  -> CONTENT-PLAN-v1
  -> Brief Resolver: story roles + A/B/C design directions
  -> PATTERN-DECK-v1
  -> Pattern Resolver: ED / Density / Theme / Composition -> geometry
  -> SCENE-DECK-v1
  -> Design Lab: explicit human selection / review
  -> HTML / editable PPTX
  -> Design Lint / PPT-SAFE / Golden QA
```

The Insight Engine currently detects period deltas, trends, change-point candidates, robust anomalies, rankings, concentration (Top-20% share / HHI / Gini), contribution, correlation, and segment gaps. Statistical association is kept separate from causal interpretation.

Canonical analysis files include:

- `docs/INSIGHT_ENGINE_V1.md`
- `schemas/insight-bundle.v1.json`
- `insight/insight-engine-rules.v1.json`
- `tools/analyze_insights.js`
- `tools/resolve_brief_with_insights.js`
- `docs/CONTENT_PLANNER_V1.md`
- `docs/BRIEF_RESOLVER_V1.md`
- `docs/PATTERN_RESOLVER_V1.md`
- `docs/SHARED_SCENE_GRAPH_COMPILER_V1.md`

## PowerPoint rendering layer

Current compatibility profile: **`PPT-SAFE-v1.3`**.

The rendering layer controls:

1. font mapping and fallback detection
2. deterministic text fitting
3. chart mode (`CHART-NATIVE` / `CHART-SHAPE`)
4. foreground/background contrast
5. geometry / minimum-font blocking QA
6. shared HTML/PPT geometry
7. Windows PowerPoint golden-render workflow

### v1.2 architecture retained

Production patterns use a renderer-neutral shared scene definition:

`Page Pattern × Text Density × Theme × Composition`

→ **resolved shared scene graph**

→ HTML renderer / PowerPoint renderer

→ Regression QA

Layout intelligence belongs in the resolved scene graph, not duplicated backend code.

### v1.3 portability layer

v1.3 expands regression beyond TH01 and raster similarity.

Coverage now includes:

- `TH05` Technical Blueprint
- `TH12` Midnight Neon
- `CM03` text-heavy calm layouts
- `CHART-SHAPE` fidelity-first charts
- `CHART-NATIVE` editability-first charts
- slide-run font declaration audit
- geometry / minimum-font audit
- Windows Microsoft PowerPoint PNG export workflow

Portable slide fonts are declared as:

- Japanese / mixed: `Yu Gothic`
- Latin labels / numbers: `Aptos`

Approved fallbacks include `Yu Gothic UI`, `Meiryo`, and `Arial`.

The current Linux/LibreOffice environment does not contain Yu Gothic or Aptos, so its render is treated as a compatibility stress test. The final production golden is the Windows Microsoft PowerPoint export.

### Current QA status

v1.2 shared-geometry test:

- average SSIM: **0.9287**
- overflow: **PASS**

v1.3 portability deck:

- slides: **8**
- slide-bounds audit: **PASS**
- text below `8.5 pt`: **0**
- overflow test: **PASS**
- unapproved slide-run fonts: **0**
- TH05 / TH12 / CM03 / Native / Shape coverage: **PASS**

Canonical files:

- `docs/PPT_RENDERING_SPEC_V1_2.md`
- `docs/PPT_RENDERING_SPEC_V1_3.md`
- `renderers/SHARED_SCENE_GRAPH_V1_2.md`
- `tokens/ppt-font-rules.v1.json`
- `tokens/ppt-text-fit.v1.json`
- `tokens/ppt-chart-rules.v1.json`
- `tokens/ppt_render_metrics.v1.2.json`
- `qa/PPT_SAFE_V1_2_RESULTS.md`
- `qa/PPT_SAFE_V1_3_RESULTS.md`
- `qa/audit_pptx_portability.py`
- `qa/audit_pptx_geometry.py`
- `qa/export_powerpoint_golden_windows.ps1`
- `qa/compare_rendered_slides.py`

## Repository structure

```text
ppt_design/
├─ README.md
├─ samples/        # HTML design-system and slide-pattern playgrounds
├─ patterns/       # Pattern definitions / IDs / metadata
├─ themes/         # Theme palettes / visual identities
├─ composition/    # CM01 / CM02 / CM03 composition modes
├─ insight/        # Insight Engine scoring / thresholds / guardrails
├─ content/        # Content Planner rules
├─ brief/          # Brief Resolver rules
├─ schemas/        # Interchange contracts: BRIEF / SOURCE / INSIGHT / CONTENT / PATTERN / SCENE
├─ tools/          # Resolvers, compilers, adapters and review builders
├─ tokens/         # Color, typography, spacing, PPT-safe rendering tokens
├─ renderers/      # Shared scene graph / HTML / PPT renderer design
├─ qa/             # Regression, analysis, font, geometry, Windows golden QA
├─ pptx/           # Editable PowerPoint examples
└─ docs/           # Design rules and authoring guidance
```

## Status

This repository is the canonical home for the presentation design system and future PowerPoint / HTML presentation assets.

The system is intentionally split into independent axes:

`Page Pattern × Text Density × Theme × Composition × Render Profile`

This keeps visual choice flexible while making PowerPoint output reproducible.
