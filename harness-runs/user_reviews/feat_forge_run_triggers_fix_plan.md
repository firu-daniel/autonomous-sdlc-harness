# User-Review Fix Plan: feat_forge_run_triggers

## Context

**Branch:** `feat_forge_run_triggers`
**Source user review:** `harness-runs/user_reviews/feat_forge_run_triggers_review.md`
**Summary:** The user's hands-on review flagged how the local commands reach a run started on GitHub. Four problems:

- `adopt` makes copies and records for every branch, and runs their bootstrap.
- `branch-status` cannot read an unadopted run.
- Pause, resume, answer and user-review go through a local copy and the watcher's relays instead of GitHub directly.
- `start` never removes its working copy.

All four observations were checked against the current working tree, and all four hold. None were invalid.

Where the review left a decision open, the finding settles it and says so:
- how a multi-file park's answers are collected: in one invocation (Finding 3);
- whether an existing record is updated after a direct dispatch: yes, by `remote-run.sh` (Finding 3);
- whether the watcher's relays stay: removed (Finding 3);
- whether a local record is still needed after observation 3: no, so the `adopt` verb is removed (Finding 1);
- whether `start`'s removal also applies on a maintainer's machine: yes (Finding 4).

---

## Phase 2 Readiness — Ordered Fix List

**This list is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as its fix lands. `[ ]` markers anywhere else, including the sub-step bullets inside the per-finding files, are informational only. The committer never touches them.

Each entry resolves to a self-contained `harness-runs/user_reviews/feat_forge_run_triggers_fix_plan/finding_<K>.md` via its `**Finding K**` reference. The order is lowest blast-radius first, except where a dependency decides:
- Finding 3 builds the GitHub read (`remote_state`, `fetch`) that Finding 2's no-record `status` reuses.
- Finding 3 also removes the adopt step from the four acting commands.
- Finding 1 removes the `adopt` verb only once nothing calls it.

All four edit `cli/templates/scripts/remote-run.sh`, so they run in this order.

1. [x] **Finding 4** — `remote-run.sh start` removes the working copy and local branch it created once the push lands, and on every failure exit after the cut. It never removes a copy or branch it did not create. The `start` header states the removal applies wherever `start` runs. _(layer: cli, general)_
2. [x] **Finding 3** — The four acting commands act on GitHub directly for a remote run:
   - `remote-run.sh` gains a shared remote-state derivation, a `fetch` read verb and a `review` verb, plus a record update after a user's chain-0 resume dispatch;
   - `create-worktree.sh` accepts `--existing --no-bootstrap`;
   - the watcher's relay passes are removed and remote records are skipped;
   - the four commands, `branch-status` step 6 and the documents are updated. _(layer: cli, plugin, general)_
3. [x] **Finding 2** — `remote-run.sh status <branch>` answers from GitHub alone when there is no local record, reading the newest bundle into a temporary directory and writing nothing. A `list` verb replaces `adopt --list` for `branch-status`'s digest. `branch-status` stays read-only and never syncs. _(layer: cli, plugin, general)_
4. [ ] **Finding 1** — Remove the `adopt` verb, its test, its header text and its field comments, now that no command needs a local record for a run started on GitHub. Restate the bootstrap disclosure in `docs/github-issue-trigger.md` `## 4.` as what remains: no local command runs a branch's code. Update `docs/watcher.md` and Gate 12 (xiii)(c). _(layer: cli, general)_

---

## Must Fix

### 1. A command for one branch adopts every GitHub-started run, creating working copies and running each branch's bootstrap on this machine
→ [finding_1.md](feat_forge_run_triggers_fix_plan/finding_1.md)

### 2. `/autonomous-sdlc-harness:branch-status` cannot show a run started on GitHub until it is adopted
→ [finding_2.md](feat_forge_run_triggers_fix_plan/finding_2.md)

### 3. Pause, resume, answer and user-review on a remote run need a local copy, an adopt, a sync and a running watcher, though GitHub accepts every one of them directly
→ [finding_3.md](feat_forge_run_triggers_fix_plan/finding_3.md)

