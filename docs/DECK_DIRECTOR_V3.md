# Deck Director v3

Deck Director v3 edits the **sequence of the deck** and the **title chain** after slide claims have already been grounded and edited.

It remains presentation-only. It does not calculate evidence or strengthen claims.

## Responsibilities

1. Choose a narrative arc from the deck objective.
2. Detect order inversions such as interpretation appearing before evidence.
3. Reorder unlocked slides using a stable story template.
4. Keep explicit `sequenceLocked` / `positionLocked` slides fixed.
5. Add bridge language to headlines so the title sequence reads as one argument.
6. Preserve numbers, caveats, and causal status from the source claim.
7. Pass the reordered plan to Deck Director v2 for energy, visual-mode and pattern coordination.

## Default diagnostic arc

`opening → kpi → hierarchy → breakdown → association → action`

The title sequence should be readable without the slide bodies. Typical connective moves are:

`OPEN → まず → 次に → その内訳では → 一方で → だから`

## Boundaries

Deck Director v3 may change:

- order,
- display headline,
- page-to-page transition intent,
- pattern/composition/density recommendation.

It may not:

- invent a KPI,
- recompute a metric,
- turn association into causality,
- remove a caveat to make the story cleaner.
