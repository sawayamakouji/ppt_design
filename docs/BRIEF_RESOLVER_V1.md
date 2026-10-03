# Brief Resolver v1

## Purpose

Convert a natural-language presentation request into three structurally different design directions without making the renderer business-specific.

## Pipeline

```text
Natural language
  ↓ parse_brief_text.js
BRIEF-v1
  ↓ resolve_brief_to_design_lab.js
A / B / C PATTERN-DECK-v1
  ↓ Pattern Resolver
A / B / C SCENE-DECK-v1
  ↓
DESIGN-LAB-BUNDLE-v2
  ↓ Human selection
SCENE-DECK-v1
  ↓
HTML / PPTX / Golden QA
```

## Canonical brief fields

- audience: executive / manager / operational / technical / general
- objective: approval / proposal / report / analysis / explain / training
- slideCount: 3–20
- tone[]
- density: LOW / MED / HIGH
- dataEmphasis: LOW / MED / HIGH
- novelty: LOW / MED / HIGH
- decision
- content: metrics / points / problem / cause / solution / current / ideal / stages / timeline / actions / chart / evidence

## Design directions

### A — Editorial Executive
TH01 / CM02. Strong conclusion, whitespace, decision-making rhythm.

### B — Data First
TH10 / CM03. KPI and chart-first, calmer composition, analytical reading.

### C — Technical System
TH05 / CM02. Structure, flow, system relationships, operational clarity.

These are starting directions, not fixed brand styles. The user may select A/B/C independently per slide in Design Lab.

## Story resolution

The objective selects a semantic slide-role sequence. Example for approval:

`opening → message → diagnosis → points → timeline → action`

The direction then maps each role to a different ED pattern derivative. This is why variants differ structurally rather than only changing colors.

## Important boundary

Brief Resolver is a design/story resolver, not a fact generator.

- Explicit metrics and business facts from the brief are preserved.
- Missing content gets neutral structural placeholders, not invented business claims.
- User silence is not treated as design preference.
- Final A/B/C choice remains explicit.

## Files

- `schemas/brief.v1.json`
- `brief/brief-resolver-rules.v1.json`
- `tools/parse_brief_text.js`
- `tools/resolve_brief_to_design_lab.js`
- `qa/test_brief_resolver.js`
- `samples/brief.digital-transformation.v1.txt`
