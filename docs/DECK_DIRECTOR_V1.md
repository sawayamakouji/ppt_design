# Deck Director v1

Deck Director is the presentation-level orchestration layer. It operates **after** evidence has been selected and edited into slide claims, and **before** page patterns are resolved.

```text
BRIEF + EVIDENCE
  -> Content Planner
  -> Presentation Editor
  -> Deck Director
  -> A/B/C design directions
  -> Pattern Resolver
  -> Scene Graph
  -> Design Lab
  -> PPT / HTML
```

## Why it exists

A sequence of individually valid slides can still make a bad deck.

Deck Director looks across the whole presentation and checks:

- whether the title sequence tells a coherent story
- whether adjacent slides ask the same question
- whether adjacent slides repeat the same claim
- whether the deck has visual rhythm rather than repeated cards
- whether visual peaks and calm pages alternate sensibly
- whether KPI pages are followed by a different visual mode
- whether the deck closes with a decision / action when appropriate
- whether A/B/C directions are structurally different, not palette swaps

## Output

`tools/direct_deck.js` keeps the `PRESENTATION-PLAN-v1` contract and adds `deckDirection` metadata to each slide plus a deck-level `deckDirector` quality block.

Example slide metadata:

```json
{
  "deckDirection": {
    "energy": "EVIDENCE",
    "patterns": {
      "A": "ED08-D",
      "B": "ED08-F",
      "C": "ED08-G"
    },
    "transitionFromPrevious": "hierarchy->breakdown",
    "visualJob": "show evidence"
  }
}
```

## Scope

Deck Director does not compute business evidence. It treats evidence and claims as inputs and decides how the *presentation* should sequence and express them.

That boundary is deliberate: analytical engines can change independently while presentation behavior stays stable.
