# Pattern Resolver v1

`Pattern Resolver` converts the presentation design language (`ED01–ED12`) into renderer-neutral `SCENE-DECK-v1` geometry.

## Pipeline

```text
Brief / structured content
  ↓
PATTERN-DECK-v1
  ↓ resolve_pattern_deck_to_scene.js
ED pattern + density + theme + composition
  ↓
SCENE-DECK-v1 (0–100 geometry)
  ├─ render_scene_deck_to_html.js
  └─ compile_scene_deck_to_ppt.js
```

The PowerPoint and HTML renderers do not know what `ED08-C`, `TH05`, `CM03`, or a KPI means. That intelligence is resolved before rendering.

## Input

Each slide provides:

- `pattern`: `ED01-A` ... `ED12-E` (family-only IDs such as `ED08` default to `A`)
- `density`: `LOW | MED | HIGH`
- `theme`: `TH01`, `TH05`, `TH10`, etc.
- `composition`: `CM01 | CM02 | CM03`
- `content`: semantic content for that pattern

Example:

```json
{
  "id":"s1",
  "pattern":"ED03-B",
  "density":"LOW",
  "theme":"TH01",
  "composition":"CM01",
  "content":{
    "title":"売上は伸びた。粗利はどうか。",
    "value":"+12.8%",
    "delta":"+3.1pt",
    "deltaLabel":"計画差"
  }
}
```

## Separation of responsibilities

- **Story / agent layer** decides which pattern is appropriate.
- **Pattern Resolver** decides slide geometry and visual hierarchy.
- **Theme** supplies visual tokens.
- **Composition Mode** changes emphasis and balance without changing semantic meaning.
- **Density** calibrates typography and spacing.
- **Scene Graph Renderer** only draws resolved primitives.
- **Design Lint / PPT-SAFE** validates the result.

## Current coverage

All 12 parent families are implemented, including the current derivative registry:

- ED01 A–E
- ED02 A–E
- ED03 A–E
- ED04 A–E
- ED05 A–E
- ED06 A–D
- ED07 A–F
- ED08 A–G
- ED09 A–D
- ED10 A–E
- ED11 A–E
- ED12 A–E

The resolver supports `text`, `rect`, `ellipse`, `line/connector`, `image`, and `chart` Scene Graph primitives.

## Design behavior

The resolver deliberately changes **macrostructure**, not just colors:

- Hero variants change title/visual/metric dominance.
- Compare variants use two-sided or three-option structures.
- Flow variants switch between linear, loop, hub/spoke, swimlane, and funnel.
- Data Story variants switch between chart-led, ranking, small-multiples, breakdown, and waterfall forms.
- Execution/evidence families use tables, action rows, timelines, methodology and assumptions layouts.

This addresses the failure mode where ED IDs differ but every slide silhouette remains the same.

## HTML stability

The resolved Scene Graph uses 0–100 coordinates. HTML converts them into a fixed **1600×900 internal canvas** and only applies uniform scale. It does not reflow slide content at browser breakpoints.

## Next layer

A future `Brief Resolver` can output `PATTERN-DECK-v1` from natural language. That layer should choose pattern/theme/composition using the Design Agent skill and preference ledger, while this resolver remains deterministic.
