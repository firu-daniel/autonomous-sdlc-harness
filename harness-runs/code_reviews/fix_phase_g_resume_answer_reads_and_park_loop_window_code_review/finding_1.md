### 1. The resume prompt says G.0 passes every Phase G pair to `test-fix-plan-writer`, but G.0 passes only a pair naming a pending index

> **Self-contained per-finding file** for the `fix_phase_g_resume_answer_reads_and_park_loop_window` code-review index (`harness-runs/code_reviews/fix_phase_g_resume_answer_reads_and_park_loop_window_code_review.md`). Everything needed to apply the fix is here. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`spawn_engine`) — "Phase G's G.0 finds that pair and passes its paths to"

**Also:** `cli/test/watcher-park-resume.test.mjs` (the `for (const engine of ['task', 'user_review'])` case) — "Phase G's G.0 finds that pair and passes its paths to test-fix-plan-writer"; `docs/watcher.md` → `## 4. Pausing, parking and the usage gate` → **Parking is the same shape, on a different file.** — "G.0 passes that pair's paths to `test-fix-plan-writer`"

**Problem.** The new `resume_clause` says, about every answer whose question file names an origin that opens Phase G: *"Phase G's G.0 finds that pair and passes its paths to test-fix-plan-writer, its only reader until Phase D's clarification digest quotes it."* `docs/watcher.md` repeats it: *"G.0 passes that pair's paths to `test-fix-plan-writer`"*.

The contract that sentence points at says something narrower. `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` → **Which Phase G answers G.0 consumes.** reads: *"G.0 passes a pair to `test-fix-plan-writer` only when its question file names the index's repo-relative `<test_fix_plan_path>` **and** that index is pending an answer when G.0 runs. … Every other Phase G park leaves no index pending, so its answer is read by no agent and G.0 takes its other arms."*

So the watcher's sentence is false for every Phase G park except the `fixable: 0` one. A round-cap park (origin `Phase G gates`), a gate-cap park (origin `Phase G architecture-reviewer gate`) and a G.2 `## Questions` park raised without the clause are all excluded. The trusted launch prompt then describes a hand-off that G.0 will not make. That puts a second, wrong statement of G.0's arm into the session's context, beside the one the core states. The no-read rule in the same sentence still holds, so no session reads the answer because of this. The finding is that the prompt and the operator doc misstate which pairs reach the writer.

**Fix.** Replace the clause so it says G.0 decides, rather than claiming G.0 always passes the pair. Change the same words in all three places.

1. `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`, the `resume_clause=` assignment. Replace the tail
   `Phase G's G.0 finds that pair and passes its paths to test-fix-plan-writer, its only reader until Phase D's clarification digest quotes it. `
   with
   `Phase G's G.0 decides whether that pair reaches test-fix-plan-writer, its only possible reader until Phase D's clarification digest quotes it. `
   Keep the trailing space, the backslash-newline continuations inside the double-quoted string, and every earlier sentence byte-identical. `cli/test/watcher-remote-job.test.mjs` → `PARK_RESUME` matches the first sentence, and Task 1's case matches the `Before Phase D, …` sentence.
   In the comment block above it (opening `# On a RESUME, name every top-level answer file`), replace `# is read only by test-fix-plan-writer, through G.0` with `# can be read only by test-fix-plan-writer, and only when G.0 passes it`. Re-wrap the comment lines to the block's existing width.

2. `cli/test/watcher-park-resume.test.mjs`, in the `the ${engine} resume prompt names a Phase G answer without handing it to the session` case. Replace the second asserted string
   `"Phase G's G.0 finds that pair and passes its paths to test-fix-plan-writer, its only reader until Phase D's clarification digest quotes it."`
   with
   `"Phase G's G.0 decides whether that pair reaches test-fix-plan-writer, its only possible reader until Phase D's clarification digest quotes it."`

3. `docs/watcher.md` → **Parking is the same shape, on a different file.** Replace
   `— G.0 passes that pair's paths to \`test-fix-plan-writer\`, its only reader until Phase D's clarification digest quotes it`
   with
   `— G.0 decides whether that pair's paths reach \`test-fix-plan-writer\`, its only possible reader until Phase D's clarification digest quotes it`

**Verification.** Run only the test file this fix edits, from the repository root, as one plain foreground command: `npm test --workspace cli -- test/watcher-park-resume.test.mjs`. The full suite runs in the Run gates phase.
