# Analytical prototypes in this repository

Insight Engine, Driver Explorer, and Causal Test Planner were built while exploring the end-to-end workflow from data to deck.

They are useful reference implementations, but they are **not part of the canonical presentation core**.

## Status

- Insight Engine: experimental adapter / historical prototype
- Driver Explorer: experimental adapter / historical prototype
- Causal Test Planner: experimental adapter / historical prototype

## Core dependency rule

No core presentation component should require these modules in order to generate a deck.

They may be invoked explicitly as upstream helpers, but their outputs must cross into the presentation system through a stable evidence contract.

## Future direction

If analytical development continues, move it to a dedicated analysis repository or service and keep only adapter contracts here.
