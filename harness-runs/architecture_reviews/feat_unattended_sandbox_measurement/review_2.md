# Architecture review — iteration 2

Iteration 1's two Must Fix findings are resolved in the artifact:

- `task_4_plan.md` → `sp_setup` now resolves `SP_AGENT_MODEL` and `SP_AGENT_EFFORT` through `hr_agent_model` and `hr_agent_effort`. It keeps the library's status-1-means-unset distinction. `sp_session` splices `--model` and `--effort` in the watcher's conditional `${arr[@]+…}` form. A verification bullet greps `session.sh` for `opus`.
- `task_3_plan.md` now owns N5's three arms in `sp_judge_allowed_domains`, exposed as `judge allowed-domains`. `task_10_plan.md`'s N5 row calls that function and defines no arm of its own. `task_12_plan.md` drives the three arms through the subcommand.

I checked the layer placement, dependency direction, module monopolies, configuration-at-run-time and test-run rule against all sixteen task files and the index. None of them is breached. Every run-library and watcher function the plan calls exists in `scripts/lib/harness-run-lib.sh` or `scripts/autonomous-watcher.sh`. That includes `hr_run_protected_rel_paths`, `hr_run_profile_file`, `hr_registry_peek`, `hr_registry_drop`, `hr_clone_remove_var`, `run_profile_entries`, `run_profile_render`, `run_profile_check` and `running_count`.

## Must Fix

_None._

## Should Fix

1. **Re-raised a third time, still unaddressed: `task_4_plan.md` → `sp_teardown` still asks for `SP_TMP` to be removed "in process, never a shelled-out recursive removal".** Its verification still requires `session.sh` to contain no `rm -r`. The index has no `## Rejected findings` entry for this. A bash script has no in-process recursive removal. `SP_TMP` will hold directories: `task_8_plan.md` builds scratch repositories, each with its own `.git`, under it, and L2's scratch main checkout goes there too. As written, the implementer must either fail the verification or invent a mechanism the plan does not name (`.claude/context/conventions.md` → `## Shell assets`).
   **Fix:** in `task_4_plan.md`, choose one of these and write it down:
   - remove each tracked file by name, remove each tracked scratch repository through one named helper, then `rmdir` `SP_TMP`; or
   - state that the hand-run probe takes the same exception the run library's `hr_clone_remove_var` takes, and say why.

   Then make the `rm -r` verification bullet match the choice. Alternatively, record a rejection with its reason under `## Rejected findings` in the index.

2. **Re-raised a third time, still unaddressed: Tasks 1–11 still do not say that each `scripts/lib/sandbox-probe/*.sh` file sets no shell option.** `.claude/context/conventions.md` → `## Shell assets` says *"A sourced library sets no shell options at all"*. It also requires `#!/usr/bin/env bash` on every shell file. `task_1_plan.md` states the shebang and `set -u` for the entry point only, and the ten library files are sourced.
   **Fix:** in `task_1_plan.md`'s `core.sh` bullet, add one line: each library file opens with the shebang and a `# <basename> — …` header, and sets no shell option, because the entry point owns `set -u`. Restate that line in the Targets of Tasks 2–11. Alternatively, record a rejection under `## Rejected findings`.

3. **`task_11_plan.md` → S4 reads the token names from "the profile's `credentials.envVars`". That key is `sandbox.credentials.envVars`, and each entry carries its name in `.name`.** The generator's `CREDENTIAL_LISTS` in `cli/src/generators/permissionProfile.ts` checks it as `['envVars', 'name']` under `sandbox.credentials`. Read at the top-level path, the list comes back empty, and S4 "all absent" would then pass with nothing checked. The no-retyped-list intent is right (`.claude/context/conventions.md` → `### Where a new responsibility goes` → **A responsibility that already has a home does not get a second one**). Only the path is wrong.
   **Fix:** in `task_11_plan.md`, name the read as `jq -r '.sandbox.credentials.envVars[].name' "$SP_RUN_PROFILE"`. Add a rule that an empty list prints `not run` for S4, never `pass`. Update the verification grep to match.

4. **Two places point at a `## Corpus staleness` section that the story index does not have.** The story index's `## Scope register` row 14 and `task_16_plan.md` (its Work and Verification bullets) both say the conventions-document gate count is "raised in `## Corpus staleness`". No such section exists. As written, the stale-rule observation about `.claude/context/conventions.md` → `## The testing bar` is recorded nowhere.
   **Fix:** add the `## Corpus staleness` section to the story index. Have it carry that one observation, naming `.claude/context/conventions.md` → `## The testing bar` as the site, the gate list as the stale content, and a supervised `/harness-analyze` re-run or a hand edit as the route. Otherwise, re-point both citations to the place the observation is actually recorded.

## Nice to Have

_None._
