### Task 2 — Rename the variable-name constants and literals in `cli/src`

**Goal:** Every name `init` and `doctor` print, and every `gh variable set` or `gh secret set` line, carries the `DEVSCENE_` name. The constant owners change their values; the literals in comments follow, and the one help line that retyped a name now reads it through its constant.

**Depends on:** Task 1. That task moved the plugin-corpus guard onto `MAIN_REPO_ANCHOR_VARIABLE`, so renaming that constant here is what retargets it.

**Where this task stops.** It changes `cli/src` only. The templates that mirror these constants byte for byte are Tasks 3–6. The suites that assert them are Tasks 7–13 and 18. Until those land, the suites that read both sides are red; nothing runs them before Phase G.

### Targets

- `cli/src/remote/githubActions.ts`
- `cli/src/generators/notifications.ts`, `cli/src/generators/claudeContext.ts`
- `cli/src/core/mainRepoAnchor.ts`
- `cli/src/doctor/checks.ts`
- `cli/src/commands/doctor.ts`, `cli/src/commands/init.ts`

**Work:** apply `## Context`'s spelling table as literal substring replacements, to the table tokens only.

- [ ] `githubActions.ts`: set `RUNNER_VARIABLE`, `REMOTE_STOP_VARIABLE`, `TRIGGER_LABEL_VARIABLE`, `TRIGGER_ALLOWED_BOTS_VARIABLE`, `RUN_ACTORS_VARIABLE`, `PUSH_URL_SECRET`, `GIT_TOKEN_SECRET`, `GH_CLI_VARIABLE` and `CLI_VERSION_VARIABLE` to their `DEVSCENE_` values. Respell the header and doc comments that spell `HARNESS_GIT_TOKEN`, `${HARNESS_GH_CLI:-gh}`, `${HARNESS_AGENT_CLI:-claude}`, `vars.HARNESS_RUN_ACTORS` and `HARNESS_CLI_VERSION`. Respell `carriesRunActors`'s doc comment, keeping its sense: `false` marks a copy that does not read the allow-list variable. Name no old spelling and add no detection of one.
- [ ] `notifications.ts`: `PUSH_URL_KEY = 'DEVSCENE_PUSH_URL'`, `PUSH_CMD_KEY = 'DEVSCENE_PUSH_CMD'`. `claudeContext.ts`: respell the header's `HARNESS_PUSH_*` and `HARNESS_QA_<n>_*` to `DEVSCENE_PUSH_*` and `DEVSCENE_QA_<n>_*`.
- [ ] `mainRepoAnchor.ts`: `MAIN_REPO_ANCHOR_VARIABLE = 'DEVSCENE_MAIN_REPO'`. `MAIN_REPO_ANCHOR_READ` and `MAIN_REPO_ANCHOR_RULE` follow from it. Respell the header's grep commands and its quoted `export … ="$MAIN_REPO"` line.
- [ ] `checks.ts`: `AGENT_CLI_VARIABLE = 'DEVSCENE_AGENT_CLI'`. Respell the doc comments that spell `HARNESS_AGENT_CLI`, `HARNESS_PUSH_URL`, `HARNESS_REMOTE_STOP`, `HARNESS_GIT_TOKEN`, `HARNESS_TRIGGER_LABEL`, `HARNESS_TRIGGER_ALLOWED_BOTS` and `HARNESS_RUN_ACTORS`. Leave `KEEP_AWAKE_LOCK_PROBE_ENV` and `NESTED_USERNS_PROBE_ENV` alone: they are kept test seams.
- [ ] `commands/doctor.ts`: do not retype the new name in the help text. Add `import { RUNNER_VARIABLE } from '../remote/githubActions.js';` alongside the file's other `../` imports. Turn the `--help` array element `'which runner HARNESS_RUNNER selects. A call that times out or cannot reach GitHub warns rather than'` into the template literal `` `which runner ${RUNNER_VARIABLE} selects. A call that times out or cannot reach GitHub warns rather than` ``. Leave every other byte of that line unchanged. This follows `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: *"An environment-variable name is a constant with an owner too … each read through its constant and never retyped as a literal — including in the message that names it to a reader"*. The neighbouring lines already interpolate `${CHECK_GITHUB_FLAG}`, `${CHECK_REGISTRY_FLAG}` and `${REMOTE_JOB_FLAG}`. `commands/init.ts`: the doc comment's `${HARNESS_AGENT_CLI:-claude}` becomes `${DEVSCENE_AGENT_CLI:-claude}`. Leave `SELF_ADOPT_ENV = 'HARNESS_SELF_ADOPT'` alone: it is a kept contributor switch.

**Verification:**

- `bash scripts/typecheck.sh` exits zero.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/src` prints nothing.
- `git grep -n 'RUNNER_VARIABLE' -- cli/src/commands/doctor.ts` lists both the import and the `--help` line that interpolates `${RUNNER_VARIABLE}`.
- `git grep -nE 'HARNESS_SELF_ADOPT|AUTONOMOUS_SDLC_HARNESS_' -- cli/src` still lists the kept and excluded constants, unchanged.
