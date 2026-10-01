### Task 8 — Report `remote-run.sh`'s own notifications and a stop on GitHub

**Goal:** `remote-run.sh`'s own lifecycle notifications — the `paused` and `failed` that `continue` and `poll` send when they cannot re-dispatch or give up — reach the run's issue or pull request too, worded for a GitHub reader. A stop, sent locally with `remote-run.sh stop` or from a comment, leaves a `stopped` comment and the `sdlc-harness: stopped` label, so each side sees what the other did (goal 7).

**Depends on:** Task 3's `forge_report <event> <branch> [<note>]` in `remote-run.sh`.

- It returns 0 always.
- It posts nothing with the forge coupling off.
- It maps `paused` → `sdlc-harness: paused`, `failed` → `failed` and `stopped` → `stopped`.
- It appends `<note>` verbatim after its own sentence for the event.
- On `failed` it posts nothing when the existing `remote_branch_stopped` answers 0.

**Where this task stops.** The watcher's events are Task 7's. The cancelled-job step and the `issues` / `pull-requests` permissions the run and resume workflows need are Task 14's, so in a job these comments land only once Task 14 grants them. Until then each attempt is one warning line, and no exit changes. `control`'s `stop` command, which passes `--actor`, is Task 10's.

### Targets

- `cli/templates/scripts/remote-run.sh` — `notify()`, each of its call sites in `continue_redispatch`, `continue_wait_poller`, `verb_continue` and `poll`, and `verb_stop` with a new `--actor` option.
- `cli/test/remote-run.test.mjs` — the forge cases for `continue` and `stop`.

**Work:**

- [ ] **`notify <event> <branch> <detail> <forge_note>`**: after the `autonomous-notify.sh` call, `forge_report "$1" "$2" "$4"`. `<detail>` stays the push notification's text, unchanged, with its slash commands. `<forge_note>` is a GitHub-safe sentence naming no slash command and no shell command. The header says each call site supplies both.
- [ ] **Every call site gains its note.** One per arm, stating only what happened, since `forge_report` adds the next GitHub action. For example:
  - *"Not continued: the repository variable `HARNESS_REMOTE_STOP` is set; clear it, then resume."*
  - *"Not continued: the chain limit was reached (<n> over `HARNESS_MAX_CHAIN` <max>)."*
  - *"The automatic resume after the usage limit could not be scheduled (<error>)."*
  - *"The job stopped before the run started: <run url>."*

  Every arm of `continue_redispatch`, `continue_wait_poller`, `verb_continue` and `poll`'s notifications gets one, and none is left without.
- [ ] **`stop <branch> [--actor <login>] [--repo <root>]`**: `--actor` is a `stop` option only, validated to a login shape like the trigger's (`^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$`), else a usage error. After a complete stop — the marker dispatched and every cancel asked — and after the existing registry write, call `forge_report stopped "$branch" "<note>"`. The note is `Stopped by @<actor>.` with `--actor`, else `Stopped from a local \`remote-run.sh stop\`.` A partial stop exits 3 as today and reports nothing, since the remedy is running `stop` again. State in the header's `stop` paragraph that a complete stop is reported, and that the cancelled job's own `failed` is then suppressed (Task 3's check).
- [ ] **`remote-run.test.mjs`**, using its existing stub, extended to answer the `api …/labels` GET with `[]` and to log `body=@<path>` contents. The fixture's `feat_x` carries a task-prompt provenance line for issue 7 on origin.
  - With `forge` `github`: `continue` with `HARNESS_REMOTE_STOP=1` → the existing `paused` notification, plus one comment on 7 naming `HARNESS_REMOTE_STOP` and `@sdlc-harness resume`, and no `/autonomous-sdlc-harness:` text in the comment.
  - With `forge` `github`: `stop feat_x --actor alice` → a comment naming `@alice` and an `sdlc-harness: stopped` label add after the cancel. A partial stop → neither.
  - `stop feat_x --actor 'a b'` → usage error, nothing sent.
  - With `forge` unset, every pre-existing `continue`, `poll` and `stop` case keeps its exact `gh` call list.

**Verification:**

- `npm test -- test/remote-run.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "^\s*notify \(paused\|failed\)" -- cli/templates/scripts/remote-run.sh` has every hit carrying a fourth quoted argument: no notification reaches GitHub with a slash command for its text.

**Deviations from plan:**

- The three notes saying the automatic resume after a usage limit failed (`continue_wait_poller`'s two arms, `poll_recheck`) also carry the next action, `USAGE_RESUME_NOTE` (*"Comment `@sdlc-harness resume` after the limit resets to continue."*), rather than stating only what happened: in a job the registry's `pause_reason` is `usage`, so `forge_report`'s own `paused` sentence says the run resumes by itself, which these arms contradict.
- `notify` runs `forge_report` with stdin from `/dev/null`, and `poll_recheck` captures `GH_ERR` once before its loop: `poll_branch` notifies inside a loop reading its run list, and each report overwrites `GH_ERR`.
- The stub's body log is a sibling file, `<log>.bodies`, rather than a field of the existing log line, so every pre-existing case's `calls()` reader and call list stay byte-identical.
- `bash -n cli/templates/scripts/remote-run.sh` was refused by the tool layer (approval required) and was not run; the script's syntax rests on the 102 cases of `test/remote-run.test.mjs` executing it under bash, all passing.
