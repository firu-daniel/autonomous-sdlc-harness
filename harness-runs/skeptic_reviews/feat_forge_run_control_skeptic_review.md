# Skeptic Review: feat_forge_run_control

## Context

**Branch:** `feat_forge_run_control`
**Date:** 2026-10-01

**What was reviewed.** The whole branch diff against `dev` (`git diff dev...HEAD`): 41 files across `cli`, `plugin` and `general`. 54 run-artifact files excluded from the reviewed diff.

The adversarial pass covered:
- `remote-run.sh`'s new `report`, `deliver` and `control` verbs, and the forge-surface helpers;
- the shared `authorise_actor`;
- the `review` and `stop` reporting;
- the watcher's job-mode `notify()`;
- `harness-control.yml` and the `deliver` / cancelled-job steps of `harness-run.yml`;
- `doctor`'s new GitHub reads;
- in the `plugin` layer, the new **Pull-request review comment** reference form in `plugin/agents/user-review-fix-plan-writer.md` → `## Process` (steps 1 and 2) and its `<scripts_dir>` row in `## Resolved values`, as a consumer of the round `remote-run.sh` → `control_review_round` writes; and the forge-coupling sentences changed in `plugin/docs/AUTONOMOUS_FLOW.md` and `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`.

The task prompt and the story index were read as claims to verify.

**De-duplicated against.** These reviews were already committed:
- the code review `harness-runs/code_reviews/feat_forge_run_control_code_review.md`, Findings 1–8;
- the architecture review `harness-runs/architecture_branch_reviews/feat_forge_run_control_arch_review.md`, Findings 1–4.

`phases.parity` is `false`, so no parity review exists, and check 2's parity leg does not apply.

**What held up.** Every new verb and export has a caller. The checks were:
- `report` is reached from the watcher's job-mode `notify()`, from `remote-run.sh`'s own `notify()`, from `stop`, from `review` and from the cancelled-job step;
- `deliver` and `control` are reached from their workflow steps;
- the TypeScript names are consumed by `init`, `doctor` and the mirror suites.

The actor gate is enforced inside `control` on every path: fork, `ghost`, unlisted bot, a permission other than `write`/`admin`, a failed permission call, an unrecognised branch and the harness's own marker. The workflow `if:` is only a prefilter.

The issue-to-branch lookup trusts only a `github-actions[bot]` comment whose first line is the trigger's start sentence and whose last line is the exact `started` marker. The provenance line `forge_issue_var` reads is the last line `trigger` writes, so issue text cannot override it.

The partial-answer claim in `control_answer` was confirmed against `autonomous-watcher.sh` → `run_job`, which stops an `answer` job with an incompletely answered park before any session. The 250,000-byte question cut rests on S6, which was measured.

The `plugin` layer holds up, checked against `.claude/context/plugin.md` → `## Wires: dispatch in, return out` and `## The placeholder vocabulary`. The fix-plan writer's pull-request review comment form is a consumer of the round `cli/templates/scripts/remote-run.sh` → `control_review_round` writes, and it matches that producer on every string it keys off:
- the `## Inline comments` heading (the jq template's `"\n## Inline comments\n"`);
- the three heading shapes `` ### `<file>`, line <line> ``, `` ### `<file>`, original line <line> (outdated) `` and the bare `` ### `<file>` `` (the template's `.line != null` / `.original_line != null` / `else ""` arms);
- the ``Made on commit `<sha>`.`` line, followed by the comment body and a fenced `diff` hunk;
- the `(The review carries no summary.)` sentinel, written in place of an empty review body;
- the `---` line between the review body and the provenance sentence, which step 1 names as the body's lower bound.

The `<scripts_dir>` row added to `## Resolved values` uses the three-column form with `Class` `config value`, one of the classes `## The placeholder vocabulary` allows, and names the `scriptsDir` key. The flow-document edits restate the shipped GitHub coupling (draft pull request, comment commands, review rounds) and introduce no wire string. No net-new `plugin` finding; the code review's `plugin` clean-pass reached the same conclusion, and its Finding 8 (the bare `` ### `<file>` `` heading) is already fixed on this branch.

**Headline.** Two net-new Must Fix items. Both are lifecycle comments that name the wrong next action, so a maintainer who follows them does the wrong thing:
- a failure the job is about to auto-resume tells the maintainer to re-apply the trigger label, which starts a duplicate run;
- the `stopped` comment points at a review that `review` refuses on a branch stopped mid-run, and never names the `resume` command that works.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Name `@sdlc-harness resume` as the way on in the `stopped` comment and its documentation row _(layer: cli, general)_
2. [ ] **Finding 1** — Report a job-mode `failed` to GitHub only once the job's automatic resumes are ruled out _(layer: cli, general)_

---

## Must Fix

### 1. A job-mode failure that will be auto-resumed still posts `failed` and tells the maintainer to re-apply the trigger label, which starts a duplicate run
→ [finding_1.md](feat_forge_run_control_skeptic_review/finding_1.md)

### 2. The `stopped` comment says a new review starts another round, but a review on a branch stopped mid-run is refused; the command that works, `resume`, is not named
→ [finding_2.md](feat_forge_run_control_skeptic_review/finding_2.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there are no reference-implementation divergences. No divergence marked intentional in the plan or the code failed check 4. The one this review re-graded holds: an answer, resume, clear or review sent while a job is in flight is refused with a reply rather than queued. The reason given is that a queued dispatch could be cancelled by a newer pending run in the per-branch `concurrency` group. Each refusal says to send the command again, and nothing is lost silently.
