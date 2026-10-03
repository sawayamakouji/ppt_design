# PPT Rendering Specification v1.1

Status: **Adopted baseline — calibrated**
Date: 2026-10-03
Canonical design repository: `sawayamakouji/ppt_design`

## 1. Purpose

This specification defines the PowerPoint-safe rendering layer for the Editorial Design System.

The design system itself is described by four independent axes:

- `EDxx-*` = page pattern / information structure
- `LOW / MED / HIGH` = text density
- `THxx` = visual theme
- `CMxx` = composition mode

PowerPoint introduces a fifth layer:

- `PPT-SAFE-v1` = font metrics, text fitting, chart construction, and regression QA rules

Example:

`ED08-C / MED / TH01 / CM02 / PPT-SAFE-v1`

The goal is not pixel-perfect identity at any cost. The goal is **stable visual hierarchy, readable text, editable PowerPoint objects, and bounded rendering drift**.

## 2. Reference environment

- Aspect ratio: `16:9`
- PowerPoint page size: `13.333 × 7.5 in`
- Reference raster size for QA: `1600 × 900 px`
- Outer safe margin: `0.50 in`
- Absolute minimum edge distance for ordinary content: `0.25 in`

### Current regression state

- Published baseline raster similarity (SSIM): `0.897`
- Same-pipeline baseline rerun: `0.896`
- PPT-SAFE v1.1 result: `0.911`
- Overflow test: `PASS`

## 3.0 HTML raster → PowerPoint font calibration

For regression work, do **not** convert CSS font pixels with a generic 96 dpi assumption.

The golden HTML canvas is `1600 × 900 px` and the PowerPoint canvas is `13.333 × 7.5 in`.

Therefore the regression coordinate system is approximately:

- `120 px / in`
- theoretical: `1 CSS px = 72 / 120 = 0.60 pt`
- measured font-metric correction: approximately `0.95`
- practical starting point: `1 CSS px ≈ 0.57 pt`

For the first generator, which had been sized using a 96 dpi-style mapping, the equivalent correction is a font-size multiplier of approximately `0.76`.

This calibration is a **renderer profile**, not a universal typography law. Windows PowerPoint should still use the PPT-safe font family mapping defined below, and its golden render can later receive its own calibration profile.

## 3. Font policy

### Japanese or mixed Japanese/Latin text
- Primary: `Yu Gothic`
- Fallback 1: `Yu Gothic UI`
- Fallback 2: `Meiryo`

### Latin-only labels and numbers
- Primary: `Aptos`
- Fallback: `Arial`

### Fidelity / regression profile
Where available, `Noto Sans CJK JP` and a stable Latin sans can be used for deterministic cross-renderer QA. Do not distribute font files with the repository.

## 4. Text-fit policy

**Do not solve overflow by endlessly shrinking text.**

Recovery order:

1. Rewrap while preserving intended line breaks.
2. Shorten copy without changing meaning.
3. Expand the text box within allowed geometry.
4. Switch composition mode (`CM01 -> CM02 -> CM03`) if appropriate.
5. Switch to a more suitable page pattern.
6. Reduce font size only down to the role minimum.
7. If still overflowing: fail QA and redesign.

PowerPoint automatic font shrinking is OFF by default. Shape enlargement is OFF. Word wrap is ON. Text overflow outside the shape is never allowed.

## 5. Chart rendering modes

### `CHART-NATIVE`
Use native PowerPoint charts when editability of underlying data is more important.

### `CHART-SHAPE`
Use editable PowerPoint shapes when visual fidelity, annotations, or storytelling geometry is more important.

Default guidance:

- Time series -> line
- Category comparison -> bar
- Ranking with 6+ categories -> horizontal bar
- Part-to-whole with <= 6 categories -> pie only when a true total exists
- Numeric relationship -> scatter

## 6. Regression QA

Every generated PPT deck should run:

`Generate -> Render -> Inspect -> Compare -> Fix -> Re-render`

### Blocking failures

- text clipped
- object outside slide bounds
- unreadable foreground/background combination
- missing required font with materially different fallback metrics
- chart label collision hiding information
- unintended object overlap
- accidental transparent/blank text

### Visual similarity gates

- Deck average SSIM target: `>= 0.90`
- Per-slide green: `>= 0.90`
- Per-slide warning: `0.86–0.899`
- Per-slide failure: `< 0.86`
- Stretch target: `0.92+`

SSIM is not sufficient by itself. Human visual QA still checks hierarchy, intentional line breaks, whitespace, readability, theme identity, and chart-message clarity.

## 7. Regression matrix

Minimum golden-slide suite:

1. `ED01-A / LOW / TH01 / CM01`
2. `ED03-B / LOW / TH01 / CM01`
3. `ED05-D / HIGH / TH01 / CM02`
4. `ED07-E / HIGH / TH01 / CM02`
5. `ED08-C / MED / TH01 / CM01`
6. `ED12-A / HIGH / TH01 / CM03`
7. `ED08-C / MED / TH05 / CM02`
8. `ED02-A / LOW / TH12 / CM01`

## 8. v1.2 target

Preserve the achieved `0.911` calibrated baseline and raise deck-average SSIM toward `0.92+` without sacrificing editability.

Priority:

1. same absolute geometry for HTML and PPT annotations / repeated components
2. pattern-level font calibration only where necessary
3. chart annotation regression checks
4. expand golden coverage to TH05 / TH12 / CM03
