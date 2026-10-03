# PPT Rendering Specification v1

Status: **Adopted baseline**
Date: 2026-10-03
Canonical design repository: `sawayamakouji/ppt_design`

## 1. Purpose

This specification defines the PowerPoint-safe rendering layer for the Editorial Design System.

The design system itself is described by four independent axes:

- `EDxx-*` = page pattern / information structure
- `LOW / MED / HIGH` = text density
- `THxx` = visual theme
- `CMxx` = composition mode

PowerPoint introduces a fifth layer:

- `PPT-SAFE-v1` = font metrics, text fitting, chart construction, and regression QA rules

Example:

`ED08-C / MED / TH01 / CM02 / PPT-SAFE-v1`

The goal is not pixel-perfect identity at any cost. The goal is **stable visual hierarchy, readable text, editable PowerPoint objects, and bounded rendering drift**.

---

## 2. Reference environment

### Slide canvas

- Aspect ratio: `16:9`
- PowerPoint page size: `13.333 × 7.5 in`
- Reference raster size for QA: `1600 × 900 px`
- Outer safe margin: `0.50 in`
- Absolute minimum edge distance for ordinary content: `0.25 in`
- Intentional bleed/edge-lock elements are allowed only when the page pattern defines them.

### Existing baseline

The first 10-slide reproduction test produced:

- Average raster similarity (SSIM): `0.897`
- Overflow test: `PASS`
- Main drift source: font metrics / line wrapping / rasterizer differences

This baseline is not the target ceiling. `v1` quality gates are defined below.

---

## 3. Font policy

PowerPoint must not depend on browser-only typography.

### 3.1 PPT-SAFE font profile

#### Japanese or mixed Japanese/Latin text
- Primary: `Yu Gothic`
- Fallback 1: `Yu Gothic UI`
- Fallback 2: `Meiryo`
- Final fallback: system sans-serif

#### Latin-only labels and numbers
- Primary: `Aptos`
- Display fallback: `Arial`
- Final fallback: system sans-serif

### 3.2 Fidelity profile

When the target Windows device has the fonts installed, a higher-fidelity profile may use:

- Japanese: `Noto Sans JP`
- Latin: `Inter`

The deck must remain usable if these fonts are unavailable. Do not treat the fidelity profile as the portable default.

### 3.3 Font-weight rule

Use only a small number of weights:

- Hero / display: `Bold` or `Black` equivalent
- Heading: `Bold`
- Body: `Regular` or `Medium`
- Labels: `Bold`

Do not simulate weight by stacking duplicate text or using text outlines.

### 3.4 Mixed-script rule

Avoid splitting a Japanese sentence into many font runs merely to force Latin typography. Mixed-language body copy should usually use one Japanese-capable family for stability.

---

## 4. Typography roles

The following values are the PPT-safe defaults for a 13.333 × 7.5 in slide.

| Role | Default | Minimum | Max lines | Typical use |
|---|---:|---:|---:|---|
| `mega` | 72 pt | 60 pt | 1 | giant number / poster word |
| `hero` | 54 pt | 46 pt | 2 | cover / one-message |
| `h1` | 38 pt | 34 pt | 2 | major page headline |
| `h2` | 28 pt | 24 pt | 2 | section/card headline |
| `lead` | 20 pt | 18 pt | 3 | explanatory lead |
| `body` | 15 pt | 13 pt | 6 | normal explanation |
| `body-dense` | 13 pt | 11.5 pt | 9 | methodology / evidence |
| `label` | 9.5 pt | 9 pt | 1 | small caps / metadata |
| `note` | 9 pt | 8.5 pt | 3 | source / footnote |

### 4.1 Line-height guidance

PowerPoint line spacing is not identical to CSS. Use these visual targets:

- `mega / hero`: 0.90–0.98×
- `h1 / h2`: 0.95–1.08×
- `lead`: 1.15–1.28×
- `body`: 1.28–1.42×
- `body-dense`: 1.30–1.45×

### 4.2 Tracking guidance

PowerPoint character spacing should remain restrained:

- Hero / giant Latin: slightly tight
- Japanese headings: neutral to slightly tight
- Body: neutral
- Small all-caps label: expanded

Do not use extreme negative tracking to imitate browser typography.

---

## 5. Text-fit policy

### Principle

**Do not solve overflow by endlessly shrinking text.**

The preferred recovery order is:

