# QA: Scope and Defaults

## Q1: What scope should the prompt cover?
**Answer:** Create two separate prompt folders:
1. Critical bugfixes only (focused, quick)
2. Full improvements (everything)

## Q2: Default waitUntil change?
**Answer:** Change to `load`. Industry consensus: safer default, `networkidle` opt-in for SPAs.
