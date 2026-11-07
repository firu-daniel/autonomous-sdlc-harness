# Code Review: fix_sibling_glob_traversal

## Context

**Branch:** `fix_sibling_glob_traversal`
**Date:** 2026-11-07
**Reviewed:** the whole branch diff against the default branch `dev` (taken as `origin/dev`, because no local `dev` ref exists in this run copy). That is 8 files. In `cli`: the new decision suite `cli/test/path-anchored-arms.test.mjs` (Task 1). In `plugin`: the paired veto globs in `hc_path_anchored_patterns`, the veto-aware `hc_matches_any_pattern`, and the `!`-led word skip in `hc_runner_words` (Task 2). Also in `plugin`: the header, REPRO and README prose for the four allow-only guards (Task 3). In `general`: `docs/guard-verification.md`'s §1.2 / §1.3 / §1.5 notes, the §2 re-drive lines, row `(m)` with its fault injection, the §2.4 (a) correction and §3.1's N124–N152 (Tasks 4–7). 15 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- **The veto mechanism is sound as built.** The arm/veto binding in `hc_matches_any_pattern` is correct: a veto withdraws only the arm above it, and a veto before any arm is inert. No guard's decision code changed, and the safe-prefix set is never fed through the matcher, so no `!`-led configured command can turn into a veto. The mechanism adds no fork.
- **The documentation and scope register are complete.** Re-running the story plan's scope derivation (entry A) reaches only the two documents the branch edits.
- **One spelling is still open.** The redirection twin `cd <dir> *[<>]*` admits a zsh numeric-range glob as the second `cd` operand. The rewrite guard's pre-existing trailing-redirect strip removes that word before the matcher sees it. The two-operand `cd` route recorded as CLOSED is therefore still open in all four guards (Finding 1). That finding is derived, not measured: Bash probes outside read-only git were refused in this review session.
- **One new arm has no regression test.** The scoped-`appDir` sibling arm Task 2 added is exercised by no test (Finding 2).
- **Tests and parity.** The accompanying test is present and records its red-once run. Whether it passes is the Run gates phase's to establish. `phases.parity` is `false`, so no parity cross-check ran.

**Two Pass 0 notes.** The grep half ran nothing, because the sweep-list regex cells are an unfilled stub; that is a configuration gap, not a finding. The new-exported-symbol caller check found no added exported or defined symbols. Pass 2 found no per-unit review files under the supplied root, so it was a no-op.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Add the scoped-`appDir` keeper m39 to `cli/test/path-anchored-arms.test.mjs`, so the sibling `cd <stem>*/<appDir>` arm has a regression test _(layer: cli)_
2. [x] **Finding 1** — Restrict the `cd <dir>` redirection twin and the rewrite guard's strip to `>`, so a zsh numeric-glob `<->/…` operand is vetoed; test and record it _(layer: cli, plugin, general)_

---

## Must Fix

### 1. A zsh numeric-glob operand (`<->/…`) passes the `cd <dir> *[<>]*` twin's operand vetoes, so zsh's two-operand `cd` still leaves the workspace
→ [finding_1.md](fix_sibling_glob_traversal_code_review/finding_1.md)

---

## Should Fix

### 2. No test exercises the new sibling `cd <stem>*/<appDir>` arm, so removing it would leave every suite green
→ [finding_2.md](fix_sibling_glob_traversal_code_review/finding_2.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section carries no parity call-out.
