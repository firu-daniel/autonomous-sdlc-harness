# Skeptic Review: fix_observations_repo_relative_paths

## Context

**Branch:** `fix_observations_repo_relative_paths`
**Date:** 2026-09-25
**Reviewed:** the whole-branch diff against `dev`, six files: `plugin/instructions/improvement_observations_instructions.md`, both autonomous forks' Override I and commit-point entries 5 and 8, `plugin/docs/AUTONOMOUS_FLOW.md` → `## Improvement observations`, and the two intake README copies. I reviewed it adversarially against the task prompt and the story index.

12 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_observations_repo_relative_paths_code_review.md` and its two findings (unquoted needles; the exit-3 claims). There is no parity review, because `phases.parity` is `false`. No branch-level architecture review exists.

**Verified without a finding:**
- The machine-path check is reached from both forks' Override I **Commits + pushes** bullets.
- The three commands it needs have allow entries in `cli/templates/claude/settings.autonomous.json`: `Bash(git worktree:*)`, `Bash(jq:*)` and `Bash(grep:*)`.
- The needle set matches gate 6a's `$HOME` grep in `scripts/run-gates.sh` → `machine_path_hits`.
- The cited headings and bold leads resolve.
- `clarification_digest_instructions.md` imports the exit codes, and is explicitly excluded from the check, as the task prompt's scope requires.

**Headline:** one net-new finding. The check matches needles as fixed-string substrings and does not drop single-segment ones. In a checkout at `/app` or `/src`, or with `HOME=/root`, a correct repo-relative entry reads as a hit that cannot be cleared, so the intake file is never committed.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Drop single-segment needles from the machine-path check _(layer: plugin)_

---

## Must Fix

### 1. A single-segment needle such as `/app` or `/src` also matches inside an ordinary repo-relative path, so a correct entry reads as a hit no rewrite can clear and the intake file is never committed
→ [finding_1.md](fix_observations_repo_relative_paths_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. None of the plan or code marks anything as an intentional divergence.
