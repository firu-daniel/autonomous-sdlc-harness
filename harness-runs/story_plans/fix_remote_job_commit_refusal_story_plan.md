# Story: Remote jobs land their commits, and a ledger-less resume is never "ready for review"

## Context

Gate 12's sandbox series round 13 (2026-11-05, CLI 0.6.8, `firu-daniel/harness-gate12`) found two defects that together make every remote run land nothing and then report it finished, plus a third gap that hides the first. The measured facts are the task prompt's `## What was measured (2026-11-05, verbatim)`, and this branch invents none beyond them. The no-Bash defect on `ubuntu-26.04` is issue #261 (sandbox3b6) and is not this branch's work. Both defects here reproduce without a session running any Bash.

**Finding 1, the commit refusal.** `actions/checkout` v7.0.1 runs `git sparse-checkout disable`, which writes `core.sparseCheckout`, `core.sparseCheckoutCone` and `index.sparse`, each `false`, into `.git/config.worktree`. It then runs `git config --local --unset-all extensions.worktreeConfig`, which turns the extension off but leaves the file in place. The job's `Bootstrap the checkout` then runs `setup-worktree.sh`, which turns the extension back on and adds `core.hooksPath`. From then on `hr_worktree_config_check_var` (`cli/templates/scripts/lib/harness-run-lib.sh`), the single-key rule `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` all apply, refuses the checkout.

**Where the fix goes, and why.** The fix goes in `setup-worktree.sh`, through one new library function. Of the three options the prompt names, this is the only one that covers every path:
- **A workflow step between checkout and bootstrap** would cover only the jobs. The local paths — `create-worktree.sh` copies, the main checkout under self-adoption and an operator's repair run — never pass through a workflow.
- **A checkout input that writes no such keys** does not exist. The `run` job sets no `sparse-checkout` input, and the measured log still shows `git sparse-checkout disable`.
- **`setup-worktree.sh`** already owns this file and is the one writer that turns the extension on (its `NOTE:` on the switch being one-way and repository-global).

**It removes exactly the three keys `actions/checkout` writes, and never deletes the file.** A key is removed only when the file holds it once, at the literal value `false`. That is its provably inert shape: `false` is git's own default for all three, and with `core.sparseCheckout` not on, the other two are not consulted. So removing them changes nothing a user set on purpose (`harness-runs/lessons.md` → *Trust checks*, *"accept only its provably inert shape"*). Any other key, any other value, a duplicate or a value-less key is left exactly as it is, and the wrappers keep refusing it with today's sentence. That is goal 4, and `hr_worktree_config_check_var` is not edited. Deleting the file would destroy whatever else a user put there.

**What the fix covers:**
- **The job's checkout:** `setup-worktree.sh`'s no-argument mode.
- **A legacy linked-worktree copy:** `--target` worktree mode. This mode flips the main repository's switch, so it also cleans the main checkout's own `.git/config.worktree`.
- **The main checkout under self-adoption:** the no-argument mode.

**Clones are unaffected, and nothing changes for them.** A clone's `config.worktree` must already be an empty file with the extension off (`hr_clone_target_check_var`). `setup-worktree.sh --target <clone>` writes only the clone's `.git/config`, and the wrappers' clone arm skips the single-key check.

**The other template jobs need no change.** The other jobs that check out and later run a wrapper are `harness-run.yml`'s `collect` job, `harness-control.yml`'s `control`, `harness-trigger.yml`'s `trigger` and `harness-resume.yml`'s `poll`, and none of them runs `setup-worktree.sh` on its checkout. Their `remote-run.sh` verbs (`collect`, `control` → `review`, `trigger` → `start`) cut a copy with `create-worktree.sh --no-bootstrap` and aim `push-branch.sh` at that copy, never at the checkout. A worktree copy's own `config.worktree` is absent, and a clone's is judged by the clone arm. Nothing turns the extension back on in those jobs either, so the checkout's sparse keys stay unread. `poll` runs no wrapper at all. The fix lives where the extension is switched on, so every job that bootstraps gets it, and `scripts/sandbox-probe-runner.yml`'s bootstrap does too, which is the CS6 (runner) row.

