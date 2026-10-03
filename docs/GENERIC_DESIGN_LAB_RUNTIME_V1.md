# Generic Design Lab Runtime v1

`build_design_lab_html.js` turns any `DESIGN-LAB-BUNDLE-v2` file into a standalone review HTML.

## What it does

- renders every slide variant from the shared scene graph
- keeps every slide internally fixed at 1600×900
- only scales the canvas uniformly as the browser changes size
- lets the reviewer explicitly choose a variant for each slide
- stores selections and comments in localStorage
- exports an updated `DESIGN-LAB-BUNDLE-v2`
- exports a resolved `SCENE-DECK-v1` only when every slide has an explicit selection

## Usage

```bash
node tools/build_design_lab_html.js \
  samples/design-lab-bundle.minimal.v2.json \
  /mnt/data/design-lab.html
```

The exported Scene Deck can then be rendered with:

```bash
node tools/compile_scene_deck_to_ppt.js scene-deck.resolved.v1.json final.pptx
node tools/render_scene_deck_to_html.js scene-deck.resolved.v1.json final.html
```

## Design rule

The catalog/review UI may reflow responsively. The slide canvas may not. Slide content uses the renderer-neutral 0–100 geometry and is shown on a fixed 1600×900 canvas.
