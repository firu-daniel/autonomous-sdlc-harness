# Story: Fix Gate 12 round 9's run-control findings and record the round

## Context

Gate 12 round 9 (2026-10-06, CLI 0.6.3, `firu-daniel/harness-gate12`) ran observations (xiv), run control from GitHub, and (xv), the run-actor allow-list. It found four issues: two Medium defects (1 and 3), one Low defect (2) and one Low observation whose cause is unknown (4). This branch fixes 1 to 3, documents 4 as an unverified GitHub behaviour with a check for the next round, adds the new pass conditions to the Gate 12 procedure, and copies the round's record into `docs/development.md`.

The work is cut into nine single-layer tasks: four in `cli`, then five in `general`, the catch-all, which ships last because it documents what the `cli` tasks built. No `plugin` file needs a change. Every `plugin` passage that states when `push-branch.sh` pushes is a `no-change` row of the `## Scope register` (rows 82 to 88), each with its reason. For example, `plugin/docs/AUTONOMOUS_FLOW.md`'s *What the flow does push* paragraph says a run pushes its own branch after each commit and that a push that is refused or fails is reported, never fatal. A push that is skipped because origin deleted the branch is reported the same way, so the paragraph stays true.

Tasks 2, 3 and 4 all edit `cli/templates/scripts/remote-run.sh`'s `forge_report` and its header. They are chained by `**Depends on:**` (2, then 3, then 4), and each per-task file names the code branch and the header sentences it owns.

**Finding 1 (Medium): a deleted branch is pushed back by the cancelled job.** Task 1. The `Push the branch` step of `harness-run.yml` runs under `always()`, so it runs after the deletion's stop cancels the job, and `push-branch.sh` re-created the branch. The fix goes into `push-branch.sh` itself, not into the workflow step, because the run's own commit points (the `committer`, the orchestrators) push through the same script while the cancel is still on its way. The rule: **a branch this checkout tracks on its remote is never pushed when that remote no longer lists it.** "Tracks" means `branch.<b>.merge` is configured or `refs/remotes/origin/<b>` resolves, which a job's checkout of the branch always satisfies. A new branch has neither, so `start` and a first push are unchanged. The script still exits 0 and still never forces. This takes the task prompt's general form, an `ls-remote` check. Its other suggestion, `--force-with-lease`, is declined: `push-branch.sh`'s rule of record forbids every force flag. The knock-on that round 9 saw, a second `stopped` comment on round 8's closed issue, came from the re-created branch and needs no fix of its own.

**Finding 3 (Medium): a deletion leaves the run's open pull request `running`.** Tasks 2 and 3.
- **Every `stopped` report marks the progress comment `stopped`** (Task 2). The progress comment on each pull request that the report labels has its `in progress` line rewritten to `stopped`. This happens on every route that stops a run, not only a deletion: after a plain `stop` or a close, the comment would otherwise read `in progress` just the same. A later resume re-renders the comment from the ledger, as it does today.
- **The deletion's stop reports on the run's pull request too** (Task 3). `stop --branch-gone` lists the branch's pull requests in every state and reports on each one that comes from this repository, is not merged, and still carries `sdlc-harness: running`, `parked` or `paused`. Each such pull request gets the `stopped` comment and the `sdlc-harness: stopped` label, and Task 2 rewrites its progress comment. The issue keeps its comment and label as today. Declined: the suggested alternative of letting the `pull_request` close job label its own pull request. That would have two jobs reporting one stop, with no ordering between them. The close job therefore stays quiet, and its log line says the deletion's job reports.

