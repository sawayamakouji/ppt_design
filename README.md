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

> `ED08-C / MED` で作成。結論は短く、理由は2文まで。

## Text density

Each pattern can also be described with a text-density level:

- `LOW` — cover pages, strong messages, single KPI
- `MED` — analysis, comparison, roadmaps
- `HIGH` — methodology, assumptions, detailed process explanations

Principle:

> 結論は短く。理由は文章で。詳細は構造化する。

## Planned structure

```text
ppt_design/
├─ README.md
├─ samples/        # HTML design-system and slide-pattern playgrounds
├─ patterns/       # Pattern definitions / IDs / metadata
├─ tokens/         # Color, typography, spacing, layout tokens
├─ pptx/           # Editable PowerPoint examples
└─ docs/           # Design rules and authoring guidance
```

## Status

This repository is the canonical home for the presentation design system and future PowerPoint / HTML presentation assets.
