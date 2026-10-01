### 2. `/autonomous-sdlc-harness:branch-status` cannot show a run started on GitHub until it is adopted

**Files:**
- `cli/templates/scripts/remote-run.sh`: the gate arm `status|sync)` ("refused, nothing written: the local record of '$branch' does not carry execution: github-actions"); `verb_status`; the header's exit-map line for 2 ("the branch's local record does not carry `execution: github-actions` (status, sync)") and its `WHAT IT NEVER DOES` paragraph
- `plugin/commands/branch-status.md`: the `<scripts_dir>` row of `## Resolved values`; step 2's "**Runs started on GitHub, not yet adopted.**"; step 3's "**Remote record**"; step 4; step 6's "For a run listed as **not yet adopted** in step 2"; the closing read-only paragraph
- `docs/remote-execution.md` → `## 1.`, the table row `` `/autonomous-sdlc-harness:branch-status` ``
- `cli/test/remote-run.test.mjs`

**Depends on:** Finding 3's `remote_state` derivation and `fetch`'s open-question listing in `remote-run.sh`.

**Problem.** Verified in the current tree. The `status|sync)` gate in `remote-run.sh` exits 2 ("refused, nothing written") whenever the registry is absent or the branch's record does not carry `execution: github-actions`. A run nobody adopted has no record, so `status <branch>` refuses it. `branch-status` covers that gap only with `remote-run.sh adopt --list` (step 2), which prints `not adopted: <branch> <url>` and nothing about the run's state. The user cannot see a GitHub-started run's status, pause reason or open questions without letting a command adopt it, and adopting creates a local copy and runs that branch's bootstrap (observation 1).

**Fix.**

- [ ] **`status <branch>` answers from GitHub alone when there is no local record.** In the gate, split `status` from `sync`:
  - `sync` keeps today's refusal.
  - For `status`: when the registry file exists (`-f`) and holds a record for the branch, keep today's rule. A record carrying `execution: github-actions` gets today's output; a record without it is refused, exit 2.
  - When there is no record (no registry file, or no `branch` field for the branch), apply the sending verbs' `execution.target` gate instead: not `github-actions` → exit 2 with today's "execution.target is '…'" message, nothing sent. Then take the GitHub-only path below.
- [ ] **The GitHub-only path in `verb_status`.**
  1. The runs listing and its print are unchanged (`list_runs`, `titled_runs "harness run $branch" "harness pause $branch"`, the first `STATUS_RUNS_SHOWN`).
  2. Print `remote-run.sh: no local record; state from GitHub (newest run):` instead of the "local record (last synced)" block.
  3. Make a temporary directory (`mktemp -d`) and register a `trap 'rm -rf "$tmp"' EXIT`.
  4. Run Finding 3's `remote_state` derivation with the bundle downloaded into that directory, never into `<state_dir>/autonomous_logs/remote_download/`.
  5. Print `state`, `pause_reason`, `detail`, `engine` and the run's URL. For each open question (Finding 3's open-question rule: top-level `question_<n>.md` with no `answer_<n>.md` under `clarifications/<branch>/`), print one line naming `question_<n>.md` and each `## Q<k> — …` heading line in it. Print `expired_line` when the bundle expired.
  6. With no `harness run <branch>` run listed, print `remote-run.sh: no local record, and no run titled 'harness run <branch>' on GitHub` and exit 0.
  7. Skip the "finished after the last sync" comparison on this path: there is no sync to compare against.

  Write nothing under the state directory and no registry. `hr_registry_get` creates an absent registry, so test `-f` before any read, as `adopt` does today.
- [ ] **New read verb `list [--repo <root>]`** for `branch-status`'s no-argument digest, replacing `adopt --list`.
  - It is gated by `execution.target` (2 when not `github-actions`).
  - It does one `list_all_runs` listing, keeps each branch's newest `harness run <branch>` run, and drops a branch that has a local record, one `hr_branch_is_protected` does not answer 1 for, and one that is not a live head in one `git ls-remote --heads origin`. These are the filters `verb_adopt` applies; move them into one function both call until Finding 1 deletes `adopt`.
  - It prints `remote-run.sh: on GitHub, no local record: <branch> <url>` per branch, or `remote-run.sh: no run on GitHub without a local record`.
  - It writes nothing. Exit 0 printed, 1 usage, 2 refused, 3 the listing or `ls-remote` failed.
  - It reads only titles and refs, never a bundle, so it stays one listing however many branches there are.
- [ ] **Header.** Rewrite the exit-map line for 2 so `status` reads: "a local record that does not carry `execution: github-actions`; or no record and `execution.target` not `github-actions`". Add `list` to the verb list and the exit map. In `WHAT IT NEVER DOES`, state that `status` and `list` write nothing: `status` uses a temporary directory it removes on exit.
- [ ] **`plugin/commands/branch-status.md`.**
  - Step 2: replace the "Runs started on GitHub, not yet adopted" bullet. With no argument, run `bash <scripts_dir>/remote-run.sh list` once and print a short *Started on GitHub, no local record* section, one line per branch and URL (exit 2: say nothing; 1 or 3: report its message). With a branch argument the registry does not hold, run `bash <scripts_dir>/remote-run.sh status <branch>` once instead (step 3's no-record arm).
  - Step 3: add a **No local record** arm. Summarise `status`'s output: the newest runs with status and URL, then the run's state, pause reason and open questions with their `## Q<k>` headings. Report exit 2 as "no run of that name is known locally or on GitHub" when the gate refused for remote execution being off. Report 1 and 3 with their message.
  - Step 4: for a no-record run there is no local log. Say the run's log is on its run page and in its `harness-state` artifact's `run.log`.
  - Step 6: replace "For a run listed as **not yet adopted** in step 2, any of … adopts it first and then acts on it" with: for a run with no local record, the same commands act on it on GitHub when given its `<branch>:` prefix (Finding 3).
  - `## Resolved values` and the closing paragraph: name `list` and `status` as the only `remote-run.sh` verbs it invokes, both of which write nothing. Remove every `adopt` mention. Keep "never `sync`": the command stays read-only and never syncs.
- [ ] **`docs/remote-execution.md`**, the `branch-status` table row: replace the `adopt --list` sentence with the `list` digest and the no-record `status`, which reads the newest bundle into a temporary directory and writes nothing.
- [ ] **Tests** in `cli/test/remote-run.test.mjs`:
  - `status feat_x` with no registry and `execution.target: github-actions`, against a gh stub listing a completed `harness run feat_x` run whose `harness-state` bundle is `parked` with `question_1.md`. Exit 0; the output names `parked` and `question_1.md` and its `## Q1` heading. Assert that the fixture's state directory is byte-identical before and after (no registry, no `remote_download`) and that no temporary directory the run made is left.
  - The same with `execution.target: local`: exit 2, no gh call.
  - With no runs: exit 0 and the "no run titled" line.
  - `list` prints only the unrecorded, live, unprotected branch, and creates no registry. This moves the current `adopt --list` case in `cli/test/remote-adopt.test.mjs` here.
  - The existing `status` cases for a remote record stay unchanged.
