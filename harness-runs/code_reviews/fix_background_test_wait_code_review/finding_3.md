### 3. The adopter templates forbid a `cd` compound and a redirect in the single-file command, but not the pipe that point 6 also forbids

> **Self-contained per-finding file** for the `fix_background_test_wait` code-review index (`harness-runs/code_reviews/fix_background_test_wait_code_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/claude/context/conventions.md` (the "What belongs here" bullet beginning "Logging, error handling, and the testing bar") and `cli/templates/claude/context/layer.md` (the bullet beginning "What \"done\" means here"). Both carry the substring "never `cd <dir> && …`, and never with its output redirected to a file".

The templates tell `/autonomous-sdlc-harness:harness-analyze` how to state `<test_file_cmd>` in an adopter's conventions document. The new sentence rules out two shapes: a `cd` compound and a redirect. The rule that consumes that command, `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6, rules out three. A unit runs it "never redirected to a file, never piped, never started in the background". Point 6 also forbids reshaping a refused command.

Suppose an analyze pass writes a piped single-file command (for example one that pipes through `tail` to trim output). The template permits it. A unit then cannot obey point 6 by running that command as stated, and it may not rewrite it either. The only honest outcome is a skip on every unit, so the per-unit test never runs in that repository. The pipe is also one of the shapes `.claude/context/conventions.md` → `## Shell assets` names as withdrawing the script-allowlist guard's permit in an unattended run.

**Fix:** in **both** template files, replace

> never `cd <dir> && …`, and never with its output redirected to a file

with

> never `cd <dir> && …`, never piped, and never with its output redirected to a file

Leave the rest of each sentence as it is. Both files carry the identical sentence today. Keep them identical, and grep `cli/templates/claude/context/` for `never piped` to confirm both changed.