**Finding 2 (Low): a pause that a park overtakes gets no `paused` comment.** Task 4. When the job drops `PAUSE` for a `harness pause` run, the registry records `pause_reason: user`, and that value is still set when the run exits parked (`autonomous-watcher.sh` clears it only at the job's end). `forge_report` already reads `pause_reason`. On `parked` and `park_loop`, when it reads `user`, it appends one fixed line to the park comment, saying that the pause is folded into the park. The line names no login, because the job only sees a `harness pause` run, and that run's actor is the bot. `control`'s `Pause requested … and a paused comment follows.` reply is unchanged. It is right in the case where the pause is honoured, and the park comment covers the case where the park comes first.

**Finding 4 (Low, observation): `harness-resume.yml` never ticked on its schedule.** Tasks 6 and 7, documentation only. GitHub reused round 8's workflow record (`deleted`, then `active`), and no scheduled run followed in about 2.5 hours. The cause is unknown and may be GitHub's. Task 6 adds the behaviour to `docs/remote-execution.md` → `## 6. What is not verified here`, together with the hand dispatch that ticks the poller. Task 7 adds the task prompt's "To check next round" steps to (xiv)'s setup.

**The record** (Tasks 5 to 9). Task 5 updates `docs/github-run-control.md`, Task 6 updates `docs/remote-execution.md`, Task 7 adds the new pass conditions to Gate 12 legs (f) and (h) and the poller check to the setup, and Task 8 copies round 9's record byte for byte. Task 9 updates `docs/outer-loop-verification.md`. Its drift block still lists five scripts as having comment-only diffs. The block's own grade shows executable change in three of them: `push-branch.sh` (round 8's retry, and Task 1's check), `cleanup-merged-worktrees.sh` and `autonomous-notify.sh`. Task 9 re-runs that grade over all five and derives both lists and both counts from its output. Its `### 1.2` table gets a row for the new outcome, marked as a unit measurement rather than a §0 row.

Top risks: The likeliest regression is Task 1's new skip refusing a push it should make. One case is a first push. Another is a local branch that reuses the name of one deleted on origin, whose stale remote-tracking ref was never pruned. Task 1 runs the check only when the branch tracks a remote branch, prints a line that names the hand push that publishes it, and its suite covers a new branch and a still-present remote as positive controls. The second risk is Task 3 labelling an old pull request of the same branch that an earlier stop or merge already settled, as round 8's #13 and round 9's #18 were. Task 3 acts only on unmerged same-repository pull requests that still carry an unfinished state label, and its verification includes one that already reads `sdlc-harness: stopped`. The third risk is churn in the `gh`-stub suites: Tasks 2 and 3 add calls (a comment listing, a pull-request listing) to the `stopped` path, which existing suites assert as exact sequences. Each of those tasks greps `cli/test` for those assertions and updates them itself, rather than leaving them for Phase G.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_forge_run_control_gate12_round9_findings/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence in the configured layer order: `cli` first, with the catch-all `general` layer last. No task is in `plugin`.

1. [x] **Task 1** — `push-branch.sh` never pushes back a tracked branch its remote deleted _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — A `stopped` report rewrites the progress comment's `in progress` line to `stopped` _(layer: cli)_ _(points: 18)_
3. [x] **Task 3** — `stop --branch-gone` reports on the run's unmerged pull requests that still read unfinished _(layer: cli)_ _(points: 18)_
4. [x] **Task 4** — A park that overtakes a requested pause says the pause is folded into it _(layer: cli)_ _(points: 12)_
5. [x] **Task 5** — `docs/github-run-control.md`: the deleted branch's pull request, the stopped progress comment, the folded pause _(layer: general)_ _(points: 13)_
6. [ ] **Task 6** — `docs/remote-execution.md`: a deleted branch stays deleted, and the poller's unverified schedule _(layer: general)_ _(points: 12)_
7. [ ] **Task 7** — `docs/development.md` Gate 12 procedure: legs (f) and (h) pass conditions, and the poller schedule check _(layer: general)_ _(points: 10)_
8. [ ] **Task 8** — `docs/development.md`: the Gate 12 round 9 record, copied as written _(layer: general)_ _(points: 8)_
9. [ ] **Task 9** — `docs/outer-loop-verification.md`: the drift block's comment-only scripts re-graded, and `### 1.2`'s deleted-on-origin row _(layer: general)_ _(points: 10)_

## Scope register

This plan's targets include durable corpus text: four documents under `docs/` (`github-run-control.md`, `remote-execution.md`, `development.md`, `outer-loop-verification.md`), plus the header and function comments of the adopter-facing templates `cli/templates/scripts/push-branch.sh`, `remote-run.sh`, `autonomous-watcher.sh` and `cli/templates/github/workflows/harness-run.yml`. The register also lists, as `no-change` rows, every site the entries below reach outside those targets. That includes every `docs`, `plugin` and template statement of when `push-branch.sh` pushes (D11). A message literal in a template is listed when a derivation command reaches it, unless D11's exclusions name it. The tests are source, and none of them owes a row.

**Scope predicates**, quoted verbatim from the task prompt:
- *"Expected: a run stopped by a branch deletion does not push the branch."*
- *"Add "the branch stays deleted" to (h)'s pass condition."*
- *"Expected: either the reply's promise holds (the pause is honoured after the park is answered, or the park comment says the pending pause was folded into it), or the job notes on the PR that the pause was overtaken by a park."*
- *"Expected: after a deletion, every open pull request of the run reads `sdlc-harness: stopped` (and gets the `stopped` line, or at least the label), and its progress comment is not left reading "in progress"."*
- *"To check next round: after adoption, watch for the first `schedule` run within ~1 h; if none, record the record id and state, and whether a trivial edit/push of `harness-resume.yml` restores ticks."*
- *"The text below is round 9's record for `docs/development.md`. It goes after round 8's paragraphs, in the same form."*

**Derivation entry D1 — the deleted branch's stop (command).** Re-run verbatim from the checkout root:

```
git grep -nE "branch was deleted|branch-gone|deletion's own job|whose head is deleted|deleting the branch|deleted its branch" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D2 — the progress comment's states (command).**

```
git grep -nE "done, in progress or not started|in progress\` \(the first pending|withheld for a stopped branch|the only comment this file ever edits" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D3 — the end-of-job push (command).**

```
git grep -nE "Push the branch|stays deleted|Under \`always\(\)\`: \`push-branch\.sh\`|fast-forward push of already-committed" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D4 — the pause reply's promise (command).**

```
git grep -nE "paused comment follows" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D5 — the poller's schedule (command).**

```
git grep -nE "\`schedule\` trigger is a recurring|scheduled tick|ticked on its schedule" -- docs cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D6 — template header paragraphs (procedure).**
- **Artifact:** the leading `#` comment blocks of `cli/templates/scripts/push-branch.sh`, `cli/templates/scripts/remote-run.sh` and `cli/templates/github/workflows/harness-run.yml`; in `cli/templates/scripts/autonomous-watcher.sh`, the registry field list's `pause_reason` entry and the `JOB MODE` block's `TWO PASSES ONLY A JOB RUNS` bullet; and in `remote-run.sh`, the function comments of `forge_report`, `forge_progress` and `control_close`.
- **Traversal:** each paragraph that opens with an upper-case or backticked lead, in file order. In `push-branch.sh`, each header paragraph and its `REPRO` block.
- **Decision rule:** a paragraph is reached when it states any of these:
  - (a) when, or whether, `push-branch.sh` pushes;
  - (b) what the end-of-job push does;
  - (c) where a `stopped` report posts or labels, or what a deleted branch's stop reads;
  - (d) what the progress comment says, or which comment the file edits;
  - (e) what a `parked` or `park_loop` comment carries;
  - (f) what `pause_reason` holds when a run leaves `running`.

**Derivation entry D7 — adopter documents by section (procedure).**
- **Artifact:** `docs/github-run-control.md`, `docs/remote-execution.md`, and `docs/development.md` → Gate 12.
- **Traversal:**
  - in `github-run-control.md`: `## 1.`'s `pause` reply block and the paragraph under it; `## 5.`'s table, row by row, and every paragraph of `## 5.`; and `## 8.`'s table;
  - in `remote-execution.md`: `## 1.`'s numbered lifecycle; `## 3.` → `### The kill switch and stopping` and `### Resuming without the local watcher`; and `## 6.`'s table;
  - in `development.md`: Gate 12's round 8 closing paragraphs, (xiv)'s setup, legs (f) and (h), and (h)'s **What it settles**.
- **Decision rule:** a row or paragraph is reached when it states D6's (a) to (e), the poller's schedule, or a pass condition of leg (f)'s pause or leg (h)'s deletion.

**Derivation entry D8 — sites the task prompt names (procedure).**
- **Artifact:** the task prompt, `harness-runs/task_prompts/fix_forge_run_control_gate12_round9_findings_task_prompt.md`.
- **Traversal:** each finding's **Cause**, **Design text**, **Suggested fix** and **To check next round** lines, then section 5's blockquote.
- **Decision rule:** a file-plus-line, a file-plus-heading pair or a named leg is a site.

**Derivation entry D9 — conventions documents (procedure).**
- **First step, runnable:** `grep -nE "push-branch|deleted|progress comment|park|pause|schedule" .claude/context/conventions.md .claude/context/cli.md .claude/context/plugin.md`
- **Artifact:** the three `layers[].conventions` documents.
- **Traversal:** each `##` section in file order.
- **Decision rule:** a sentence is reached when it states D6's (a) to (f) or the poller's schedule. It reached none: the grep's three hits concern the commit-subject probe, the `forge` key's readers and the sample-fixture pointers.

**Derivation entry D10 — standing-artifact rows (procedure).**
- **First step, runnable:** `grep -nE "^## |^- " harness-runs/lessons.md`
- **Artifact:** that standing ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it names a write scoped to a branch, remote state, a retry, or a person's command or other input.

**Derivation entry D11 — every statement of when `push-branch.sh` pushes (command, then procedure).**
- **First step, runnable:** re-run verbatim from the checkout root:

  ```
  git grep -n "push-branch" -- docs plugin cli/templates README.md ARCHITECTURE.md
  ```

- **Artifact:** that command's output.
- **Traversal:** each hit in output order, read in its whole sentence, table row or comment paragraph.
- **Decision rule:** a hit is a site when its sentence states any of these:
  - when or whether `push-branch.sh` pushes, including what it never does, what it refuses, and whether it fails its caller (D6 (a));
  - what the end-of-job push does (D6 (b)).

  These hits are **not** sites:
  - a bare invocation line, such as `bash <scripts_dir>/push-branch.sh "$REPO_ROOT"` or the `run:` line of `harness-run.yml`;
  - a variable assignment or a `Usage:` line;
  - a placeholder-table row saying which scripts a file names;
  - a line `push-branch.sh` itself prints, or one a caller logs about it (`autonomous-watcher.sh`'s `WARNING:` and `did not bring origin/…` lines);
  - a listing of the agent-invocable wrappers (`plugin/docs/AUTONOMOUS_FLOW.md`'s *Git wrappers* row);
  - a permission-surface row of `docs/outer-loop-verification.md` that names the script only as a command an agent may run.

  A site already listed by D3, D6 or D7 keeps its row, and D11 is added to that row's evidence.

**Closure invariant:** every site that any entry above reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/scripts/push-branch.sh` header → `WHAT IT NEVER DOES.` ("It performs only a fast-forward push of already-committed work") | — | D3, D6 (a) | `change` | Task 1 (adds that it never pushes back a tracked branch its remote deleted) |
| 2 | `push-branch.sh` header → a new `A BRANCH ITS REMOTE DELETED STAYS DELETED.` paragraph, after `EVERY FAILURE PATH IS NON-FATAL` | — | D6 (a) | `change` | Task 1 |
| 3 | `push-branch.sh` header → `REPRO` | — | D6 (a), D11 | `change` | Task 1 (adds the *deleted on origin* case) |
| 4 | `push-branch.sh` → the comment above the push block ("Push the branch. Use the existing upstream when one is configured") | — | D3, D6 (a) | `change` | Task 1 (names the check that runs before it) |
| 5 | `push-branch.sh` header → `WHAT IT IS FOR`, `WHY A WRAPPER EXISTS AT ALL`, `EVERY FAILURE PATH IS NON-FATAL`, `DEFENCE IN DEPTH` | — | D6 (traversed; none states when a tracked branch is pushed) | `no-change` | Still true: the skip exits 0 and is visible, and is stated in row 2's paragraph |
| 6 | `cli/templates/github/workflows/harness-run.yml` → the `Push the branch` step | — | D3, D6 (b), D8 (finding 1 **Cause**) | `change` | Task 1 (a comment above the step says a branch deleted on origin is not pushed back; `always()` and the `run:` line are unchanged) |
| 7 | `harness-run.yml` header → `THE COLLECT JOB.`, `THE RUN-ACTOR GATE.`, `WHAT IT READS.`, `THE PERMISSIONS.` | — | D6 (traversed; none states (b)) | `no-change` | None states what the end-of-job push does |
| 8 | `cli/templates/scripts/remote-run.sh` → `verb_trigger`'s refusal literal "Push the branch to this repository and open the pull request from there." | — | D3 | `no-change` | About a fork's pull request, not the end-of-job push |
| 9 | `plugin/hooks/autonomous-protected-branch-guard.sh` → the deny literal "Push the branch you mean by name." | — | D3 | `no-change` | About naming a push target, not this branch's fix |
| 10 | `docs/remote-execution.md` → `## 1.` → step 6, **The end of the job.** ("Under `always()`: `push-branch.sh`, then …") | — | D3, D7, D11 | `change` | Task 6 (`push-branch.sh` pushes nothing back for a branch deleted on origin) |
| 11 | `docs/remote-execution.md` → `## 3.` → `### The kill switch and stopping` → **Closing or deleting stops a run too.** | — | D7 | `change` | Task 6 (the deleted branch stays deleted; the deletion's stop reports on the run's pull request) |
| 12 | `docs/remote-execution.md` → `### The kill switch and stopping` → **Stopping one run** and **Pausing one run** | — | D7 (traversed; neither states D6 (a) to (e)) | `no-change` | Neither names the push, a pull request's report, or a park |
| 13 | `remote-run.sh` header → `` `report` TURNS A LIFECYCLE EVENT INTO ONE COMMENT AND ONE STATE LABEL `` → the target-rule sentence ("`stop`'s `--pr` and `--branch-gone` change this for its own report: its paragraph") | — | D1, D6 (c) | `no-change` | Still true: `--branch-gone`'s own paragraph (row 15) states the change |
| 14 | `remote-run.sh` header → the same paragraph's sentence "A plain `stopped` on a pull request says its draft stays open and closing it discards the run." | — | D6 (c)(d) | `change` | Task 2 (adds: a `stopped` report rewrites each labelled pull request's progress comment) |
| 15 | `remote-run.sh` header → the `stop` paragraph → "`--branch-gone` is for a branch GitHub no longer has: … (4) reads the issue from the task prompt …" | — | D1, D6 (c) | `change` | Task 3 (adds: (4) also reports on each unmerged same-repository pull request of the branch that still carries an unfinished state label) |
| 16 | `remote-run.sh` header → usage line `[--branch-gone] [--repo <root>]` and the `--branch-gone` usage echo and argument parser | — | D1 | `no-change` | The flag and its arguments are unchanged |
| 17 | `remote-run.sh` header → `THE CLOSE.` → gate 6 ("on `pull_request`, the head branch absent on origin … the `delete` event's job stops the run") | — | D1, D6 (c) | `change` | Task 3 (that job stops the run and reports it on that pull request) |
| 18 | `remote-run.sh` header → `THE CLOSE.` → the note list ("`… deleted the branch `<b>`.` (with `--branch-gone`)") | — | D1 | `no-change` | The note and the flag are unchanged |
| 19 | `remote-run.sh` → `control_close`'s comment "GitHub closes a pull request whose head is deleted; the `delete` event's own job stops that run from the default branch, so this one stays quiet." and its `control_close_ignore` literal "… the deletion's own job stops the run" | — | D1 | `change` | Task 3 (the comment adds that the deletion's job reports on this pull request; the ignore line's literal reads "… the deletion's own job stops the run and reports it here") |
| 20 | `remote-run.sh` → `control_close`'s `deleted) what="deleted the branch …"; stop_flags=(--branch-gone)` | — | D1 | `no-change` | Code, unchanged |
| 21 | `remote-run.sh` → `forge_report`'s function comment ("`gone`, the branch deleted on GitHub, its issue read from the task prompt at <sha>") and its code comment "GitHub closes a pull request whose head is deleted, so none is open." | — | D1, D6 (c) | `change` | Task 3 |
| 22 | `remote-run.sh` → `forge_report`'s `stopped` text for `gone` ("its branch was deleted, so the run cannot be resumed …") | — | D1 | `no-change` | The text is unchanged; Task 3 posts it on the pull requests as well |
| 23 | `cli/templates/github/workflows/harness-control.yml` header → `THE PERMISSIONS.` → `contents: write … the contents read a `stop --branch-gone` makes` | — | D1 | `no-change` | Task 3's pull-request listing is covered by `pull-requests: write`, and labels by `issues: write`, both already listed |
| 24 | `remote-run.sh` header → the `progress` paragraph ("then `- <label>: done`, `in progress` (the first pending phase) or `not started` …"; "one `PATCH` of that comment — the only comment this file ever edits") | — | D2, D6 (d) | `change` | Task 2 (a `stopped` report edits that same comment, `in progress` becoming `stopped`; it stays the only comment the file edits) |
| 25 | `remote-run.sh` → `forge_progress`'s function comment ("upsert the one progress comment of the run or round") | — | D6 (d) | `no-change` | Its upsert is unchanged. Task 2 moves its comment lookup into a new `forge_progress_comment_var`, which carries its own new comment, and `forge_progress_stopped` calls that same lookup. The sentence stays true. |
| 26 | `docs/github-run-control.md` → `## 5.` → the `progress` row ("the four phases, each done, in progress or not started") | — | D2, D7 | `change` | Task 5 (or `stopped`, after a stop) |
| 27 | `docs/github-run-control.md` → `## 5.` → **The progress comment.** paragraph ("each done, in progress or not started"; "withheld for a stopped branch") | — | D2, D7 | `change` | Task 5 |
| 28 | `docs/github-run-control.md` → `## 5.` → the `stopped (closed or deleted)` row ("For a deleted branch, the issue … The issue is labelled too") | — | D1, D7, D8 (finding 3 **Design text**) | `change` | Task 5 |
| 29 | `docs/github-run-control.md` → `## 5.` → the plain `stopped` row | — | D7 | `change` | Task 5 (its pull request's progress comment reads `stopped`) |
| 30 | `docs/github-run-control.md` → `## 5.` → the paragraph "Every comment names its next action … a comment posted before the branch was deleted is not changed afterwards." | — | D1, D7 | `change` | Task 5 (a lifecycle comment is not changed afterwards; only the progress comment is rewritten, to `stopped`) |
| 31 | `docs/github-run-control.md` → `## 5.` → **Closed or deleted.** ("Deleting a branch whose pull request is open closes that pull request as well; that close is one line in its job's log, and the deletion's job does the stop.") | — | D1, D7 | `change` | Task 5 |
| 32 | `docs/github-run-control.md` → `## 5.` → the `parked` and `park_loop` rows | — | D7 | `change` | Task 5 (the folded-pause line) |
| 33 | `docs/github-run-control.md` → `## 5.` → the other rows (`launched`, `opened`, `paused`, `resumed`, `failed`, `not_started`, a started round, `completed`), **The target rule.**, **The budget is silent.**, **Push notifications are unchanged.**, **The state labels**, and the paragraph after the table on the `reply` marker's engine | — | D7 (traversed; none states D6 (a) to (e)) | `no-change` | Unchanged by this branch |
| 34 | `docs/github-run-control.md` → `## 1.` → the `pause` reply block ("Pause requested by @<login>; … and a paused comment follows.") | — | D4, D7 | `change` | Task 5 (the reply is unchanged; a sentence under the block says a park that comes first carries the folded line instead) |
| 35 | `remote-run.sh` → `control_pause`'s reply literal "… yields at its next clean checkpoint, and a paused comment follows." | — | D4 | `no-change` | Kept: it is right whenever the pause is honoured, and Task 4's line covers a park that comes first |
| 36 | `remote-run.sh` header → the `report` paragraph's `parked` sentences ("`parked` instead posts one comment per open question … then the answer form … then <note>") | — | D6 (e) | `change` | Task 4 (the folded-pause line on `parked` and `park_loop` when `pause_reason` is `user`) |
| 37 | `cli/templates/scripts/autonomous-watcher.sh` → the registry field list → `pause_reason` ("why a `paused` record paused … Cleared when job mode relaunches the run") | — | D6 (f) | `change` | Task 4 (a `user` value still set when the run exits `parked` or `park_loop` is read by `report` for the park comment, and `run_job` clears it at the job's end) |
| 38 | `autonomous-watcher.sh` header → `JOB MODE` → `TWO PASSES ONLY A JOB RUNS` | — | D6 (traversed; it states when `pause_reason` is recorded, not what reads it on a park) | `no-change` | Still true |
| 39 | `docs/github-run-control.md` → `## 8.` → a new row: `gh pr list --head <branch> --state all` lists a pull request whose head branch was deleted, with its labels | — | D7 | `change` | Task 5 |
| 40 | `docs/github-run-control.md` → `## 8.` → the row *Deleting a pull request's head branch closes the pull request and raises a `pull_request` `closed` event* | — | D7 | `no-change` | The close Task 3 reports on rests on it unchanged |
| 41 | `docs/github-run-control.md` → `## 4.` → **The plain mention.** ("deleting the branch stops an unfinished run (§5, *Closed or deleted*)") | — | D1 | `no-change` | Still true |
| 42 | `docs/remote-execution.md` → `## 6.` → the row *A `schedule` trigger is a recurring cron on the default branch …* | — | D5, D7 | `no-change` | Still the carried source on schedules in general; Task 6 adds a separate row for the re-used record |
| 43 | `docs/remote-execution.md` → `## 6.` → a new row: a `schedule` workflow whose record GitHub reused (`deleted`, then `active`, on the same path) ticks on its schedule | — | D7, D8 (finding 4) | `change` | Task 6 |
| 44 | `docs/remote-execution.md` → `### Resuming without the local watcher` → the poller bullet ("The poller is a `schedule` workflow, every 30 minutes as shipped …") | — | D7 | `change` | Task 6 (one sentence: a tick is GitHub's best effort; round 9 saw none on a re-used record; the hand dispatch ticks it) |
| 45 | `cli/templates/github/workflows/harness-resume.yml` header → `WHY A POLLER.` | — | D5 | `no-change` | It states why a poller exists, not whether GitHub ticks it |
| 46 | `docs/development.md` → Gate 12 → (xiv)'s setup, after the `gh workflow list --all` pass condition | — | D7, D8 (finding 4 **To check next round**) | `change` | Task 7 |
| 47 | `docs/development.md` → Gate 12 → leg (f)'s `@SDLC-HARNESS pause` pass condition | — | D7, D8 (finding 2) | `change` | Task 7 |
| 48 | `docs/development.md` → Gate 12 → leg (h)'s deletion pass condition ("Passes when the issue carries a `stopped` comment saying the branch was deleted …") | — | D1, D7, D8 (finding 1 **Suggested fix**, finding 3) | `change` | Task 7 |
| 49 | `docs/development.md` → Gate 12 → leg (h)'s **What it settles** | — | D7 | `change` | Task 7 (leg (h) settles row 39's new row) |
| 50 | `docs/development.md` → Gate 12 → the **Round 9** paragraphs, after round 8's closing "What still owes a first recording" list | — | D8 (section 5) | `change` | Task 8 |
| 51 | `docs/development.md` → Gate 12 → round 8's teardown paragraph and its "What still owes a first recording" list | — | D7 | `no-change` | A dated record of round 8 |
| 52 | `docs/development.md` → Gate 12 → **Round 7** leg (e) and **Round 8** *Branch deletion* bullet ("the branch was deleted … its branch was deleted, so the run cannot be resumed") | — | D1 | `no-change` | Dated records |
| 53 | `docs/development.md` → Gate 12 → leg (g) and leg (i), and leg (h)'s issue-close and pull-request-close pass conditions | — | D7 (traversed; none states the deletion or a park) | `no-change` | Unchanged by this branch |
| 54 | `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md` | — | D9 (no sentence reached) | `no-change` | None states when `push-branch.sh` pushes, a stop's report targets, the progress comment, a park's comment or the poller's schedule |
| 55 | `harness-runs/lessons.md` → *Remote and branch-scoped operations* → "A command scoped to one branch reads and writes that branch's state only …" | — | D10 | `no-change` | Obeyed: Task 3 reports only on pull requests whose head is the stopped branch |
| 56 | `harness-runs/lessons.md` → *Remote and branch-scoped operations* → "Act on remote state where it lives …" | — | D10 | `no-change` | Obeyed: Task 1 asks origin with `ls-remote` rather than trusting the local tracking ref, and Task 3 labels the pull requests on GitHub directly |
| 57 | `harness-runs/lessons.md` → *Unattended control loops* → "Every automatic retry in an unattended path is bounded …" | — | D10 | `no-change` | Obeyed: Task 1 adds no retry; the skip happens before `push-branch.sh`'s bounded loop |
| 58 | `harness-runs/lessons.md` → *Remote and branch-scoped operations* → "Never refuse a person's input because a run is in flight …" | — | D10 | `no-change` | Not engaged: no command is refused or newly accepted by this branch |
| 59 | `docs/github-run-control.md` → `## 8.` → the row *The job's token may edit its own issue comment (`PATCH issues/comments/<id>`)* ("The progress comment, edited in place rather than posted anew") | — | D7, D6 (d) | `change` | Task 5. *What rests on it* also names a stop's rewrite of the progress comment to `stopped` (Task 2). *If it is wrong* adds that a stopped run's comment keeps its `in progress` line. The row notes that a local `remote-run.sh stop` makes that edit with the operator's own token, on the bot's comment, which is not verified either. A refused edit is one warning line. |
| 60 | `cli/templates/github/workflows/harness-run.yml` header → `WHY THE REPORT STEP MAY FAIL.` ("runs `remote-run.sh deliver` after the push, so the pull request's head carries the run's last commit") | — | D6 (b) | `no-change` | The `Open the pull request and report` step runs under `!cancelled()`, and `deliver` acts only on `status: completed`. A run stopped by its branch's deletion is cancelled, so the push this paragraph relies on is never the one Task 1 skips. |
| 61 | "`push-branch.sh` (still) opens no pull request": `ARCHITECTURE.md` → **No forge coupling beyond GitHub.** ("… and consults no platform"); `README.md` → **GitHub-coupled on request, and merging is always yours.**; `docs/config.md` → the `forge` row; `docs/github-run-control.md` → `## 4.` → **When it opens.**; `docs/remote-execution.md` → **The draft pull request is the job's, not the flow's.**; `remote-run.sh` header → the `deliver` paragraph ("the job's own `push-branch.sh`, which opens no pull request") | — | D11 | `no-change` | Still true. Task 1's `ls-remote` asks the git remote, not a forge API, so the script still opens no pull request and consults no platform. |
| 62 | `README.md` → the flow diagram's edge "commit-on-branch.sh + push-branch.sh after every unit" → "branch pushed" | — | D11 | `no-change` | It names the call point, which is unchanged. The only skip is for a branch origin deleted, and that run is stopped. |
| 63 | `push-branch.sh` → the header's title line ("push the current non-protected branch to its upstream, and …") and its separate-statement note ("never `if commit-on-branch.sh …; then push-branch.sh; fi`") | — | D11 | `no-change` | A summary line and a calling rule. The skip is stated in row 2's paragraph and in `WHAT IT NEVER DOES` (row 1). |
| 64 | `cli/templates/scripts/autonomous-watcher.sh` header → `A FAILED COMMIT OR PUSH BLOCKS A REMOTE DISPATCH` ("push-branch.sh exits 0 on every path, so "landed" is read as `origin/<branch>` equal to HEAD") | — | D11 | `no-change` | Still true. The skip exits 0 and leaves `origin/<branch>` absent. That reads as not landed, so the dispatch is refused visibly, as stated. |
| 65 | `autonomous-watcher.sh` header → the `REPRO` case "A bare origin whose pre-receive hook rejects a branch update -> … the notification naming push-branch.sh" | — | D11 | `no-change` | A rejection case on a branch origin still has. The skip does not reach it. |
| 66 | `cli/templates/scripts/commit-on-branch.sh` header → `LOUD-FAILURE CONTRACT` ("push-branch.sh makes every failure non-fatal") and `WHAT IT NEVER DOES` ("It never pushes (that is push-branch.sh, called as a SEPARATE statement …)") | — | D11 | `no-change` | Still true. The skip is non-fatal, and the calling rule is unchanged. |
| 67 | `cli/templates/scripts/create-worktree.sh` header → "every later commit goes through `commit-on-branch.sh` and `push-branch.sh`, which refuse a protected branch themselves" | — | D11 | `no-change` | Still true. |
| 68 | `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_push_landed`'s comment ("`push-branch.sh` exits 0 on every path"; "the retry is `push-branch.sh`'s") | — | D11 | `no-change` | Still true. A skipped push answers `1`, "anything else", which the comment already covers. |
| 69 | `remote-run.sh` header → `WHAT IT NEVER DOES.` ("Only `start` and `review` push, and only through `create-worktree.sh` and `push-branch.sh`") | — | D11 | `no-change` | Still true. |
| 70 | `remote-run.sh` → the lineage comment ("`push-branch.sh` never forces, so every own run's `headSha` stays an ancestor of HEAD; a deleted, unmerged branch's commits are not ancestors of a branch recreated under its name") and `docs/remote-execution.md` → **Central state.** ("`push-branch.sh` never forces") | — | D11 | `no-change` | Still true. Task 1 adds no force. A run's own push no longer re-creates a deleted branch, which only narrows when a branch is re-created. |
| 71 | `remote-run.sh` → `start`'s and `review`'s placement-failure literals ("the remote refused the push (push-branch.sh's lines in this job's log name why)"), and `docs/remote-execution.md` → `### When GitHub fails or lags` → the second **Decision:** ("a refusal is the remote's own and `push-branch.sh` names it above the failure line") | — | D11 | `no-change` | `start` pushes a branch that `create-worktree.sh` has just pushed. `review` runs only for a branch whose pull request is open. Neither meets a branch that origin deleted, and if one did, `push-branch.sh`'s own line above the failure would name the skip. |
| 72 | `docs/cli.md` → the `remote` check bullet ("`push-branch.sh` is non-fatal by contract …, so every push fails, every committer returns `pushed: failed`") | — | D11 | `no-change` | It is about a run with no remote. The skip keeps that non-fatality. |
| 73 | `docs/development.md` → the item 6 paragraphs ("the outer-loop trio — `commit-on-branch.sh`, `push-branch.sh` …"; "Item 6 has now shipped and `push-branch.sh` opens no pull request …") | — | D11 | `no-change` | Dated record. |
| 74 | A refused push is retried: `docs/github-run-control.md` → `## 2.` → **A push the remote refused is retried.**; `docs/remote-execution.md` → `### When GitHub fails or lags` → the first **Decision:** (`PUSH_ATTEMPTS`); `docs/remote-execution.md` → `## 6.` → the `! [rejected]` row | — | D11 | `no-change` | Still true. The skip happens once, before the retry loop, and is not a refusal. Task 1 adds no retry and changes none of the loop's rules. |
| 75 | `docs/outer-loop-verification.md` → **Drift since that stamp** → "Four carry executable change:" and "The other five — `commit-on-branch.sh`, `push-branch.sh`, … — have comment-only diffs since the stamp, so no §1 row's mechanism moved." | — | D11 | `change` | Task 9. Re-run the block's own grading rule, from the commit that added the files, over all five scripts the sentence names. Each script whose output has a non-comment line moves into the executable-change list with a bullet naming what changed, and both count lines are derived from that result. At plan time the grade moved `push-branch.sh` (round 8's bounded retry; Task 1's skip), `cleanup-merged-worktrees.sh` (`run_bounded()`, the bounded `fetch --prune`, `park_loop` in its `jq` selection) and `autonomous-notify.sh` (the `park_loop)` case and its usage line), and left `commit-on-branch.sh` and `setup-worktree.sh` in the sentence. |
| 76 | `docs/outer-loop-verification.md` → `### 1.2 \`push-branch.sh\` — refuses **visibly and non-fatally**` → the outcome table | — | D11 | `change` | Task 9 adds a row: a tracked branch that origin no longer lists, no push, exit 0. It is marked as a unit measurement on `cli/test/push-branch-deleted-upstream.test.mjs`, not a §0 row. |
| 77 | `docs/outer-loop-verification.md` → **Not re-confirmed by a run:** → "Two cells — the shim-reach sentence in §1.6 and the `hr_main_repo` row of §2.4 — rest on a `node:test` case …" | — | D11 (knock-on of row 76) | `change` | Task 9 names the new `### 1.2` row as a third such cell. |
| 78 | `docs/outer-loop-verification.md` → `### 1.6` → the `push-branch.sh` row of the `jq`-absent table ("**0** \| the bare ref unchanged") | — | D11 | `no-change` | An unresolvable configuration. The check runs after that refusal and never reaches it. |
| 79 | `docs/remote-execution.md` → `## 4.` → **Push frequency — a finding, not a change.** ("the job's final `push-branch.sh` under `always()` retries the second whenever that step still runs") | — | D11, D6 (b) | `change` | Task 6 adds "unless origin no longer has the branch, which it then leaves deleted (§3, *Closing or deleting stops a run too*)". |
| 80 | `docs/remote-execution.md` → **Guards.** ("`push-branch.sh` still refuses protected branches") and **Moving a run in flight to the new version, on purpose.** ("A job pushes the branch after every commit and at its end …, and a push that fails because the remote moved is non-fatal") | — | D11 | `no-change` | Still true. Neither statement is about a branch origin deleted. |
| 81 | `docs/watcher.md` → `## 1.` step 5 ("pushed as a separate statement through `push-branch.sh` … a push that did not land, stops the dispatch") and the scripts table row ("Pushes the current non-protected branch, and never aborts its caller") | — | D11 | `no-change` | Step 5 stays true: a skipped push has not landed, so the dispatch stops visibly. The table row is a one-line summary that already leaves out every other case where nothing is pushed, such as a detached HEAD or an unresolvable configuration. Those cases are stated in the script's header, which is where Task 1 states the skip. |
| 82 | `plugin/agents/committer.md` → the `push` argument bullet, step 6 **Push** and step h. **Push** ("Report `pushed: yes` … or `pushed: failed` …") | — | D11 | `no-change` | The committer reports what the helper printed. The skip prints no `pushed <branch> to origin` line, so the report is never `yes`, and the commit stands, as each bullet says. A committer push runs in the run's own worktree, where origin lacks the branch only after its deletion stopped the run. |
| 83 | `plugin/commands/branch-start-docs-autonomous.md`, `branch-start-plan-autonomous.md` and `branch-start-user-review-fix-autonomous.md` → the paragraph "The flow **does** push its own **non-protected** … branch to its upstream after each commit (via `<scripts_dir>/push-branch.sh`)" | — | D11 | `no-change` | Its subject is the protected-branch boundary, which is unchanged. The call still follows each commit. |
| 84 | `plugin/docs/AUTONOMOUS_FLOW.md` → **What the flow does push.** | — | D11 | `no-change` | The skip is reported and the run carries on, which is the paragraph's non-fatal contract. Its closing summary still states whether the commits reached the remote (see `## Context`). |
| 85 | `plugin/instructions/autonomous_pause_and_ledger.md` → §1.6, the commit-then-push rule ("`<scripts_dir>/commit-on-branch.sh`, then `<scripts_dir>/push-branch.sh`"; the headless-trap note; "`push-branch.sh` is non-fatal and only fast-forwards already-committed work, so an unconditional push is a …") | — | D11 | `no-change` | Still true. The skip pushes less than this states and is non-fatal. |
| 86 | The ⚠️ *No exit-code gate* notes and their sister sentences: `improvement_observations_instructions.md`, `plan_orchestration_instructions_autonomous.md`, `user_review_fixes_instructions_autonomous.md`, `task_plan_writing_instructions_autonomous.md` and `user_review_fix_plan_writing_instructions_autonomous.md` (each ⚠️ note); `docs_orchestration_instructions_autonomous.md` ("`push-branch.sh` is best-effort, non-fatal, only fast-forwards …"); `docs_phase_instructions.md` (**Commit + push.**, and the paragraph after it) | — | D11 | `no-change` | Each says why the push is never gated, and the skip changes none of that. |
| 87 | **Push after the commit.**: `task_plan_writing_instructions_autonomous.md` (both paragraphs) and `user_review_fix_plan_writing_instructions_autonomous.md` ("it pushes the worktree branch to its upstream whenever a commit landed") | — | D11 | `no-change` | Its subject is where the call is placed, set against the exit-gated alternative. Which pushes the helper declines is its header's business, and the first paragraph already defers to it ("best-effort (it exits 0 and logs on any failure — non-git dir, detached HEAD, protected branch, …"). In the run's own worktree, a branch that origin deleted belongs to a run the deletion has stopped. |
| 88 | Where a push follows a commit: `plan_orchestration_instructions_autonomous.md` → **Post-commit push.** ("as far as each of those pushes succeeded"), the docs-phase **Commits** bullet, entry 10, and the **Flow-progress ledger — Implementation flip points.** paragraph; `user_review_fixes_instructions_autonomous.md` → the docs-phase **Commits** bullet; the ledger flips in `task_plan_writing_instructions_autonomous.md`, `user_review_fix_plan_writing_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md` | — | D11 | `no-change` | Each says a push follows a commit, which still holds. **Post-commit push.** already bounds the remote's state by whether each push succeeded. |
| 89 | `remote-run.sh` header → `THE ARMS.` → the `stop` arm ("`stop <branch> --actor <login>` as a child, which posts its own `stopped` comment to the run's target; on 0 a reply is ALWAYS posted where the command was typed too …") | — | D6 (c) | `no-change` | Still true. A typed `stop` never passes `--branch-gone`, so Task 3 does not change where it posts. Task 2's rewrite of the progress comment is part of what `report stopped` does on each pull request it labels, and is stated in the `report` paragraph (row 14), which this arm reaches by calling `stop`. |
| 90 | `harness-runs/lessons.md` → *Remote and branch-scoped operations* → "A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create." | — | D10 (a write scoped to a branch) | `no-change` | Not engaged: no task's script creates a temporary working copy or branch. Task 1's check asks origin with `ls-remote`, which needs none, and Task 3 lists and labels pull requests through the API. The fixtures Task 1's suite builds are test source, under the system temp directory. |
| 91 | `harness-runs/lessons.md` → *Remote and branch-scoped operations* → "A collector fired by one event gathers every pending item from every authorised author since the last consumed point …" | — | D10 (a person's input) | `no-change` | Not engaged: no task changes a collector or what it consumes. Task 3's pull-request listing selects report targets, and takes every matching pull request of the branch rather than only the one whose close fired. |
| 92 | `harness-runs/lessons.md` → *Remote and branch-scoped operations* → "Let an input's type or state decide only whether it triggers an action, never whether its text is kept …" | — | D10 (a person's input) | `no-change` | Obeyed: Task 4 changes only what the park comment says about an accepted `pause` that a park overtook. The `pause` comment stays where it was typed, its acceptance and `control`'s reply are unchanged, and no task discards, edits or stops collecting a person's text because of the run's state. |
| 93 | `harness-runs/lessons.md` → *Adopter-facing documentation* → "Every command an adopter is meant to run sits in a fenced block, one command per line …" | — | D10 (a person's command) | `no-change` | Obeyed: every command Tasks 5 to 8 give an adopter to run, such as Task 6's hand dispatch of the poller and Task 7's poller check, sits in a fenced block, one per line. A quoted `## 8.` row title that names a `gh` call is a title, not a command to run. |
