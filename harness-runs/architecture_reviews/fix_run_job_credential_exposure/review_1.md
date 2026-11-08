# Architecture review — iteration 1

Round-0 Must Fixes 1 (one profile `envVars` reader, `hr_profile_env_var_names`) and 2 (`hr_session_pass_env` built on `hr_config_load`) are resolved in `task_2_plan.md` and `task_4_plan.md`. Round-0 Must Fix 3 is resolved for the two paragraphs it named (**THE WRITE EXCEPTIONS…** and **NAMING.**). Finding 1 below covers the other header enumerations the same new writers and reads fall under. The index has no `## Rejected findings` section.

## Must Fix

1. **The library header enumerates every writer, every environment read and every shell mirror, and Task 2 leaves three of those enumerations stale** — `task_2_plan.md`. Rule: `.claude/context/cli.md` → `## What "done" means here` → *"Where the header states a rule, the change either satisfies it or amends the header in the same edit"*. The same rule produced round-0 Must Fix 3.
   The header of `cli/templates/scripts/lib/harness-run-lib.sh` states three closed lists that Task 2's new code falls under. Task 2's **The module header.** bullet amends none of them:
   - **The read-only-caller list.** The paragraph opening *"A caller that calls no `hr_lane_*`, `hr_registry_init`, … or `hr_clone_remove_var` function still gets a library that only reads"* lists every writing function. After Task 2, a caller that calls `hr_push_refusal_record` or `hr_push_refusal_handled` calls none of the listed functions and still writes. `remote-run.sh` and `launch-sandboxed-gates.sh` are such callers, and they rely on this sentence. The sentence becomes false.
   - **The environment-read enumeration.** The same paragraph names every environment variable the library reads, and which function reads it: *"`XDG_STATE_HOME`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `HOME`, `PWD` … `GITHUB_ACTIONS` is read by `hr_keep_awake_mode_var` alone … `GITHUB_RUN_ID`, `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY` and `HARNESS_INPUT_CHAIN` are read by `hr_remote_status_write` alone … `HARNESS_GITHUB_DEFAULT_COMMIT` is read by `hr_remote_state_dir_var` alone"*. `hr_credential_values_var` adds reads of `GH_TOKEN`, `GITHUB_TOKEN`, `HARNESS_PR_TOKEN` and `HARNESS_GIT_TOKEN`, a new class (credential values, read as data to scan for). The paragraph does not name them.
   - **The mirror declarations.** The header declares every shell mirror of a `cli/src` owner as a module-level paragraph, for example *"MIRROR OF `cli/src/config/model.ts` → `sandboxOptedOut`; `hr_sandbox_opted_out` … A change to either owner is an edit here."* Task 1 makes `SANDBOX_PASS_ENV_PATTERN` an owner whose shell mirror is `hr_session_pass_env`'s element filter. Task 2 records the mirror only in that function's own comment, so the module's mirror list misses it.

   The opening summary paragraph (*"the one place every generated outer-loop script resolves … answers whether the sandbox opt-out is taken …"*) also lists the library's answers, and gains none of the four new responsibilities.
   **Fix:** In `task_2_plan.md` → **The module header.**, add four sub-bullets, plus one Verification bullet for each:
   - Append `hr_push_refusal_record` and `hr_push_refusal_handled` to the *"A caller that calls no … function still gets a library that only reads"* list.
   - In the same paragraph, add a sentence stating that `GH_TOKEN`, `GITHUB_TOKEN`, `HARNESS_PR_TOKEN` and `HARNESS_GIT_TOKEN` are read by `hr_credential_values_var` alone, as values to scan for. They are never a configured value and never policy, and they are never printed.
   - Add a **MIRROR OF `cli/src/config/model.ts` → `SANDBOX_PASS_ENV_PATTERN`** paragraph beside the `sandboxOptedOut` one, naming `hr_session_pass_env`'s element filter.
   - Add the credential check, the push-refusal record, `hr_session_pass_env` and `hr_profile_env_var_names` to the opening summary's list of answers.

