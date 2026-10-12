# Code Review: feat_unattended_bash_sandbox

## Context

**Branch:** `feat_unattended_bash_sandbox`
**Date:** 2026-10-12
**Reviewed:** the whole branch diff against `dev` (`git diff dev...HEAD`), 97 files in six segments: the `cli/src` generators (`sandboxProfile.ts`, `writeProtection.ts`, `profileEntries.ts`, `permissionProfile.ts`, `outerLoopScripts.ts`) and the shipped profile template; the configuration-key contract (schema, `config/model.ts`, `config/check.ts`, `docs/config.md` §5, the two negative fixtures and their `validate:config:negative` wiring); `doctor`'s `profile-sandbox` and `profile-write-protection` checks; the shell templates (`lib/harness-run-lib.sh`'s git-free section, `push-branch.sh`, `refresh-branch.sh`, `setup-worktree.sh`, the watcher's `PERMISSION_MODE`) and their five new suites; the plugin corpus (the `<MAIN_REPO>` push spelling, the sandbox-refusal reading in `layer-implementer.md` and `test-fix-plan-writer.md`, the `dontAsk` rewording); and the `general` prose and the re-rendered `examples/notes-app` profile. 45 run-artifact files excluded from the reviewed diff.

The configuration key lands in all four required places in the right order, each new `cli/src` module carries its rule-stating header, `doctor` reads every expected value from the generator and the template, and every behaviour the new shell code adds has a case driving the shipped template against a throwaway fixture. Whether those suites pass is the Run gates phase's to establish; this review ran none. Pass 0's grep half had no regexes configured, so it found nothing; the new-export caller check found no export without a consumer. `phases.parity` is `false`, so no parity cross-check applies. Pass 2 reconciled nothing: the per-unit findings root holds no review files.

What remains is two containment gaps and five smaller defects. The write protection skips most of the outer-loop scripts the watcher and the remote job run unsandboxed from the main checkout. Four corpus sites put the commit and the excluded push in one fenced block, so a run that issues the fence as one call pushes sandboxed. On macOS that push fails over SSH while the wrapper still exits 0.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else, such as sub-step bullets inside a per-finding file, are informational, and the committer never touches them. Each entry resolves to `harness-runs/code_reviews/feat_unattended_bash_sandbox_code_review/finding_<K>.md`. The leading number is the ship order and the `K` is the finding's stable identity.

1. [x] **Finding 6** — Refuse a push whose current branch name begins with `-` in `push-branch.sh` _(layer: cli)_
2. [ ] **Finding 4** — Set `failIfUnavailable: false` alongside `enabled: false` under a taken `sandbox.optOut` _(layer: cli, general)_
3. [ ] **Finding 1** — Write-protect the main checkout's copy of every top-level outer-loop script _(layer: cli, general)_
4. [ ] **Finding 3** — Write-protect the profile and the project settings files whose hooks run outside the sandbox _(layer: cli, general)_
5. [ ] **Finding 2** — Put the `<MAIN_REPO>` push in its own fenced block and Bash call at the four sites that share one with the commit _(layer: plugin)_
6. [ ] **Finding 5** — Bind `<MAIN_REPO>` to a literal `git worktree list --porcelain` path in the three forks that name a nonexistent watcher environment _(layer: plugin)_
7. [ ] **Finding 7** — State the sandbox's platform prerequisites and the interim remote-job consequence in `docs/cli.md` and `docs/remote-execution.md` _(layer: general)_

---

## Must Fix

### 1. The watcher and the remote job run the main checkout's other outer-loop scripts unsandboxed, and the run can still write them
→ [finding_1.md](feat_unattended_bash_sandbox_code_review/finding_1.md)

### 2. Four corpus sites put the commit and the excluded push in one fenced block, so a single-call run pushes sandboxed
→ [finding_2.md](feat_unattended_bash_sandbox_code_review/finding_2.md)

---

## Should Fix

### 3. The profile and the project settings files are protected only by a tool-layer refusal that is unmeasured under `dontAsk`
→ [finding_3.md](feat_unattended_bash_sandbox_code_review/finding_3.md)

### 4. The opt-out keeps `failIfUnavailable: true`, which may stop the session on the platform the opt-out exists for
→ [finding_4.md](feat_unattended_bash_sandbox_code_review/finding_4.md)

### 5. Three autonomous forks bind `<MAIN_REPO>` to a watcher environment that does not exist, with no literal-spelling rule
→ [finding_5.md](feat_unattended_bash_sandbox_code_review/finding_5.md)

### 6. `push-branch.sh` passes a sandbox-writable branch name to `git push` where a leading `-` is parsed as an option
→ [finding_6.md](feat_unattended_bash_sandbox_code_review/finding_6.md)

### 7. No adopter-facing document states what the sandbox needs on Linux, or that a remote job without it exits at startup
→ [finding_7.md](feat_unattended_bash_sandbox_code_review/finding_7.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section has no divergence entries.
