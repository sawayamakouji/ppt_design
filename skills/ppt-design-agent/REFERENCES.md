# PPT Design Agent — References

This file records the external projects that informed the workflow. The implementation in `SKILL.md` is presentation-specific and independently written for `ppt_design`.

## 1. 0xdesign / design-plugin

Repository: https://github.com/0xdesign/design-plugin

Useful ideas observed:

- design exploration as a workflow rather than one-shot generation,
- interview / brief before visual generation,
- multiple meaningfully different variants,
- explicit feedback and convergence,
- reuse of the existing project's visual language rather than generic presets.

License note:

- No root `LICENSE` file was present when reviewed on 2026-10-03.
- Therefore no source code, templates, or wording from this repository are copied into `ppt_design`.
- Only high-level workflow concepts are independently re-expressed.

## 2. MengTo / Skills

Repository: https://github.com/MengTo/Skills

License: MIT at time of review.

Useful ideas observed:

- skills as concise operating procedures,
- explicit triggers, defaults, guardrails, and acceptance checks,
- visual references as reusable design inputs,
- separating reusable visual grammar from protected/signature reference elements,
- versioned prompts/workflows instead of disposable chat instructions,
- portable demos and reference artifacts.

The `ppt-design-agent` skill uses an independently written presentation workflow. No external example assets are redistributed.

## 3. gnurio / refactoring-ui-plugin

Repository: https://github.com/gnurio/refactoring-ui-plugin

Useful ideas observed:

- atomic evaluative design checks,
- hierarchy before polish,
- limited typography scale,
- systematic spacing and proximity,
- contrast checks,
- clutter reduction,
- pass/fail style design review.

License note:

The repository's `LICENSE` states that reuse, redistribution, and modification are not permitted. Therefore:

- no skill text is copied,
- no source code is copied,
- no examples are copied,
- `ppt_design` only implements independently written, general design-review concepts.

## 4. Taste-related design skills

Primary discovery site: https://tasteskill.dev/

Useful ideas:

- design taste should include tradeoffs and rationale, not only tokens,
- audit-first redesign,
- anti-generic / anti-slop review,
- preflight checks before declaring a design finished.

Implementation is independent and presentation-specific.

## 5. Layers

Site: https://layers.jamiemill.com/

Useful idea:

- visual surface is only one layer; clarify user goal, information model, interaction/decision structure, and then visual treatment.

For presentations this becomes:

`Audience → Decision → Story → Pattern → Visual System → Render`.

## 6. Hallmark

Site: https://usehallmark.com/

Useful ideas:

- extract design DNA from references rather than copying screens,
- treat macrostructure as part of visual identity,
- avoid accidental repetition of recent structural patterns.

For `ppt_design`, this informed the `recent-patterns` macrostructure check.

## Synthesis rule

External projects are inputs, not dependencies.

The canonical presentation pipeline remains:

`Brief → Story → Variations → Human Review → ED/Density/TH/CM → Design Lint → Shared Scene Graph → HTML/PPT/Golden → PPT-SAFE QA`.
