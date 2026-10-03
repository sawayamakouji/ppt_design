# Golden Benchmark Suite v1

Golden Benchmark Suite is the regression corpus for `ppt_design`.

The system is now large enough that a single successful slide or deck is not sufficient evidence that a change improved presentation quality. The benchmark suite evaluates the same presentation-generation pipeline across multiple business-document shapes.

## v1 corpus

- 10 decks
- 63 slides
- 10 deck types
- 8 themes
- ED01–ED12 family coverage
- all business values synthetic/anonymized for the public repository

Scenarios are based on recurring business-document structures used during development: operational diagnostics, evidence evaluation, technical architecture, planning, executive investment proposals, governance, workflow redesign and strategy roadmaps.

## Candidate Golden vs Golden

Rendered benchmark outputs start as `candidate-golden`.

A deck becomes `golden` only after explicit human approval. Silence or the absence of feedback is never treated as approval.

## Evaluation

The 100-point rubric covers:

- story coherence
- title-chain continuity
- content fit
- visual rhythm
- pattern fit
- layout readability
- typography and spacing
- render safety
- editability

Content fit, layout readability and render safety are blocking dimensions.

## Run the corpus check

```bash
node qa/test_golden_benchmark_v1.js
```

Materialize the embedded candidate Pattern Decks with:

```bash
node tools/materialize_golden_benchmark_v1.js
```

Each materialized `PATTERN-DECK-v1` can then pass through the normal Pattern Resolver -> Scene Graph -> HTML/PPT renderers -> PPT-SAFE QA pipeline.

## Regression policy

Changes to patterns, themes, composition rules, Deck Director, Deck Length Editor, Scene Graph or renderers should be evaluated against this corpus before being treated as presentation-system improvements.

A future CI workflow should render the corpus, run structural and PPT-SAFE checks, build montages, compare approved Golden images and publish a regression report.
