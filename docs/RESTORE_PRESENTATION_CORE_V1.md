# Restore Presentation Core v1

This change restores the repository's center of gravity to presentation generation.

## Decision

The canonical responsibility of `ppt_design` is:

> evidence -> editorial compression -> deck direction -> visual system -> editable presentation

It is not:

> raw data -> statistical analysis -> causal estimation -> presentation

## Canonical flow

```text
BRIEF + EVIDENCE-BUNDLE-v1
  -> Content Planner
  -> Presentation Editor
  -> Deck Director
  -> A/B/C directions
  -> Pattern Resolver
  -> Scene Graph
  -> Design Lab
  -> PPT / HTML
  -> Design Lint / PPT-SAFE / Golden QA
```

## What happens to analytical prototypes?

They remain in git for reference and compatibility, but are non-core and opt-in. Future statistical / causal development should move to a separate analysis project and connect here through the evidence contract.

## What changes next?

The next design-system work should deepen Deck Director behavior: title-sequence quality, visual pacing, section rhythm, structural diversity, transition logic, and whole-deck regression QA.
