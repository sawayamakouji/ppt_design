# Readability QA v1

## Purpose

Typography & Density QA v1 established an emergency floor of 8.5pt. That prevents hidden content shrink, but 8.5pt is not a normal presentation reading target.

Readability QA v1 adds role-aware presentation floors after the Scene Graph is resolved and before HTML/PPT rendering.

## Role-aware floors

| Role | Minimum |
|---|---:|
| system metadata / pattern spec | 8.5pt |
| top kicker / small section label | 10pt |
| footnote / source note | 9.5pt |
| content label / chart or process label | 12pt |
| body / explanatory copy | 14pt |

The 8.5pt typography floor remains the absolute emergency floor. Normal content is expected to be larger.

## Guard behavior

The guard does **not** solve a crowded slide by making text smaller.

1. classify text role
2. test the role floor against the existing text box
3. safely raise the font when it still fits
4. block the build if the role floor would overload the box
5. request editorial reflow instead

Preferred editorial reflow actions:

- shorten copy
- change pattern
- split the page
- move detail to appendix
- prefer a diagram over repeated prose labels

## Golden Benchmark v1 impact

On the current 10-deck / 63-slide benchmark, after Typography & Density QA:

- 396 readability floor fixes
- 374 content-label fixes
- 7 body-copy fixes
- 14 kicker fixes
- 1 footnote fix
- 0 projected readability overloads
- final content-label floor: 12pt
- final body floor: 14pt
- all 10 PPTX files pass slide overflow testing locally

This changes many small labels intentionally; visual diff should therefore report broad but controlled drift while the benchmark remains `candidate-golden`.

## Pipeline

```text
Pattern Resolver
  -> raw Scene Graph
  -> Typography & Density Guard (absolute 8.5pt floor)
  -> Readability Guard (role-aware floors)
  -> Geometry QA
  -> Typography QA
  -> Readability QA
  -> HTML / editable PPTX
  -> render / visual diff
```

## Current classification note

v1 infers roles from text content and geometry because older Scene Graphs do not yet carry explicit text-role metadata. This is intentionally conservative and deterministic.

A future Scene Graph revision should allow explicit semantic roles such as `system_meta`, `kicker`, `footnote`, `content_label`, and `body`, removing the need for inference.

## Canonical files

- `tools/apply_readability_guard.js`
- `qa/validate_readability_v1.js`
- `qa/test_readability_v1.js`
- `qa/run_golden_benchmark_pipeline_v1.js`
- `qa/design-lint-rules.v1.json` (`L17 readabilityFit`)
- `.github/workflows/golden-benchmark-ci.yml`