1. Rewrap while preserving intended line breaks.
2. Shorten copy without changing meaning.
3. Expand the text box within the pattern's allowed geometry.
4. Switch to a calmer composition mode (`CM01 -> CM02 -> CM03`) if appropriate.
5. Switch to a more suitable page pattern.
6. Reduce font size only down to the role's defined minimum.
7. If still overflowing: fail QA and require redesign.

### 5.1 Autofit

- PowerPoint automatic font shrinking: **OFF by default**
- Shape enlargement: **OFF**
- Word wrap: **ON**
- Text overflow outside shape: **never allowed**

### 5.2 Internal text margins

Default text-box margins:

- Hero / title: `0.02–0.05 in`
- Body: `0.05–0.08 in`
- Card text: `0.08–0.12 in`
- Dense evidence cards: `0.07–0.10 in`

### 5.3 Capacity guardrails

Approximate preferred content limits:

- `LOW`: 25–70 Japanese characters per slide, excluding metadata
- `MED`: 70–180 Japanese characters
- `HIGH`: 160–320 Japanese characters

These are not hard counts. Pattern geometry and chart labels matter more than raw characters.

### 5.4 Forbidden behavior

- Do not shrink normal body text below `11.5 pt`
- Do not shrink labels below `8.5 pt`
- Do not reduce font size by more than 20% from the role default without changing the layout
- Do not use more than 4 primary font sizes on one page unless the pattern explicitly requires it

---

## 6. Geometry and spacing

### Grid

- Base slide grid: 12 columns
- PowerPoint spacing unit: `0.10 in` approximate base unit
- Preferred spacing family: `0.10 / 0.20 / 0.30 / 0.40 / 0.60 / 0.80 in`
- Major section gap should usually be at least 2× local internal gap.

### Alignment

- Default reading alignment: left
- Use no more than 3 major alignment anchors per slide
- Prefer explicit numeric positions over relative/manual dragging
- Repeatable cards in the same row must share exact x/y/height or exact baseline anchors

### Borders

- Grid / helper line: `0.5–0.75 pt`
- Normal card: `1.25–1.75 pt`
- Strong editorial border: `2–2.5 pt`
- Do not emulate HTML 3 px literally; convert by visual weight.

---

## 7. Color and contrast

Use the design-theme palette, but apply PowerPoint-safe foreground/background pairing.

### Required pairings

- Dark fill -> warm-white foreground
- Vermilion / deep accent fill -> warm-white foreground
- Yellow / signal fill -> near-black foreground
- Off-white fill -> near-black foreground

### Contrast QA

Use WCAG-like visual thresholds as a practical safety check:

- Body-sized text: contrast ratio target `>= 4.5:1`
- Large text (`>= 24 pt` or bold `>= 19 pt`): target `>= 3:1`

Decorative background grids must never reduce body-copy readability.

---

## 8. Chart rendering modes

Every chart declares one of two modes.

### 8.1 `CHART-NATIVE`

Use native PowerPoint charts when editability of underlying data is more important.

Use when:
- the user is likely to edit data later
- the chart is standard bar / line / scatter / pie
- visual requirements are conventional

Rules:
- no 3D
- no bevels, gradients, or shadows
- maximum 3 data series by default
- direct labeling preferred over legends when practical
- gridlines: light and sparse
- chart title is usually handled by the slide layout, not the chart object
- data labels must not overlap
- use one highlight series/color and neutral comparison tones

### 8.2 `CHART-SHAPE`

Use editable PowerPoint shapes when visual fidelity is more important than embedded chart semantics.

Use when:
- the chart is a key storytelling object
- annotations are integral to the design
- HTML/PPT consistency matters strongly
- only a small amount of data is shown

Rules:
- bars, lines, dots, axis labels, and annotations are separate editable shapes
- geometry comes from explicit data-to-coordinate mapping
- labels remain real text boxes
- source data should be stored in slide notes or adjacent implementation metadata if needed

### 8.3 Chart-selection defaults

- Time series -> line
- Category comparison -> bar
- Ranking with 6+ categories -> horizontal bar
- Part-to-whole with <= 6 categories -> pie only when a true total exists
- Numeric relationship -> scatter
- Do not use decorative chart types merely for novelty

### 8.4 Chart typography

- Axis labels: `9–11 pt`
- Data labels: `10–12 pt`
- Annotation: `11–14 pt`
- KPI number inside chart story: `24–48 pt` depending on hierarchy

---

## 9. Pattern-specific PPT rules

### `ED01 / ED02`
- Protect headline line breaks.
- Prefer explicit text boxes rather than placeholder auto-fit.
- Hero text must not exceed 2 lines unless the variant explicitly allows it.

