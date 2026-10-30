# Dispatch additions — fix_linux_sandbox_deny_placeholders

## [C · Item 3 · cli · iter 0] → layer-implementer  (#40)
- **added:** `context_notes:`
- **verbatim:** context_notes: this finding's readiness entry is tagged `_(layer: cli, general)_` and is dispatched once per layer in that order, with a `general`-layer dispatch following this one before the single commit; the `general` dispatch owns `scripts/autonomous-watcher.sh` and `docs/watcher.md` (source: harness-runs/code_reviews/fix_linux_sandbox_deny_placeholders_code_review.md → ## Phase 2 Readiness — Ordered Fix List, entry 3)
- **why the agent could not derive it:** the layer tag and the per-layer dispatch order live in the code-review index's readiness entry and in the unit loop's routing rule, neither of which is in the implementer's read set; dispatch #39 of the same unit returned an unmarked out-of-scope blocker for want of that fact.
