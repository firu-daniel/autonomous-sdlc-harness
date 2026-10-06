# Story: Fix Gate 12 round 8's run-control findings and record the round

## Context

Gate 12 round 8 (2026-10-05 to 2026-10-06, CLI 0.6.2, `firu-daniel/harness-gate12`) ran observations (xiv), run control from GitHub, and (xv), the run-actor allow-list. It found six issues. Findings 1 to 5 are concrete defects. Finding 6 is an umbrella over 1, 2, 3 and 5, and its **Expected** line is the bar this branch is held to: a remote job that fails to start is noticed and reported in plain terms, a transient GitHub error is retried before a round is given up, and every recovery path works when the failed job left no bundle. The branch fixes all five defects, the parts of finding 6 that its Expected line names, and the runner-wait logging from its suggested fix 5. It then writes the round's record into `docs/development.md`.

The work is cut into sixteen single-layer tasks: twelve in `cli`, then one in `plugin` (Task 16), then three in `general`, the catch-all, which ships last because it documents what the other tasks built. A grep of `plugin/` for `pause-requested`, `not a harness branch`, `records no engine` and `is not HEAD` finds nothing, and `plugin/` names `push-branch.sh` only as a best-effort, non-fatal, ungated call, all of which stays true. The one `plugin` site this branch falsifies is `/autonomous-sdlc-harness:branch-resume`'s sentence that a `killed` run resumes "from the committed ledger", which a first run GitHub never started does not have (Task 16).

Most `cli` tasks edit `cli/templates/scripts/remote-run.sh`, a 6,000-line template. They are chained by `**Depends on:**` in the order below. Each per-task file names the functions and header paragraphs it owns, so no two tasks edit the same function. Three header paragraphs are shared by clause: `WHAT IT NEVER DOES.` (Tasks 4, 7 and 8), `` THE `killed` AND `expired` MAPPINGS `` and the `sync` paragraph (Tasks 6 and 7). Each task names the clause it owns, and the later task depends on the earlier.

**Finding 1 (High): the pause the job never saw.** Tasks 1 and 2.
- **`pause-requested` gets its own "no pause" exit, `5`** (Task 1). Exit `1` then means only a usage error, or a library or configuration that cannot be resolved. The watcher reads `1` as a failed poll, so a usage refusal can no longer drop a pause silently.
- **The poll bound overlaps, and never moves below where the job started** (Task 2). After a successful poll the bound becomes the larger of two values: the job's starting bound, and the epoch taken just before the query less `CONTROL_POLL_OVERLAP_SECS` (300). So a `harness pause` run that the eventually consistent listing showed late is still inside the next poll's window. A marker from before the job is never re-seen, because the bound never drops below the starting bound. Seeing one marker twice is harmless, as the `pause-requested` header already states.
- **Every poll logs one line** through the watcher's `log`, which reaches the job log as well as `watcher.log`. Declined: putting `watcher.log` into the bundle. The job log already carries each poll's line, and the bundle's file set is a format of record.

**Finding 2 (Medium): `collect` gives up on a transient push rejection.** Tasks 3, 4 and 8.
- **`push-branch.sh` retries a push the remote refused, at most three attempts in all** (Task 3), waiting `PUSH_RETRY_DELAY_SECS` (default 5) and then three times that. It **never retries a `[rejected]` push**, which is non-fast-forward or fetch-first, meaning the remote moved. That keeps `docs/github-run-control.md` → §2's rule of record: a push that loses a race fails loudly and is never fetched, rebased or retried. It still never fails its caller.
- **`hr_push_landed` tells a moved remote from a refused push** (Task 4): `1` when the push was refused, `2` when `origin/<branch>` moved to a commit that is not an ancestor of `HEAD`. `start` and `review` then name which one happened, instead of `origin/<branch> is not HEAD`.
- **`collect`'s failure comment offers re-running the `collect` job** (Task 8). That was round 8's workaround, and it needs no new review.

**Finding 3 (Medium): a run job GitHub never starts is invisible.** Tasks 5 to 10, 12 and 16.
- **What "never started" means** (Task 6). The newest `harness run <branch>` run is finished, its `run` job ended `cancelled` or `failure`, and the jobs API lists no step for that job. The reason is the job's first check-run annotation, which in round 8 was "The job was not acquired by Runner of type hosted even after multiple attempts". When no annotation can be read, the reason falls back to the conclusion. `remote_state` keeps its two existing no-bundle states and sets `RS_NOT_STARTED=1` with a detail naming GitHub's reason. If an older run carries a bundle, the state is `paused` / `killed`, which `resume` already accepts. If no run does, the state is `failed`, unless Task 7 recovers the run's engine: then it too is `paused` / `killed`, so a branch's first run that GitHub never started is resumable. That is safe, because with no bundle anywhere `verb_restore` starts the resumed job as the branch's first. Such a branch carries no flow-progress ledger, because `verb_start` commits only the task prompt, so `control` reaches `resume` on it only through Task 10's recognition of the branch its issue's `started` marker names.
- **The engine is recorded at dispatch, in the comment the dispatcher already posts** (Tasks 5 and 7). Every dispatch that changes a run's engine already posts a comment:
  - the trigger's `started` comment is always engine `task`;
  - a `round` comment is always engine `user_review`;
  - `control`'s reply after a `resume`, `clear` or `answer` dispatch now carries ` engine=<engine>` in its `reply` marker (Task 5).

  For a run that never started, `remote_state` reads the newest such marker on the run's issue and pull request (Task 7). It trusts only `github-actions[bot]`, only a marker that matches exactly, and only one posted no earlier than `DISPATCH_MARKER_SLACK_SECS` (120) before the run's `createdAt`. A first run whose job never started takes engine `task` from the trigger's `started` marker this way. With no such marker, the engine stays empty and the refusal that names the Run workflow form stands, as today. A chained `continue` dispatch and a poller dispatch post no comment, so a run they created that never started keeps that refusal too.

  Declined: putting the engine into `run-name`. The title `harness <action> <branch>` is a wire matched exactly by the pause poll, `continue`, `poll`, `status`, `stop` and the settledness test. Declined too: changing the `started` marker. `control` finds an issue's branch by that marker's exact bytes.
