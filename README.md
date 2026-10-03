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

Pattern IDs use the following convention:

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

> `ED08-C / MED / TH01 / CM02 / PPT-SAFE-v1`

## Text density

Each pattern can also be described with a text-density level:

- `LOW` — cover pages, strong messages, single KPI
- `MED` — analysis, comparison, roadmaps
- `HIGH` — methodology, assumptions, detailed process explanations

Principle:

> 結論は短く。理由は文章で。詳細は構造化する。

## PowerPoint rendering layer

PowerPoint uses an additional compatibility profile: **`PPT-SAFE-v1`**.

It fixes the four main sources of HTML → PPT drift:

1. font mapping and fallback rules
2. deterministic text fitting instead of endless font shrinking
3. chart rendering mode (`CHART-NATIVE` / `CHART-SHAPE`)
4. regression QA using render / compare / fix loops

Canonical files:

- `docs/PPT_RENDERING_SPEC_V1.md`
- `tokens/ppt-font-rules.v1.json`
- `tokens/ppt-text-fit.v1.json`
- `tokens/ppt-chart-rules.v1.json`
- `qa/ppt-regression-rules.v1.json`
- `samples/ppt-rendering-spec-v1.html`

Current first-deck baseline: average raster SSIM **0.897**, overflow **PASS**. The v1 target is deck-average SSIM `>= 0.90`, with a stretch target of `0.92+`, while keeping PowerPoint content editable.

## Repository structure

```text
ppt_design/
├─ README.md
├─ samples/        # HTML design-system and slide-pattern playgrounds
├─ patterns/       # Pattern definitions / IDs / metadata
├─ themes/         # Theme palettes / visual identities
├─ composition/    # CM01 / CM02 / CM03 composition modes
├─ tokens/         # Color, typography, spacing, PPT-safe rendering tokens
├─ renderers/      # HTML / PPTX renderer implementation
├─ qa/             # Regression and visual QA rules
├─ pptx/           # Editable PowerPoint examples
└─ docs/           # Design rules and authoring guidance
```

## Status

This repository is the canonical home for the presentation design system and future PowerPoint / HTML presentation assets.

The system is intentionally split into independent axes:

`Page Pattern × Text Density × Theme × Composition × Render Profile`

This keeps visual choice flexible while making PowerPoint output reproducible.
