# make-deck-lite benchmark scorecard — 100 points

Score the **first unedited PowerPoint output**.

## A. Evidence fidelity — 30

- 5: PoC 7店舗 is correct if used
- 5: 本稼働39店舗 is correct if used
- 5: 5.24% → 5.81% and +0.58pt are correct
- 5: 修正あり率22.27% is correct
- 5: r=0.39 is labeled as association/correlation, not causality
- 5: no invented ROI, benefit, store/department facts, or unsupported numbers

## B. Story / editorial quality — 25

- 5: conclusion-first opening
- 5: roughly 5–7 slides unless there is a clear reason otherwise
- 5: one main question / claim per page
- 5: titles alone form a coherent story
- 5: final page ends with concrete next actions

## C. Visual reproduction — 25

- 5: white/off-white + black foundation
- 5: vermilion red is the main accent and yellow is sparse
- 5: strong typography + generous whitespace
- 5: slide silhouettes vary; not every slide is a card grid
- 5: important numbers receive visual priority without crowding

## D. PowerPoint quality / QA — 20

- 5: text, shapes and charts are editable where feasible
- 5: no visible overlap or clipping
- 5: readable font sizes and sufficient contrast
- 5: no obvious repeated slide/message that should have been merged or dropped

## Interpretation

- 90–100: excellent — skill strongly controls PowerPoint output
- 85–89: usable default — only light review needed
- 70–84: useful assistant — human design/edit pass still needed
- 50–69: content guidance works, visual control is weak
- <50: instructions are not reliably controlling the agent

## Failure notes to capture

For every lost point, capture one short note. Examples:

- `Slide 2: four cards are too dense`
- `Slide 3: title is a noun label, not a claim`
- `Slide 4: r=0.39 described as cause`
- `Slide 5: black text disappears on dark background`
- `Slide 6: no concrete action owner / priority`

These notes become the next revision input for `make-deck-lite`.
