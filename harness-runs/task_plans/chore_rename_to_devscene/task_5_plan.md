### Task 5 — Respell the watcher, `remote-run.sh`, the notifier and `restart-watcher.sh` templates

**Goal:** The four largest outer-loop script templates name the product `devscene` in every command a person is told to run, every machine path they document, every notification and every comment. Apply the spelling table in the story index's `## Context`.

**Depends on:** Task 1, whose TypeScript values these scripts mirror. `cli/src/remote/githubActions.ts` → `MENTION_COMMAND` is `/${PLUGIN_NAME}:harness-read-mention`, now `/devscene:harness-read-mention`, and `remote-run.sh`'s own `MENTION_COMMAND` must equal it byte for byte. The machine directories these scripts document are `MACHINE_DIR_NAME`'s, now `devscene`. The shell functions that compute those directories live in `cli/templates/scripts/lib/harness-run-lib.sh` and are Task 6's. This task changes only the comments here that spell the resulting paths.

**Where this task stops.** No test file. Task 10 respells the watcher, remote and prompt-injection suites that pin these messages, and Task 9 the ones that pin the library. This repository's own copies under `scripts/` are Task 17's, as byte copies of what this task leaves.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/templates/scripts/remote-run.sh`
- `cli/templates/scripts/autonomous-notify.sh`
- `cli/templates/scripts/restart-watcher.sh`

**Work:**

- [ ] `autonomous-watcher.sh`, messages: every `notify …` and `log …` string telling a person to run `/devscene:branch-resume <branch>`, `/devscene:branch-status`, `/devscene:branch-answer` or `/devscene:branch-qa-test`; the `npx --yes "devscene@$HARNESS_CLI_VERSION" doctor …` call; the `npx devscene doctor reports it under sandbox-prerequisites` refusal; and the `devscene init --force` hint for `RUN_ANALYTICS`.
- [ ] `autonomous-watcher.sh`, comments: the machine-path comments (`${XDG_STATE_HOME:-$HOME/.local/state}/devscene/…`, `${XDG_CONFIG_HOME:-$HOME/.config}/devscene/watcher.env`, the usage-lane and `run-lane.lock` lines, `run-profiles/…`) and the command-name comments. In the block opening `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.`, which is a measured record, respell `autonomous-sdlc-harness 0.1.0`, `claude plugin details …@…` and the two `…:branch-start-plan-autonomous` spellings. Add the parenthesis *"(Taken under the product's earlier name; only the name is respelled here.)"* to its `# Measured on Claude Code 2.1.274, …` sentence. `ENGINE_COMMAND_TASK=`, `ENGINE_COMMAND_USER_REVIEW=`, `ENGINE_COMMAND_DOCS=`, the three `#   <branch>_… -> /branch-…` mapping lines, and the two exempted lines `#   "/branch-start-plan-autonomous": exit 0` and `#     \`/branch-start-plan-autonomous\`. The instructions` stay byte-identical: `scripts/check-command-spelling.sh` matches them as `line` / `contains` exemptions.
- [ ] `remote-run.sh`: `MENTION_COMMAND='/devscene:harness-read-mention'`, `RESUME_HINT="/devscene:branch-resume"`, the `/devscene:branch-qa-test` and `/devscene:branch-user-review` texts in posted comments and replies, and the comment lines (`npx devscene init` in the REPRO, the `branch-user-review` comments).
- [ ] `autonomous-notify.sh`: the two `${XDG_CONFIG_HOME:-$HOME/.config}/devscene/push.env` comments and the notification group `-group "devscene.$slug"`. `restart-watcher.sh`: the default `cli="${HARNESS_CLI:-devscene}"` and the comment *"HARNESS_CLI names the CLI, `devscene` when unset."* The variable name `HARNESS_CLI` is out of scope and unchanged.
- [ ] Parse each edited file with `bash -n <file>`, one plain command per file.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- cli/templates/scripts/autonomous-watcher.sh cli/templates/scripts/remote-run.sh cli/templates/scripts/autonomous-notify.sh cli/templates/scripts/restart-watcher.sh` prints nothing.
- `bash -n` exits 0 on each of the four files.
- `git grep -n -E '^ENGINE_COMMAND_(TASK|USER_REVIEW|DOCS)=' -- cli/templates/scripts/autonomous-watcher.sh` prints the same three lines `git show HEAD:cli/templates/scripts/autonomous-watcher.sh` carries, unchanged.
- `git grep -n -F "MENTION_COMMAND='/devscene:harness-read-mention'" -- cli/templates/scripts/remote-run.sh` prints one line.
