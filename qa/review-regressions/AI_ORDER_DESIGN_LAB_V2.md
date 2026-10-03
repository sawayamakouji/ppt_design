# AI Order Design Lab v2 — feedback regression

Date: 2026-10-03

## User feedback applied

- `C / Slide 2 / ED03 KEY NUMBER`: KPI cards overlapped the title region.
- `C / Slide 3 / ED08 DATA STORY`: title overlapped the diagram region; connectors did not align cleanly to node/card boundaries.

## Fixes

### C / Slide 2

- moved KPI grid below the resolved title bounding box
- reserved an explicit minimum title-to-content gap
- widened KPI value columns so large numbers do not collide with labels
- restored a separate explanatory footer line

### C / Slide 3

- moved the diagram frame below the resolved title bounding box
- recalculated connector start/end geometry using source/target node boundaries
- moved supporting copy into the diagram frame without crossing nodes or connectors
- preserved the fixed `1600×900` canvas model

## Design-lint rule added

`L10 geometryRelations` now blocks:

- unexpected title/content collisions
- text crossing card/chart bounds
- connector endpoints that do not meet source/target boundaries within tolerance

These checks are treated as design-system regressions, not one-off slide fixes.
