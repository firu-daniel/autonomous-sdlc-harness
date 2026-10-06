# Code Review: fix_forge_run_control_gate12_round8_findings

## Context

**Branch:** `fix_forge_run_control_gate12_round8_findings`
**Date:** 2026-10-06
**Reviewed:** the whole branch diff against `dev`. That is the twelve `cli` tasks:
- `pause-requested`'s exit `5`, and the overlapped, floored control poll with its per-poll log line (Tasks 1–2);
- `push-branch.sh`'s bounded retry, and `hr_push_landed`'s refused/moved split (Tasks 3–4);
- the `engine=` reply marker, never-started detection, engine recovery, `collect`'s `not_started` report and the poller's bounded download wait (Tasks 5–9);
- `control`'s wider harness-branch test (Task 10), the runner-wait log and note (Task 11), and `harness-run.yml`'s gate pointer and header (Task 12).

It also covers the `plugin` correction to `branch-resume.md` (Task 16), the three `general` documentation tasks (Tasks 13–15), and the tests that ship with them. 24 run-artifact files were excluded from the reviewed diff.

The `plugin` edit was checked against `.claude/context/plugin.md` and passes clean. The corrected `paused` bullet in `plugin/commands/branch-resume.md` keeps `<engine>` and `<scripts_dir>` as placeholders. It introduces no adopter literal, no line coordinate and no renamed wire string. Its "starts as the branch's first, from its committed task prompt" agrees with `remote-run.sh`'s `` THE `killed` AND `expired` MAPPINGS `` header: "`restore` finds no previous bundle and the resumed job starts as the branch's first".

Every new behaviour lands with cases in the `cli/test` suites it touches, among them a new `push-branch-retry.test.mjs`, never-started cases in `remote-collect`, `remote-control` and `remote-run`, and overlap, floor and runner-wait cases in `watcher-remote-job`. This review runs no suite; whether they pass is the Run gates phase's to establish. The round 8 record in `docs/development.md` matches the task prompt's dated paragraphs. `phases.parity` is `false`, so no parity cross-check ran. `per_task_findings_root` holds no per-unit review files, so the reconciliation pass carried nothing over.

The eight findings below are what is left:
- `sync` drops the engine Task 7 recovers (Finding 1).
- `hr_push_landed` reads a landed push as refused once its own fetch shows origin equal to `HEAD` (Finding 2).
- A failed artifact lookup on a completed run keeps the poller waiting with no bound, against the ledger's bounded-retry rule (Finding 3).
- Four smaller wording and edge-case defects, and one cosmetic one.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else are informational and are never the iteration source.

Each entry resolves to `harness-runs/code_reviews/fix_forge_run_control_gate12_round8_findings_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order: small, self-contained fixes first, wider ones last. `K` is the finding's stable identity.

1. [x] **Finding 7** — Remove the claim that `answer` works on a run whose job never started from `github-run-control.md`'s command table and its `## 8.` row _(layer: general)_
2. [x] **Finding 8** — Repoint the refused-push reason's "names the refusal above" at the job log _(layer: cli)_
3. [x] **Finding 6** — Drop "from its committed ledger" from the `not_started` comment's `resume` way on _(layer: cli)_
4. [x] **Finding 5** — Name `branch-resume` in `collect`'s `not_started` push only when the state is `paused` _(layer: cli)_
5. [x] **Finding 2** — `hr_push_landed` answers `0` when its fetch shows origin equal to `HEAD` _(layer: cli)_
6. [x] **Finding 1** — `sync` writes the recovered engine for a run GitHub never started _(layer: cli)_
7. [x] **Finding 4** — Do not measure or note a runner wait on a re-run attempt _(layer: cli, general)_
8. [x] **Finding 3** — Count a completed run's failed artifact lookup under the poller's download-failure bound _(layer: cli, general)_

---

## Must Fix

### 1. `sync` throws away the engine it recovered for a run GitHub never started, so a local resume can dispatch the wrong engine
→ [finding_1.md](fix_forge_run_control_gate12_round8_findings_code_review/finding_1.md)

### 2. `hr_push_landed` answers "refused" when its own fetch shows the push landed
→ [finding_2.md](fix_forge_run_control_gate12_round8_findings_code_review/finding_2.md)

### 3. The poller waits on a completed run whose artifact lookup fails, with no bound
→ [finding_3.md](fix_forge_run_control_gate12_round8_findings_code_review/finding_3.md)

---

## Should Fix

### 4. On a re-run attempt the runner wait counts from the first attempt, and the `resumed` comment blames GitHub for hours it did not take
→ [finding_4.md](fix_forge_run_control_gate12_round8_findings_code_review/finding_4.md)

### 5. `collect`'s `not_started` push notification tells the operator to run `branch-resume` on a run it records as `failed`
→ [finding_5.md](fix_forge_run_control_gate12_round8_findings_code_review/finding_5.md)

### 6. The `not_started` comment promises a resume "from its committed ledger" to a first run that has none
→ [finding_6.md](fix_forge_run_control_gate12_round8_findings_code_review/finding_6.md)

### 7. `github-run-control.md` says `answer` works on a run whose job never started; it is refused
→ [finding_7.md](fix_forge_run_control_gate12_round8_findings_code_review/finding_7.md)

---

## Nice to Have

### 8. The refused-push reason says "names the refusal above" in a pull-request comment that has nothing above it
→ [finding_8.md](fix_forge_run_control_gate12_round8_findings_code_review/finding_8.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section carries no parity call-out.
