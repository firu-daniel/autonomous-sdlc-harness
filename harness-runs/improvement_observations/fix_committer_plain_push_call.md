## A `<default_branch>..HEAD` range does not resolve in the run copy, which carries no local `dev` ref
- **category:** agent-contract
- **evidence:** at Phase D the orchestrator issued `improvement_observations_instructions.md` → `## Dispositioned units` (b)'s command as written, `git log --format='%h %s%n%b' --name-only dev..HEAD`, and it exited 128 with `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.`; the same session's `branch-reviewer` (Phase B), `skeptic-reviewer` (Phase C2) and `statistics-plan-writer` (Phase D.1) returns each reported that no local `dev` ref exists in this checkout and that they diffed or logged against `origin/dev` instead.
- **cost this run:** four sites fell back to `origin/dev` on their own judgement; none failed, but each substitution was improvised rather than stated by the instruction.
- **hypothesis:** (guess) the run copy is cut from `origin/dev` and never gets a local `dev` branch, so every instruction spelling the range as `<default_branch>..HEAD` hits this.

## A unit's type check was run behind a `cd`, against the test-run rule's foreground-form point
- **category:** agent-contract
- **evidence:** the Phase C `layer-implementer` dispatch for code-review Finding 1 (heartbeat `[C · Item 1 · plugin · iter 0]`, dispatch #11) returned that it ran `bash scripts/typecheck.sh` "with a `cd` to that directory in front of it"; `unit_loop_core.md` → `## The test-run rule` point 6 says each run is one foreground command "never … wrapped in a `cd`".
- **cost this run:** none visible — the call was allowed and printed `PASS: typecheck`; in an unattended profile a `cd`-prefixed form may not match the configured command's allow entry.
