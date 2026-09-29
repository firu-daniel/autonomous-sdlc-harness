`fix_remote_pause_state_and_gate12_record` closes what round 2 of Gate 12 (`docs/development.md` → `## 5. Verifying
a change` → **Gate 12 — remote execution against a real GitHub repository**) found in 0.4.1's remote execution, and
writes the round's results into the documents that list them as unverified. Round 2 ran a full delivery end to end on
a GitHub-hosted runner, so everything below is either a defect the run exposed or a record the docs now owe.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The approaches below
> are **candidates, not instructions** — verify each against the real code and the real contracts before planning
> it, and say so in the plan if a better one exists or if one of them is wrong.

---

## The gate run this comes from

Scratch repository `firu-daniel/harness-gate12-r2` (private, a small TypeScript library, `phases.qa`, `docs` and
`parity` all off, `execution.target: github-actions`), adopted with `npx autonomous-sdlc-harness@0.4.1 init`,
2026-09-29, one task dropped as `feat_invoice_totals`. The evidence lives outside this repository, so what matters
is quoted here.

## 1. A self-pause in a remote job discards uncommitted in-flight work

With `HARNESS_SELF_PAUSE_AFTER_MINUTES=5` (Gate 12 observation (iii)), three consecutive jobs each ran the
task-plan writer and paused before any reviewer ran, and nothing but the flow-progress ledger reached the branch.

- Planning artifacts stay untracked until P1/P3 convergence — the story index
  `<stateDir>/story_plans/<branch>_story_plan.md` and the per-task directory `<stateDir>/task_plans/<branch>/`.
- The state bundle carries only `status.json`, `clarifications/<branch>/`, `PAUSE_PROGRESS.md`, `flow_walker_state`
  and `run.log` (`cli/templates/scripts/lib/harness-run-lib.sh` → `THE REMOTE STATE BUNDLE`). The bundle of the second
  job held exactly four files.
- The next job starts in a fresh checkout, so the saved walk (pending `architecture_review`) is unusable and the
  walker's Override 2(c) re-runs the writer from scratch. The run's own `PAUSE_PROGRESS.md` said so:

      the untracked story index and per-task files from the first session were not on disk (the checkout was
      fresh). The saved walk was therefore unusable under the core's **Continuing a saved walk.** rule, and
      Override 2(c) re-ran the task-plan-writer from scratch via `start --entry plan_writer`. … They will be lost
      again if the resume runs in a fresh checkout.

With a short budget the chain never converges before `HARNESS_MAX_CHAIN`; with the 240-minute default the same loss
happens whenever a self-pause, a user pause or a stop lands mid-planning. A local run never meets it, because a paused
worktree keeps its untracked files on disk. `docs/remote-execution.md` → `## 3.` → *Runs longer than a job* ("the
continuation resumes from the pushed ledger") does not state the loss. Only untracked artifacts are exposed: the
pause protocol already waits for a clean tracked tree before it honours a pause.

**Open question for planning — decide it, and record the reason.** Two directions:

- **(a) The bundle carries the untracked `<stateDir>` artifacts the saved walk depends on**, and `restore` puts them
  back — the remote equivalent of a worktree that keeps them. Preferred going in, not decided. Facts that bear on
  it: a bundle is per run and restored per branch (`remote-run.sh` → `previous_bundle_run` lists `harness-run.yml`
  runs with `--branch <branch>`, keeps completed runs titled exactly `harness run <branch>` other than its own,
  newest first, and restores the first that still has a bundle), so another branch's job never sees it; artifacts
  are readable by anyone who can read the repository — on a public repository, drafts become public before they are
  committed; a bundle expires with the repository's artifact retention (90 days on the gate repository).
- **(b) A pause in job mode commits them before yielding.** That puts unconverged plans into branch history, and P1
  today means both "converged" and "committed", so the ledger and the walker would have to tell the two apart.

Whichever is chosen: which untracked paths are carried (planning, and any other phase that writes untracked
artifacts a saved walk depends on), how a restore treats a path the fresh checkout already has, and the bundle
format's own fence in `harness-run-lib.sh` all change together, and `docs/remote-execution.md` states the result.

## 2. The workflow templates pin actions that run on Node.js 20

Every run printed:

    Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24:
    actions/checkout@v4, actions/upload-artifact@v4.

`cli/templates/github/workflows/harness-run.yml` and `harness-resume.yml` pin `actions/checkout@v4`,
`actions/setup-node@v4`, `actions/cache@v4`, `actions/cache/restore@v4` and `actions/upload-artifact@v4`. The warning is
about the actions' own runtime, not the job's Node version (`setup-node` already gives the steps Node 22). Bump each
to the major version that targets Node 24, checked against each action's own release notes rather than assumed.
`.github/workflows/publish-main.yml` already pins `checkout` v5 by full commit sha with its reason; decide whether the
templates follow that pinning style, and keep the templates' header comments (which name each action and its inputs,
e.g. the `retention-days` reasoning) true.

