---
name: ppt-design-agent
description: Design, compare, refine, and validate business presentation slides using the ppt_design system. Use for new decks, redesigns, reference-inspired exploration, HTML/PPT generation, and visual QA.
version: 1.0.0
---

# PPT Design Agent

This skill turns a presentation brief into a small set of meaningfully different design directions, converges through human review, then renders the selected direction through the shared HTML/PPT scene system.

The skill is intentionally presentation-specific. It borrows useful workflow ideas from several public design-agent projects while keeping the implementation, wording, rules, and rendering model native to `ppt_design`.

## 0. Core contract

A slide is not finished because it is attractive. It is finished when:

- the audience can identify the main message quickly,
- the visual hierarchy matches business importance,
- the composition is materially different from recently used patterns when variety is required,
- the selected Theme and Composition Mode remain recognizable,
- the slide survives HTML, PowerPoint, and Golden-image rendering,
- Design Lint and PPT-SAFE QA pass.

Production specification:

`EDxx-* / LOW|MED|HIGH / THxx / CMxx / PPT-SAFE-v1.3`

## 1. Start with the decision, not the decoration

Before selecting a pattern, resolve these fields:

```text
Audience
Purpose
Decision / action expected
Single most important message
Supporting evidence
Required content
Optional content
Tone
Text density
Constraints
Reference material
```

For an existing deck, also identify:

```text
Keep
Change
Pain points
What already works
```

Do not ask the user to choose ED/TH/CM codes unless they want to. Translate natural language into those parameters internally.

## 2. Read the current design language first

Before inventing a new direction:

1. Read the current theme/tokens used by the project.
2. Read the relevant ED pattern family.
3. Inspect the last few slides or accepted examples when available.
4. Identify what is already visually established:
   - color roles,
   - typography roles,
   - spacing rhythm,
   - border/shadow behavior,
   - chart language,
   - information density,
   - alignment anchors.

New work should feel like the same design system unless the brief explicitly asks for a new visual family.

## 3. Reference study: extract grammar, not pixels

When the user supplies a slide, screenshot, deck, website, or moodboard, split the analysis into two buckets.

### Reusable grammar

Capture relationships such as:

- large vs small type contrast,
- asymmetry vs uniformity,
- amount of whitespace,
- card density,
- use of rules/lines,
- palette relationships,
- chart annotation style,
- image/text balance,
- reading path,
- editorial rhythm.

### Do-not-copy signatures

Avoid reproducing:

- exact branded layouts,
- proprietary marks or logos,
- distinctive wordmarks,
- unusually recognizable composition arrangements,
- source-specific decorative motifs,
- exact text/image placement when that arrangement is a signature feature.

The goal is to transfer design reasoning, not reconstruct someone else's artifact.

## 4. Generate 3 genuinely different directions

Default exploration count: **3**.

Do not create three cosmetic variants of the same macrostructure. Each candidate must differ on at least one structural axis.

Recommended axes:

### A — Hierarchy direction

Change what dominates first, second, and third.

Examples:
- message-first,
- KPI-first,
- evidence-first.

### B — Macrostructure direction

Change the page model.

Examples:
- split layout,
- three-column structure,
- timeline,
- matrix,
- chart hero,
- stacked argument.

### C — Density / expression direction

Change the tradeoff between scan speed and information density.

Examples:
- expressive `CM01`,
- balanced `CM02`,
- calm `CM03`.

Every candidate must include a one-sentence rationale explaining why it exists.

## 5. Avoid repetitive macrostructure

Maintain a short `recent-patterns` memory for the current deck.

Default rule:

- inspect the previous 3 slides,
- do not repeat the same dominant macrostructure unless repetition is intentional,
- do not solve consecutive pages with the same `headline-left / number-right` silhouette,
- do not use the same 3-card row repeatedly simply because it is easy.

Repetition is allowed when it communicates sequence, comparison, or rhythm. Otherwise, vary the structural model while keeping the visual language consistent.

## 6. Human review loop

Present the 3 candidates as fixed Golden previews when possible.

Ask for lightweight feedback such as:

```text
A
B
C
Aの構成 + Bの落ち着き
数字を弱く
文章をもう少し残す
これは好き
これは使わない
```

Convert feedback into explicit design changes rather than vague style adjectives.

Example:

```text
"もう少し落ち着いて"
→ CM01 -> CM02
→ hero font down one token
→ accent area reduced
→ asymmetry reduced
```