2. **The watcher and the library would spell `HARNESS_GIT_TOKEN` and `HARNESS_PUSH_URL` as literals, and the names' owner says in its header that the watcher spells none of them** — `task_4_plan.md` (and `task_2_plan.md`). Rules: `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` → *"An environment-variable name is a constant with an owner too … never retyped as a literal"*, and the persisted-key bullet beside it, *"a mirror the header does not declare is a defect"*. Also `.claude/context/cli.md` → `## What "done" means here` → *"A reviewer holds a change to its module's own header"*.
   The owner is `cli/src/remote/githubActions.ts` → `PUSH_URL_SECRET = 'HARNESS_PUSH_URL'` and `GIT_TOKEN_SECRET = 'HARNESS_GIT_TOKEN'`. Its header lists the shell and YAML mirrors that *"must agree byte for byte"* and states: *"`cli/templates/scripts/autonomous-watcher.sh` is not one: it reaches GitHub only through `remote-run.sh`, spells none of these names in code"*. It declares the library as a mirror of `WORKFLOW_RUN_FILE` and `STATE_ARTIFACT_NAME` only.
   - Task 4 adds `SESSION_ENV_STRIP_EXTRA` holding `HARNESS_PUSH_URL` and `HARNESS_GIT_TOKEN` to `autonomous-watcher.sh`. Today the watcher spells neither name.
   - Task 2 adds `HARNESS_GIT_TOKEN` as a credential source in `harness-run-lib.sh`.

   With both copies in place, the owner's header becomes false. A rename of either secret also misses two undeclared copies, and the one the watcher strips is a credential. Round 0 raised this as a Nice to Have. It is raised here as a Must Fix because the owner's header states the exclusion as a rule.
   **Fix:**
   - In `task_4_plan.md`, add `cli/src/remote/githubActions.ts` to `### Targets`. Add a Work bullet that rewrites the header's watcher sentence: the watcher now mirrors `PUSH_URL_SECRET` and `GIT_TOKEN_SECRET` in `SESSION_ENV_STRIP_EXTRA`, and still reaches GitHub only through `remote-run.sh`. Extend the library's entry there so it also mirrors `GIT_TOKEN_SECRET` (Task 2's credential source). No other task edits that file.
   - In `task_4_plan.md`, the watcher's own header declares the mirror at `SESSION_ENV_STRIP_EXTRA`.
   - In `task_2_plan.md`, extend the library header's **MIRRORS OF `cli/src/remote/githubActions.ts`** list with `GIT_TOKEN_SECRET`, naming `hr_credential_values_var`.
   - Add a Verification bullet to each task: `grep -n 'HARNESS_GIT_TOKEN\|HARNESS_PUSH_URL'` over the edited script finds each code occurrence under a declared mirror.

## Should Fix

- `task_2_plan.md` / `task_1_plan.md`: the precedent Task 1 cites for declaring the shell mirror is `sandboxOptedOut`'s doc comment, which reads *"held equal by `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`"*. No task holds `SANDBOX_PASS_ENV_PATTERN` equal to `hr_session_pass_env`'s filter. Two options:
  - Add a case to the new `cli/test/credential-scan-lib.test.mjs`, a file Task 2 owns, that reads the pattern from the compiled `model.js` and drives `hr_session_pass_env` with names on either side of it.
  - Or make the model doc comment say that no test holds them equal.
- `task_3_plan.md`: `harness-runs/lessons.md` → *Trust checks* says *"An unsandboxed script takes … the path of every trust input from a record the session cannot write … never from … an environment variable."* The stored-credential source is located through `HOME` / `XDG_CONFIG_HOME`, which Task 3 records only as a residual. Either argue in the header paragraph why this input does not fall under the lesson (it can only add values that cause a refusal, never remove one the environment and `.git/config` supply), or resolve the paths from the main checkout's own record.

## Nice to Have

- `task_2_plan.md`: nothing.
