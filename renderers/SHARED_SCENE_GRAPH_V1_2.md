# Shared Scene Graph — v1.2

## Why

HTML and PowerPoint drift when each backend reimplements the same slide independently.

From `PPT-SAFE-v1.2`, layout is resolved once before rendering.

## Pipeline

`ED pattern + Density + Theme + Composition`

→ `resolved scene graph`

→ `HTML renderer`

→ `PowerPoint renderer`

→ `Regression QA`

## Core primitive schema

Initial primitives:

- `text`: text, x, y, w, h, font, size, weight, color, align, valign, tracking, line spacing
- `rect`: x, y, w, h, fill, stroke, stroke width
- `line`: x1, y1, x2, y2, color, stroke width, transparency
- `ellipse`: x, y, w, h, fill, stroke, stroke width

Future primitives:

- `image`
- `group`
- `chart-native`

## Coordinate model

Scene coordinates are normalized to a `0–100` slide space.

Renderers map this to:

- PPT: `13.333 × 7.5 in`
- HTML QA: `1600 × 900 px`

This keeps geometry backend-neutral.

## Rule

Do not fix a visual mismatch by moving the HTML object and PPT object separately.

Fix one of:

1. shared scene geometry
2. shared design token
3. documented backend typography calibration

## Chart storytelling

For `CHART-SHAPE`, bars, frame, labels, callout, and leader lines are normal scene primitives. This is how `ED08-C` moved from SSIM `0.8933` to `0.9211` in the v1.2 regression.

## Result

Same-pipeline average SSIM:

- v1.1: `0.9053`
- v1.2: `0.9287`

Overflow QA: `PASS`.
