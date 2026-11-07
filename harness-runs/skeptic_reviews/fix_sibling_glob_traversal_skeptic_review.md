# Skeptic Review: fix_sibling_glob_traversal

## Context

**Branch:** `fix_sibling_glob_traversal`
**Date:** 2026-11-07

**What was reviewed.** The whole branch diff against `dev`, taken as `origin/dev` because this run copy has no local `dev` ref. That is 8 files: `cli/test/path-anchored-arms.test.mjs`, `docs/guard-verification.md`, `plugin/hooks/README.md`, the four allow-only guards and `plugin/hooks/lib/harness-config-lib.sh`. 18 run-artifact files were excluded from the reviewed diff.

**De-duplicated against** `harness-runs/code_reviews/fix_sibling_glob_traversal_code_review.md` and its two findings: the zsh numeric-glob `<->` operand, and the missing m39 keeper. Both are applied on the branch. `phases.parity` is `false`, and no architecture review exists for this branch.

**Checks run first-hand.**
- **Arm/veto binding.** The binding in `hc_matches_any_pattern` holds. A veto withdraws only the arm above it.
- **Matcher callers.** The matcher's only callers are the four guards, all fed by `hc_path_anchored_patterns`.
- **The `*>*` twin.** Its operand vetoes admit only `>`-bearing, digit-, `>`- or `&`-led single words. A bare `&` inside the tail is split off by `hc_split_command` before the matcher sees it.
- **Traversal and trailing-slash spellings.** Every spelling under the stem arms is refused.
- **The rewrite guard's narrowed strip.** It hands the matcher no `cd <dir>` stripped of a second operand.
- **Citations.** Every citation the branch adds names a heading or row that exists.

**Headline.** The closure holds. It also introduces one unrecorded cost. Under a sibling worktree or a run copy, the stem arm's new class veto refuses every `cd` below a scoped `appDir`. The record of rows `b`, `K13` and `(m)`, and the library's own comment, still say the `cd` arms are unaffected (Finding 1).

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Record the scoped-`appDir` subpath cost the stem arm's class veto introduced (m46–m47), and correct the library comment and rows `b` / `K13` / `(m)` that say the `cd` arms are unaffected _(layer: plugin, general)_

---

## Must Fix

### 1. The stem arm's class veto takes `allow` away from every sibling and run-copy path below a scoped `appDir`, and the record says the `cd` arms are unaffected
→ [finding_1.md](fix_sibling_glob_traversal_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Intentional divergences / call-outs

`phases.parity` is `false`, so this branch has no reference implementation to diverge from. **m43** is a recorded observation that the branch explicitly does not claim to close: `cd <W> && git rm tracked.txt` behind an anchor on `<repo>` is `allow`. It does not leave the workspace, because `<W>` is a real sibling worktree. This review leaves it as recorded.