**Finding 2, the ledger-less "completed".** `classify_run_exit` (`cli/templates/scripts/autonomous-watcher.sh`) today keeps `completed` for a zero exit whose ledger is absent or unreadable. The decision is **`paused` with `pause_reason` `unfinished`**, not `failed`, for any zero exit with an absent or unreadable ledger that follows one of these:
- a resume (`resume_kind` `answer` or `pause`, which the job's `resume answer`, `resume pause`, every automatic resume and every local resume set);
- a stall restart (`stall_restarts` above 0);
- an earlier park (a question already archived under `clarifications/<branch>/answered/`, read by `max_question_index`).

**Why `paused` / `unfinished` and not `failed`:**
- **It reuses the arm that exists.** The precedence of a held `user`, `usage` or `budget` pause applies unchanged.
- **The job's retry is already bounded.** `run_job`'s `unfinished)` arm calls `job_auto_resume`, at most `REMOTE_AUTO_RESUME_MAX` times (`harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded"*). It then notifies and breaks with the default decision, so the job prints `job: paused stop`.
- **The local watcher does the same in local mode.** It records `paused` and sends one `paused` notification naming `/autonomous-sdlc-harness:branch-resume`. That is the same fix in both execution modes (`harness-runs/lessons.md` → *"A recovery for an unattended run's failure covers every execution mode"*).
- **`failed` would mislabel the run.** It would also be auto-resumed, but it would report as a crash a run that only never reached its ledger.

**Which engine writes which ledger:**
- `task` and `user_review` write `<state_dir>/flow_progress/<branch>_progress.md`, created by planner and fix-plan Setup before their first dispatch.
- `docs` writes `<state_dir>/docs_catalog/<branch>_docs.md`, committed by the watcher before the launch.

A **first launch** with none of the three signals keeps today's `completed` plus its `classify:` log line, for a pre-Setup halt.

`/autonomous-sdlc-harness:branch-status` explains an `unfinished` record by its ledger's first `[ ]` entry. After this change an `unfinished` record can have no ledger, so Task 9 updates that one bullet in `plugin/commands/branch-status.md`.

**Finding 3, the green job.** `Push the branch` in `harness-run.yml`'s `run` job keeps `push-branch.sh` non-fatal (its header's **EVERY FAILURE PATH IS NON-FATAL (exit 0)**). The step itself now:
- prints one `::error::` annotation for each wrapper line carrying `refusing to push`, and for each line where the wrapper gave up a push;
- appends the same lines to `$GITHUB_STEP_SUMMARY`;
- still exits 0, so no `!cancelled()` step or conclusion-reading path changes.

An annotation is listed on the run page whatever the job's conclusion.

**Cross-cutting rules:**
- **The test-file re-cast is required, not optional.** Every test stub that stands in for an engine session and is resumed must now write a finished ledger wherever its case asserts `completed` (`harness-runs/lessons.md` → *"When a check moves to reading a field one producer writes…"*). Tasks 4 and 5 do this.
- **The self-adopted copies are byte-identical to the templates.** This repository's `scripts/` copies of the changed scripts follow the templates byte for byte (Task 7). This repository commits no rendered workflow, and `examples/` carries none of the changed files.
- **The `.claude/` conventions documents are not targets.** No task touches them.
- **Nothing loosens a trust check.** No `excludedCommands` entry is added, and no wrapper check is loosened.
- **Bash 3.2 floor.** Every shell change keeps to it.

**Top risks:**
1. **Flipping existing suites.** The reclassification flips existing suites whose resumed stubs exit 0 with no ledger and assert `completed`. Task 4 re-casts the job-mode suite. Task 5 re-casts the named local suites, including `run-copy-migration.test.mjs`'s two resumed legacy-worktree cases, and its sweep — a grep over every `cli/test/*.test.mjs` that uses the watcher fixture, each hit's `completed` assertions read — makes every further such file one of its targets. Each task runs the files it edits.
2. **Removing more than the three inert keys.** The clean could remove a key a user meant to keep. Task 1 limits it to the three keys at the literal `false`. Task 2 asserts that a `true` sparse key and a foreign key both survive and are still refused.
3. **The replay not reproducing on the test host's git.** Task 2 asserts the replay's precondition, naming `git --version` on failure, and carries a hand-planted case that does not depend on git's `sparse-checkout` behaviour.

The GitHub confirmation is not this branch's: it is owed to the next Gate 12 round, after the next release (Task 8 records it as owed).

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom.

**Who flips a marker.** Only the committing role flips a marker to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker, and never edits any other line of this section, in an index a run is iterating.

**Other `[ ]` markers are informational.** `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_remote_job_commit_refusal/task_<K>_plan.md`, where `K` is the task number the entry names. The entries are ordered bottom-up by ship sequence in the configured layer order (`cli`, `plugin`, then the catch-all `general`), so entry 7 is Task 9, and entries 8 and 9 are Tasks 7 and 8.

1. [x] **Task 1** — Drop `actions/checkout`'s three inert sparse keys from `config.worktree` in `setup-worktree.sh`, through a new library function _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Replay the checkout's two commands on a fixture and show `commit-on-branch.sh` and `push-branch.sh` accept the bootstrapped target _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Classify a resumed, stall-restarted or previously parked run's ledger-less zero exit as `paused` / `unfinished` _(layer: cli)_ _(points: 20)_
4. [ ] **Task 4** — Job-mode cases for the ledger-less resume, and the job-mode cases that resumed without a ledger re-cast _(layer: cli)_ _(points: 15)_
5. [ ] **Task 5** — Give the local watcher suites' resumed sessions a finished ledger where completion is the case's point _(layer: cli)_ _(points: 20)_
6. [ ] **Task 6** — Surface a refused or given-up push in `Push the branch` as an `::error::` annotation and a job-summary line _(layer: cli)_ _(points: 15)_
7. [ ] **Task 9** — Make `/autonomous-sdlc-harness:branch-status`'s `unfinished` bullet cover a ledger-less resume _(layer: plugin)_ _(points: 8)_
8. [ ] **Task 7** — Refresh the self-adopted `scripts/` copies of the library, `setup-worktree.sh` and the watcher from their templates _(layer: general)_ _(points: 10)_
9. [ ] **Task 8** — Record the cause and the fixes in `docs/sandbox-verification.md` §9 and §10, `docs/remote-execution.md`, `docs/watcher.md` and `ARCHITECTURE.md`, confirmation owed to the next Gate 12 round _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/remote-execution.md` and `docs/sandbox-verification.md` §9 and §10 record the cause (CS6 (runner) and FR3) with confirmation owed to the next Gate 12 round. **No measured result is invented.**"*. Also in scope is every durable corpus statement that this branch's behaviour changes falsifies: the absent-ledger rule, what `setup-worktree.sh` writes, and what `Push the branch` shows.

**Derivation entry 1 — the absent-ledger rule (command).** Re-run verbatim from the checkout root: `git grep -nE "no readable ledger|absent or unreadable|ledger is absent|absent ledger|exit code alone|ledger-less|before its ledger finished" -- '*.md' ':(exclude)harness-runs/**' ':(exclude)examples/**'`

**Derivation entry 2 — the two named check rows (command).** `git grep -nE "^\| (CS6 \(runner\)|FR3) \|" -- docs/sandbox-verification.md`

**Derivation entry 3 — the `Push the branch` step in prose (command).** `git grep -nE "Push the branch" -- '*.md' ':(exclude)harness-runs/**' ':(exclude)examples/**'`

**Derivation entry 4 — `docs/remote-execution.md`'s sections that state the job's recovery, push and unverified behaviours (command).** `git grep -nE "^### API errors$|^### When GitHub fails or lags$|^## 6\. What is not verified here$" -- docs/remote-execution.md`

**Derivation entry 5 — the prose row describing `setup-worktree.sh` (command).** `git grep -nE "^\| .setup-worktree\.sh. \|" -- docs/watcher.md`

**Derivation entry 6 — the lessons ledger's rules (procedure).**
- **First step, runnable:** `grep -nE "^## |^- " harness-runs/lessons.md`.
- **Artifact:** `harness-runs/lessons.md`.
- **Traversal:** its `## ` topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it names a kind of surface this branch changes. Those kinds are a trust check meeting a file an outside actor creates, a check moving to read a field a producer writes, a recovery for an unattended failure, and an automatic retry in an unattended path.

**Closure invariant:** every site each derivation entry reaches appears as a row below. Re-running entries 1–5 prints no hit outside these rows, and re-walking entry 6 reaches no rule outside them.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ARCHITECTURE.md` → the `classify_run_exit` inventory row ("an absent or unreadable ledger keeps `completed`") | — | entry 1, `absent or unreadable ledger` | `change` | Task 8 |
| 2 | `ARCHITECTURE.md` → the **[shipped]** negative-result paragraph ("because an absent ledger keeps `completed`") | — | entry 1, `absent ledger` | `change` | Task 8 |
| 3 | `docs/watcher.md` → §1 step 7, "**The session's exit is classified**" ("a ledger that is absent or unreadable … keeps `completed`") | — | entry 1, `no readable ledger` | `change` | Task 8 |
| 4 | `plugin/instructions/run_mode_instructions.md` → "A ledger-less flow is **not** ungoverned" | — | entry 1, `ledger-less` | `no-change` | It concerns run-mode inheritance by a flow that keeps no ledger, not exit classification, and nothing this branch changes falsifies it |
| 5 | `docs/sandbox-verification.md` → §9 row `CS6 (runner)` | — | entry 2 | `change` | Task 8 |
| 6 | `docs/sandbox-verification.md` → §10 row `FR3` | — | entry 2, entry 3 | `change` | Task 8 |
| 7 | `docs/cli.md` → "in the workflow's `Sweep the sandbox placeholders` step (`autonomous-watcher.sh job-sweep`), before `Push the branch`" | — | entry 3 | `no-change` | It states the sweep's order relative to the push step, which this branch keeps |
| 8 | `docs/development.md` → Gate 12 round 8 finding, "pushed back by the cancelled job's `Push the branch` step" | — | entry 3 | `no-change` | It is a dated record of round 8's finding, and editing it would falsify the record |
| 9 | `docs/development.md` → the deleted-branch leg, "Passes when the issue carries a `stopped` comment …" | — | entry 3 | `no-change` | It is a leg's pass condition about a deleted branch, and a refusal annotation does not change it |
| 10 | `docs/development.md` → the leg reading "The first answers `HTTP 404` (`Branch not found`)" | — | entry 3 | `no-change` | It tells the round where to read the push step's log, and that log still carries the same lines |
| 11 | `docs/development.md` → observation (xvi)'s `**FR3**` bullet | — | entry 3 | `no-change` | It is the round's expectation and reading source, which are unchanged. The measured result and the cause are recorded in the §10 FR3 row (site 6), which owns results |
| 12 | `docs/development.md` → observation (xvi)'s `**FR4**` bullet | — | entry 3 | `no-change` | It names the push step only as a log beside FR4's source, and is unaffected |
| 13 | `docs/remote-execution.md` → §11, "**The post-session steps on a job that passed.**" | — | entry 3 | `no-change` | It states what runs unsandboxed after the session. The annotation adds no unsandboxed input |
| 14 | `docs/watcher.md` → the bubblewrap paragraph, "**On a bubblewrap host (Linux, WSL2),** three more things run" | — | entry 3 | `no-change` | It concerns the placeholder sweep before the push step, which is unchanged |
| 15 | `docs/watcher.md` → "**How it reaches origin.**" | — | entry 3 | `no-change` | It concerns the local watcher's push, and no annotation runs locally |
| 16 | `docs/remote-execution.md` → `### API errors` | — | entry 4; entry 1, `before its ledger finished` | `change` | Task 8: the ledger-less resume joins the `unfinished` shape |
| 17 | `docs/remote-execution.md` → `### When GitHub fails or lags` | — | entry 4 | `change` | Task 8: a refused or given-up push is annotated |
| 18 | `docs/remote-execution.md` → `## 6. What is not verified here` | — | entry 4 | `change` | Task 8: one row for the checkout's sparse keys, measured in round 13, the fix's effect owed |
| 19 | `docs/watcher.md` → the `setup-worktree.sh` row of the scripts table | — | entry 5 | `change` | Task 8: names the inert-key drop |
| 20 | `harness-runs/lessons.md` → *Trust checks*, "When a trust check meets a file an actor outside your control creates on every run, accept only its provably inert shape …" | — | entry 6, a trust check meeting an outside actor's file | `no-change` | Task 1 applies it. The ledger is append-only and written only by the fix-plan writer |
| 21 | `harness-runs/lessons.md` → *Evidence and measurement*, "When a check moves to reading a field one producer writes …" | — | entry 6, a check moving to read a producer's field | `no-change` | Tasks 4 and 5 apply it. The ledger is append-only |
| 22 | `harness-runs/lessons.md` → *Unattended control loops*, "A recovery for an unattended run's failure covers every execution mode …" | — | entry 6, an unattended recovery | `no-change` | Tasks 1 and 3 apply it in both modes. The ledger is append-only |
| 23 | `harness-runs/lessons.md` → *Unattended control loops*, "Every automatic retry in an unattended path is bounded …" | — | entry 6, an automatic retry | `no-change` | Task 3 routes through the bounded `job_auto_resume`. The ledger is append-only |
| 24 | `docs/watcher.md` → terminal-states table, `completed` row ("— or its ledger is absent or unreadable (step 7) —") | — | entry 1, `absent or unreadable` | `change` | Task 8: Task 3 falsifies it. An absent or unreadable ledger keeps `completed` only on a first launch |
| 25 | `docs/watcher.md` → terminal-states table, `paused` row ("or its session exited 0 before its ledger finished (`pause_reason` `unfinished`, §4)") | — | entry 1, `before its ledger finished` | `change` | Task 8: the row lists the ways a run becomes `paused`, and Task 3 adds a second way to reach `unfinished`, a ledger-less zero exit after a resume, a stall restart or an earlier park |
| 26 | `docs/watcher.md` → §4, the paragraph headed **"A zero exit over an unfinished ledger is a pause, not a completion."** ("The ledger check in §1 step 7 is the backstop …") | — | entry 1, `before its ledger finished` | `no-change` | Its subject is a ledger that exists and is unfinished, and every statement about that case stays true. The ledger-less case reaches the same `unfinished` arm with the same `paused (unfinished)` log line, and it is stated in §1 step 7 and the `paused` row (sites 3 and 25) |
| 27 | `plugin/commands/branch-status.md` → step 6, the `paused` local-run bullet "`pause_reason` `unfinished`: say the session ended (exit 0) before its ledger finished … and that the resume continues at its first `[ ]` entry" | — | entry 1, `before its ledger finished` | `change` | Task 9: after Task 3 an `unfinished` record can have no ledger, so there is no first `[ ]` entry to name |
| 28 | `docs/development.md` → the gates paragraph, "An absent or unreadable previous record runs the round in full" | — | entry 1, `absent or unreadable` | `no-change` | It concerns `run-gates.sh`'s previous-round record, not a run's ledger, and this branch does not change it |
