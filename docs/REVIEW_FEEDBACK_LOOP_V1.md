# Review Feedback Loop v1

This layer turns Design Lab feedback into reusable QA rules, taste evidence, and a conservative deck-selection plan.

## Principle

Do not treat silence as preference.

- Objective defects such as overlap, clipping, connector misalignment, unreadable text, and slide reflow are QA issues. They can become blocking rules immediately when mechanically testable.
- Taste is different. Theme, composition, density, and pattern preference should be promoted only from explicit positive/negative feedback or repeated evidence.
- A slide with no positive review evidence remains unresolved rather than being auto-selected.

## Flow

`Design Lab review JSON`
→ classify feedback
→ QA defects / taste evidence
→ update `design-preferences.v1.json`
→ build per-slide deck plan
→ human confirmation when unresolved
→ compile Shared Scene Graph
→ HTML / PPTX / Golden PNG
→ Design Lint / PPT-SAFE

## Current feedback captured

The first AI Order review identified two objective geometry defects in Technical Modern:
- title/content-card collision
- diagram text collision and connector/frame misalignment

These are retained as QA feedback, not as evidence that the user dislikes TH05 or Technical Modern.

## Files

- `preferences/design-preferences.v1.json`
- `qa/review-to-preference-rules.v1.json`
- `tools/review_to_deck_plan.py`

## Next extension

Once reviews contain `favorite`, `keep`, explicit style comments, or scored slides, the same pipeline can accumulate preference evidence such as:
- preferred themes
- preferred composition modes
- preferred macrostructures
- preferred density
- repeated rejection patterns

The ledger should remain inspectable and reversible.
