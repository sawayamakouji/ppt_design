# Presentation Editor v1

## Purpose

The analysis stack can discover statistically interesting facts, but a slide deck must answer a different question: **what should a human understand in a few seconds per page?**

Presentation Editor is the editorial layer between Content Planner / Driver Explorer and Pattern Resolver.

```text
SOURCE-BUNDLE
  -> Insight Engine
  -> Driver Explorer
  -> Content Planner
  -> Presentation Editor
  -> PRESENTATION-PLAN-v1
  -> 3 design directions
  -> Pattern Resolver
  -> Scene Graph
  -> Design Lab
  -> PPT / HTML
```

## Responsibilities

1. **One page, one question, one claim.**
2. Compress analytical prose into slide-safe values, labels, and short support copy.
3. Build a narrative ladder instead of repeating four-card summaries on adjacent pages.
4. Preserve causal status: contribution is not causality; association is not causality.
5. Lock the deck to an analysis scope. The same metric from a different undeclared source/scope is suppressed rather than mixed into the story.
6. Prefer claims over generic titles such as “数値を要因へ分解する”.
7. Carry the edited story into A/B/C design directions without changing its factual meaning.

## Driver-aware story sequence

`opening -> kpi -> hierarchy -> breakdown -> association -> action`

For the deterministic retail sample this becomes:

- what changed?
- four anchor numbers
- where is the change concentrated?
- which categories explain the accounting change?
- what moves with it?
- what should be validated next?

## Scope consistency

Presentation Editor does not assume that two tables containing a column with the same name are directly comparable.

When the target metric is anchored to `sample:driver_detail`, a `markdown_amount` trend from `sample:monthly_summary` is withheld when comparability is not explicitly declared. This prevents a visually clean deck from mixing incompatible scales.

## Causal language

Allowed examples:

- `寄与` for accounting decomposition
- `関連` / `相関` for association
- `差` for descriptive gaps
- `検証候補` for hypotheses

Without a causal design, do not promote these to `原因`, `影響`, or `効果`.

## Files

- `schemas/presentation-plan.v1.json`
- `presentation/presentation-editor-rules.v1.json`
- `tools/edit_content_for_presentation.js`
- `tools/resolve_presentation_plan_to_design_lab.js`
- `tools/build_presentation_editor_review_html.js`
- `tools/resolve_brief_with_presentation_editor.js`
- `qa/test_presentation_editor.js`

## Design Lint

`L12 editorialStoryFit` blocks or flags:

- generic/non-claim headlines after the editorial pass
- undeclared cross-source metric mixing
- adjacent slides that answer the same question with the same evidence
- causal verbs that exceed the evidence status
- dense prose being promoted into primary visual slots
