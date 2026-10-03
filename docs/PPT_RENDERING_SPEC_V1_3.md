# PPT Rendering Specification v1.3

Status: **Portability & coverage baseline**  
Date: 2026-10-03

## Purpose

`PPT-SAFE-v1.3` extends v1.2 from visual similarity into **portable, detectable, repeatable PowerPoint output**.

Complete slide specification:

`EDxx-* / LOW|MED|HIGH / THxx / CMxx / PPT-SAFE-v1.3`

## v1.3 focus

v1.2 proved that shared geometry can push HTML→PPT reproduction beyond the 0.92 raster-similarity target. v1.3 shifts the priority to:

1. font declaration and fallback detection
2. geometry / minimum-font blocking QA
3. `CHART-NATIVE` vs `CHART-SHAPE` coverage
4. TH05 / TH12 regression coverage
5. CM03 text-heavy coverage
6. real Windows PowerPoint golden-render workflow

## Portable font contract

### Declared slide fonts

- Japanese / mixed: `Yu Gothic`
- Latin labels / numbers: `Aptos`

Approved fallbacks:

- `Yu Gothic UI`
- `Meiryo`
- `Arial`

### Audit rule

The PPTX package is inspected at the slide-run level. Unapproved font declarations are a blocking failure.

The current Linux/LibreOffice QA environment does **not** contain Yu Gothic or Aptos, therefore the local render necessarily uses substitution. This is useful as a compatibility stress test, but it is **not** the final Windows visual golden.

The final production golden must be exported by Microsoft PowerPoint on Windows.

## Text size guard

- No text run below `8.5 pt`
- Normal body target `>= 11.5 pt`
- Metadata / compact labels may use `8.5–10 pt`
- Tiny text is a blocking QA failure

## Geometry guard

Every shape must remain inside the `13.333 × 7.5 in` slide canvas.

Blocking failures:

- x < 0
- y < 0
- x + width > slide width
- y + height > slide height

This is separate from raster QA and catches silent layout errors before rendering.

## Chart modes

### `CHART-SHAPE`

Use when visual storytelling and annotation geometry matter most.

Characteristics:

- bars / dots / axes / labels are editable shapes
- explicit coordinates
- annotation position is deterministic
- highest cross-renderer visual control

### `CHART-NATIVE`

Use when later data editing matters most.

Characteristics:

- true PowerPoint chart object
- data remains editable
- native axis / plot-area behavior
- more renderer-specific visual drift is accepted

The design system should not force one mode globally. The page's purpose chooses the mode.

## Regression coverage added in v1.3

The portability deck contains:

1. `TH05 / ED01-A / CM02` — Technical Blueprint opening
2. `TH12 / ED02-A / CM01` — Midnight Neon message
3. `TH01 / ED12-A / HIGH / CM03` — text-heavy calm evidence page
4. `ED08-C / CHART-SHAPE` — fidelity-first data story
5. `ED08-A / CHART-NATIVE` — editability-first chart
6. `TH05 / ED07-D / CM02` — technical architecture flow
7. `TH12 / ED03-D / CM02` — dark-theme KPI trio
8. `PPT-SAFE v1.3 / QA` — portability contract summary

## v1.3 QA result in current runtime

- slide count: `8`
- slide-bounds audit: `PASS`
- text below `8.5 pt`: `0`
- PptxGenJS / slide overflow test: `PASS`
- declared run fonts: `Yu Gothic`, `Aptos`
- unapproved slide-run fonts: `0`
- target fonts installed in current Linux runtime: `NO`

The last item is expected and is now explicitly detected rather than silently ignored.

## Windows golden workflow

`export_powerpoint_golden_windows.ps1` uses the Microsoft PowerPoint COM API to export the actual deck to `1600 × 900` PNG slides.

That output should become the final Windows golden set for:

- font metrics
- line wrapping
- native chart rendering
- antialiasing
- Office-specific spacing

LibreOffice rendering remains a cross-platform compatibility test, not the final authority.

## Production pipeline

`Design Spec → Shared Scene / Native Chart Decision → PPTX → Structural QA → Font Audit → Render → Visual QA → Windows Golden QA`

## v1.4 target

1. ingest Windows golden PNGs into automated regression
2. measure font-fallback line-wrap drift per text box
3. create per-theme typography calibration for TH01 / TH05 / TH12
4. add object-level anchor comparison to golden scene data
5. automate `CHART-NATIVE` render variance checks
