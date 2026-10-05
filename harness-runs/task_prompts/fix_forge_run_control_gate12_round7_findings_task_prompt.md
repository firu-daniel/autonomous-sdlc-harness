`fix_forge_run_control_gate12_round7_findings` fixes what Gate 12 round 7 (2026-10-05, CLI 0.6.1, `firu-daniel/harness-gate12`) found when it re-ran observation (xiv), **run control from GitHub**. It also records the round in `docs/development.md` and `docs/github-run-control.md`. The round worked one run from GitHub alone: issue #10, then branch `feat_invoices_4`, then draft PR #11. It used:

- a park answered on the issue, and a park answered on the PR;
- pause and resume;
- three review rounds, with reviews submitted while a round ran;
- `status`;
- stop and resume;
- closing the issue, closing the PR and deleting the branch;
- a dispatch from the wrong ref.

The round confirmed most of `fix_forge_run_control_gate12_findings` (#64) on a real repository, round 6's High among them. It also found three new defects. One is **High**: the `harness-control.yml` that 0.6.1 renders is not valid YAML. GitHub runs it for no event, so every command, review, close and deletion is ignored. The round could only continue on a hand-patched copy.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Line numbers below are approximate and come from 0.6.1's rendered copies in the scratch repository. The fixes listed under each item are **candidates, not instructions**: verify each one against the real code and GitHub's documentation before planning it. If a better fix exists, or a candidate is wrong, say so in the plan.

---

## Priority and shape

1. **Item 1 first.** It is the only High. It breaks run control from GitHub for every 0.6.1 adopter with `forge: github`, and no gate would have caught it.
2. Then item 3 (Medium), then item 2 (Low).
3. Then item 4, the round's record. It is documentation only, and it is the equivalent of recording the round by hand. It is not a user-review finding.

All four fit one branch.

---

## A. Defects

### Item 1 — `harness-control.yml` 0.6.1 is not valid YAML — High

- **What:** The `control` job's `if:` in `cli/templates/github/workflows/harness-control.yml` is a plain (unquoted) YAML scalar. #64 added a test for closed issues that carry a state label: `contains(join(github.event.issue.labels.*.name, ','), 'sdlc-harness: ')`. The `: ` inside that plain scalar is read as a mapping indicator, so the file does not parse. 0.6.0's `if:` had no `: ` and parsed.
- **What GitHub did:**
  - `GET repos/<owner>/<repo>/actions/workflows` listed the workflow under its path, `.github/workflows/harness-control.yml`, and not by its `name:` (`harness-control`).
  - The adoption push to `main` produced run `37286840763` (event `push`, conclusion `failure`, no jobs). GitHub's run page says: *"This run likely failed because of a workflow file issue."*
  - `@sdlc-harness answer 1` on issue #10 (09:00:14Z) started no `harness-control.yml` run and got no reply. The issue stayed `sdlc-harness: parked`.
- **Evidence:** `actionlint` 1.7.7 on the rendered file reports `harness-control.yml:174:0: could not parse as YAML: yaml: line 174: mapping values are not allowed in this context [syntax-check]`. With the `if:` rewritten as a folded block scalar, it lints clean:

  ```yaml
      if: >-
        (github.event_name == 'issue_comment' && … ) || … || (github.event_name == 'delete' && github.event.ref_type == 'branch')
  ```

  Pushed to the scratch repository's `main`, the patched file was listed as `harness-control`. Every later event ran.
- **Why no gate caught it:** no suite parses the rendered workflow templates as YAML. The stub suites drive `remote-run.sh` directly and never load a workflow file.
- **Fix (candidates):**
  - Write the `if:` as a block scalar (`if: >-`). Check the other three templates for any plain scalar that holds `: ` or ` #`.
  - Add a gate that parses every file under `cli/templates/github/workflows/`, as rendered by `init`, with a real YAML parser and fails on any error. Also run `actionlint` over them when it is on `PATH`, and skip it with a printed reason when it is not, the way gate 13d is skipped. Keep in mind:
    - The CLI has no YAML dependency today. Decide in the plan between a dev-only one and parsing in the gate script.
    - `docs/development.md` → `## 5. Verifying a change` gains the gate.
  - **The upgrade path is part of the fix.** `init` writes `harness-control.yml` create-if-absent, and `init --upgrade-workflows` does not re-render it, so a 0.6.1 adopter keeps the broken copy after upgrading the CLI.
    - Give adopters a route to the fixed file, and state it where an adopter will see it: the CLI's output, `doctor`, `docs/github-run-control.md` and `docs/remote-execution.md`. The candidates are:
      - `init --force` (which regenerates the whole managed set);
      - a re-render of the one file when it matches 0.6.1's rendered bytes, which is when the adopter has not edited it;
      - `--upgrade-workflows` learning this file.
    - **A `doctor --check-github` check.** A workflow GitHub lists with `name` equal to its `path` is one it could not parse. Report that for each of the four harness workflows as a `FAIL` naming the file and the route above. It would have caught this on the round's setup.

### Item 3 — A `resumed` report that lands after a stop un-stops the issue — Medium

- **What happened (leg (h), second half):**
  1. `@sdlc-harness resume` on issue #10 (10:24:55Z) dispatched run `37296454656`, created 10:25:12Z.
  2. Once the PR read `sdlc-harness: running` (10:25:24Z), the PR was closed (10:25:27Z).
  3. The close's control job `37296486401` stopped the run at 10:25:48Z. It logged `dispatched the action=stop marker`, `asked GitHub to cancel run 37296454656`, `stopped feat_invoices_4` and `report: stopped on feat_invoices_4 reported on #11`. Both items went `sdlc-harness: stopped`, the issue at 10:25:46Z.
  4. One second later the run job's watcher logged `job: resuming paused run 'feat_invoices_4'` (10:25:49Z) and sent its own `resumed` report. PR #11 was now closed, so the §5 target rule fell back to issue #10.
  5. The issue got *"The harness run on `feat_invoices_4` resumed."* (10:25:51Z) and was relabelled `sdlc-harness: running` (10:25:52Z–10:25:53Z).
  6. The run ended `cancelled` (10:26:55Z). Its `Notify a cancelled job` step correctly said `report: feat_invoices_4 was stopped, and the stop already reported the run; nothing posted`.
  7. Issue #10 was left reading `sdlc-harness: running` for a stopped run, beside a `resumed` comment posted after the stop.
- **Evidence:** issue #10's timeline shows `10:25:45 unlabeled running`, `10:25:46 labeled stopped`, `10:25:52 unlabeled stopped` and `10:25:53 labeled running`, all by `github-actions[bot]`. PR #11 stayed `stopped`.
- **Root cause:** `forge_report` in `scripts/remote-run.sh` (`cli/templates/scripts/remote-run.sh`) checks `remote_branch_stopped` only for the `failed` event. `resumed`, `paused`, `parked`, `park_loop` and `round` are reported unconditionally, so a job that a stop has overtaken still reports.
- **Fix (candidates):**
  - Apply the `remote_branch_stopped` guard to every event a run job reports, not only `failed`. Remember that `stopped` itself is posted by the stop.
  - Decide in the plan whether a `resumed` that a stop overtook should say anything. Silence matches what `failed` already does.
  - Optionally, have job mode send `resumed` before the slow setup steps, which shrinks the window. That alone is not a fix.
- **Docs:** `docs/github-run-control.md` → `## 5.` states that nothing from a stopped job changes a label or posts a lifecycle comment.

### Item 2 — `status` early in a user-review round reports the previous engine's ledger — Low

- **What:** `@sdlc-harness status` on issue #10 and on PR #11 (09:55:39Z and 09:55:40Z) came during user-review round 1, which had started at 09:54:50Z. Both replies read:

  > `` `feat_invoices_4` is `running`. ``
  > Every entry of the flow-progress ledger is ticked.

  The run was at the start of a round, not finished.
- **Root cause:** the round job writes a fresh ledger at the same path, `sdlc-harness/flow_progress/feat_invoices_4_progress.md` (`5f94336 chore: Add flow-progress ledger for feat_invoices_4`, 09:55:53Z). The status jobs (`37293241849` and `37293244742`) had fetched `origin` before that commit. `control_ledger_next_var` reads `refs/remotes/origin/<branch>:…/flow_progress/<branch>_progress.md` from that fetch, which still held the task engine's completed ledger.
- **Fix (candidates):**
  - In `control_status`, a `running` state never pairs with "every entry … is ticked".
  - When the ledger reads fully ticked while the run is running, check whether the tip carries a `chore: add user review for <slug>` commit newer than the ledger's last change. If it does, say that a user-review round has started and its ledger is not yet written.
  - Alternatively, read the engine the newest run was dispatched with and say so.
- **Docs:** `docs/github-run-control.md` → `## 1.`, under `status`.

---

## B. The round's record

### Item 4 — Record Gate 12 round 7 — documentation

The round's record has not been written. This item writes it. It is the equivalent of the operator recording the round by hand, and it is **not** a user-review finding.

1. **`docs/development.md` → Gate 12.** After round 6's closing *"What still owes a first recording"* paragraph, add the Round 7 paragraph below verbatim. Then replace round 6's *"What still owes a first recording"* sentence with the one at the end of the Round 7 text, so only the newest one stands. Adjust the wording only where this branch's fixes make a sentence untrue, and say so in the plan.
2. **`docs/github-run-control.md` → `## 8. What is not verified here`.** Move the four rows below out of the table, into a new `### Verified in Gate 12 round 7` table beside round 6's. Use the *Observed* text given here. Update the section's opening sentence to name round 7.

| Behaviour (row as it stands in §8) | Observed |
|---|---|
| A `delete` event's workflow runs from the default branch | Deleting `feat_invoices_4` started `harness-control.yml` run `37297215528`, event `delete`, `headBranch` `main`, `headSha` `db0f6ab` (the default branch's tip). It stopped the run ([`development.md`](development.md) → Gate 12 → Round 7, leg (h)) |
| The contents API serves a file at a commit no branch points at any more | After the deletion, the `stopped` comment reached issue #10. The deletion path reads the issue from the task prompt at the newest run's `headSha`, which no branch pointed at any more |
| A workflow can be dispatched from the default branch while its `branch` input names a deleted branch | The deletion's `harness stop feat_invoices_4` marker run `37297237226` was accepted and listed under `main` |
| A `pull_request` `closed` job runs the merge-commit copy of the workflow | Closing PR #11 ran `harness-control.yml` run `37296486401` (event `pull_request`, `headBranch` `feat_invoices_4`, `headSha` the head's tip). The head branch still carried 0.6.1's unparseable copy (item 1), and only `main` had the fixed one, yet the job parsed and ran. It therefore did not run the head's copy, which matches the merge-commit copy. That the default branch's copy ran instead is not excluded by this observation |

