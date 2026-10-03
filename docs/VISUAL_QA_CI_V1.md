# Visual QA / Golden Benchmark CI v1

## Purpose

Run the 10-deck / 63-slide Golden Benchmark on every relevant pull request and main-branch change so presentation-system regressions are visible before merge.

The CI has two kinds of gates:

1. **Blocking structural gates** — corpus contract, Scene Graph geometry, PPT generation, PDF/PNG rendering, page-count integrity.
2. **Visual regression signal** — compares the current render against the base branch. `candidate-golden` changes are reported only; formally approved `golden` decks can block when changed-pixel ratio exceeds the configured threshold.

A pixel-diff metric is a regression signal, not a design-quality score.

## Pipeline

```text
10 benchmark specs
  -> corpus contract
  -> materialize PATTERN-DECK-v1
  -> Pattern Resolver
  -> SCENE-DECK-v1
  -> Scene Geometry QA
  -> fixed-canvas HTML
  -> editable PPTX
  -> LibreOffice PDF render
  -> PNG render
  -> compare PR vs base branch
  -> Markdown + JSON reports
  -> CI artifact upload
```

## Structural QA

`qa/validate_scene_deck_v1.js` blocks:

- bounding boxes outside the 0–100 canvas,
- invalid connector/line endpoints,
- missing finite geometry,
- malformed scene profile.

It reports, but does not currently block, small fonts and unusually high text density. These warnings are intentionally separate from hard failures until benchmark evidence supports stricter thresholds.

## Visual comparison

`qa/compare_benchmark_renders_v1.py` compares PNGs from the PR/current commit with PNGs generated from the PR base branch under the same Ubuntu/LibreOffice environment.

- `candidate-golden`: visual changes are non-blocking and appear in the report.
- `golden`: visual changes above the configured threshold are blocking.

This lets the corpus remain flexible during curation while still allowing approved decks to become regression guards later.

## Generated artifacts

The workflow uploads:

- Scene Deck JSON
- fixed-canvas HTML
- PPTX
- PDF
- per-slide PNG
- geometry QA JSON
- pipeline report
- visual-diff report

Large generated files are CI artifacts, not source-controlled assets.

## Local commands

```bash
npm install --no-save pptxgenjs
node qa/test_golden_benchmark_v1.js
node qa/run_golden_benchmark_pipeline_v1.js . .artifacts/golden-current
```

For full PNG rendering install LibreOffice and Poppler, render the PPTX files, then run:

```bash
python3 -m pip install pillow
python3 qa/compare_benchmark_renders_v1.py \
  .artifacts/golden-current/png \
  .artifacts/golden-base/png \
  --benchmark-root benchmarks/golden-v1 \
  --out .artifacts/golden-current/report
```

## Next step

After explicit human approval of selected candidate decks, promote their benchmark spec from `candidate-golden` to `golden`. CI will then treat visual drift in those decks as a blocking regression signal.
