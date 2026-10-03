# Deck Length Editor v1

Deck Length Editor decides whether the deck should keep, merge, split, or drop pages **before** Deck Director finalizes ordering and visual rhythm.

```text
BRIEF + EVIDENCE
  -> Content Planner
  -> Presentation Editor
  -> Deck Length Editor
  -> Deck Director v3
  -> A/B/C design directions
  -> Pattern Resolver
  -> Scene Graph
  -> Design Lab
  -> PPT / HTML
```

## Why it exists

A deck can be visually polished and still be the wrong length. Common failures are:

- two adjacent slides doing the same job
- one slide carrying too many items because page count was fixed too early
- an optional summary repeating the previous page
- executive decks that feel long even when every page is individually valid

## Operations

### KEEP
Default. No change.

### MERGE
Auto-apply only when adjacent slides have the same story step, compatible causal status, overlapping question/claim/evidence, and the combined payload remains inside page-safe limits.

### SPLIT
Auto-apply only for clearly overloaded structured payloads such as too many breakdown items. The evidence and claim are preserved; only presentation pagination changes.

### DROP
Auto-apply only when a slide is explicitly optional / allow-drop and duplicates the adjacent question or claim. Opening and action-close pages are protected.

## Safety boundary

Deck Length Editor must not:

- invent evidence
- recompute business metrics
- strengthen a claim
- remove unique evidence automatically
- merge slides with conflicting causal status
- override `sequenceLocked`, `positionLocked`, or `deckLengthLocked`

All automatic operations are recorded and reversible.

## Target range

Target page ranges are guidance, not a command to destroy evidence.

- executive: 5–7
- management: 6–8
- standard: 6–10
- status/update: 4–7

If the safe result is outside the target, the editor emits a warning instead of forcing the count.

## Output

The tool keeps the `PRESENTATION-PLAN-v1` contract and adds `deckLengthEditor` metadata containing:

- before / after slide count
- target range
- applied operations
- warnings
- safety policy