Preserve accepted decisions in the deck review data or project notes.

## 7. Design Lint — run before rendering

Design Lint is separate from PPT-SAFE rendering QA.

### L01 Hierarchy

Pass when:
- one primary message is visually dominant,
- secondary evidence supports rather than competes,
- tertiary metadata is visibly subordinate.

Fail when:
- everything is bold,
- every card has equal emphasis despite unequal importance,
- decoration is stronger than the business message.

### L02 Typography

Pass when:
- font-size variety is controlled,
- emphasis uses size + weight + contrast, not size alone,
- body text remains comfortably readable.

Default: no more than 4 primary type sizes on a slide unless the ED pattern requires more.

### L03 Spacing / grouping

Pass when:
- related items are closer together,
- between-group spacing is clearly larger than within-group spacing,
- whitespace expresses grouping without requiring excessive boxes.

Preferred relationship:

`between-group gap >= 2 × within-group gap`

### L04 Color / contrast

Pass when:
- accent colors indicate meaning or hierarchy,
- foreground/background pairing is explicit,
- signal yellow is sparse,
- decorative grid lines do not harm readability.

### L05 Clutter

Pass when:
- every visible element has a job,
- redundant borders/labels are removed,
- strong visual objects are limited.

Default: `strongVisualElements <= 3`.

### L06 Composition diversity

Pass when:
- the current slide does not accidentally repeat the recent silhouette,
- ED choice matches the information task,
- structural variation is meaningful rather than random.

### L07 Content fit

Pass when:
- information density matches LOW/MED/HIGH,
- the slide does not hide complexity by shrinking text,
- excess detail moves to structure or appendix instead of becoming unreadable.

### L08 Originality

Pass when:
- reference influence is abstracted into grammar,
- signature source elements are not reproduced,
- the final slide feels native to this design system.

### L09 Fixed-canvas HTML

Slide content must not reflow based on browser width.

Required behavior:

- internal canvas: `1600 × 900`, fixed geometry,
- external catalog/UI: responsive,
- slide preview: uniform scale only,
- no responsive typography inside the slide,
- no auto-fit grid that changes the slide structure,
- no breakpoint that turns slide columns into another layout.

The HTML catalog can reflow. The slide itself cannot.

## 8. Resolve to the presentation design system

After review, resolve each slide to:

```yaml
pattern: ED08-C
density: MED
theme: TH01
composition: CM02
renderProfile: PPT-SAFE-v1.3
chartMode: CHART-SHAPE
```

If the user chose a mixed direction, record the mapping explicitly rather than leaving it as prose.

## 9. Scene-first rendering

Production slides are resolved into the shared scene graph before backend rendering.

```text
Brief
→ Story / Message
→ ED + Density + TH + CM
→ Shared Scene Graph
→ HTML / PPT / Golden image
```

Renderer-specific code should be thin.

Do not fix drift by independently moving HTML and PowerPoint objects. Fix the shared geometry or a documented typography calibration.

## 10. Rendering QA

After Design Lint passes, run PPT-SAFE QA.

Required checks:

- text clipping,
- slide bounds,
- minimum font sizes,
- foreground/background contrast,
- font declaration/fallback,
- chart-label collision,
- connector alignment,
- unintended overlap,
- Golden-image regression when available.

Required loop:

`Generate → Render → Inspect → Compare → Fix → Re-render`

## 11. Golden previews

For design review, prefer fixed previews over live responsive slide HTML.

Use:

- Golden PNG for visual comparison,
- HTML catalog for filtering, comments, ratings, and review export,
- PPTX for editable delivery.

The same slide ID must connect all three artifacts.

Example:

```text
BD02-03
ED08-C / MED / TH01 / CM01 / PPT-SAFE-v1.3
```

## 12. Acceptance checklist

A production deck should satisfy all of the following:

- story sequence is coherent,
- each slide has one dominant job,
- repeated macrostructures are intentional,
- design tokens are consistent,
- fixed-canvas HTML does not reflow,
- editable PowerPoint output remains readable,
- Golden image is available for important patterns,
- Design Lint has no blocking failures,
- PPT-SAFE QA has no blocking failures.

## 13. Source policy

Read `REFERENCES.md` for upstream inspiration and licensing notes.

Do not copy external skill text or code into this repository unless its license clearly permits it and attribution requirements are satisfied. For unlicensed or restricted sources, use only independently expressed high-level design ideas.