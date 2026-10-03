# ppt_design

Presentation design system repository for the **Editorial 90/8/2** style.

## Core purpose

`ppt_design` turns an already-prepared brief and evidence into a clear, editable, visually coherent presentation.

It is **not** the canonical place for domain analysis, causal estimation, forecasting, clustering, or business-specific KPI calculation. Those belong upstream and enter this system through a stable evidence contract.

See:

- `docs/SCOPE_BOUNDARY_V1.md`
- `schemas/evidence-bundle.v1.json`
- `docs/ANALYTICS_PROTOTYPES.md`

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

## Canonical presentation pipeline

```text
Natural-language brief + EVIDENCE-BUNDLE-v1
  -> Content Planner
  -> Presentation Editor
  -> Deck Length Editor
  -> Deck Director v3
  -> A/B/C design directions
  -> PATTERN-DECK-v1
  -> Pattern Resolver: ED / Density / Theme / Composition -> geometry
  -> SCENE-DECK-v1
  -> Design Lab: explicit human selection / review
  -> HTML / editable PPTX
  -> Design Lint / PPT-SAFE / Golden QA
```

### Content Planner

Chooses what belongs in the deck from already-available evidence.

### Presentation Editor

Converts analysis-style prose into presentation-safe claims, values, labels, caveats, and page jobs. It enforces one page / one question / one primary claim.

### Deck Length Editor

Decides whether pages should be kept, merged, split, or dropped before sequence and visual rhythm are finalized. Automatic edits are deliberately conservative: unique evidence is never dropped just to hit a target page count, and every operation is recorded and reversible.

### Deck Director v3

Looks across the whole deck rather than slide-by-slide. It manages slide ordering, title-chain continuity, story progression, visual rhythm, macrostructure diversity, visual peaks, repeated silhouettes, and closing action.

Canonical files:

- `docs/PRESENTATION_EDITOR_V1.md`
- `docs/DECK_LENGTH_EDITOR_V1.md`
- `deck/deck-length-editor-rules.v1.json`
- `tools/edit_deck_length.js`
- `tools/edit_length_then_direct_v3.js`
- `docs/DECK_DIRECTOR_V3.md`
- `deck/deck-director-rules.v3.json`
- `tools/direct_deck_v3.js`
- `docs/CONTENT_PLANNER_V1.md`
- `docs/BRIEF_RESOLVER_V1.md`
- `docs/PATTERN_RESOLVER_V1.md`
- `docs/SHARED_SCENE_GRAPH_COMPILER_V1.md`

## Analytical prototypes

Insight Engine, Driver Explorer, and Causal Test Planner remain in the repository as historical / experimental adapters only.

They are **not core dependencies** of the presentation pipeline and should not be extended here into a general analytics platform.

If analytical work continues, it should live in a separate analysis repository or service and provide `EVIDENCE-BUNDLE-v1` to this system.

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

Production patterns use a renderer-neutral shared scene definition:

`Page Pattern × Text Density × Theme × Composition`

→ **resolved shared scene graph**

→ HTML renderer / PowerPoint renderer

→ Regression QA

Layout intelligence belongs in the resolved scene graph, not duplicated backend code.

Portable slide fonts are declared as:

- Japanese / mixed: `Yu Gothic`
- Latin labels / numbers: `Aptos`

Approved fallbacks include `Yu Gothic UI`, `Meiryo`, and `Arial`.

The current Linux/LibreOffice environment is treated as a compatibility stress test. The final production golden remains Windows Microsoft PowerPoint export.

## Repository structure

```text
ppt_design/
├─ README.md
├─ samples/        # HTML design-system, deterministic plans and slide-pattern playgrounds
├─ patterns/       # Pattern definitions / IDs / metadata
├─ themes/         # Theme palettes / visual identities
├─ composition/    # CM01 / CM02 / CM03 composition modes
├─ deck/           # Deck Length Editor + Deck Director rules
├─ content/        # Content Planner rules
├─ presentation/   # Presentation Editor rules
├─ brief/          # Brief Resolver rules
├─ schemas/        # Presentation interchange contracts
├─ tools/          # Resolvers, compilers, editors, adapters and review builders
├─ tokens/         # Color, typography, spacing, PPT-safe rendering tokens
├─ renderers/      # Shared scene graph / HTML / PPT renderer design
├─ qa/             # Presentation, regression, font, geometry and Golden QA
├─ pptx/           # Editable PowerPoint examples
└─ docs/           # Design rules and authoring guidance
```

## Status

This repository is the canonical home for the presentation design system and future PowerPoint / HTML presentation assets.

The system is intentionally split into independent axes:

`Page Pattern × Text Density × Theme × Composition × Render Profile`

This keeps visual choice flexible while making PowerPoint output reproducible.