**Round 7 paragraph (verbatim, for `docs/development.md`):**

> **Round 7 — 2026-10-05, CLI 0.6.1.** Scoped to observation (xiv), run control from GitHub, re-run after `fix_forge_run_control_gate12_findings`, and run by hand against `firu-daniel/harness-gate12` from its seed commit (a GitHub-hosted runner, `phases.qa`, `docs` and `parity` off). Round 6's teardown had not reset `main`, so the round began by resetting it to the seed. It was adopted with `npx autonomous-sdlc-harness@0.6.1 init --non-interactive`, then `config set execution.target github-actions`, `config set forge github` and a second `init`, which reported creating all four workflows. `sdlc-harness` was created, and `can_approve_pull_request_reviews` read `false`, was switched on through `PUT repos/<owner>/<repo>/actions/permissions/workflow`, and read `true`. The job installed Claude Code `2.1.289`. No run daemon was registered (`daemon stop` found no unit), so nothing local took part. `firu-daniel` (admin) commented, `expause-admin` (write) submitted every review, and with no `HARNESS_GIT_TOKEN` set the pull request was authored by `app/github-actions`. The setup **passed** on its `doctor` lines: `PASS  forge` named both forge workflows and the six commands, and `remote-github` warned only that `HARNESS_PUSH_URL` is not set while saying `GitHub knows harness-trigger.yml and harness-control.yml, and the label `sdlc-harness` exists`. But the adoption push had already started a `harness-control.yml` run, `37286840763`, that failed with no job on a workflow file issue, which is finding 1. The task was the invoices task with a closing section reserving two security limits to the product owner.
>
> Leg (a) **passed**: issue #10, labelled at 08:57:45Z, got the trigger's comment naming `feat_invoices_4` and run `37286947112`, and the label moved to `sdlc-harness: running`. At 08:59:50Z the task-plan writer parked before any draft, and the issue carried one comment with `question_1.md` whole (five questions), the `@sdlc-harness answer 1` instruction and its copy block, and no `answer_1.md` anywhere — round 6's finding 4 re-observed fixed — with the label `sdlc-harness: parked`. Leg (b) **failed** as shipped: `@sdlc-harness answer 1` at 09:00:14Z started no `harness-control.yml` run and got no reply, because the file does not parse (finding 1). The scratch repository's copy was patched by hand, its job `if:` rewritten as a folded block scalar, and pushed, after which GitHub listed the workflow as `harness-control`; every leg from here on ran against that patched copy. The answer, posted again, got `Answer to question 1 received from @firu-daniel; every open question is answered, so `feat_invoices_4` resumes.`, then `resumed` and `running`; the job logged `wrote answer_1.md for feat_invoices_4` and `resuming parked run 'feat_invoices_4' (answers 1)` and did not re-park. Leg (c) **passed**: once the ledger showed P1 and P3 `[x]`, `@sdlc-harness pause` got `Pause requested by @firu-daniel; …`; the job logged `dropped PAUSE (reason user)`, finished its task in flight and logged `paused (PAUSE honored, reason user)`; `paused` and the label followed, and `@sdlc-harness resume` got the resume reply, `resumed` and `running`. Leg (d) **passed** with no workaround — round 6's finding 1 re-observed fixed: the answered, paused and resumed run logged `completed — branch ready for review` and `deliver: opened pull request #11`; `isDraft` was `true`, `headRefName` `feat_invoices_4`, the body carried `Started from #10.` and the six commands, the issue's `completed` comment named the pull request, and both items carried `sdlc-harness: done`. The issue's timeline showed no `cross-referenced` event, as expected with the job's token.
>
> Leg (e) **passed**: a review requesting changes with two inline comments (`src/invoice-limits.ts` line 2, `src/invoice-render.ts` line 9), its body reserving two more security limits, was placed by its own control job as `chore: add user review for feat_invoices_4`. The round file carried the body verbatim under `## Review by @expause-admin` with its provenance line, both inline comments with file, line, `Made on commit`, author link and hunk, and the marker `reviews=5412752170 comments=4182722327,4182722338`; the started-round comment read `Round 1 from pull request #11 … by @expause-admin`. The user-review fix-plan writer parked, question 2 was posted whole on the pull request, and the bare `@sdlc-harness answer` there resumed it. Leg (f) **passed** but for one condition not observed: `@sdlc-harness approve` got the reply listing the six commands and its control run concluded `success` — round 6's finding 3 re-observed fixed; `@sdlc-harness status` on the issue and on the pull request each replied with the state and the latest run and changed no label, but named the previous engine's ledger as all ticked, which is finding 2; a bare `pause` and an *Approve* review each gave a `skipped` control run. A second review requesting changes, submitted while round 1 ran, was answered `your review was collected. … Nothing needs to be submitted again.`, no second round commit appeared, and round 1's `collect` job placed it as `feat_invoices_4_review_2.md` and started round 2. A review then started round 3, and three more, submitted back to back while it ran, were none refused; the jobs for the second and fourth answered "collected", and the third's pending job was `cancelled` by the fourth and posted nothing. Round 3 was then stopped by leg (g) and ended by leg (h) before it completed, so the `collect` job placing those three reviews in one round file was **not observed** this round; round 6 observed it. Leg (g) **passed**: `@sdlc-harness stop` on the issue got `Stop requested by @firu-daniel; …`, a `stopped` comment reading `Stopped by @firu-daniel.`, `sdlc-harness: stopped` on both items and the round's run `cancelled` with its bundle saved and uploaded. `@SDLC-HARNESS pause` on the stopped run passed the `if:` and was refused as `` the run on `feat_invoices_4` is `stopped`; its cancelled job is still finishing `` — round 6's finding 7 re-observed fixed. `@sdlc-harness resume` restarted it, and the job logged `resumes after a job that did not pause for engine user_review … — no pause note` with no line naming `PAUSE_PROGRESS.md` — round 6's finding 8 re-observed fixed. Leg (h): closing the issue while the run ran **passed** — a `stopped` comment on the pull request carried `Stopped because @firu-daniel closed issue #10.`, both items read `sdlc-harness: stopped`, and the run was `cancelled` with its `harness-state` artifact listed. Closing the pull request after a resume **failed** on one condition: the pull request got `Stopped because @firu-daniel closed pull request #11.` and the run was `cancelled`, but the resumed job's own `resumed` report landed a second after the stop, fell back to the issue, and left it reading `sdlc-harness: running`, which is finding 3. Deleting the branch after a further resume **passed**: the issue got a `stopped` comment saying the branch was deleted and the run cannot be resumed, its label read `sdlc-harness: stopped`, a `harness stop feat_invoices_4` run was listed under `main`, and no run followed. The close by a triage user and the triage refusal were not run, the repository being owned by a personal account. Leg (i) **passed** — round 6's finding 6 re-observed fixed: a `harness-run.yml` dispatch from `main` naming `feat_invoices_4` failed in its `wrong-ref` job with `this run was dispatched from 'main', but its branch input is 'feat_invoices_4': …`, and its `run` job was skipped. Four rows of `docs/github-run-control.md` → `## 8. What is not verified here` are moved to *Verified in Gate 12 round 7*.
>
> The findings:
>
> 1. **`harness-control.yml` as 0.6.1 renders it is not valid YAML, so no comment, review, close or deletion reaches `control`.** The job `if:` is a plain scalar that #64 extended with the state-label prefix `'sdlc-harness: '`, whose `: ` makes the line a mapping. GitHub listed the workflow by its path, failed the adoption push's run on a workflow file issue, and started nothing for leg (b)'s comment. No gate parses the rendered workflows.
> 2. `status` early in a user-review round names the previous engine's ledger as all ticked while it calls the run `running`: the control job reads the ledger from its fetch of `origin`, made before the round's fresh ledger lands.
> 3. A run job's `resumed` report that lands after a stop posts `resumed` and sets `sdlc-harness: running` on a stopped run: `forge_report` checks whether the branch was stopped for `failed` alone.
>
> All three are carried to `fix_forge_run_control_gate12_round7_findings`.
>
> What still owes a first recording: (v)'s enable and its in-progress artifact listing; (vii), (ix) and (x); (xii)'s last leg on a real release after the one under test; (xiii)'s machine-off condition and its leg (b) refusal; (xiv) on an unpatched `harness-control.yml` once finding 1 is fixed, its leg (f) `collect` of the back-to-back reviews into one round, its leg (h) pull-request close leaving both items `stopped`, and its triage refusal and triage close, not runnable on a repository owned by a personal account; and the rest of `docs/github-run-control.md` → `## 8.`.

