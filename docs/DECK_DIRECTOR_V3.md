# Deck Director v3

Deck Director v3 edits the **sequence of the deck**, the **title chain**, and the **navigation structure** after slide claims have already been grounded and edited.

It remains presentation-only. It does not calculate evidence or strengthen claims.

## Responsibilities

1. Choose a narrative arc from the deck objective.
2. Detect order inversions such as interpretation appearing before evidence.
3. Reorder unlocked slides using a stable story template.
4. Keep explicit `sequenceLocked` / `positionLocked` slides fixed.
5. Add bridge language to headlines so the title sequence reads as one argument.
6. Preserve numbers, caveats, and causal status from the source claim.
7. Decide whether an Agenda / section navigation is useful from main-body length and section complexity.
8. Pass the reordered plan to Deck Director v2 for energy, visual-mode and pattern coordination.

## Default diagnostic arc

`opening → kpi → hierarchy → breakdown → association → action`

The title sequence should be readable without the slide bodies. Typical connective moves are:

`OPEN → まず → 次に → その内訳では → 一方で → だから`

## Agenda / navigation policy

Agenda is based on **main-body slides only**. Appendix slides are excluded from the count.

| Main-body slides | Default decision |
|---:|---|
| 1–7 | No Agenda by default |
| 8–9 | Recommend Agenda when the deck has 3+ major sections |
| 10–19 | Recommend Agenda by default |
| 20+ | Agenda required |

Exception: a strongly linear 10–19 slide story may omit Agenda when `deck.linearStory=true` (or `deck.storyMode="linear"`). This exception does not apply at 20+ main-body slides.

Section dividers are recommended for 20+ main-body slides or 4+ major sections, and required by default at 30+ main-body slides.

Deck Director emits the decision at:

`deckDirector.navigation.agenda.decision`

Possible values:

- `none`
- `optional`
- `recommended`
- `required`

The output also records main-slide count, appendix count, major-section count, linear-story status, and section-divider recommendation.

## Boundaries

Deck Director v3 may change:

- order,
- display headline,
- page-to-page transition intent,
- pattern/composition/density recommendation,
- Agenda / section-navigation recommendation.

It may not:

- invent a KPI,
- recompute a metric,
- turn association into causality,
- remove a caveat to make the story cleaner,
- count Appendix pages as main-body length when deciding Agenda.
