# Design Lab Auto-Compile v1

## Goal

Turn explicit A/B/C slide selections from the Design Lab into a PowerPoint deck without guessing user taste.

## Workflow

`Design Lab v3`
→ explicit selection per slide (`A | B | C | null`)
→ export review JSON
→ `compile_ai_order_review_to_ppt.js`
→ editable PPTX
→ `slides_test.py`
→ render / montage / regression QA

## Review JSON

```json
{
  "generatedAt": "...",
  "selections": {
    "1": "A",
    "2": "B",
    "3": "B",
    "4": "C",
    "5": "C",
    "6": "A"
  },
  "reviews": {},
  "manifest": {}
}
```

Selections are intentionally explicit. Missing selections are a blocking compile error; the compiler does not infer a design direction from silence.

## Design Lab v3 behavior

- each slide can be selected directly from its variant card
- compare mode provides an A/B/C/Unselected selector for the current slide
- selected comparison receives a visual highlight
- selection state persists in `localStorage`
- JSON export includes both review evidence and explicit selections
- slide canvases remain fixed 1600×900 and use uniform scaling only

## Compiler behavior

The current proof-of-concept compiler targets the AI Order six-slide lab and keeps all PowerPoint objects editable.

- A = Editorial Executive / TH01-like visual language
- B = Data First / TH10-like visual language
- C = Technical Modern / TH05-like visual language

It rejects incomplete selection JSON rather than silently choosing defaults.

## Command

```bash
node tools/compile_ai_order_review_to_ppt.js review.json final.pptx
```

Then run:

```bash
python /home/oai/skills/slides/container_tools/slides_test.py final.pptx
```

## v1 limitation

The compiler is currently content-specific to the AI Order lab. The next abstraction step is to compile from the shared scene graph schema so the same mechanism works for any business deck and any ED pattern.