### 4. `remote-run.sh start` leaves its working copy, and its local branch, behind on every run
→ [finding_4.md](feat_forge_run_triggers_fix_plan/finding_4.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK

None. Every observation was verified as valid against the current working tree:
- `verb_adopt` / `adopt_one` and the four commands' "**Runs started on GitHub are adopted first.**" step;
- the `status|sync)` gate's refusal;
- the commands' marker-file writes and the watcher's `relay_remote_pauses` / `relay_remote_answers` / `resume_paused_run` remote arms;
- `verb_start`'s `create-worktree.sh --no-bootstrap` call with no removal.

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/feat_forge_run_triggers_review.md`, so this fix plan is self-contained. **This section stays in the index.**

1. `adopt` adopts every GitHub-started run, not the branch the command acts on. `remote-run.sh adopt` takes every `harness run <branch>` run on GitHub that the registry does not hold, and `branch-answer`, `branch-pause`, `branch-resume` and `branch-user-review` each run it with no branch before they act. A command for one branch must never create working copies or records for other branches: nothing in these commands reads across branches. If a local record is still needed after item 3, scope it to the one branch the command names (for example `adopt <branch>`), and never run a branch's bootstrap (`setup-worktree.sh`, `commands.depInstall`, `commands.build`) for it. The copy holds markers, answers and synced state only and never builds or runs code, so `create-worktree.sh --no-bootstrap` is enough. Update the docs that describe the bootstrap disclosure added by the code review's Finding 2 (`docs/github-issue-trigger.md` `## 4.` and `## 5.`, `docs/remote-execution.md` "What each local command does for a remote run") so they state what remains.

2. `/autonomous-sdlc-harness:branch-status` for a run started on GitHub should read GitHub directly, with no local record, no local copy and no adopt. `remote-run.sh status` today refuses (exit 2) a branch whose local record does not carry `execution: github-actions`, and a run nobody adopted has no record, so it is listed as `not adopted` and nothing more. Let `status <branch>` answer from GitHub alone when there is no local record: the branch's newest runs with status and URL, and the run's state (status, pause reason, open questions) from its newest `harness-state` bundle downloaded to a temporary directory and removed afterwards, writing nothing under the state directory. Keep `branch-status` read-only and keep it never syncing.

3. Pause, resume, answer and user-review on a remote run should act on GitHub directly, with no local sync and no local watcher relay. GitHub already accepts all four: `harness-run.yml`'s `workflow_dispatch` takes `action: pause`, `resume: pause`, `resume: answer` with the `answers` JSON input, `park_loop_clear`, and `engine: user_review`, and `remote-run.sh` already has `pause` and `dispatch` to send them. Today the commands only write a file into the local copy (or the inbox), and the local watcher relays it on its next pass, so acting on a remote run needs the copy, an adopt, a sync and the watcher running. For a branch whose run executes on GitHub (a local record with `execution: github-actions`, or no local record and a `harness run <branch>` run on GitHub):
   - `branch-pause` sends `remote-run.sh pause <branch>` itself.
   - `branch-resume` sends the `resume: pause` dispatch itself, with `park_loop_clear` when the run is in `park_loop` and the user has cleared it.
   - `branch-answer` reads the open question files from the newest bundle (downloaded to a temporary directory, as in item 2) to show them, then sends `resume: answer` with the answers itself once every open question of the park has an answer. Keep the 65,535-character payload refusal and keep answers untrusted, verbatim task data. Settle how answers to a park with several questions are collected across invocations when no local copy holds the earlier ones.
   - `branch-user-review` computes the round from `origin/<branch>`'s `<state_dir>/user_reviews/` (same anchored pattern and exact branch equality), commits the round as `chore: add user review for <branch>` onto the branch tip and pushes it without bootstrapping anything, then dispatches `engine: user_review`. Keep the refusal for a branch with a run in flight.
   - Keep the job-side notifications naming both routes, and keep `remote-run.sh` the one producer of the dispatch inputs. These commands run in an interactive session; the autonomous guard's deny of `remote-run.sh` for unattended agents stays as it is.
   - A local record that exists keeps working: decide whether it is updated after the direct dispatch (for example by a `sync`), and remove the watcher's relay pass for remote records if nothing needs it any more.
   - Local runs (`execution` absent) keep the marker files and the watcher exactly as today.
   Update the per-command table in `docs/remote-execution.md`, `docs/github-issue-trigger.md` `## 5. Working the run`, the five plugin commands and `plugin/docs/AUTONOMOUS_FLOW.md` to match.

4. Each trigger run leaves its working copy behind. `remote-run.sh start` cuts the branch with `create-worktree.sh --no-bootstrap` into a sibling working copy of the job's checkout (`hr_worktree_dir`), commits and pushes the task prompt, and never removes it. On a GitHub-hosted runner the machine is discarded, but on a self-hosted runner (`HARNESS_RUNNER`) the work directory persists and these copies pile up, one per triggered issue, since `actions/checkout` cleans only its own path. Remove the copy (`git worktree remove` plus `git worktree prune`) once the push has landed, and also on every failure exit after the copy was created, so a failed start leaves nothing either. A copy is not needed after the push, so this does not wait for the branch to be merged the way `cleanup-merged-worktrees.sh` does. If `start` is also meant to be run from a maintainer's machine, decide whether the removal applies there too, and state the decision in the `start` paragraph of the `remote-run.sh` header.
