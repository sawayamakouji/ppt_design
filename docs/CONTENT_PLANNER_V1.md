# Content Planner v1

Content Planner is the evidence-selection layer between `BRIEF-v1` and the existing design pipeline.

## Pipeline

```text
Natural language
  ↓
BRIEF-v1
  +
SOURCE-BUNDLE-v1  ← CSV / XLSX / JSON / BigQuery result
  ↓
CONTENT-PLAN-v1
  ↓
BRIEF-v1 enriched with grounded content
  ↓
Brief Resolver
  ↓
PATTERN-DECK-v1 → SCENE-DECK-v1 → Design Lab → PPT / HTML
```

## What it decides

For each story role it selects:

- which KPI / fact to show
- which table or metric pair supports the message
- whether the evidence should be KPI, delta, line trend, ranking, compare, or table
- a recommended ED pattern hint
- source lineage and confidence
- alternatives that were considered but not selected

## Grounding rule

A content slide is `grounded` only when it has explicit source references.

`action` and `flow` are deliberately allowed to remain `structural`. Source data does not automatically justify a business action or process claim.

The planner does **not** invent missing business conclusions. If no supported evidence clears the score threshold, the slide becomes `unresolved`.

## Source bundle

`SOURCE-BUNDLE-v1` supports two evidence types:

1. `facts[]` — explicit KPIs / known summary facts. These are highest-confidence evidence.
2. `tables[]` — raw or aggregated tabular results with typed fields and provenance.

Table adapters can represent CSV files, Excel sheets, JSON row arrays, and BigQuery query outputs. The canonical planner input is the Source Bundle, so upstream ingestion is replaceable without changing the design system.

## Candidate generation

The current planner derives `fact`, `delta`, `trend`, `ranking`, `correlation`, and `table` candidates.

Correlation is computed and retained as evidence, but scatter rendering is marked unsupported in v1 because the current Scene Deck chart renderer does not yet guarantee scatter parity across HTML and PowerPoint. The planner therefore prefers supported line/ranking visuals for automatic rendering.

## Files

- `schemas/source-bundle.v1.json`
- `schemas/content-plan.v1.json`
- `content/content-planner-rules.v1.json`
- `tools/plan_content.js`
- `tools/apply_content_plan_to_brief.js`
- `tools/build_content_plan_review_html.js`
- `tools/ingest_tabular_source.py`
- `tools/resolve_brief_with_sources.js`
- `qa/test_content_planner.js`

## CLI

```bash
node tools/plan_content.js brief.json source-bundle.json content-plan.json
node tools/apply_content_plan_to_brief.js brief.json content-plan.json brief.enriched.json
node tools/build_content_plan_review_html.js content-plan.json content-plan-review.html
```

Full repository orchestration:

```bash
node tools/resolve_brief_with_sources.js brief.json source-bundle.json out/
```

Excel / CSV / JSON adapter:

```bash
python tools/ingest_tabular_source.py input.xlsx source-bundle.json table_id Sheet1
python tools/ingest_tabular_source.py input.csv source-bundle.json table_id
```

BigQuery can export query results as JSON or CSV, or an application can construct `SOURCE-BUNDLE-v1` directly while preserving the query text / table name in `provenance`.

## Review surface

The HTML review shows, per slide, primary message, selected evidence, visual encoding, ED pattern hint, source reference, confidence, warnings, and alternate candidates. This creates a human checkpoint before visual design selection.
