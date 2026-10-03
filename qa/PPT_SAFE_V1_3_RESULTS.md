# PPT-SAFE v1.3 Regression Result

Date: 2026-10-03

## Deck

`editorial_design_system_portability_regression_v1_3.pptx`

## Result

v1.3 adds portability and coverage tests rather than optimizing SSIM alone.

- Slides: **8**
- Slide overflow: **PASS**
- Geometry bounds audit: **PASS**
- Text below 8.5 pt: **0**
- Declared fonts: **Yu Gothic / Aptos**
- Unapproved slide-run fonts: **0**
- TH05 coverage: **PASS**
- TH12 coverage: **PASS**
- CM03 high-density coverage: **PASS**
- CHART-SHAPE coverage: **PASS**
- CHART-NATIVE coverage: **PASS**

## Important portability finding

The current Linux QA environment does not have **Yu Gothic** or **Aptos** installed. The font audit now detects this explicitly.

Therefore:

- current LibreOffice render = **compatibility stress test**
- Windows Microsoft PowerPoint render = **final golden reference**

This distinction is now part of the rendering specification rather than an implicit assumption.

## Visual review

The 8-slide montage confirms that:

- TH05 retains its light technical grid and blue hierarchy
- TH12 remains readable on the dark neon palette
- CM03 handles longer explanatory text without collapsing into a poster layout
- CHART-SHAPE preserves the editorial annotation treatment
- CHART-NATIVE remains visually simpler but keeps a true editable PowerPoint chart object

## Blocking QA correction during v1.3

The first v1.3 build used 7–8 pt metadata labels. The structural audit correctly failed every slide because the v1.3 minimum is 8.5 pt.

The deck was regenerated with:

- metadata labels: `9 pt`
- footer: `8.5 pt`
- chart week labels: `8.5 pt`

After regeneration the geometry/minimum-font audit passed all slides.

## Pending item

A real Windows PowerPoint golden export cannot be generated in the current runtime. The bundle includes `export_powerpoint_golden_windows.ps1` so the exact deck can be exported through Microsoft PowerPoint COM at `1600 × 900` on the target Windows environment.
