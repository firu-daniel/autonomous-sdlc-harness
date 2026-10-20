# Code Review: feat_clone_per_run_anchor

## Context

**Branch:** `feat_clone_per_run_anchor`
**Date:** 2026-10-20
**Reviewed:** the whole branch diff against `dev`, 87 files: the `cli` layer (`cli/src/core/mainRepoAnchor.ts`, the `profile-main-anchor` check in `cli/src/doctor/checks.ts`, the anchor rule and `_README` line in `cli/src/generators/permissionProfile.ts`, the watcher's `spawn_engine` export and the comment-only notes in `harness-run-lib.sh`, `remote-run.sh` and `setup-worktree.sh`, the run-copy wording in the profile, `repo/` and state-directory templates, and the suites: `doctor-main-anchor`, `main-anchor-isolation`, `watcher-main-anchor`, the new `qa-user-locks` clone cases and the anchor blank at every `process.env` spread). The `plugin` layer: `hc_main_root`'s anchor read, the two QA-lock helpers' headers and REPRO blocks, the canonical `<MAIN_REPO>` row in all eight declaring files, the canonical clause at every prose resolution site, and the run-copy sweep across agents, commands, instructions, flow documents and READMEs. The `general` layer: `docs/watcher.md`, `docs/cli.md`, `docs/sandbox-verification.md`, `docs/guard-verification.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `docs/config.md`, `docs/retrieval.md`, `docs/remote-execution.md`, and the worked example's re-rendered profile. 23 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**

- **The anchor closure holds.** `grep -rn 'worktree list' plugin` prints only lines that carry `printenv HARNESS_MAIN_REPO`, plus the two sites the story's scope register records as `no-change`: `branch-prompt.md`'s collision guard (b), and `improvement_observations_instructions.md`'s machine-path needles.
- **The canonical texts are byte-identical.** All eight `<MAIN_REPO>` rows match, and every one of the fourteen prose sites carries the canonical clause verbatim.
- **Agent word counts held.** No changed agent definition grew: `committer.md` −6, `qa-tester.md` −6, `layer-implementer.md` −1, and every other changed agent 0.
- **No outer-loop script reads the anchor.** The name is spelled in `cli/src` only by its owning module. `spawn_engine` is the only launch site, and it overwrites an inherited value. The three new exports each have callers outside the defining file.
- **Tests: present, not run.** Every accompanying test the touched layers require is present. This review runs no suite: the Run gates phase establishes whether they pass.
- **Merge blockers outside this review.** The owed rows AN1–AN4 in `docs/sandbox-verification.md` and the story's three **Manual setup required** steps are a person's to take before merge. This review cannot settle them.
- **Parity.** `phases.parity` is `false`, so nothing is held to a reference implementation.

Pass 2 was a no-op: the per-unit findings root holds no review folders for this branch. The three findings below are all Should Fix. Two are gaps in the tests that guard the anchor's isolation and its `doctor` grade. The third is a too-narrow rename sweep in the owning module's header.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committing role flips each one to `[x]` as that fix's commit lands — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else are informational only. Each entry resolves to `harness-runs/code_reviews/feat_clone_per_run_anchor_code_review/finding_<K>.md`.

1. [ ] **Finding 3** — Widen `mainRepoAnchor.ts`'s header rename sweep to a repository-wide `git grep` that also reaches the worked example's profile and the documents _(layer: cli)_
2. [ ] **Finding 2** — Add a `deny`-list case to `doctor-main-anchor.test.mjs` _(layer: cli)_
3. [ ] **Finding 1** — Make the suite-isolation source guard check each `process.env` spread rather than each file _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The suite-isolation source guard passes a whole file once that file names the anchor anywhere, so an unblanked `process.env` spread added beside a blanked one goes unnoticed
→ [finding_1.md](feat_clone_per_run_anchor_code_review/finding_1.md)

### 2. `doctor-main-anchor.test.mjs` states that a rule in `deny` warns, but no case puts the rule in `deny`
→ [finding_2.md](feat_clone_per_run_anchor_code_review/finding_2.md)

### 3. `mainRepoAnchor.ts`'s header limits the rename sweep to `cli/` and `plugin/`, which misses the worked example's rendered profile and the documents that quote the name
→ [finding_3.md](feat_clone_per_run_anchor_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section carries no parity call-out.