- **`collect` is the one reporter** (Task 8). It runs after a `run` job GitHub cancelled before any step, as round 8 observed. When the run it belongs to never started, it sends `notify not_started` once. That is a new `forge_report` event, which comments on the target and sets `sdlc-harness: paused`, or `failed` when no bundle exists anywhere and no engine is recorded. Its `forge_report` arm composes the way on, as every arm does, so `notify`'s note carries only GitHub's reason: `@sdlc-harness resume` when the engine is recorded, else the Run workflow form. It does this before it requires an open pull request, because a first run has none.
- **The poller** (Task 9). It no longer drops a branch whose finished run's listed bundle cannot be downloaded. That run counts as waiting, bounded by `HARNESS_POLL_MAX_DISPATCH_FAILURES` consecutive failed downloads, counted apart from failed dispatches and reset by a successful download. At the bound it sends exactly one push notification, with no comment and no label change, because only the download failed and the run's own state is unknown. A finished run that never started is one log line and not waiting, because `collect` reports it. Declined: the poller also reporting it. Two jobs reporting one event would post two comments.
- **The run workflow's header** says that `collect` reports a job GitHub never started (Task 12).

**Finding 5 (Medium): a stop in a run's first minutes is refused.** Task 10. When the ledger is absent from the tip, `control_check_branch` still accepts a branch in two cases. On an issue, it accepts the branch that issue's genuine `started` marker names, the task prompt's own alternative (*"or when the issue carries the `started` marker for it"*), provided the branch still exists on origin (`remote_branch_exists`): `control_branch_from_issue` has already verified that marker for exactly that branch. An issue keeps its marker after its branch is deleted, so a marker-named branch gone from origin is refused with a reason naming the deletion, never dispatched onto a missing ref. On any path, it accepts a branch with a queued, waiting, requested, pending or in-progress `harness run <branch>` run. The first case also makes a first run that GitHub never started commandable from its issue, which finding 3 needs. A failed listing, or a failed existence check, is a refusal that names the failed read, never "not a harness branch".

**Finding 4 (Low): the allow-list refusal cites the wrong section.** Task 12. Both byte-identical gate lines in `harness-run.yml` point at `docs/remote-execution.md, section 7 step 4, and section 11`.

**Finding 6, suggested fix 5: queue-time awareness.** Task 11. The job logs how long it waited for a runner, measured from this run's `createdAt` to `HARNESS_JOB_STARTED_EPOCH`. When the wait is at least `RUNNER_WAIT_NOTE_SECS` (300), its `resumed` report carries a note saying so. The time budget already starts at `HARNESS_JOB_STARTED_EPOCH`, so nothing changes there.

**Declined from finding 6's suggested fix 3: a generic retry around `gh` API calls and dispatches.** A 5xx answer to a `POST` does not say whether the write landed. Retrying a dispatch or a comment could start two runs or post two comments. The transient error round 8 actually hit was a push, and Tasks 3 and 4 cover it. The docs tasks record this decision.

**The record** (Tasks 13 to 15):
- **Task 15** copies the task prompt's Round 8 paragraphs into `docs/development.md` byte for byte, after round 7's.
- **Task 13** moves the two halves of the `docs/remote-execution.md` → `## 6.` row that legs (e) and (g) settled into a new *Verified in Gate 12 round 8* table.
- **Tasks 13 and 14** state every new behaviour where an adopter reads it. **Task 16** (`plugin`) corrects `branch-resume`'s `killed` sentence for a first run that never started.

Round 7's "What still owes a first recording" sentence is a dated record of that round, and it stays.

Top risks: The likeliest regression is the overlapping poll bound re-seeing a `harness pause` marker from before the job and pausing a freshly resumed run at once. Task 2 floors the bound at the job's starting bound, and its verification plants exactly that marker. The second is a wrong engine on a recovered resume, which would run the wrong flow on the branch. Task 7 trusts only an exact, bot-authored marker inside the slack window and otherwise leaves the existing refusal in place, and its verification covers a stale marker as well as a fresh one. The third is call-sequence churn in the `gh`-stub suites: Task 6 adds a jobs call to the no-bundle paths, and Task 8 moves `collect`'s settledness read ahead of its pull-request check. Phase G's full run would surface that churn late, so each of those tasks greps `cli/test` for exact call-list assertions on its paths and updates them itself.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_forge_run_control_gate12_round8_findings/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, in the configured layer order: `cli` first, then `plugin`, with the catch-all `general` layer last. Task 16 was added in revision and sits at entry 13, in `plugin`'s place; entry numbers and task numbers differ from there on, and each entry names the file it resolves to. Within `cli`, finding 1 (High) comes first, then findings 2, 3 and 5 (Medium), then finding 6's runner-wait logging, then finding 4 (Low).

