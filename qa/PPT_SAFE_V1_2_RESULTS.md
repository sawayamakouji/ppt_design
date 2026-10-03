# PPT-SAFE v1.2 Regression Result

Date: 2026-10-03

## Result

v1.2 replaces separate HTML/PPT layout logic with a shared scene graph.

Apples-to-apples QA pipeline:

- HTML: WeasyPrint → PDF → PNG at `1600 × 900`
- PPT: same LibreOffice-based slide renderer

Results:

- v1.1 average SSIM: **0.9053**
- v1.2 average SSIM: **0.9287**
- improvement: **+0.0234**
- quality gate `>= 0.92`: **PASS**
- overflow test: **PASS**

| Slide | Spec | v1.1 | v1.2 |
|---:|---|---:|---:|
| 01 | `ED01-A / LOW / TH01 / CM01` | 0.8910 | 0.9137 |
| 02 | `ED02-A / LOW / TH01 / CM01` | 0.8984 | 0.9261 |
| 03 | `ED03-B / LOW / TH01 / CM01` | 0.9248 | 0.9379 |
| 04 | `ED05-D / HIGH / TH01 / CM02` | 0.9073 | 0.9278 |
| 05 | `ED07-E / HIGH / TH01 / CM02` | 0.9042 | 0.9183 |
| 06 | `ED08-C / MED / TH01 / CM01` | 0.8933 | 0.9211 |
| 07 | `ED09-A / MED / TH01 / CM01` | 0.9091 | 0.9377 |
| 08 | `ED10-D / MED / TH01 / CM02` | 0.9080 | 0.9319 |
| 09 | `ED11-B / MED / TH01 / CM02` | 0.8991 | 0.9262 |
| 10 | `ED12-A / HIGH / TH01 / CM03` | 0.9183 | 0.9463 |

## Main finding

The largest source of avoidable drift was not color or font calibration. It was duplicated geometry.

v1.1:

`HTML layout logic ↔ PPT layout logic`

v1.2:

`slide spec → shared scene graph → HTML renderer / PPT renderer`

The scene graph owns card coordinates, chart bars, labels, annotation boxes, leader lines, borders, and text boxes. Renderers only translate those primitives to their target format.

## ED08-C

The annotated Data Story improved from **0.8933 → 0.9211** after the chart callout and leader line moved into the shared geometry.

## QA

`slides_test.py`: **PASS — No overflow detected.**

Blocking defects found: 0.
