#!/usr/bin/env python3
"""Compare rendered reference slides and candidate slides using SSIM.

Usage:
  python qa/compare_rendered_slides.py \
    --reference-dir html_render \
    --candidate-dir ppt_render \
    --report qa-report.md
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as ssim


def sorted_images(path: Path) -> list[Path]:
    files = list(path.glob("*.png"))

    def key(p: Path) -> tuple[int, str]:
        digits = "".join(ch for ch in p.stem if ch.isdigit())
        return (int(digits) if digits else 10**9, p.name)

    return sorted(files, key=key)


def gray(path: Path, size: tuple[int, int] | None = None) -> np.ndarray:
    image = Image.open(path).convert("L")
    if size and image.size != size:
        image = image.resize(size)
    return np.asarray(image)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference-dir", required=True, type=Path)
    parser.add_argument("--candidate-dir", required=True, type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--green", type=float, default=0.90)
    parser.add_argument("--warning", type=float, default=0.86)
    args = parser.parse_args()

    refs = sorted_images(args.reference_dir)
    cands = sorted_images(args.candidate_dir)
    if len(refs) != len(cands):
        raise SystemExit(
            f"Slide count mismatch: reference={len(refs)} candidate={len(cands)}"
        )

    scores: list[float] = []
    rows: list[str] = []
    for index, (ref, cand) in enumerate(zip(refs, cands), 1):
        ref_img = gray(ref)
        cand_img = gray(cand, (ref_img.shape[1], ref_img.shape[0]))
        score = float(ssim(ref_img, cand_img, data_range=255))
        scores.append(score)
        status = (
            "GREEN" if score >= args.green
            else "WARN" if score >= args.warning
            else "FAIL"
        )
        rows.append(f"| {index:02d} | {score:.4f} | {status} |")

    average = float(np.mean(scores)) if scores else 0.0
    report = "\n".join(
        [
            "# Render Regression QA",
            "",
            f"- Slides: **{len(scores)}**",
            f"- Average SSIM: **{average:.4f}**",
            f"- Green threshold: **{args.green:.2f}**",
            f"- Warning threshold: **{args.warning:.2f}**",
            "",
            "| Slide | SSIM | Status |",
            "|---:|---:|---|",
            *rows,
            "",
        ]
    )

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(report, encoding="utf-8")
    else:
        print(report)

    return 1 if any(score < args.warning for score in scores) else 0


if __name__ == "__main__":
    raise SystemExit(main())