1. [x] **Task 1** — `pause-requested` answers "no pause" with its own exit code, `5` _(layer: cli)_ _(points: 8)_
2. [x] **Task 2** — The job's control poll overlaps its bound, floors it at the job's start, and logs every poll _(layer: cli)_ _(points: 15)_
3. [ ] **Task 3** — `push-branch.sh` retries a push the remote refused, at most three attempts in all, and never a `[rejected]` one _(layer: cli)_ _(points: 12)_
4. [ ] **Task 4** — `hr_push_landed` tells a moved remote from a refused push, and `start` and `review` name which _(layer: cli)_ _(points: 15)_
5. [ ] **Task 5** — `control`'s reply after a dispatch records the engine in its marker _(layer: cli)_ _(points: 8)_
6. [ ] **Task 6** — `remote_state` recognises a run whose `run` job GitHub never started _(layer: cli)_ _(points: 15)_
7. [ ] **Task 7** — A never-started run takes its engine from its dispatch's marker _(layer: cli)_ _(points: 18)_
8. [ ] **Task 8** — `collect` reports a run whose job never started, and offers a re-run of `collect` when a round fails to place _(layer: cli)_ _(points: 20)_
9. [ ] **Task 9** — The poller waits on a listed bundle it cannot download, bounded, and skips a run that never started _(layer: cli)_ _(points: 18)_
10. [ ] **Task 10** — `control` accepts a branch the issue's `started` marker names, or whose `harness run` is queued or in progress _(layer: cli)_ _(points: 15)_
11. [ ] **Task 11** — The job logs how long it waited for a runner, and notes a long wait on its `resumed` comment _(layer: cli)_ _(points: 10)_
12. [ ] **Task 12** — `harness-run.yml`: the gate cites §7 step 4 and §11, and the header says `collect` reports a job that never started _(layer: cli)_ _(points: 8)_
13. [ ] **Task 16** — `branch-resume`: a `killed` run whose job GitHub never started, a first run included _(layer: plugin)_ _(points: 5)_
14. [ ] **Task 13** — `docs/remote-execution.md`: the poll bound, push retries, jobs GitHub never starts, what `killed` covers, the runner wait, and round 8's verified rows _(layer: general)_ _(points: 18)_
15. [ ] **Task 14** — `docs/github-run-control.md`: branch recognition, the recorded engine, the push rule, the `not_started` comment, and §8 _(layer: general)_ _(points: 15)_
16. [ ] **Task 15** — `docs/development.md`: the Gate 12 round 8 record, copied as written _(layer: general)_ _(points: 8)_

## Scope register

This plan's targets include durable corpus text: three documents under `docs/`, the command `plugin/commands/branch-resume.md`, and the header and function comments of the adopter-facing templates `cli/templates/scripts/remote-run.sh`, `autonomous-watcher.sh`, `push-branch.sh`, `lib/harness-run-lib.sh`, `cli/templates/github/workflows/harness-run.yml` and `harness-resume.yml`, and the doc comment of `COMMENT_MARKER`'s owner, `cli/src/remote/githubActions.ts`. The register below covers those sites only. A message literal in a template is listed when a derivation command reaches it. The tests are source, and none of them owes a row.

**Scope predicates**, quoted verbatim from the task prompt:
- *"Expected: a pause accepted by the control job is honoured at the next clean checkpoint."*
- *"Expected: a transient push failure is retried (a few attempts with backoff) before the round is given up; the reason names the rejection, not a moved remote."*
- *"Expected: a run that ended without its job ever running is reported, as `failed` or as `stopped`, with a `resume` hint; the labels leave `running`; `collect` does not wait for a job that is gone."*
- *"Fix: point at §7 (step 4), or at §11."*
- *"Fix: treat a branch as a harness branch when a `harness run <branch>` run is queued or in progress (or when the issue carries the `started` marker for it)."*
- *"Expected: A remote job's failure to start, or to finish its bookkeeping, is noticed by something that does run, and reported on the issue or PR in plain terms. A transient GitHub error is retried before a round is given up. Every recovery path (`resume`, the poller, the form) works even when the failed job left no bundle."*
- *"The text below is round 8's record for `docs/development.md`. It goes after round 7's paragraphs, in the same form."*

**Derivation entry D1 — template comments on the control poll (command).** Re-run verbatim from the checkout root:

```
git grep -nE "^[[:space:]]*#.*(control_polled_at|pause-requested|CONTROL POLL)" -- cli/templates
```

**Derivation entry D2 — prose on the control poll (command).**

```
git grep -nE "control_polled_at|pause-requested|polls its own workflow's runs" -- docs plugin README.md ARCHITECTURE.md
```

**Derivation entry D3 — what a failed push does (command).**

```
git grep -nE "never fetched, rebased or retried|is not HEAD|nothing is retried|single .push-branch\.sh. call|failed push \(a transient|requesting changes retries" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D4 — the harness-branch test (command).**

```
git grep -nE "not a harness branch|harness-branch test|carries no flow-progress ledger|can be commanded|harness branch" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D5 — the engine refusal (command).**

```
git grep -nE "records no engine|engine is refused, never guessed|An empty engine is refused" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D6 — a run that left no bundle (command).**

```
git grep -nE "ended with no state bundle|no branch is waiting|own end collects|cannot be downloaded|left no bundle|never uploaded a state bundle" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D7 — the gate's section pointer (command).**

```
git grep -nE "remote-execution\.md, section 9" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D8 — the comment marker's form (command).**

```
git grep -nE "sdlc-harness event=|event=<event>|carries the .reply. marker" -- docs plugin cli/templates cli/src README.md ARCHITECTURE.md
```

**Derivation entry D9 — template header paragraphs (procedure).**
- **Artifact:** the leading `#` comment blocks of these templates:
  - `cli/templates/scripts/remote-run.sh`;
  - `cli/templates/scripts/autonomous-watcher.sh` (its `JOB MODE` block and its registry-key list);
  - `cli/templates/scripts/push-branch.sh`;
  - `cli/templates/github/workflows/harness-run.yml`;
  - `cli/templates/github/workflows/harness-resume.yml`.

  Also, in `cli/templates/scripts/lib/harness-run-lib.sh`: the header's enumerated write-fence list, the `THE ARTIFACT PLACEMENT` section banner, the function comment of `hr_push_landed`, and the bundle-schema block.
