#!/usr/bin/env python3
"""Convert Design Lab review JSON into a conservative per-slide deck plan.

Policy: do not infer taste from silence. Objective geometry defects are QA signals,
not aesthetic preferences.
"""
from __future__ import annotations
import json, sys
from pathlib import Path
from statistics import mean

QA_WORDS = ("かぶ", "被り", "ずれ", "はみ出", "切れ", "重な", "線", "枠", "読め", "崩れ")

def load(path: str):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def classify_comment(text: str):
    t = (text or "").strip()
    if not t:
        return "none"
    if any(w in t for w in QA_WORDS):
        return "qa"
    if any(w in t for w in ("好き", "良い", "いい", "採用", "残したい")):
        return "positive"
    if any(w in t for w in ("嫌", "微妙", "変えたい", "再設計")):
        return "negative"
    return "neutral"

def as_bool(v):
    return v is True or str(v).lower() == "true"

def score_for(reviews, variant, slide_no):
    base = f"{variant}.s{slide_no}"
    vals = []
    for i in range(4):
        k = f"{base}.score{i}"
        if k in reviews:
            try: vals.append(float(reviews[k]))
            except Exception: pass
    return mean(vals) if vals else None

def build_plan(data):
    reviews = data.get("reviews", {})
    manifest = data.get("manifest", {})
    variants = list((manifest.get("variants") or {"A":{}, "B":{}, "C":{}}).keys())
    slides = manifest.get("slides") or [{"no": i} for i in range(1, 7)]
    evidence, plan = [], []
    for s in slides:
        n = int(s["no"])
        candidates = []
        for v in variants:
            base = f"{v}.s{n}"
            comment = str(reviews.get(f"{base}.comment", "") or "")
            cls = classify_comment(comment)
            fav = as_bool(reviews.get(f"{base}.favorite", False))
            keep = as_bool(reviews.get(f"{base}.keep", False))
            redo = as_bool(reviews.get(f"{base}.redo", False))
            score = score_for(reviews, v, n)
            rank, reasons = 0, []
            if keep: rank += 100; reasons.append("keep")
            if fav: rank += 60; reasons.append("favorite")
            if cls == "positive": rank += 30; reasons.append("positive_comment")
            if redo: rank -= 100; reasons.append("redo")
            if cls == "negative": rank -= 30; reasons.append("negative_comment")
            if cls == "qa":
                rank -= 80; reasons.append("qa_defect")
                evidence.append({"slide": n, "variant": v, "type": "qa", "comment": comment})
            if score is not None:
                rank += score; reasons.append(f"avg_score={score:.2f}")
            candidates.append({"variant": v, "rank": rank, "reasons": reasons, "score": score})
        candidates.sort(key=lambda x: x["rank"], reverse=True)
        top = candidates[0]
        selection = top["variant"] if top["rank"] > 0 else None
        plan.append({
            "slide": n,
            "ed": s.get("ed"),
            "role": s.get("role"),
            "selectedVariant": selection,
            "selectionReason": ",".join(top["reasons"]) if selection else "unresolved_no_positive_evidence",
            "candidates": candidates
        })
    return {
        "version": "1.0",
        "policy": "explicit-review-signals-only",
        "deckPlan": plan,
        "evidence": evidence,
        "note": "Slides with no positive evidence remain unresolved; do not auto-infer taste from silence."
    }

def main():
    if len(sys.argv) < 2:
        print("usage: review_to_deck_plan.py review.json [output.json]")
        raise SystemExit(2)
    result = build_plan(load(sys.argv[1]))
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("deck-plan.json")
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(out)

if __name__ == "__main__":
    main()
