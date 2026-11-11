# Skeptic Review: chore_devscene_env_variables

## Context

**Branch:** `chore_devscene_env_variables`
**Date:** 2026-11-12
**Reviewed:** the whole-branch diff against `origin/dev` up to `06959328`. `defaultBranch` is `dev`, which has no local branch in this run copy. That is 138 files, +1202 / −1194, and covers:
- the `cli/src` constants;
- the shell and workflow templates and their self-adopted copies;
- every respelled suite;
- the plugin's shell library, QA helpers and prose;
- the documents and the worked example's dev-server files.

35 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/chore_devscene_env_variables_code_review.md` and its two findings. No parity review exists, because `phases.parity` is `false`, so check 2's parity leg is inert. No architecture review exists for this branch: `harness-runs/architecture_reviews/chore_devscene_env_variables/` holds only a per-unit `review_0.md`.

**What was verified first-hand:**
- **Mirror pairs.** Every `vars.` / `secrets.` / `env.` reference in the four workflow templates and the probe runner is either a renamed table name, a kept plumbing name or an unprefixed name. No mirror is renamed on one side only.
- **Credential wiring.** `SESSION_ENV_STRIP_EXTRA`, `hr_credential_values_var` and `GIT_TOKEN_SECRET` / `PUSH_URL_SECRET` agree.
- **Main-checkout anchor.** `MAIN_REPO_ANCHOR_*`, `hc_main_root_var`, the watcher's `export` and the plugin's `printenv` reads agree.
- **Pasted text.** The Task 26 paste record matches the new templates' header text.
- **Citation.** The breaking-rename lesson the story index cites exists and says what it is cited for.

**Headline.** The rename itself is consistent. Two net-new findings:
- **Finding 1.** The story index's manual migration step re-renders only two of the four workflows and none of the scripts. A maintainer who follows it gets a repository whose forge workflows and scripts still read the `HARNESS_*` names it was just told to delete.
- **Finding 2.** The watcher's `SESSION_ENV_BASE` derivation grep was left unable to match a `DEVSCENE_*` name.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside per-finding files, are informational only. They are NEVER the iteration source, and the committer does NOT touch them.

Each entry resolves to a self-contained `harness-runs/skeptic_reviews/chore_devscene_env_variables_skeptic_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable identity.

1. [ ] **Finding 2** — Add `DEVSCENE` to the watcher's `SESSION_ENV_BASE` derivation grep, in the template and its adopted copy _(layer: cli, general)_
2. [ ] **Finding 1** — Make the story index's manual migration step run `init --force`, which replaces all four workflows and the scripts, instead of `--upgrade-workflows` _(layer: general)_

---

## Must Fix

### 1. The story's manual migration step re-renders only two of the four workflows and none of the scripts, so the migrated repository reads deleted `HARNESS_*` names
→ [finding_1.md](chore_devscene_env_variables_skeptic_review/finding_1.md)

---

## Should Fix

### 2. The watcher's `SESSION_ENV_BASE` derivation grep can no longer find a `DEVSCENE_*` name, though its own prose lists two among its hits
→ [finding_2.md](chore_devscene_env_variables_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so there is no reference-implementation divergence to call out.

- **Verified-OK: the kept plumbing names reach no adopter-facing text.** `HARNESS_STOPPED`, `HARNESS_TRIGGER_LOOKUP_SECS` and `HARNESS_REPO_SLUG` have no hit in `README.md`, `docs/`, `cli/src` or `plugin/`. The story index's *Names kept* classification therefore holds for them.
