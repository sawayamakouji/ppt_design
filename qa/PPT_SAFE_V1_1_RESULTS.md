# PPT-SAFE v1.1 Regression Result

Date: 2026-10-03

## Result

The 10-slide Design System test deck was regenerated with the PowerPoint-safe rendering rules.

- Published baseline average SSIM: **0.897**
- Same-pipeline baseline rerun: **0.896**
- PPT-SAFE v1.1 average SSIM: **0.911**
- Improvement vs same-pipeline baseline: **+0.016**
- PowerPoint overflow test: **PASS**
- Blocking overflow detected: **0**

The v1 quality gate (`deck average SSIM >= 0.90`) is met.

## Slide-by-slide

| Slide | Spec | Baseline | PPT-SAFE v1.1 | Change |
|---:|---|---:|---:|---:|
| 01 | `ED01-A / LOW / TH01 / CM01` | 0.877 | 0.903 | +0.026 |
| 02 | `ED02-A / LOW / TH01 / CM01` | 0.887 | 0.915 | +0.027 |
| 03 | `ED03-B / LOW / TH01 / CM01` | 0.920 | 0.931 | +0.011 |
| 04 | `ED05-D / HIGH / TH01 / CM02` | 0.895 | 0.909 | +0.014 |
| 05 | `ED07-E / HIGH / TH01 / CM02` | 0.899 | 0.909 | +0.011 |
| 06 | `ED08-C / MED / TH01 / CM01` | 0.881 | 0.896 | +0.015 |
| 07 | `ED09-A / MED / TH01 / CM01` | 0.905 | 0.909 | +0.004 |
| 08 | `ED10-D / MED / TH01 / CM02` | 0.905 | 0.911 | +0.006 |
| 09 | `ED11-B / MED / TH01 / CM02` | 0.891 | 0.904 | +0.013 |
| 10 | `ED12-A / HIGH / TH01 / CM03` | 0.897 | 0.926 | +0.029 |

## Key finding

The first deck converted CSS font sizes using a browser-style 96 dpi assumption. The HTML reference is `1600 × 900 px`, while the PowerPoint canvas is `13.333 × 7.5 in`, which means the regression coordinate system is approximately `120 px/in`.

The theoretical conversion is `CSS px × 0.60 pt`. After a small renderer-specific font-metric correction, the practical starting point is approximately `CSS px × 0.57 pt`. For the original generator this corresponds to applying a font-size multiplier around `0.76`.

## Remaining drift

The largest remaining mismatch is `ED08-C` (`0.896`). Main causes are chart annotation geometry, text rasterization differences, and some HTML components using CSS-flow layout while PowerPoint uses explicit coordinates.

## Next target

Target for v1.2: **0.92+ deck average**.

Priority:
1. same absolute geometry for annotations and repeated components
2. pattern-level font calibration where necessary
3. chart annotation regression checks
4. expand golden suite to `TH05`, `TH12`, and `CM03`
