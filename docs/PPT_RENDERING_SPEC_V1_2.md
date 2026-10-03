# PPT Rendering Specification v1.2

Status: **Adopted baseline — shared geometry**
Date: 2026-10-03

## Purpose

`PPT-SAFE-v1.2` is the PowerPoint compatibility layer for the Editorial Design System.

Complete slide specification:

`EDxx-* / LOW|MED|HIGH / THxx / CMxx / PPT-SAFE-v1.2`

The goal is stable visual hierarchy, readable text, editable PowerPoint objects, and bounded HTML→PPT rendering drift.

## v1.2 architectural change

HTML and PowerPoint must **not** maintain separate layout implementations for production patterns.

The resolved slide is converted once into a renderer-neutral **scene graph**. The scene graph stores explicit primitives such as:

- `text`
- `rect`
- `line`
- `ellipse`
- later: `image`, `chart-native`, `group`

Both HTML and PPT renderers consume the same:

- `x / y / w / h`
- colors
- border width
- typography role
- alignment
- line endpoints
- chart/annotation geometry
- z-order

Required pipeline:

`ED + Density + TH + CM → resolved scene graph → HTML / PPT → QA`

Do not repair renderer drift by independently nudging HTML and PowerPoint coordinates. Fix the shared scene definition, or a documented backend-specific typography calibration.

## Canvas / QA reference

- PowerPoint: `13.333 × 7.5 in`
- QA raster: `1600 × 900 px`
- safe outer margin: `0.50 in`
- ordinary content minimum edge distance: `0.25 in`

## Font policy

Portable Windows profile:

- Japanese / mixed text: `Yu Gothic → Yu Gothic UI → Meiryo`
- Latin labels/numbers: `Aptos → Arial`

Optional high-fidelity profile when installed:

- Japanese: `Noto Sans JP`
- Latin: `Inter`

Keep weights limited to display/heading bold, body regular/medium, label bold.

## Text-fit policy

PowerPoint automatic font shrinking is OFF by default.

Recovery order:

1. rewrap
2. shorten copy
3. expand box inside allowed pattern geometry
4. change composition mode (`CM01 → CM02 → CM03`)
5. choose a better ED pattern
6. shrink only to the role minimum
7. fail QA and redesign

Do not reduce ordinary body text below `11.5 pt` or labels below `8.5 pt`.

## Chart modes

### `CHART-NATIVE`

Use native PowerPoint charts when later data editing matters most.

### `CHART-SHAPE`

Use editable shapes when storytelling geometry and cross-renderer fidelity matter most. Annotated `ED08` pages default to this mode.

In v1.2, chart bars, labels, frame, annotation box, and leader line can all come from the same scene geometry used by HTML.

## Contrast

Required foreground/background pairs:

- dark fill → warm-white text
- vermilion/deep accent → warm-white text
- signal yellow → near-black text
- warm-white/off-white → near-black text

Practical contrast targets:

- body text: `>= 4.5:1`
- large text: `>= 3:1`

## Regression QA

Required loop:

`Generate → Render → Inspect → Compare → Fix → Re-render`

Blocking failures:

- clipped text
- object outside slide bounds
- unreadable foreground/background combination
- materially wrong font fallback
- chart-label collision
- unintended overlap
- blank/transparent text

Raster QA uses `1600 × 900` golden renders and SSIM as one signal. SSIM never replaces human visual inspection.

## v1.2 measured result

Using the same deterministic QA pipeline for v1.1 and v1.2:

- v1.1 average SSIM: `0.9053`
- v1.2 average SSIM: `0.9287`
- improvement: `+0.0234`
- overflow: `PASS`
- v1.2 gate `>= 0.92`: `PASS`

The former weak point `ED08-C` improved from `0.8933` to `0.9211` after its callout, leader line, bars, labels, and frame moved to shared geometry.

## Production rule

From v1.2 onward, renderer backends should be thin. Layout intelligence belongs in the resolved scene graph and design-system tokens, not duplicated backend code.

## Next target

v1.3 focuses on portability and coverage rather than SSIM alone:

1. Windows PowerPoint golden-render profile
2. font fallback detection
3. `CHART-NATIVE` vs `CHART-SHAPE` parity
4. TH05 / TH12 regression slides
5. CM03 text-heavy regression cases
6. per-object geometry QA in addition to raster similarity
