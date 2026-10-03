# Deck Director v2

Deck Director v2 is a deck-level editor. It does not analyze business data. It receives an already edited `PRESENTATION-PLAN-v1` and coordinates the presentation as a sequence.

## What v2 adds

v1 detected repetition and assigned coarse energy. v2 actively coordinates:

- **energy curve** across the whole deck
- **peak placement** rather than letting every important slide shout
- **page-to-page bridge type** (`QUANTIFY / DRILL / DECOMPOSE / QUALIFY / RESOLVE`)
- **visual-mode rhythm** (`hero / key_numbers / flow / data / explain / action`)
- **pattern choice per A/B/C direction** with recent visual-shape memory
- **composition mode per slide** based on deck energy
- **density per slide** based on visual job

## Default six-slide rhythm

For a common executive six-slide deck:

`PEAK -> ANCHOR -> BRIDGE -> PEAK -> CALM -> PEAK`

This avoids the failure mode where opening + KPI + evidence all have the same visual weight.

## Content boundary

Deck Director may change presentation metadata, pattern, density, composition, visual energy and transition intent.

It must not invent evidence, recompute metrics, or strengthen a claim beyond its source evidence.

If two adjacent slides repeat the same question or claim, v2 raises an editorial repair issue. Factual wording remains the responsibility of Presentation Editor / human review.

## Output

Each slide gets `deckDirection`:

- `energy`
- `visualMode`
- `transitionIn`
- `continuity.in / continuity.out`
- `variants.A/B/C.pattern`
- `variants.A/B/C.visualShape`
- `variants.A/B/C.composition`
- `variants.A/B/C.density`

The deck gets:

- `energyCurve`
- `transitions`
- `repairs`
- `issues`
- `quality`

## Canonical pipeline

`BRIEF + EVIDENCE -> Content Planner -> Presentation Editor -> Deck Director v2 -> A/B/C -> Pattern Resolver -> Scene Graph -> Design Lab -> PPT / HTML -> QA`