---

## Acceptance criteria

- **Item 1:**
  - The rendered `harness-control.yml` parses, and `actionlint` reports no syntax error on any of the four rendered workflows.
  - A gate parses every rendered workflow template, fails on a YAML error, and runs `actionlint` where it is installed. The gate is listed in `docs/development.md` → `## 5.` and in `scripts/run-gates.sh`.
  - The gate fails on 0.6.1's file: show it in the plan's verification, or as a negative fixture.
  - `doctor --check-github` reports a harness workflow that GitHub lists by its path as `FAIL`, naming the file and the route to the fixed copy. Covered by a `gh`-stub suite case.
  - A 0.6.1 adopter has a stated, tested route to the fixed file. The release notes, or the docs the plan names, carry it.
- **Item 3:** a `gh`-stub suite case where a stop lands between a resumed job's start and its `resumed` report. Nothing from the stopped job posts a comment or changes a label, so both items stay `stopped`. The same holds for `paused`, `parked` and `round`.
- **Item 2:** a `gh`-stub suite case where `status` runs while a round is running and the ledger on `origin` is the previous engine's completed one. The reply does not say every entry is ticked.
- **Item 4:**
  - `docs/development.md` carries the Round 7 paragraph, and only round 7's *"What still owes a first recording"* sentence stands.
  - `docs/github-run-control.md` → `## 8.` carries the *Verified in Gate 12 round 7* table, and the four rows have left the main table.
- **Docs and tests:**
  - The `harness-control.yml` and `remote-run.sh` header paragraphs match the new behaviour.
  - Gate 12 → (xiv)'s setup in `docs/development.md` checks that GitHub lists all four workflows by name.
  - The full test suite passes.

## Out of scope

- The version bump and the release of 0.6.2.
- Roadmap item 19: the PR opened at the run's start, its draft state following the run, `completed` on the PR, phase comments and resolved threads.
