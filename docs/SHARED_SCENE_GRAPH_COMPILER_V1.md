# Shared Scene Graph Compiler v1

## Goal

Remove domain-specific PowerPoint code from the final rendering step.

The compiler does not know about AI Order, coupons, markdown, budgets, or any other business topic. It only knows how to render a resolved scene graph.

## Architecture

```text
Brief / data / source files
        ↓
PPT Design Agent
        ↓
A / B / C scene variants
        ↓
DESIGN-LAB-BUNDLE-v2
        ↓ human selection
resolve_design_lab_bundle.js
        ↓
SCENE-DECK-v1
        ├── compile_scene_deck_to_ppt.js → editable PPTX
        └── render_scene_deck_to_html.js → fixed-canvas HTML
```

The old `compile_ai_order_review_to_ppt.js` becomes a compatibility adapter / legacy example. New work should target `SCENE-DECK-v1`.

## Coordinate system

All geometry uses a renderer-neutral **0–100 coordinate space**.

- x / w map to 13.333 inch PowerPoint width and 1600px HTML width.
- y / h map to 7.5 inch PowerPoint height and 900px HTML height.
- HTML slide internals never reflow. The 1600×900 canvas only scales uniformly.

## Element types

v1 supports:

- `text` including optional rich text `runs`
- `rect`
- `roundRect`
- `ellipse`
- `line`
- `connector`
- `image`
- `chart` (`bar`, `column`, `line`, `pie`, `doughnut`)

Complex diagrams and CHART-SHAPE visualizations can always be composed from primitives.

## Theme tokens

A style color may be a literal hex color or a theme token such as:

```json
{"color":"$ink"}
{"fill":"$paper"}
{"color":"$accent"}
```

Each deck may carry arbitrary themes. The renderer does not hardcode TH01 / TH05 / TH10.

## Design Lab bundle

`DESIGN-LAB-BUNDLE-v2` carries fully resolved scenes for every variant.

```json
{
  "slideOrder": ["s1", "s2"],
  "variants": {
    "A": {"slides": {"s1": {"elements": []}, "s2": {"elements": []}}},
    "B": {"slides": {"s1": {"elements": []}, "s2": {"elements": []}}}
  },
  "selections": {"s1":"A", "s2":"B"}
}
```

The resolver refuses to guess when a slide has no explicit selection.

## Separation of responsibility

- **Story / pattern choice:** agent layer
- **Theme / density / composition:** design resolver
- **Geometry:** scene graph
- **PPT / HTML differences:** backend renderer only
- **Taste:** preference ledger
- **Quality:** Design Lint + PPT-SAFE

This separation is what makes the system reusable across business domains.
