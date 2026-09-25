### Task 5 — Ship `remote-run.sh` with `dispatch`, `pause`, `warm` and `stop`

**Goal:** Add the outer-loop script every call from this machine to GitHub goes through, with its four sending verbs, and register it in the shipped table. It is the one place a `gh workflow run` for a harness run is composed, so the workflow's input contract has exactly one producer on the shell side.

**Depends on:** Task 2, whose names this script mirrors byte for byte — `harness-run.yml`, `HARNESS_GH_CLI` (the binary run as `gh`: `"${HARNESS_GH_CLI:-gh}"`) — and whose header lists this file among its mirrors; and Task 3, whose `hr_execution_target` and `hr_registry_set` / `hr_registry_get` this script calls.

**The workflow input contract — this task is its shell-side producer; Task 15 declares the same inputs in `harness-run.yml` and restates this table.**

| Input | Values | Meaning |
|---|---|---|
| `action` | `run` \| `pause` \| `warm` \| `stop` | what the dispatched run does; `pause`, `warm` and `stop` skip the `run` job (`warm` runs only its own `warm` job; `pause` and `stop` run no job at all, so no runner starts and no minute is billed) |
| `branch` | a branch name | the run's branch; also the dispatch `--ref` for `run`, `pause` and `stop` |
| `engine` | `task` \| `user_review` \| `docs` | the flow command the job launches (`action: run` only) |
| `resume` | `none` \| `answer` \| `pause` | a fresh start, a resume on answered clarifications, or a resume from the ledger |
| `answers` | a JSON object `{"<n>": "<answer text>", …}` | the answer files a `resume: answer` delivers, by index |
| `park_loop_clear` | `true` \| `false` | the local park-loop clear, carried to the job |
| `chain` | a non-negative integer | automatic dispatches since the last user action; a user's dispatch sends `0` |

The workflow's `run-name` is `harness <action> <branch>`; Task 10's job-side pause poll matches `harness pause <branch>` by that title, and Task 8's `continue` and `poll` match `harness stop <branch>` and `harness run <branch>` by it, so the spelling is a wire.

