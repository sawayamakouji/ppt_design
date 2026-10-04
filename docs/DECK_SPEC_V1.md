# DECK-SPEC-v1

`DECK-SPEC-v1` is the stable semantic handoff between a capable generative AI/editor and the deterministic `ppt_design` rendering pipeline.

The AI decides **meaning and story**. `ppt_design` decides **layout, typography, rendering, and QA**.

## Why this contract exists

Do not ask a model to invent slide coordinates, text-box sizes, or arbitrary font sizes. Those details make output fragile and model-dependent.

A model should instead describe:

- who the deck is for,
- what decision or understanding it should create,
- what each page is trying to do,
- the reader question for each page,
- the primary claim,
- evidence references,
- semantic content such as metrics, items, stages, or actions,
- whether detail belongs in the main story or Appendix.

The same JSON can then be rendered by the same pipeline regardless of whether it was produced by ChatGPT, Copilot, Claude, Gemini, Codex, or another agent.

## Required slide semantics

Every slide requires:

- `id`
- `slideJob`
- `question`
- `primaryClaim`
- `content`

Recommended fields:

- `section`
- `detailMode`: `main | supporting | appendix`
- `evidenceRefs`
- `visualIntent`

A main-body slide without a meaningful `primaryClaim` is invalid. The compiler also rejects renderer geometry (`x`, `y`, `w`, `h`, `fontSize`, etc.) inside semantic content.

## Slide jobs

`slideJob` is deliberately semantic rather than visual:

- `opening`
- `summary`
- `key_number`
- `compare`
- `diagnose`
- `breakdown`
- `hierarchy`
- `process`
- `timeline`
- `matrix`
- `insight`
- `association`
- `evidence`
- `decision`
- `action`
- `generic`
- `appendix`

The compiler maps these jobs into the existing Presentation Editor / Deck Length Editor / Deck Director pipeline and then lets the pattern system choose concrete `ED`, density, composition, and Scene Graph geometry.

## Design mode

The user-facing design control is intentionally small:

- `auto`
- `executive`
- `data`
- `technical`

Internally these resolve to the current A/B/C Design Lab directions. End users do not need to understand `ED`, `TH`, or `CM` codes.

## Build

```bash
node tools/ppt-design.js build samples/deck-spec.business-plan.sample.v1.json --out ./output
```

Outputs:

```text
output/
├─ deck-spec.resolved.json
├─ final.scene.json
├─ final.html
├─ final.pptx
├─ qa-report.json
├─ readability-report.json
├─ scene-qa-report.json
└─ intermediate/
   ├─ presentation-plan.json
   ├─ presentation-plan.directed.json
   ├─ design-lab.bundle.json
   └─ design-lab.selected.json
```

`final.pptx` requires `pptxgenjs`. `--no-pptx` can be used for contract/CI checks where PowerPoint generation is not required.

## Compiler pipeline

```text
DECK-SPEC-v1
  -> semantic validation + evidence-reference checks
  -> PRESENTATION-PLAN-v1
  -> Deck Length Editor
  -> Deck Director v3 + navigation decision
  -> Design Lab A/B/C
  -> selected direction
  -> SCENE-DECK-v1
  -> Readability Guard
  -> Scene Geometry QA
  -> final.html + editable final.pptx
  -> qa-report.json
```

## Content architecture rule

A slide should answer one reader question and make one primary claim. If content cannot fit at readable size, do not shrink it indefinitely. Repair in this order:

1. shorten copy,
2. choose a better structure/pattern,
3. split the page,
4. move detail to Appendix.

This rule is more important than decorative styling.

## Current v1 boundary

`DECK-SPEC-v1` does not perform domain analysis. Upstream agents/tools remain responsible for calculations, causal estimates, forecasts, and source interpretation. The spec carries the selected claims and evidence references into the presentation system.

Montage/PNG preview generation remains an environment-dependent post-render step because it requires PowerPoint/LibreOffice/browser rendering. The core one-shot contract guarantees editable PPTX, fixed-canvas HTML, Scene Graph, and QA outputs.
