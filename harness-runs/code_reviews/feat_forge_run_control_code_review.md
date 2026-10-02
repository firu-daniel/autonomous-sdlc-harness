# Code Review: feat_forge_run_control

## Context

**Branch:** `feat_forge_run_control`
**Date:** 2026-10-01
**Reviewed:** the whole branch diff against `dev` (`git diff dev...HEAD`), 41 files across all three layers, with the task prompt and the story index read for intent. 43 run-artifact files excluded from the reviewed diff.
- **`cli`:** the run-control names in `remote/githubActions.ts`; the forge workflows in the generator, `init`'s report and `doctor`'s `forge` and `remote-github` checks; the new `harness-control.yml` and the `deliver` and report wiring in the run and resume workflows; `remote-run.sh`'s `report`, `deliver` and `control` verbs, the shared `authorise_actor`, and the round and stop reporting in `review` and `stop`; the watcher's job-mode `notify()`; and the seven test suites that drive them.
- **`plugin`:** `user-review-fix-plan-writer.md` and the two flow documents. These were checked against `.claude/context/plugin.md`, and four of its rules hold:
  - The new `<scripts_dir>` row's `Class` is `config value`, one of the four classes `## The placeholder vocabulary` allows, and it names the `scriptsDir` key that `schemas/harness.config.schema.json` declares.
  - The quoted wire strings `## Inline comments`, `(The review carries no summary.)`, `original line <n> (outdated)` and ``Made on commit `<sha>`.`` match what `remote-run.sh` → `control_review_round` emits byte for byte (`## Wires: dispatch in, return out`).
  - `@sdlc-harness` and `sdlc-harness: <state>` are the harness's own constants, `COMMAND_HANDLE` and `STATE_LABEL_PREFIX` in `cli/src/remote/githubActions.ts`, mirrored in `remote-run.sh`. They are not adopter values, so `## What this layer is` → *No adopter's value is ever a literal here* is not breached.
  - `<scripts_dir>/remote-run.sh` is cited by its adopter-repo path and never as a `${CLAUDE_PLUGIN_ROOT}` path (`## Citation`).

  One gap remains. The producer writes a third, line-less heading form that the fix-plan writer's form omits, which is Finding 8.
- **`general`:** the schema description, `ARCHITECTURE.md`, `ROADMAP.md`, `README.md`, `llms.txt` and the `docs/` set, including the new `docs/github-run-control.md`.

This review ran no suite. Every new verb, workflow and `doctor` arm has a suite that drives it against a `gh` stub. Whether those suites pass is for the Run gates phase to establish. `phases.parity` is `false`, so no parity cross-check applies.

**The pre-sweep.** The sweep table in this agent's definition is unfilled, so the grep half of it found nothing. The caller check found a caller outside the defining file for every new export, under `cli/src` or in the mirror suites. The architecture review's four findings are fixed on this branch and are not repeated here.

**Lessons ledger.** The diff exercises ten ledger rules, in four of the ledger's five sections; `## Layer ownership` is covered by the per-layer checks above. All ten hold, so none of them produced a finding:
- *Unattended control loops*, the bounded-retry rule:
  - `verb_deliver` retries a failed draft create exactly once without `--draft`, and makes no retry on GitHub's `PR_CREATE_FORBIDDEN` refusal. It then posts one `completed` comment naming the error and the compare URL to open the pull request by hand.
  - `forge_set_state` makes at most two label `POST`s, creating the missing label between them. On the second failure it logs the error and returns, and the lifecycle comment has already been posted.
- *Unattended control loops*, the expiring-store rule:
  - `control_answer`'s `paused:expired` arm refuses with the expiry detail and points at `resume`.
  - `control_resume` resumes an expired pause from the committed ledger, never as a fresh start, and the job's `verb_restore` emits the `::warning::` naming the expiry and what was lost.
  - `verb_review` refuses a `paused`/`expired` run by quoting `RS_DETAIL`.
- *Remote and branch-scoped operations*, the single-branch rule: `verb_control` resolves exactly one `CONTROL_BRANCH`, from `control_check_branch`, `control_branch_from_pr` or `control_branch_from_issue`, and every child verb is passed that branch only.
- *Remote and branch-scoped operations*, the temporary-working-copy rule:
  - `report` and `deliver` remove the `mktemp -d` directory they made, and only that one, by `rmdir "$made_tmp"`. Neither verb has an exit between creating the directory and removing it.
  - `control` records every directory it creates in `control_dirs`, and the `control_cleanup` `EXIT` trap removes them. `RUNNER_TEMP` itself is never added.
  - `review`'s cut copy is removed by the `start_remove_copy` `EXIT` trap on every failure and explicitly on success. A pre-existing mirror is never removed.
- *Remote and branch-scoped operations*, the act-where-it-lives rule: a changes-requested review's round is committed and pushed onto the branch on origin by the job, through the `review --allow-no-run` child. It is not relayed through any local record.
- *Adopter-facing documentation*, the fenced-command rule:
  - `docs/github-run-control.md` puts every comment command in its own fence: the four bare verbs and `answer 2` in `## 1. Commands in a comment`, the multi-line answer in `## 3. Answering a park in a comment`, `/autonomous-sdlc-harness:branch-user-review` in `## 4. The draft pull request`, and `git pull --ff-only` in `## 7. Working a run from both sides`.
  - Its one-time setup list under `## The GitHub entry point` names `init` and `/autonomous-sdlc-harness:harness-analyze` without fences. Each step links to `README.md` → `### Adopting it in your own repository`, steps B and C, where the command sits in its own fence, so the list points at a fenced command and does not restate it inline.
  - The edited documents fence each command they add: `gh label create sdlc-harness`, `gh secret set HARNESS_GIT_TOKEN` and `/autonomous-sdlc-harness:branch-user-review` in `docs/cli.md`; `npx autonomous-sdlc-harness init --force` and `gh variable set HARNESS_TRIGGER_LABEL --body harness` in `docs/github-issue-trigger.md`, each in its own fence.