### `ED03`
- KPI number should be a separate text object from unit / delta.
- Decimal / percent alignment must be deliberate.

### `ED05 / ED06`
- Filled cards must carry explicit foreground-color tokens.
- Parallel comparison cards must share equal height unless asymmetry is the point.

### `ED07`
- Use exact lane/card coordinates.
- Connectors must attach cleanly; avoid line endpoints floating between shapes.

### `ED08`
- Default to `CHART-SHAPE` for annotated editorial data stories.
- Default to `CHART-NATIVE` for operational dashboards likely to be updated.

### `ED09`
- Quadrant axis intersection must be exact.
- Labels must never sit directly on axis lines.

### `ED10`
- Timeline nodes and phase widths must be mathematically distributed, not manually eyeballed.

### `ED11`
- Who / What / When columns must preserve scanning order and equal row rhythm.

### `ED12`
- Dense evidence pages may use `body-dense`, but readability has priority over visual drama.
- Prefer CM03 when content density is high.

---

## 10. Regression QA

Every generated PPT deck should run through this sequence:

`Generate -> Render -> Inspect -> Compare -> Fix -> Re-render`

### 10.1 Blocking checks

Any one of these fails the slide:

- text clipped
- object outside slide bounds
- unreadable foreground/background combination
- missing required font with materially different fallback metrics
- chart label collision that hides information
- unintended object overlap
- accidental transparent/blank text

### 10.2 Geometric checks

Recommended tolerance:

- key anchor position drift: `<= 0.06 in`
- repeated-card alignment drift: `<= 0.03 in`
- edge margin drift: `<= 0.05 in`
- major chart frame drift: `<= 0.06 in`

### 10.3 Visual similarity

Reference raster size: `1600 × 900`.

`v1` gates:

- Deck average SSIM target: `>= 0.90`
- Per-slide green: `>= 0.90`
- Per-slide warning: `0.86–0.899`
- Per-slide failure: `< 0.86`

A slide may pass below the SSIM target only if:
- all blocking checks pass, and
- the difference is explainable by rasterizer/font antialiasing rather than geometry or hierarchy.

### 10.4 Human visual QA

SSIM is not sufficient. Visually inspect:

- hierarchy preserved?
- line breaks intentional?
- enough whitespace?
- body copy readable?
- color areas balanced?
- chart message obvious within 3 seconds?
- slide still looks like the selected `TH` and `CM`?

---

## 11. Regression matrix

Minimum golden-slide suite for future changes:

1. `ED01-A / LOW / TH01 / CM01`
2. `ED03-B / LOW / TH01 / CM01`
3. `ED05-D / HIGH / TH01 / CM02`
4. `ED07-E / HIGH / TH01 / CM02`
5. `ED08-C / MED / TH01 / CM01`
6. `ED12-A / HIGH / TH01 / CM03`
7. `ED08-C / MED / TH05 / CM02`
8. `ED02-A / LOW / TH12 / CM01`

This covers:
- giant typography
- KPI
- text-heavy colored cards
- structured flow
- chart storytelling
- calm dense layout
- technical light theme
- dark neon theme

---

## 12. Generation contract

A PowerPoint renderer receives a resolved slide specification such as:

```text
pattern: ED08-C
density: MED
theme: TH01
composition: CM01
renderProfile: PPT-SAFE-v1
chartMode: CHART-SHAPE
```

The renderer must:

1. Resolve theme colors.
2. Resolve PPT font profile.
3. Resolve composition geometry.
4. Allocate text roles and max lines.
5. Fit text without violating minimum sizes.
6. Draw chart in the declared chart mode.
7. Apply explicit foreground colors to filled shapes.
8. Run QA.
9. Render to raster.
10. Compare against the HTML/golden reference when one exists.

---

## 13. Acceptance definition

A slide is production-ready when:

- editable PowerPoint objects are preserved
- no blocking QA issue exists
- the selected ED / TH / CM / density intent is visually recognizable
- text remains readable on a normal laptop screen
- chart semantics are clear
- regression score is within tolerance
- no manual pixel nudging is required after generation for ordinary patterns

---

## 14. v1 priority improvements

1. Lock Windows-safe font mapping.
2. Implement deterministic text-box sizing.
3. Add `CHART-NATIVE` and `CHART-SHAPE` rendering modes.
4. Add automated overflow / contrast / slide-bounds checks.
5. Keep golden HTML/PPT pairs for regression.
6. Raise deck-average SSIM from the current `0.897` baseline toward `0.92+` without sacrificing editability.
