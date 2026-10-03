# Presentation Editor v1 regression

## Trigger

A generated Driver Explorer deck was technically inside slide bounds but still hard to read: analytical sentences were forced into KPI cards, adjacent pages repeated the same structure, and a same-named metric from a different source/scope was eligible for the story.

## System fix

Presentation Editor is inserted before pattern resolution.

It now enforces:

- one page / one question / one primary claim
- scalar KPI values with separate labels and notes
- narrative progression instead of adjacent evidence repetition
- target-source scope locking for same-metric comparisons
- explicit causal-status wording (`寄与`, `関連`, `差`, `検証候補`)
- suppression of undeclared cross-source metric comparisons

## Deterministic sample expectation

The driver-aware sample resolves to:

1. `売変金額 +35.5百万円 / 道東 76.7%`
2. `+35.5百万円 / +27.2百万円 / 82.2% / r=0.96`
3. `道東 → 帯広 → 生鮮 → デリカ`
4. top categories `パン / デリカ / 農産`
5. association language with causal caveat
6. validation actions rather than causal conclusions

The unrelated `sample:monthly_summary` trend for the same metric is suppressed because cross-source comparability is not declared.