- **Traversal:** each paragraph that opens with an upper-case or backticked lead, in file order. In `push-branch.sh`, each header paragraph and its `REPRO` block. In the library's write-fence list, each numbered entry in order.
- **Decision rule:** a paragraph is reached when it states any of these:
  - (a) the control poll's bound or `pause-requested`'s exits;
  - (b) what a failed or refused push does;
  - (c) which branch `control` accepts;
  - (d) where a resume's or an answer's engine comes from;
  - (e) the comment marker's form;
  - (f) what `remote_state`, `sync`, `collect` or `poll` does with a run that left no bundle;
  - (g) where the allow-list gate's refusal points;
  - (h) what a push's landed check writes or fetches;
  - (i) what the poller's failure count and its bound count, or how the poller notifies.

  The `WHAT IT NEVER DOES.` paragraph of `remote-run.sh`, which enumerates every verb's writes, is reached through (f) and (h).

**Derivation entry D10 — adopter documents by section (procedure).**
- **Artifact:** `docs/github-run-control.md` and `docs/remote-execution.md`.
- **Traversal:**
  - in `github-run-control.md`: `## 1.`'s command table and the paragraphs under it, `## 2.`, `## 5.`'s table and paragraphs, and `## 8.`'s opening sentence and table;
  - in `remote-execution.md`: `## 3.`'s subsections, `## 6.`'s opening paragraph and table, and `## 7.` → `### Every secret and variable`'s table, row by row.
- **Decision rule:** a row or paragraph is reached when it states any of D9's (a) to (g) or (i), or GitHub's run assignment, runner wait or a transient GitHub error.

**Derivation entry D14 — the poller's bound by name (command).**

```
git grep -nE "HARNESS_POLL_MAX_DISPATCH_FAILURES|failed-dispatch count" -- docs cli/templates
```

**Derivation entry D15 — what `killed` means (command).** Tasks 6 and 7 make `paused` / `killed` also cover a job GitHub never started, and for a first run one with no ledger.

```
git grep -nE "pause_reason: killed|ended mid-run" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D11 — sites the task prompt names (procedure).**
- **Artifact:** the task prompt, `harness-runs/task_prompts/fix_forge_run_control_gate12_round8_findings_task_prompt.md`.
- **Traversal:** finding 4's **Fix** sentence, then the `## Dated paragraph for docs/development.md` section's blockquote, then that section's sentence beginning "The rows of `docs/remote-execution.md` → `## 6.`".
- **Decision rule:** a file-plus-heading pair or a named row is a site.

**Derivation entry D12 — conventions documents (procedure).**
- **First step, runnable:** `grep -nE "push-branch|pause-requested|harness branch|records no engine|sdlc-harness event|section 9|retr(y|ied)" .claude/context/conventions.md .claude/context/cli.md .claude/context/plugin.md`
- **Artifact:** the three `layers[].conventions` documents.
- **Traversal:** each `##` section in file order.
- **Decision rule:** a sentence is reached when it states D9's (a) to (g) or a push's retry policy. It reached none.

**Derivation entry D13 — standing-artifact rows (procedure).**
- **First step, runnable:** `grep -nE "^## |^- " harness-runs/lessons.md`
- **Artifact:** that standing ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it names a retry, the poller's switch, an expiring bundle, or a refusal of a person's command.

