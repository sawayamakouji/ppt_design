#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, shutil, subprocess, zipfile
from pathlib import Path
from collections import Counter

SLIDE_RE = re.compile(r"ppt/slides/slide\d+\.xml")
FONT_RE = re.compile(r'typeface="([^"]+)"')

APPROVED = {
    "PPT-SAFE-v1.3": {
        "declared": ["Yu Gothic", "Aptos"],
        "fallback": ["Yu Gothic UI", "Meiryo", "Arial"],
    }
}

def fc_has(name: str) -> bool | None:
    if not shutil.which("fc-match"):
        return None
    out = subprocess.check_output(["fc-match", "-f", "%{family}\n", name], text=True, errors="ignore").strip().lower()
    return name.lower() in out


def slide_fonts(pptx: Path) -> Counter[str]:
    fonts: Counter[str] = Counter()
    with zipfile.ZipFile(pptx) as z:
        for n in z.namelist():
            if SLIDE_RE.fullmatch(n):
                s = z.read(n).decode("utf-8", "ignore")
                fonts.update(FONT_RE.findall(s))
    return fonts


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pptx", type=Path)
    ap.add_argument("--profile", default="PPT-SAFE-v1.3")
    ap.add_argument("--json", dest="json_path", type=Path)
    args = ap.parse_args()
    fonts = slide_fonts(args.pptx)
    profile = APPROVED[args.profile]
    allowed = set(profile["declared"] + profile["fallback"])
    rows = []
    bad = []
    for name, count in sorted(fonts.items()):
        installed = fc_has(name)
        approved = name in allowed
        rows.append({"font": name, "runs": count, "approved": approved, "installedHere": installed})
        if not approved:
            bad.append(name)
    result = {
        "pptx": str(args.pptx),
        "profile": args.profile,
        "slideRunFonts": rows,
        "unapprovedFonts": bad,
        "status": "PASS" if not bad else "FAIL",
        "note": "installedHere reflects the current runtime only. Windows PowerPoint must be audited on the target machine separately."
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.json_path:
        args.json_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0 if not bad else 1

if __name__ == "__main__":
    raise SystemExit(main())
