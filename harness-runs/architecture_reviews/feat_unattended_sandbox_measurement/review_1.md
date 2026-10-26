# Architecture review — iteration 1

Iteration 0's three Must Fix findings are resolved in the artifact:

- `task_4_plan.md` now resolves `SP_STATE_DIR` and `SP_REGISTRY` through `hr_state_dir` and `hr_state_path`.
- `task_5_plan.md` now derives the scratch path from `hr_state_dir "$SP_CLONE"`.
- `task_13_plan.md` now runs every preflight and snapshot case against a copy of the probe inside a `createWatcherFixture` fixture.

The two findings below are new.

## Must Fix

1. **`task_4_plan.md` hardcodes `--model opus` on `sp_session`'s launch line, and drops `--effort`. The watcher resolves both from `harness.config.json` through the run library.** Violates `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` (*"each consumer re-reads the file on each run, from the root it resolved for itself"*), and `### Where a new responsibility goes` → **A responsibility that already has a home does not get a second one**.
   The launch line in `sp_session` spells `--model opus` as a literal. `scripts/autonomous-watcher.sh` does not. At start-up it sets `AGENT_MODEL="$(hr_agent_model "$MAIN_REPO")"`, and `spawn_engine` adds `--model "$AGENT_MODEL"` only when that value is non-empty. It adds `--effort "$AGENT_EFFORT"` from `hr_agent_effort` the same way. Its header comment gives the flag as `--model "<agentModel>"` / `--effort "<agentEffort>"`.
   The task says it reproduces the watcher's line "flag for flag". Its own verification says "Every flag is the watcher's, except the named `--allowedTools` and `--debug-file` departures". So this is a third copy of `agentModel`, frozen at this repository's current value. If `agentModel` changes, or `agentEffort` is set, the probe would measure a different launch line from the one the watcher runs, and no result line would say so. That is the same defect iteration 0's Finding 1 fixed for `stateDir`.
   **Fix:** In `task_4_plan.md`, under `sp_setup` → **State directory and registry, resolved once**, also resolve:
   - `SP_AGENT_MODEL="$(hr_agent_model "$SP_MAIN")"`
   - `SP_AGENT_EFFORT="$(hr_agent_effort "$SP_MAIN")"`

   Treat a non-zero status the same way as the other two reads. In `sp_session`, replace `--model opus` with the watcher's conditional form: `--model "$SP_AGENT_MODEL"` only when it is non-empty, and `--effort "$SP_AGENT_EFFORT"` only when it is non-empty. Use the `${arr[@]+…}` array form `spawn_engine` uses, so an empty array is safe under `set -u`. Add a verification bullet: grep `session.sh` for `opus` and find no match.

2. **`task_12_plan.md` pins N5's three arms through the `judge` subcommand. Task 3's `sp_judge_cli` has no N5 verdict, because `task_10_plan.md` puts that decision rule inside the leg file.** Violates `.claude/context/conventions.md` → `### Where a new responsibility goes` → **A responsibility that already has a home does not get a second one**. The story index declares `judge.sh` the owner of "reads a stream and git state into a verdict". The finding also bears on `## The testing bar` → *"Where behaviour cannot be reached from a behavioural test, guard the source instead … a last resort"*.
   `task_10_plan.md` → **N5** defines a three-arm judge inside `sp_leg_network` (`scripts/lib/sandbox-probe/legs-network.sh`):
   - refused gives `pass`;
   - host answered gives `fail`, with a line naming the follow-up finding;
   - no `allowed_domains` on the call (read through `sp_call_input`) gives `not run`.

   `task_3_plan.md` → `sp_judge_cli` exposes only `judge call | tool | mcp`. `judge call` cannot produce the `not run`-on-absent-parameter arm. It cannot print the follow-up wording either. Both its `ran` and refused outcomes are graded against a caller-supplied `<expect>`, not N5's rule.
   `task_12_plan.md` says it "changes no probe file", and yet its cases assert all three N5 arms through `judge`. The story index's first top risk depends on that ("Task 12 pins all three arms against fixtures"). As planned, the most important verdict in the probe lives where no test can reach it. Either Task 12 cannot be implemented, or its implementer has to move logic into a file another task owns.
   **Fix:**
   - In `task_3_plan.md`, add `sp_judge_allowed_domains <stream> <exact command>` to `judge.sh`. It carries N5's three arms exactly as `task_10_plan.md` states them: refusal at any layer gives `pass`; a host answer (layer `ran`) gives `fail`, with the follow-up-finding sentence in the evidence; an absent `allowed_domains`, read through `sp_call_input`, gives `not run`. Expose it as `judge allowed-domains <stream> <command>` in `sp_judge_cli`.
   - In `task_10_plan.md`, have `sp_leg_network`'s N5 row call `sp_judge_allowed_domains` instead of defining the arms itself.
   - In `task_12_plan.md`, drive N5's three cases through `judge allowed-domains`.
   - Move `task_10_plan.md`'s grep verification for the three arms to `judge.sh`.

## Should Fix

1. **Re-raised from iteration 0, still unaddressed: `task_4_plan.md` → `sp_teardown` still asks for `SP_TMP` to be removed "in process, never a shelled-out recursive removal", and still verifies that `session.sh` contains no `rm -r`.** A bash script has no in-process recursive removal. `SP_TMP` will hold directories: `task_8_plan.md` builds scratch repositories with their own `.git` under it, and so does L2's scratch main checkout. The plan index has no `## Rejected findings` entry for this. Name the mechanism the implementer must use. One option: remove each tracked file by name, remove each tracked scratch repository through one named helper, then `rmdir` `SP_TMP`. The other option: state the exception the run library's `hr_clone_remove_var` already takes, and the reason for it (`.claude/context/conventions.md` → `## Shell assets`).

2. **Re-raised from iteration 0, still unaddressed: Tasks 1–11 still do not say that each `scripts/lib/sandbox-probe/*.sh` file sets no shell option.** `.claude/context/conventions.md` → `## Shell assets` states *"A sourced library sets no shell options at all"*, and requires `#!/usr/bin/env bash` on every shell file. `task_1_plan.md` states the shebang and `set -u` for the entry point only. Add a line to `task_1_plan.md`'s `core.sh` bullet, restated in the Targets of Tasks 2–11: each library file opens with the shebang and a `# <basename> — …` header, and sets no shell option, because the entry point owns `set -u`.

## Nice to Have

_None._