- *Adopter-facing documentation*, the adopter-vocabulary rule: the new adopter-facing surfaces are the five verbs `answer`, `pause`, `resume`, `stop` and `clear`, the handle `@sdlc-harness` and the six `sdlc-harness: <state>` labels. Each is a plain English word or the product's own name. The configuration keys, workflow file names and variables they sit beside (`forge`, `execution.target`, `HARNESS_GIT_TOKEN`, `HARNESS_TRIGGER_LABEL`) are wire identifiers, which the rule keeps as they are.
- *Evidence and measurement*, the stub-figure rule: no design decision rests on a figure measured under a stub. The question cut at 250,000 bytes in `docs/github-run-control.md` § 3 rests on S6, a measurement against GitHub itself. The row `docs/github-issue-trigger.md` adds as "Driven by a `gh` stub, not observed on GitHub" records a gap and justifies nothing.
- *Evidence and measurement*, the unmeasured-ships-its-seam rule: each behaviour `docs/github-run-control.md` → `## 8. What is not verified here` lists as unmeasured has two things:
  - an *If it is wrong* outcome that shows up in the job log or the posted comment;
  - a measuring step, Gate 12 observation (xiv) in `docs/development.md`, which this branch adds.

  The PR-conversation size bound and the draft fallback (C3) are both rows there.
- *Evidence and measurement*, the decision-as-proposal rule: the `ROADMAP.md` edit records shipped work ("**Run control has shipped:**") and narrows *Still open* to other trackers. It writes no decision-rule verdict into any document as pending work.

The ledger's wall-clock rule was checked and is not exercised: the diff adds no timing figure to any document of record.

**What remains:**
- **Two Must Fix behaviours.**
  - Three files state that a pull request's head never shapes the control job. The research this branch cites records that a `pull_request_review` job runs the workflow file from the pull request's merge commit, and the three files include `## 11. Security`'s promise to self-hosted-runner adopters.
  - A failed run's issue comment names `sdlc-harness` as the label to re-apply, even when another label started the run.
- **One Must Fix pointer.** `ARCHITECTURE.md` points at a README bullet this branch renamed.
- **Four Should Fix items and one Nice to Have.**

`.claude/context/conventions.md` → `## Not determined` still says the meaning of `forge` beyond the trigger is unsettled. The story index's scope register raises that as a corpus-staleness entry. A conventions document is never a task's target, so it is not a finding here.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 7** — Name both events in `control`'s exit-map line for exit 1 _(layer: cli)_
2. [x] **Finding 3** — Repoint `ARCHITECTURE.md` at README's renamed forge bullet _(layer: general)_
3. [x] **Finding 8** — Name the line-less file-comment heading in the fix-plan writer's pull-request review comment form _(layer: plugin)_
4. [x] **Finding 6** — Build the draft pull request's command list from `COMMAND_VERBS` _(layer: cli)_
5. [x] **Finding 4** — Report an unreadable secret list as *cannot tell* in `doctor`'s pull-request-setting arm _(layer: cli)_
6. [x] **Finding 5** — Mirror `PR_CREATE_SETTING` and its path in `remote-run.sh` and use them in `deliver`'s comment _(layer: cli)_
7. [x] **Finding 2** — Name the label that started the run in a failed run's issue comment _(layer: cli)_
8. [x] **Finding 1** — Correct the fork and merge-commit claims about `harness-control.yml`'s review event _(layer: cli, general)_

---

## Must Fix

### 1. Three files say a pull request's head never shapes the control job, but a review event runs the workflow file from the pull request's merge commit
→ [finding_1.md](feat_forge_run_control_code_review/finding_1.md)

### 2. A failed run's issue comment tells the maintainer to re-apply `sdlc-harness` even when another label started the run
→ [finding_2.md](feat_forge_run_control_code_review/finding_2.md)

### 3. `ARCHITECTURE.md` still points at README's *Forge-agnostic* bullet, which this branch renamed
→ [finding_3.md](feat_forge_run_control_code_review/finding_3.md)

---

## Should Fix

### 4. `doctor --check-github` says `HARNESS_GIT_TOKEN` is not set when it could not read the secret list
→ [finding_4.md](feat_forge_run_control_code_review/finding_4.md)

### 5. `deliver`'s comment spells GitHub's pull-request setting and its path a second time, with different arrows from the owner
→ [finding_5.md](feat_forge_run_control_code_review/finding_5.md)

### 6. The draft pull request's body hand-lists four of the five commands, under a condition only one of them has
→ [finding_6.md](feat_forge_run_control_code_review/finding_6.md)

### 8. The fix-plan writer's pull-request review comment form omits the line-less heading `remote-run.sh` writes for a comment on a whole file
→ [finding_8.md](feat_forge_run_control_code_review/finding_8.md)

---

## Nice to Have

### 7. `control`'s exit map says exit 1 means "not an `issue_comment` event", but it also handles `pull_request_review`
→ [finding_7.md](feat_forge_run_control_code_review/finding_7.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences.