**Closure invariant:** every site that any entry above reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/scripts/remote-run.sh` header → `THE VERBS AND THE EXIT MAP` → the exit-`1` entry ("for pause-requested, also NO such run") and a new exit-`5` entry | — | D1, D9 (a) | `change` | Task 1 |
| 2 | `remote-run.sh` header → the usage synopsis line `remote-run.sh pause-requested <branch> <since_epoch> [--repo <root>]` | — | D1 | `no-change` | The verb's arguments are unchanged |
| 3 | `remote-run.sh` header → `THE VERBS AND THE EXIT MAP` → the exit-`0` entry ("for pause-requested: such a run exists") and the exit-`3` entry ("For pause-requested and run-created-at, also an answer that is not the expected JSON") | — | D1 | `no-change` | Both meanings are unchanged |
| 4 | `remote-run.sh` header → `` `pause-requested` AND `run-created-at` ARE THE JOB'S TWO READ VERBS `` ("the caller takes <since_epoch> just before the query it will next start from") | — | D1, D9 (a) | `change` | Task 1 (states the overlapped, floored bound the caller now passes, and exit `5`) |
| 5 | `remote-run.sh` header → the sentence listing verbs that write nothing ("`pause-requested`, `run-created-at`, `list` and `status` write nothing") | — | D1 | `no-change` | Still true |
| 6 | `remote-run.sh` header → `REPRO` → the `pause-requested` lines ("with 1767225620 -> 1") | — | D1 | `change` | Task 1 (`-> 5`) |
| 7 | `remote-run.sh` → the comment above `EXIT_NO_PAUSE` ("pause-requested only: the read succeeded and found no pause.") | — | D1 | `change` | Task 1 (the constant becomes `5`; the comment names its own code) |
| 8 | `cli/templates/scripts/autonomous-watcher.sh` header → `JOB MODE` → the `TWO PASSES ONLY A JOB RUNS` bullet ("Each successful poll advances it to the epoch taken just before its query") | — | D1, D9 (a) | `change` | Task 2 |
| 9 | `autonomous-watcher.sh` → the registry-key list → `control_polled_at` ("the epoch second up to which the job has checked … advanced by every successful poll") | — | D1, D9 (a) | `change` | Task 2 |
| 10 | `cli/templates/scripts/lib/harness-run-lib.sh` → the bundle-schema block → `control_polled_at` ("the epoch second up to which the job checked for a `harness pause <branch>` run, or empty") | — | D1, D9 (a) | `change` | Task 2 |
| 11 | `docs/remote-execution.md` → `## 3.` → `### The kill switch and stopping` → **Pausing one run** paragraph | — | D2, D10 | `change` | Task 13 |
| 12 | `cli/templates/scripts/push-branch.sh` header → `EVERY FAILURE PATH IS NON-FATAL` ("a failed push (a transient network, say)") | — | D3, D9 (b) | `change` | Task 3 |
| 13 | `push-branch.sh` header → `WHAT IT NEVER DOES` | — | D9 (b) | `change` | Task 3 (adds: it never retries a `[rejected]` push) |
| 14 | `push-branch.sh` header → `REPRO` → the `push fails` case | — | D9 (b) | `change` | Task 3 (adds the refused-then-landed and `[rejected]` cases) |
| 15 | `push-branch.sh` header → `WHAT IT IS FOR` and `WHY A WRAPPER EXISTS AT ALL` | — | D9 (traversed; neither states (b)) | `no-change` | Neither states what a failed push does |
| 16 | `lib/harness-run-lib.sh` → `hr_push_landed`'s comment ("0 only when `HEAD` and `refs/remotes/origin/<branch>` both resolve and are equal; 1 otherwise") | — | D9 (b) | `change` | Task 4 |
| 17 | `remote-run.sh` → `verb_start`'s `placement_fail "pushing $branch (origin/$branch is not HEAD)"` | — | D3 | `change` | Task 4 |
| 18 | `remote-run.sh` → `verb_review`'s `review_fail "pushing $branch (origin/$branch is not HEAD)"` | — | D3 | `change` | Task 4 |
| 19 | `remote-run.sh` header → `THE VERBS AND THE EXIT MAP` → the exit-`4` entries ("start: placement failed — the branch cut, the copy, the commit or the push"; "review: placement failed — …") | — | D9 (b) | `no-change` | A refused or lost push is still placement failure, exit 4 |
| 20 | `remote-run.sh` header → `` `start` IS THE ADAPTERS' ONE ENTRY `` and `` `review` PLACES A USER REVIEW ROUND `` | — | D9 (b) | `no-change` | Each says a failed push is exit 4 with nothing dispatched, which stays true |
| 21 | `remote-run.sh` header → the control review paragraph ("submitting a review requesting changes retries now") | — | D3 | `no-change` | `control`'s own review placement is unchanged; only `collect`'s comment gains the re-run hint |
| 22 | `remote-run.sh` → `verb_collect`'s line `review exited $CHILD_STATUS; the pull request was told, and nothing is retried` | — | D3 | `no-change` | Still true: `collect` itself retries nothing |
| 23 | `docs/github-run-control.md` → `## 2.` → **A push that loses a race fails loudly, and is never fetched, rebased or retried.** | — | D3, D10 | `change` | Task 14 (a lost race still fails loudly; a refused push is now retried) |
| 24 | `docs/remote-execution.md` → `## 4.` → the paragraph "each direct commit is followed by a single `push-branch.sh` call. That push is best-effort." | — | D3 | `no-change` | Still one call, still best-effort; the call's own bounded retry is stated in Task 13's new subsection |
| 25 | `remote-run.sh` header → `THE BRANCH.` ("one whose origin tip carries no flow-progress ledger (`forge_recognised`) is not a harness branch") | — | D4, D9 (c) | `change` | Task 10 (the ledger, or on an issue the branch its genuine `started` marker names while it still exists on origin, or a `harness run` in flight) |
| 26 | `remote-run.sh` → `control_check_branch`'s comment and its refusal `is not a harness branch: its tip carries no flow-progress ledger` / `Only a branch a harness run works on can be commanded.` | — | D4 | `change` | Task 10 (also `control_branch_from_issue`'s comment, which now passes `started`) |
| 27 | `remote-run.sh` → `forge_recognised`'s comment ("the harness-branch test, read from committed state") | — | D4 | `no-change` | `forge_recognised` is unchanged; Task 10 adds a second test beside it in `control_check_branch` |
| 28 | `remote-run.sh` → `forge_report`'s line `pull request #$FORGE_PR's head carries no flow-progress ledger; it is not a target` | — | D4 | `no-change` | The report target rule is unchanged |
| 29 | `plugin/docs/AUTONOMOUS_FLOW.md` → the *Remote execution* inventory row ("a changes-requested review on a harness branch's pull request") | — | D4 | `no-change` | A generic description that none of these fixes falsifies |
| 30 | `docs/github-run-control.md` → `## 5.` → **The target rule.** ("one from the run's branch whose tip carries the flow-progress ledger") | — | D10 (c) | `no-change` | The lifecycle-comment target rule is unchanged |
| 31 | `remote-run.sh` header → `THE ARMS.` ("An empty engine is refused, never guessed (the `engine` input defaults to `task`), naming the Run workflow form.") | — | D5, D9 (d) | `change` | Task 7 (a run that never started takes its engine from its dispatch's marker first) |
| 32 | `remote-run.sh` → `control_resume_dispatch`'s comment ("An empty engine is refused, never guessed") and the two `records no engine, and the harness does not guess one` refusals | — | D5 | `no-change` | They still apply whenever the engine is empty after Task 7's read |
| 33 | `remote-run.sh` header → `` `collect` STARTS THE NEXT ROUND `` ("whose own end collects next"; "submitting a review requesting changes retries; there is no automatic retry") | — | D3, D6, D9 (b)(f) | `change` | Task 8 |
| 34 | `remote-run.sh` → `remote_state`'s Case 4 detail `ended with no state bundle (killed, cancelled or replaced)` | — | D6 | `no-change` | Kept for a job that started; Task 6 adds a separate never-started detail |
| 35 | `remote-run.sh` → `verb_sync`'s line `left no bundle; the record is paused (killed), nothing restored` | — | D6 | `no-change` | Sync's Case 4 outcome is unchanged |
| 36 | `remote-run.sh` → `poll_fetch`'s line `cannot be downloaded` and `verb_poll`'s line `no branch is waiting; disabled` | — | D6 | `no-change` | Both literals are kept; Task 9 changes what follows a failed download |
| 37 | `remote-run.sh` → `verb_collect`'s line `that run's own end collects` | — | D6 | `no-change` | Kept for a run genuinely in flight; Task 8's never-started branch comes first |
| 38 | `remote-run.sh` header → `` `poll`: `HARNESS_REMOTE_STOP` set exits 0 … `` ("a bundle that cannot be downloaded (one line)"; "A dispatch that fails counts one more failure for that run … until the count reaches `HARNESS_POLL_MAX_DISPATCH_FAILURES`") | — | D9 (f)(i), D14 | `change` | Task 9 (a never-started run is skipped; a listed, undownloadable bundle waits under its own consecutive-download count and ends with one push-only `bundle_unreadable`) |
| 39 | `remote-run.sh` header → `` THE `killed` AND `expired` MAPPINGS `` (including "`pause_reason: killed`" and its reason "while the ledger on the branch is intact") | — | D9 (f), D15 | `change` | Task 6 (a job GitHub never started maps to the same states, with its own detail); Task 7 (appends: with no bundle anywhere and a recovered engine, `paused` / `killed`; a first run has no ledger yet and starts as the branch's first) |
| 40 | `remote-run.sh` header → `` `sync` READS THE NEWEST `harness run <branch>` RUN `` cases 4 and 5 ("a job that died before its upload") | — | D9 (f) | `change` | Task 6; Task 7 (appends to case 5: such a run with a recovered engine is recorded as case 4 records) |
| 41 | `remote-run.sh` header → `` `fetch` IS THE COMMANDS' READ `` ("pause_reason: engine: detail: from the derivation") | — | D9 (d) | `no-change` | Still "from the derivation", which Task 7 widens without a new key |
| 42 | `cli/templates/github/workflows/harness-resume.yml` header ("`poll: no branch is waiting; disabled harness-resume.yml`") | — | D6, D9 | `no-change` | Still what an idle tick logs |
| 43 | `docs/development.md` → Gate 12 → **Round 2** paragraph | — | D6 | `no-change` | A dated record of round 2 |
| 44 | `docs/remote-execution.md` → `### Resuming without the local watcher` → **The disable is verified; the enable is not observed.** | — | D6, D10 | `no-change` | Still what an idle tick does |
| 45 | `docs/remote-execution.md` → `### Verified in Gate 12 round 2` → the `gh workflow disable` row | — | D6 | `no-change` | A verified row |
| 46 | `cli/templates/github/workflows/harness-run.yml` → the `run` job's gate `::error::` line ("(docs/remote-execution.md, section 9)") | — | D7, D9 (g), D11 | `change` | Task 12 |
| 47 | `harness-run.yml` → the `collect` job's gate `::error::` line, byte-identical to row 46 | — | D7, D9 (g), D11 | `change` | Task 12 |
| 48 | `harness-run.yml` header → `THE COLLECT JOB.` ("a cancelled or stopped run skips it") | — | D9 (f) | `change` | Task 12 |
| 49 | `harness-run.yml` header → `THE RUN-ACTOR GATE.` | — | D9 (traversed; states no pointer) | `no-change` | It names no section of `remote-execution.md` |
| 50 | `remote-run.sh` header → the trigger paragraph's marker ("`<!-- sdlc-harness event=started branch=<branch> -->` on a start") | — | D8, D9 (e) | `no-change` | The `started` marker keeps its exact bytes; `control` matches them |
| 51 | `remote-run.sh` header → `` `report` TURNS A LIFECYCLE EVENT INTO ONE COMMENT AND ONE STATE LABEL `` (its state map and "`<!-- sdlc-harness event=<event> branch=<branch> -->`") | — | D8, D9 (e)(f) | `change` | Task 8 (adds `not_started` to the event set and the state map; the marker form is unchanged) |
| 52 | `remote-run.sh` header → the control reply paragraph ("Every reply goes to the item the comment was typed on, opens `@<login>`, and carries the `reply` marker") | — | D8, D9 (e) | `change` | Task 5 (a reply after a dispatch adds ` engine=<engine>`) |
| 53 | `docs/github-issue-trigger.md` → **6. The comment and the label.** (the `started` marker) | — | D8 | `no-change` | The `started` marker is unchanged |
| 54 | `docs/github-run-control.md` → `## 1.` → the command table's `resume` and `answer` rows | — | D10 (d) | `change` | Task 14 (a run whose job never started resumes with the engine its dispatch recorded) |
| 55 | `docs/github-run-control.md` → `## 1.` → **Who and where.** | — | D10 (c) | `change` | Task 14 (a branch is commanded when its tip carries the ledger, or on an issue when it is the branch the issue's genuine `started` marker names and it still exists on origin, or when a `harness run` is queued or in progress; a deleted marker-named branch is refused as deleted) |
| 56 | `docs/github-run-control.md` → `## 1.` → **Never a command:** → the hidden-line bullet | — | D10 (e) | `no-change` | Every harness comment still carries the hidden line; the added field changes nothing there |
| 57 | `docs/github-run-control.md` → `## 2.` → **How it is sent.** and the `collect` bullet ("When that run ends `completed` or `failed`, the `collect` job … starts the next round") | — | D10 (b)(f) | `change` | Task 14 (the failure comment offers re-running `collect`) |
| 58 | `docs/github-run-control.md` → `## 5.` → the lifecycle table | — | D10 (f) | `change` | Task 14 (adds the `not_started` row) |
| 59 | `docs/github-run-control.md` → `## 8.` → its opening sentence and table | — | D10 | `change` | Task 14 (adds the dispatch-marker timing row; the opening sentence is unchanged, since round 8 moved no row of this table) |
| 60 | `docs/remote-execution.md` → `## 3.` → a new `### When GitHub fails or lags` subsection after `### Stalls` | — | D10 | `change` | Task 13 |
| 61 | `docs/remote-execution.md` → `### Resuming without the local watcher` → the poller bullet and **A re-dispatch that keeps failing is bounded.** | — | D10 (f)(i), D14 | `change` | Task 13 (a listed bundle that cannot be downloaded waits under the same variable, counted apart and reset by a success, and ends with one push-only notification) |
| 62 | `docs/remote-execution.md` → `### Runs longer than a job` | — | D10 (runner wait) | `change` | Task 13 (the logged runner wait; the budget already starts at `HARNESS_JOB_STARTED_EPOCH`) |
| 63 | `docs/remote-execution.md` → `### API errors` | — | D10 (traversed) | `no-change` | It is about the Anthropic API, not GitHub's |
| 64 | `docs/remote-execution.md` → `## 6.` → the row "A `remote-run.sh continue` chain and a `harness-resume.yml` poller dispatch name `github-actions[bot]` …" | — | D10, D11 | `change` | Task 13 (the continue-chain and owner-type halves move to *Verified in Gate 12 round 8*; the poller half stays) |
| 65 | `docs/remote-execution.md` → `## 6.` → the opening paragraph ("Gate 12 round 2 … verified the rows moved to …") | — | D10, D11 | `change` | Task 13 (names round 8) |
| 66 | `docs/remote-execution.md` → `## 6.` → new rows for the never-started job's empty `steps` and its annotation | — | D10 | `change` | Task 13 |
| 67 | `docs/development.md` → Gate 12 → the **Round 8** paragraphs, after round 7's closing "What still owes a first recording" paragraph | — | D11 | `change` | Task 15 |
| 68 | `docs/development.md` → Gate 12 → round 7's "What still owes a first recording" paragraph | — | D11 | `no-change` | A dated record of what round 7 left open; the prompt asks only that round 8's paragraphs be added after it |
| 69 | `docs/remote-execution.md` → `### Every secret and variable` (§7 step 4) and `## 11. Security` → **Who can spend the credential.** | — | D11 | `no-change` | The targets of the corrected pointer; their text already describes the allow-list |
| 70 | `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md` | — | D12 (no sentence reached) | `no-change` | None states a push's retry policy, the control poll, the harness-branch test, the engine, the marker or the gate pointer |
| 71 | `harness-runs/lessons.md` → *Unattended control loops* → "Every automatic retry in an unattended path is bounded by a count or a deadline …" | — | D13 | `no-change` | A constraint this plan obeys: Task 3's three attempts, and Task 9's existing failure count with its one notification |
| 72 | `harness-runs/lessons.md` → *Unattended control loops* → "A process that turns off a shared switch another actor can turn on must check the enabling condition again …" | — | D13 | `no-change` | Obeyed: Task 9 leaves `poll_recheck` as it is |
| 73 | `harness-runs/lessons.md` → *Unattended control loops* → "State held only in an expiring store … must be reported plainly as expired …" | — | D13 | `no-change` | Obeyed: Task 9 counts only an unexpired, listed bundle as waiting; an expired one still takes `bundle_state`'s route |
| 74 | `harness-runs/lessons.md` → *Remote and branch-scoped operations* → "Never refuse a person's input because a run is in flight …" | — | D13 | `no-change` | Obeyed: Task 10 removes a refusal of a run in its first minutes |
| 75 | `cli/templates/scripts/lib/harness-run-lib.sh` header → the write-fence list → entry 4, `THE ARTIFACT PLACEMENT` ("Fence: the caller-named `<worktree>/<rel>`, its parent directories and that path's index entry, plus whatever the two caller-named wrappers do") | — | D9 (h) | `change` | Task 4 (names `hr_push_landed`'s fetch of `refs/remotes/origin/<branch>` after a failed landing) |
| 76 | `lib/harness-run-lib.sh` → the write-fence list → entries 1 to 3 (the usage lane, `THE RUN REGISTRY`, `THE REMOTE STATE BUNDLE`) | — | D9 (traversed; none states (h)) | `no-change` | None covers the placement or a push |
| 77 | `lib/harness-run-lib.sh` → the `THE ARTIFACT PLACEMENT` section banner → `THE CONTRACT.` ("read \"landed\" as `origin/<branch>` equal to `HEAD`") | — | D9 (b)(h) | `no-change` | "Landed" still means equal; the fetch after a failed landing is stated in row 75's fence entry and row 16's function comment |
| 78 | `cli/src/remote/githubActions.ts` → `COMMENT_MARKER`'s doc comment ("the whole line is `<!-- sdlc-harness event=<event> branch=<branch>[ question=<n>] -->`") | — | D8 | `change` | Task 5 (adds `[ engine=<engine>]`, carried only by a `reply` after a successful dispatch; the constant's value is unchanged) |
| 79 | `cli/templates/scripts/remote-run.sh` header → `WHAT IT NEVER DOES.` (the paragraph enumerating each verb's writes; distinct from row 13, which is `push-branch.sh`'s) | — | D9 (f)(h) | `change` | Task 4 (the `start` and `review` clauses: the landed check's fetch of `refs/remotes/origin/<branch>` after a failed landing); Task 7 (the `fetch`, `status`, `sync`, `control` and `review` clauses, and `list`'s if it reaches `remote_state`: `forge_dispatch_engine_var`'s `forge_fetch_branch` for a never-started run; in the `review` clause, reached through `branch_settled_var`, a sentence appended after Task 4's text, which stays unchanged); Task 8 (the `collect` clause: a `not_started` comment on the issue or pull request, state labels on both, one push notification, and its settledness read's fetch). Its `poll` clause stays true |
| 80 | `remote-run.sh` header → `` `continue` AND `poll` CLOSE THE LOOP WITHOUT THIS MACHINE `` → the `HARNESS_POLL_MAX_DISPATCH_FAILURES` entry ("`poll` only: failed re-dispatches of one paused run before it gives up") and the sentence "Notifications go through the sibling `autonomous-notify.sh`, as `paused` or `failed`, and each is then reported as `report` reports that event" | — | D9 (i), D14 | `change` | Task 9 |
| 81 | `remote-run.sh` → `poll_bounds_var`'s two code lines reading `HARNESS_POLL_MAX_DISPATCH_FAILURES` (the default and the `POLL_BOUND_BAD` text) | — | D14 | `no-change` | Code, not prose; the variable's name and its parsing are unchanged |
| 82 | `cli/templates/github/workflows/harness-resume.yml` header → `WHAT IT READS.` → `HARNESS_POLL_MAX_DISPATCH_FAILURES (failed re-dispatches of one paused run before the poller gives up on it …)` | — | D9 (i), D14 | `change` | Task 9 |
| 83 | `harness-resume.yml` header → `WHAT IT READS.` → `HARNESS_PUSH_URL (optional notifications: the poller's own failed notice when it cannot resume a run)` | — | D9 (i) | `change` | Task 9 (also its `bundle_unreadable` notice) |
| 84 | `harness-resume.yml` header → `WHAT IT WRITES.` ("the failed-dispatch count `poll` carries to the next tick") | — | D9 (i), D14 | `change` | Task 9 (the failed-dispatch and failed-download counts) |
| 85 | `harness-resume.yml` → the job's `env:` line `HARNESS_POLL_MAX_DISPATCH_FAILURES: ${{ vars.HARNESS_POLL_MAX_DISPATCH_FAILURES }}` | — | D14 | `no-change` | A mapping, not prose; unchanged |
| 86 | `harness-resume.yml` header → `THE PERMISSIONS.` ("serve `poll`'s reports, which comment on the waiting run's issue or pull request") | — | D9 (i) | `no-change` | Still true: the new `bundle_unreadable` notice posts no comment |
| 87 | `docs/remote-execution.md` → `## 7.` → `### Every secret and variable` → the `HARNESS_POLL_MAX_DISPATCH_FAILURES` row ("failed re-dispatches of one paused run before the poller gives up on it") | — | D10 (i), D14 | `change` | Task 13 |
| 88 | `docs/remote-execution.md` → `## 7.` → `### Every secret and variable` → every other row | — | D10 (traversed; none states (a) to (g) or (i)) | `no-change` | None describes a behaviour this branch changes |
| 89 | `docs/remote-execution.md` → `## 4.` → **Central state.** ("A job that ended without uploading one — killed before the upload, or finished while its bundle still said `running` — syncs as `paused` with `pause_reason: killed`, not `failed`, because a `failed` record has no resume path while the ledger on the branch is intact"; "A run with no bundle anywhere syncs as `failed`, and re-dropping the artifact is the recovery") | — | D15 | `change` | Task 13 (a never-started run syncs the same way when an older bundle exists or its engine is recovered; a first run has no ledger yet and starts as the branch's first) |
| 90 | `docs/remote-execution.md` → `## 1.` → the `/autonomous-sdlc-harness:branch-resume` row ("A run `paused` with `pause_reason: killed` — a job that ended mid-run — resumes the same way") | — | D15 | `change` | Task 13 (adds a job GitHub never started, and the no-ledger first run) |
| 91 | `plugin/commands/branch-resume.md` → step 6, **GitHub route** → the **`paused`** bullet ("A `pause_reason: killed` — a job that ended mid-run — resumes exactly like any other paused run, from the committed ledger") | — | D15 | `change` | Task 16 (adds a job GitHub never started; a first run has no ledger yet and starts as the branch's first, from its committed task prompt, so "from the committed ledger" no longer stands alone) |
| 92 | `docs/remote-execution.md` → `## 3.` → `### The kill switch and stopping` → **Closing or deleting stops a run too.** ("`paused` with `pause_reason: killed` when the cancelled job's bundle still said `running`") | — | D15 | `no-change` | Still true: it describes a job that ran and was cancelled, whose bundle exists |
| 93 | `cli/templates/scripts/remote-run.sh` → `remote_state`'s Case 3 detail `the job ended mid-run (its bundle still says running)` | — | D15 | `no-change` | Code, and still true: Case 3 is a run whose own bundle exists; Task 6's never-started detail is separate |
