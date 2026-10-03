# Design Agent Synthesis v1

Date: 2026-10-03
Status: proposal branch

## Why this exists

`ppt_design` already had strong rendering rules: ED patterns, text density, themes, composition modes, shared scene geometry, PPT-SAFE rules, and regression QA.

The missing layer was **design reasoning before rendering**.

This synthesis adds that layer without replacing the current system.

## New architecture

```text
1. BRIEF
Audience / purpose / expected decision / constraints

        ↓

2. STORY
What should the audience understand first, second, third?

        ↓

3. REFERENCE GRAMMAR
Extract reusable relationships, not pixels

        ↓

4. DESIGN LAB
Generate 3 structurally different directions

        ↓

5. HUMAN REVIEW
Pick / mix / reject / annotate

        ↓

6. RESOLVE
ED × Density × TH × CM

        ↓

7. DESIGN LINT
Hierarchy / typography / spacing / color / clutter /
composition diversity / content fit / originality / fixed-canvas HTML

        ↓

8. SHARED SCENE GRAPH
One geometry definition

        ↓

9. RENDER
HTML / PowerPoint / Golden PNG

        ↓

10. PPT-SAFE QA
Geometry / fonts / overflow / contrast / regression
```

## What was added

### A. Three-direction exploration

Default is 3 alternatives, not a large catalog.

Each alternative must differ structurally:

- hierarchy,
- macrostructure,
- density/expression.

The system rejects “same layout, different accent color” as insufficient exploration.

### B. Recent-pattern diversity

The previous 3 slides form a short composition memory.

The agent checks whether the new slide accidentally repeats the same silhouette.

Examples of repetition to avoid unless intentional:

- headline left / giant number right,
- three equal cards,
- two-column compare,
- centered headline with small footer copy.

Visual consistency comes from Theme, typography, color, spacing, and border language — not from repeating one skeleton everywhere.

### C. Design Lint

Rendering QA answers “did the file break?”

Design Lint answers “is this a good design decision?”

Current lint families:

- L01 Hierarchy
- L02 Typography
- L03 Spacing / grouping
- L04 Color / contrast
- L05 Clutter
- L06 Composition diversity
- L07 Content fit
- L08 Originality
- L09 Fixed-canvas HTML

### D. Fixed-canvas HTML

The catalog UI is responsive.

The slide itself is not.

```text
Catalog shell
= responsive / reflow allowed

Slide canvas
= fixed 1600 × 900
= fixed coordinates
= fixed typography
= no breakpoint layout changes
= uniform scale only
```

This makes the HTML preview behave like an image/PPT slide instead of a responsive webpage.

### E. Golden-review workflow

For review:

- PNG = visual truth
- HTML = interactive catalog and feedback UI
- PPTX = editable delivery

Every representation shares the same slide ID.

## External inspiration policy

The project reviewed public design-agent resources including 0xdesign Design Lab, MengTo Skills, Refactoring UI-derived agent skills, Taste-related skills, Layers, and Hallmark.

The synthesis intentionally does **not** vendor those projects.

Reasons:

- some have no declared reusable license,
- some explicitly prohibit reuse,
- many are web/product-design focused rather than presentation focused,
- the presentation renderer and QA architecture already exists here.

The strategy is therefore:

> import useful design reasoning, not source code.

See `skills/ppt-design-agent/REFERENCES.md` for per-source notes.

## Recommended next experiment

Run one real deck through the full pipeline:

1. create the brief,
2. generate 3 cover/opening directions,
3. select one,
4. generate 3 alternatives for a difficult analysis slide,
5. capture review feedback,
6. run Design Lint,
7. render Golden HTML/PPT/image outputs,
8. compare against the previous one-shot workflow.

Success is not only higher visual quality. It is fewer manual corrections and more explicit reasons for why each design decision exists.
