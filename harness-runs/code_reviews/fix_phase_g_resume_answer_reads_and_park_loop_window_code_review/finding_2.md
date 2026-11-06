### 2. `docs/watcher.md` §4 still says "The defaults are sized", and the window's removal leaves a run-on sentence

> **Self-contained per-finding file** for the `fix_phase_g_resume_answer_reads_and_park_loop_window` code-review index (`harness-runs/code_reviews/fix_phase_g_resume_answer_reads_and_park_loop_window_code_review.md`). Everything needed to apply the fix is here. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `docs/watcher.md` → `## 4. Pausing, parking and the usage gate`, the paragraph opening "The defaults are sized from this repository's own `watcher.log`"

**Problem.** Task 6 removed the window clause from this paragraph, and two pieces of the old text no longer fit:

- The paragraph still opens *"The defaults are sized …"*, plural. The guard now has one default, `PARK_LOOP_MAX_CYCLES`. The watcher's own knob comment was changed on this branch to *"The default is sized from measured park-resumed sessions"* (`cli/templates/scripts/autonomous-watcher.sh`, the block opening `# The park-loop guard (classify_run_exit; clear_park_loops).`), so the doc and the header now disagree.
- Taking out *"so a `300`-second window separates the two classes …"* left two `and` clauses joined in a row: *"… and the spurious ones ran 41s and 39s, and `2` cycles holds a loop after one repeat …"*.

**Fix.** Make two text replacements in that paragraph and change nothing else:

1. `The defaults are sized from this repository's own` → `The default is sized from this repository's own`
2. `and the spurious ones ran 41s and 39s, and \`2\` cycles holds a loop` → `and the spurious ones ran 41s and 39s; \`2\` cycles holds a loop`

Leave the rest of the paragraph as it is. That includes the 41s/39s figures, which the next sentence refers back to, and the closing *"This paragraph is the only place the 2026-09-17 timings are written."*

**Verification.** This is prose only, so no unit test applies. The Run gates phase runs the full suite, including the `**/*.md` tree guard.
