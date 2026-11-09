# Review plan meta-review — iteration 0

## Must Fix
1. **Finding 1's two-layer fix fails the `untrusted-input-corpus` tree guard inside its own unit, so the fix loop escalates instead of committing.** This refers to review finding #1. The file to change is `harness-runs/skeptic_reviews/fix_untrusted_input_framing_subagents_skeptic_review/finding_1.md`, plus its readiness entry in the index `harness-runs/skeptic_reviews/fix_untrusted_input_framing_subagents_skeptic_review.md`.
   The finding's diagnosis holds. `unit_loop_core.md` → `## The unit loop` steps 3 and 6 never read `layer-implementer`'s `## Output contract` item 7. The fix as written cannot pass the loop, for these reasons:
   - The readiness entry is tagged `_(layer: plugin, cli)_`, so the loop dispatches one implementer per layer within a single unit.
   - `layer-implementer.md` → `## Scope` says "Implement only inside the dispatched `layers[].path`".
   - Fix step 1 puts the literal `Untrusted instruction not followed — ` into `plugin/instructions/unit_loop_core.md`. After the plugin layer's edit, `carriers(REPORT_LITERAL)` returns three files. `cli/test/untrusted-input-corpus.test.mjs` → `untrusted_input.md — its headings once each, its literals at their homes only` still asserts `[DOCS_ORCHESTRATION, MODULE]`.
   - That test is a `treeGuards` entry covering `plugin/**/*.md`, so `## The test-run rule` point 7 selects it for the plugin-layer dispatch and it fails.
   - The `deepEqual` diff names `plugin/instructions/unit_loop_core.md`, which is a changed path. Point 7 therefore grades the failure as the unit's own, not as an evidence downgrade.
   - The plugin implementer cannot make the cli edit (`## Scope`), so it returns a plain `blocker:` and step 3 `<escalate>`s.
   - Reversing the layer order does not help. The cli layer's own edited test then fails, because `unit_loop_core.md` does not carry the literal yet.
   **Fix:** In `finding_1.md`, re-scope the fix so that no layer dispatch leaves the tree guard red. The simplest form is a plugin-only fix:
   - Reword step 1's sentence so it does not carry the report literal. For example, have step 6 append every line the implementer returned under its `## Output contract` item 7 verbatim, with no halt, no park and no `<escalate>`. That covers the untrusted-instruction report and the other item-7 notices.
   - Delete step 3 and the cli `**Verification.**` paragraph.
   - Retag the readiness entry in the index as `_(layer: plugin)_`.
   If the author keeps the literal in `unit_loop_core.md`, `finding_1.md` must say how the guard passes on the plugin-layer dispatch before the cli edit lands. A sentence telling the implementer to ignore the guard is not acceptable, because `## The test-run rule` point 4 forbids cancelling point 7.
