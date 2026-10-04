# make-deck-lite benchmark — AI Order v1

Purpose: validate how closely Copilot in PowerPoint can reproduce the `make-deck-lite` presentation behavior using only the skill + one source document.

## Test setup

1. Add the `make-deck-lite` custom skill to Copilot in PowerPoint.
2. Start from a blank 16:9 presentation.
3. Attach/reference `AI_ORDER_TEST_SOURCE.docx` created from `SOURCE.md`.
4. Invoke `@make-deck-lite` with the prompt in `PROMPT.md`.
5. Do not manually fix the first output before scoring it.
6. Score the result with `SCORECARD.md`.

## What this benchmark tests

- evidence fidelity
- slide-count judgment
- one-question / one-claim editing
- title-chain narrative
- visual rhythm rather than repeated card layouts
- white / black / vermilion / yellow design discipline
- correct separation of association vs causality
- editable PowerPoint output
- final overlap / readability QA

## Pass guidance

- 85–100: skill is usable as a default PowerPoint entry point
- 70–84: useful with light human review
- 50–69: content guidance works but visual execution needs stronger instructions/examples
- under 50: skill is not reliably controlling the PowerPoint agent yet
