# Typography & Density QA v1

Purpose: prevent slide quality from being preserved only by shrinking text.

## Core rule

Final user-facing Scene Deck text must be at least **8.5pt**.

The system does **not** blindly enlarge everything. A post-resolve guard checks whether raising a small label/body element to 8.5pt still fits a conservative text-capacity estimate.

- safe at 8.5pt -> raise to 8.5pt and record the operation
- too dense at 8.5pt -> block the build and request editorial reflow

Editorial reflow means one or more of:

1. shorten copy
2. change the page pattern
3. split the page
4. move detail to appendix / evidence page

Shrinking below the floor is not an accepted escape hatch.

## Pipeline position

```text
PATTERN-DECK-v1
  -> Pattern Resolver
  -> raw SCENE-DECK-v1
  -> Typography / Density Guard
  -> final SCENE-DECK-v1
  -> Geometry QA
  -> Typography / Density QA
  -> HTML / PPTX / Golden render
```

## Tools

- `tools/apply_typography_density_guard.js`
- `qa/validate_typography_density_v1.js`
- `qa/test_typography_density_v1.js`

## Guard behavior

The guard records every automatic font-floor change in a JSON report.

It estimates copy load using:

- fixed 1600x900 scene geometry
- font size
- line height
- text-box width / height
- CJK vs Latin character-width weighting
- renderer safety margin

Large display titles are allowed to wrap intentionally. Density blocking targets body / label copy below 16pt.

## Golden Benchmark v1 result

On the initial 10-deck / 63-slide corpus:

- previous minimum: 7.8pt to 8.3pt depending on deck
- below-floor text elements found: 96
- safe automatic fixes: 96
- final minimum: 8.5pt across all 63 slides
- density overloads after the guard: 0
- all 10 generated PPTX files pass `slides_test.py` with no overflow in local validation

The most visible fixes are ED12-A / HIGH / CM03 evidence-control pages in BM02, BM05 and BM06.

## CI policy

`font_below_floor` and `density_overload` are blocking failures.

`density_tight` is a warning. It signals that the copy should be reviewed before a candidate benchmark is promoted to formal Golden.

The typography guard runs before HTML/PPT rendering so the editable PowerPoint and fixed-canvas HTML receive the same final Scene Graph.
