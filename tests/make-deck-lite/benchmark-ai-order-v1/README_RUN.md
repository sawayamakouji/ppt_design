# Run this benchmark now

Use the skill + one source document, then score the untouched first output.

1. Install `make-deck-lite` in Copilot for PowerPoint.
2. Start a blank 16:9 deck.
3. Attach/reference the benchmark source document generated from `SOURCE.md`.
4. Invoke `@make-deck-lite` and paste the request from `PROMPT.md`.
5. Let Copilot finish the whole presentation before manually editing anything.
6. Save the first output as the baseline.
7. Score it with `SCORECARD.md`.
8. Record the misses in `RESULT_TEMPLATE.md`.
9. Use only the misses to revise the skill; do not redesign the benchmark after seeing the result.
