# Code Review: chore_devscene_env_variables

## Context

**Branch:** `chore_devscene_env_variables`
**Date:** 2026-11-12
**Reviewed:** the whole branch diff against `origin/dev`, from merge base `676e81d7` to `ddf42da3`: 138 files, +1198 / −1194. That covers:
- the variable-name constants in `cli/src` (Task 2);
- the shell and workflow templates and their self-adopted copies under `scripts/` (Tasks 3–6, 16–17);
- every `cli/test` suite and helper (Tasks 1, 7–13, 18);
- the plugin's shell library, QA helpers and `<MAIN_REPO>` prose (Tasks 14–15);
- the root and `docs/` documents (Tasks 19–25);
- the worked example's live dev-server files (Task 26).

31 run-artifact files excluded from the reviewed diff. `defaultBranch` is `dev`, which has no local branch in this checkout, so every diff was taken against `origin/dev`.

**Headline conclusions.** The rename is complete and exact.

**The renamed tokens are all gone.** The story index's D1 grep over the whole tree, minus `harness-runs/`, finds the 24 renamed tokens only in four places:
- `.claude/push-notify.env.example`;
- `examples/notes-app/.claude/{push-notify.env.example, qa-accounts.env.example, settings.autonomous.json}`. These are the `.claude/**` sites Task 26's `## Paste record` hands to the maintainer, to apply before merge.
- `examples/notes-app/.claude/context/conventions.md`, the recorded-release exception.

**The token counts reconcile.** I counted each `HARNESS_*` and `DEVSCENE_*` token at the base and at the tip with `git grep --threads=1 -ohE`.
- Every kept name has the same count at the base and at the tip, so no plumbing name was respelled by mistake.
- Each renamed name's `DEVSCENE_` count plus its leftover `HARNESS_` count equals its count at the base, with two expected shortfalls:
  - `HARNESS_RUNNER` is down 1, because `doctor --help` now interpolates `${RUNNER_VARIABLE}`;
  - `HARNESS_MAIN_REPO` is down 2, because the corpus guard now builds both clauses from `MAIN_REPO_ANCHOR_READ`.
- Every `DEVSCENE_` token is a table row, a prefix form, or one of the `DEVSCENE_DOCS_RETRIEVAL` / `DEVSCENE_RETRIEVAL` / `DEVSCENE_` mentions in `docs/rag-extraction-research/` that were there before this branch.

**The mirrors agree.** Every self-adopted script under `scripts/` has the same blob id as its `cli/templates/scripts/` template. In `cli/src`, the only `DEVSCENE_` literals in code are the owning constants the story index names. The workflow templates, `remote-run.sh`, the watcher's `SESSION_ENV_STRIP_EXTRA` and `harness-run-lib.sh` → `hr_credential_values_var` all read those same names.

**No compatibility path was added.** No fallback read, no key migration and no sentence naming an old name was added anywhere. The `.env.example` headers dropped their "carrying settings over from an earlier runner" sentence, as the breaking-rename lesson requires.

**Tests.** Every suite that sets a seam variable (`DEVSCENE_GH_CLI`, `DEVSCENE_AGENT_CLI`, `DEVSCENE_PUSH_CMD`, `DEVSCENE_FETCH_TIMEOUT`, `DEVSCENE_CLI`) now sets the name its producer reads. `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV` blanks the anchor through `MAIN_REPO_ANCHOR_VARIABLE`, so it follows the rename. This review runs no suite; whether the suites pass is for the Run gates phase to establish. `phases.parity` is `false`, so no parity cross-check applies.

**Pass 0.**
- The grep half is disabled: this agent's sweep list has no regexes filled in.
- The new-exported-symbol caller check found no new export. The 12 `export const` lines the diff adds are existing constants whose values changed, and the matching removals are in the same hunks.

**Pass 2** ran in two-pass mode against `harness-runs/task_plan_point_reviews/chore_devscene_env_variables_task_plan/`. That folder does not exist, because per-unit review was off, so there was nothing to reconcile.

Two findings are left. Both are about prose that the mechanical respelling skipped or left incoherent.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside per-finding files, are informational only. They are NEVER the iteration source, and the committer does NOT touch them.

Each entry resolves to a self-contained `harness-runs/code_reviews/chore_devscene_env_variables_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable identity.

1. [x] **Finding 2** — Restore the `DEVSCENE_*` family to `launch-sandboxed-gates.sh`'s trust clause, in the template and its adopted copy _(layer: cli, general)_
2. [x] **Finding 1** — Record a dated `docs/guard-verification.md` entry for this branch's edit to the shared guard library _(layer: general)_

---

## Must Fix

### 1. The shared guard library changed and `docs/guard-verification.md` carries no dated entry for it
→ [finding_1.md](chore_devscene_env_variables_code_review/finding_1.md)

---

## Should Fix

### 2. `launch-sandboxed-gates.sh`'s trust clause names `DEVSCENE_MAIN_REPO` as "that or any other `HARNESS_*` name"
→ [finding_2.md](chore_devscene_env_variables_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so there is no reference-implementation divergence to call out. The items below are verified-OK notes for the user.

- **Verified-OK: the `.claude/**` paste is a maintainer step before merge, not a defect.** Four sites still carry old names: `.claude/push-notify.env.example` and the three `examples/notes-app/.claude/` renders. No task may write under `.claude/**`. `harness-runs/task_plans/chore_devscene_env_variables/task_26_plan.md` → `## Paste record` gives an exact line-by-line replacement for each, and the story index's **Manual setup required** lists it. Until it is applied, the first D1 command still prints those lines.
- **Verified-OK: dated records were respelled silently, as the story index decided.** Examples are the `2026-10-20` `hc_main_root` entry in `docs/guard-verification.md`, Round 16's `DEVSCENE_RUNNER=ubuntu-24.04` in `docs/sandbox-verification.md`, and the gate rounds in `docs/development.md`. Each now names a variable that did not exist on the date it records. The task prompt's *Done when* allows no `HARNESS_` use outside `harness-runs/` and recorded-release fixtures, and the breaking-rename lesson forbids a sentence saying a name changed. The story index's `## Context` → *Dated records are respelled, silently* settles this, so no finding is raised.
- **Verified-OK: `doctor`'s "written before `DEVSCENE_RUN_ACTORS`" warning.** A `devscene-run.yml` rendered before this branch reads `vars.HARNESS_RUN_ACTORS`, so `carriesRunActors` now reports it as not carrying the allow-list. This warning existed before the branch and remedies with `init --upgrade-workflows`. It is not a new migration path. The doc comment was reworded so it no longer claims to detect only copies older than the allow-list.
