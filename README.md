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

> `ED08-C / MED / TH01 / CM02 / PPT-SAFE-v1.2`

## Text density

- `LOW` — cover pages, strong messages, single KPI
- `MED` — analysis, comparison, roadmaps
- `HIGH` — methodology, assumptions, detailed process explanations

Principle:

> 結論は短く。理由は文章で。詳細は構造化する。

## PowerPoint rendering layer

Current compatibility profile: **`PPT-SAFE-v1.2`**.

The rendering layer controls:

1. font mapping and fallback
2. deterministic text fitting
3. chart mode (`CHART-NATIVE` / `CHART-SHAPE`)
4. foreground/background contrast
5. regression QA
6. shared HTML/PPT geometry

### v1.2 architecture

Production patterns no longer maintain separate HTML and PowerPoint layout logic.

`Page Pattern × Text Density × Theme × Composition`

→ **resolved shared scene graph**

→ HTML renderer / PowerPoint renderer

→ Regression QA

The scene graph owns explicit text boxes, rectangles, lines, ellipses, chart bars, labels, callouts, and connector coordinates. Renderer backends should remain thin.

This prevents the classic failure mode where an HTML design is correct but the separately coded PowerPoint version slowly drifts.

### Current regression result

Using the same deterministic QA pipeline for both versions:

- PPT-SAFE v1.1 average SSIM: **0.9053**
- PPT-SAFE v1.2 average SSIM: **0.9287**
- improvement: **+0.0234**
- v1.2 gate `>= 0.92`: **PASS**
- overflow test: **PASS**

The annotated `ED08-C` Data Story improved from `0.8933` to `0.9211` by moving its chart annotation geometry into the shared scene graph.

Canonical files:

- `docs/PPT_RENDERING_SPEC_V1_2.md`
- `renderers/SHARED_SCENE_GRAPH_V1_2.md`
- `tokens/ppt-font-rules.v1.json`
- `tokens/ppt-text-fit.v1.json`
- `tokens/ppt-chart-rules.v1.json`
- `tokens/ppt_render_metrics.v1.2.json`
- `qa/PPT_SAFE_V1_2_RESULTS.md`
- `qa/ppt-regression-rules.v1.json`
- `qa/compare_rendered_slides.py`

## Repository structure

```text
ppt_design/
├─ README.md
├─ samples/        # HTML design-system and slide-pattern playgrounds
├─ patterns/       # Pattern definitions / IDs / metadata
├─ themes/         # Theme palettes / visual identities
├─ composition/    # CM01 / CM02 / CM03 composition modes
├─ tokens/         # Color, typography, spacing, PPT-safe rendering tokens
├─ renderers/      # Shared scene graph / HTML / PPT renderer design
├─ qa/             # Regression and visual QA rules
├─ pptx/           # Editable PowerPoint examples
└─ docs/           # Design rules and authoring guidance
```

## Status

This repository is the canonical home for the presentation design system and future PowerPoint / HTML presentation assets.

The system is intentionally split into independent axes:

`Page Pattern × Text Density × Theme × Composition × Render Profile`

This keeps visual choice flexible while making PowerPoint output reproducible.