**The verbs and their exit map, stated once for every consumer** (the watcher calls `dispatch` and `pause` in Tasks 11–12; Task 8's `continue` and `poll` call `dispatch`; Task 21's deny entry and Tasks 22–23's commands name the file):

```
remote-run.sh dispatch <branch> --engine <kind> [--resume none|answer|pause] [--answers-from <clar_dir> --indexes "<n> <n>…"] [--park-loop-clear] [--chain <n>]
remote-run.sh pause <branch>
remote-run.sh warm
remote-run.sh stop <branch>
  0  sent (for stop: the action=stop marker was dispatched, and every queued, waiting or in-progress run of that branch was asked to cancel, or there was none)
  1  usage error, or the library or the configuration could not be resolved
  2  refused, nothing sent: execution.target is not github-actions; the answers payload is over the limit; a named answer file is missing
  3  gh failed: not found, or a non-zero exit — the first line of gh's stderr is named
```

`warm` dispatches `action: warm` on GitHub's own default branch (`gh repo view --json defaultBranchRef`), which may differ from the configured `defaultBranch`. **`stop` does three things, in this order.** (1) It dispatches `action: stop` on the branch (`workflow run harness-run.yml --ref <branch> -f action=stop -f branch=<branch>`), **always**, whether or not any run is in progress. That run is titled `harness stop <branch>` by the `run-name` and runs no job; it is the **stop marker** GitHub keeps and Task 8 reads. It is sent first because it is the only part that reaches a run no job is executing: a usage-paused run on a hosted runner whose reset was too far off has ended its job and enabled the resume poller (Tasks 10, 8), so nothing is queued or in progress to cancel, and without the marker the poller would resume it at the next tick after the reset. Task 8's `poll` skips, and `continue` refuses to re-dispatch or enable the poller for, any branch whose newest `harness stop <branch>` run is newer than its newest `harness run <branch>` run. A later user dispatch (`harness run <branch>`) is newer than the marker, so resuming after a stop works with no extra step. (2) It lists the branch's runs of `harness-run.yml` with status `queued`, `in_progress` or `waiting` and cancels each. (3) It sets the local record's `status` to `failed` with `remote_stopped_at` through `hr_registry_set` when a record exists. A marker dispatch that fails exits 3 at once, before any cancel, naming `gh`'s stderr, because a cancel with no marker would leave a poller-waiting run resumable. The script runs `gh` from the main checkout (`hr_main_repo`) unless `--repo <root>` is given, so `gh` resolves the repository from that checkout's remote.

### Targets

- `cli/templates/scripts/remote-run.sh` (new).
- `cli/src/generators/outerLoopScripts.ts` — its row, and the doc comment on the deny-list-carrying `false` rows.
- `cli/templates/scripts/README.md` — the family list (register row 11).
- `cli/templates/claude/settings.autonomous.json` — the `_README` entry naming who starts the non-invocable scripts (register row 10).
- `cli/test/remote-run.test.mjs` (new).
- `cli/templates/scripts/autonomous-watcher.sh` → the registry field-set comment above `registry_init` (the contract `THE REGISTRY IS A CONTRACT, NOT AN IMPLEMENTATION DETAIL.` governs) — the `remote_stopped_at` entry. Comment only; no watcher code changes in this task.

**Work:**

- [ ] Write `remote-run.sh`: `#!/usr/bin/env bash`, the `# remote-run.sh — …` header, `set -u` without `-e` (it must report every refusal, not abort mid-decision), the library sourced from `${BASH_SOURCE[0]}`, the verb table and exit map above, a `WHAT IT NEVER DOES` block (it never launches a local session, never writes the inbox, never pushes, never watches a run it sent), the declared mirrors of Task 2's names, and a `REPRO` block reproducing each verb and each refusal with `HARNESS_GH_CLI` pointed at a recorder stub against a throwaway fixture. Build the `answers` JSON with `jq -n` and `jq -R -s` per file (not `--rawfile`, which is above the `jq` 1.5 floor); refuse a payload over `REMOTE_INPUT_PAYLOAD_MAX=65535` characters, naming GitHub's documented `workflow_dispatch` input limit and its documentation page as the source. Every `gh` call is a fixed argument list, one command per line.
- [ ] Add the table row `{ file: 'remote-run.sh', mode: 0o755, agentInvocable: false }` beside the watcher's, and update the doc comment that names which `false` rows carry a `DENY_SCRIPT_BASENAMES` entry: `remote-run.sh` must, because a run that could dispatch runs could start runs about itself, and **Task 21** adds that entry in `plugin/hooks/autonomous-script-allowlist-guard.sh`.
- [ ] `cli/templates/scripts/README.md`: add `remote-run.sh` to the member list with one clause (sends a remote run's dispatch, pause, warm-up and stop to GitHub; run by the watcher, the remote job and a person). `settings.autonomous.json` `_README`: the sentence naming what the watcher process or a person starts gains `remote-run.sh` — started by the watcher, the remote job or you — with no allow entry. In the watcher's registry field-set comment, add `remote_stopped_at`: the epoch second `remote-run.sh stop` sent the branch's stop marker and asked GitHub to cancel its runs, written by `remote-run.sh stop` alone and only on an existing record, whose `status` it sets to `failed` in the same write; it means the run was stopped outright by the user, not that it failed on its own.
- [ ] `remote-run.test.mjs`: build a fixture with `init` (the helper in `cli/test/helpers/fixture.mjs`), set `execution.target` to `github-actions`, and point `HARNESS_GH_CLI` at a stub that appends its argument vector to a file and prints canned JSON for `run list` and `repo view`. Assert: `dispatch feat_x --engine task` sends exactly `workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=task -f resume=none -f chain=0`; `--resume answer --answers-from <dir> --indexes "1 2"` sends one `answers` value that `jq` parses back to both files' exact bytes; a payload over the limit exits 2 and sends nothing; `execution.target` `local` exits 2 and sends nothing; `pause feat_x` sends `action=pause`; `warm` uses the stubbed default branch as `--ref`; `stop feat_x` sends exactly `workflow run harness-run.yml --ref feat_x -f action=stop -f branch=feat_x` **before** any cancel, then cancels exactly the stubbed in-progress run ids and flips an existing record to `failed`; `stop feat_x` with a stubbed run list holding **no** queued, waiting or in-progress run (the usage-paused, poller-waiting case) still sends that `action=stop` dispatch, cancels nothing and exits 0; a stub failing the marker dispatch exits 3 and sends no cancel; a stub exiting non-zero yields exit 3 naming its stderr. Open the suite with the rule it enforces.

**Verification:**

- `bash scripts/test.sh` exits 0, including `outer-loop-scripts.test.mjs`'s byte-for-byte comparison of the written `remote-run.sh` with its template and its written mode.
- The test suite's `stop` cases show the `action=stop` dispatch in the recorded vector whether or not a run was in progress.
- The script's `REPRO` block, run by hand against a throwaway fixture, reproduces every exit code in the map.
- `grep -n "harness-run.yml\|HARNESS_GH_CLI" cli/templates/scripts/remote-run.sh` shows each literal declared once as a named mirror of Task 2's constant.
- `grep -n "remote_stopped_at" cli/templates/scripts/autonomous-watcher.sh cli/templates/scripts/remote-run.sh` hits the watcher's field-set comment as well as the writer in `remote-run.sh`.

**Deviations from plan:**

- `stop` writes `remote_stopped_at` and `status` = `failed` with two `hr_registry_set` calls, because that primitive sets one key per write and a second writer would break the library's one-writer rule. The watcher's field-set comment therefore says "in the same pass", not "in the same write". The record changes only when the marker, the list and every cancel succeeded. After a partial stop the script exits 3 with the record untouched, so running `stop` again is the remedy.
- The `REMOTE_INPUT_PAYLOAD_MAX` check measures the whole inputs object as compact JSON, not just the `answers` value, because GitHub's limit applies to the inputs payload as a whole.
- `warm` sends `-f branch=<GitHub default branch>` next to `--ref`, so its `run-name` reads `harness warm <branch>`. Task 15 must accept `branch` on `action: warm`.
- `--repo <root>` is accepted by every verb, placed after the verb.
- Two targets added outside the list: `cli/test/init.test.mjs` → `OUTER_LOOP_SCRIPT_FILES` gains `remote-run.sh` (without it, the wrapper-family assertions count the new script as a wrapper), and `cli/test/outer-loop-scripts.test.mjs` gains the byte-for-byte and mode case that the Verification bullet names.
- The `answers` round trip is asserted with `jq -j '.["<n>"]'`, which prints raw with no trailing newline, so the file's exact bytes can be compared.