## 3. Record what round 2 settled, and what it did not reach

`docs/remote-execution.md` → `## 6. What is not verified here` lists the GitHub behaviours the design rests on as
unverified, and Gate 12 is the hand-run that records them. Move what round 2 measured out of "not verified" with its
evidence, and state plainly what it did not reach:

| Behaviour | Round 2 result | Evidence |
|---|---|---|
| A step's `timeout-minutes` accepts the `env` expression | Verified | Every `harness-run.yml` run was accepted and its `Run the harness` step ran |
| A `workflow_dispatch` sent with `GITHUB_TOKEN` starts a run | Verified | Job 1's `remote-run.sh continue` → `dispatched action=run engine=task resume=pause`; a new `harness run <branch>` run started, restored the bundle and resumed |
| A push made with `GITHUB_TOKEN` starts no workflow | Not measured | The gate repository has no workflow besides the harness's own, so there was nothing to trigger |
| A job skipped by its `if:` bills nothing | Verified | `harness pause` marker run: both jobs `skipped`; `actions/runs/<id>/timing` → `"billable":{"UBUNTU":{"total_ms":0,"jobs":2,…}}` |
| `upload-artifact@v4` caps `retention-days: 400` rather than failing | Verified: capped | Artifact `expires_at` 90 days after creation; repository `artifact-and-log-retention` → `{"days":90,"maximum_allowed_days":400}` |
| `gh workflow disable` succeeds under `GITHUB_TOKEN` with `actions: write` | Verified | Hand-started poller tick: `poll: no branch is waiting; disabled harness-resume.yml`; workflow `state: disabled_manually` |
| `gh workflow enable` succeeds under that token | Not observed | No job ended on a usage pause (`wait-poller`) |
| An in-progress run's artifact is listed and downloadable | Not observed | Same reason; the poller's post-disable re-check rests on it |
| The 6-hour hosted / 5-day self-hosted job limits | Not measured | No job ran near either limit; the longest was 30 m 35 s |
| `ANTHROPIC_API_KEY` wins when both credentials are set (`## 9.`) | Not verified | Observation (ix) skipped: no API key available |
| A self-hosted runner (`## 8.`) | Not verified | Observation (vii) skipped |
| A remote run skips the interactive-test phase cleanly (`### The interactive-test phase`) | Not verified | Observation (x) skipped; the remote QA path is roadmap point 31 |

Gate 12's own text in `docs/development.md` should say that rounds 1 (0.4.0) and 2 (0.4.1) were run, which
observations passed, and which were skipped or not reached and why, so the next person knows which observations still
owe a first recording. The other verified points the round made, for whichever document already owns them: the
self-pause dropped `PAUSE` at exactly 300 s (`reason budget`) and chained a new job; a `harness pause` run was found by
the running job 47 s after creation and the job ended with decision `stop`; `remote-run.sh stop` dispatched the marker,
cancelled the running job (whose post-steps still saved and uploaded the bundle), and started nothing new; a later
resume restored that cancelled job's bundle; and one 240-minute job took the task from planning to "branch ready for
review" in 30 m 35 s with every enabled phase `[x]`.

Round 2 also exercised a path Gate 12 has no observation for, and the gate should gain one: **a remote park answered
and resumed.** A task that left three security limits undecided made the task-plan writer park before writing a draft
(`question_1.md`, `job: parked stop`). An `answer_1.md` written in the worktree clarifications directory — the file
`/autonomous-sdlc-harness:branch-answer` writes — was relayed by one `tick` ("relayed the answers (1) of parked remote
run"); the next job logged `restored the bundle of run <id>`, `wrote answer_1.md for <branch>` and
`resuming parked run '<branch>' (answers 1)`, and the session passed the answered outcome to the walker and dispatched
the writer with the answers attached, without re-parking. The run was stopped by the operator before P1, so the
answered writer's plan converging was not observed, and the `/branch-answer` command itself was not run.

## Acceptance criteria

- A remote job that pauses mid-planning and is resumed in a fresh checkout continues its saved walk instead of
  re-running the writer, or the chosen design's equivalent; a test drives a pause-then-restore across two job
  checkouts with untracked planning artifacts present.
- The design chosen for finding 1, and why the other was not, is stated in `docs/remote-execution.md`.
- Both workflow templates pin actions that target Node 24, and their headers stay true.
- `docs/remote-execution.md` → `## 6.` and Gate 12 record round 2's results as above: nothing still listed as
  unverified that round 2 measured, and nothing listed as verified that it did not.

## Out of scope

- The version bump and its publication.
- Re-running Gate 12.
- Self-hosted runner support and testing, and the remote interactive-test phase, which have their own follow-ups.
