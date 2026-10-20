# Skeptic Review: feat_clone_per_run_anchor

## Context

**Branch:** `feat_clone_per_run_anchor`
**Date:** 2026-10-20
**Reviewed:** the whole branch diff against `dev` (87 files), read adversarially. 27 run-artifact files excluded from the reviewed diff. De-duplicated against the committed code review `harness-runs/code_reviews/feat_clone_per_run_anchor_code_review.md` and its three findings: the per-spread isolation guard, the `deny`-list doctor case and the repository-wide rename sweep. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

What was verified first-hand:

- **Wiring (check 1).** `spawn_engine` is the only engine launch site, and every launch, park-resume, pause-resume and job-mode run goes through it. `remote-run.sh`'s other `"$AGENT_CLI"` call is the mention session, which runs `--tools Read,Grep,Glob --restricted` and has no reader to serve. `hc_main_root` is called only by `reserve-qa-user.sh` and `release-qa-user.sh`. No guard under `plugin/hooks/*.sh` calls it, and nothing else inside the library does either. `PROFILE_MAIN_ANCHOR_CHECK` is registered in `CHECKS`, and `appendAllow(profile, [MAIN_REPO_ANCHOR_RULE])` runs on every render.
- **Closure.** `grep -rn 'worktree list' plugin` leaves only the two `no-change` sites the scope register records. Every plugin file that uses `<MAIN_REPO>` carries the canonical row or clause, except `AUTONOMOUS_FLOW_WHITEBOARD.md`, which names the path and resolves nothing (register row 41).
- **Deny floors.** No shipped profile's `deny` and no guard refuses `printenv`, so the exact allow rule can take effect.
- **Citations (check 3).** `### The per-run clone (2026-10-19)`, `### Where the family runs git in a run's copy, and under what pins` and commit `dc53f1d0` all exist. The guard-verification note's grep claim holds.
- **Test isolation.** Every suite that runs a QA-lock helper goes through `runBash` and `ISOLATED_ENV`. The direct `execFile`/`spawn` calls that leave `process.env` unblanked run only the watcher or library functions, and neither reads the variable.

The one net-new finding is a documentation hazard in how a person is told to set the anchor by hand.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committing role flips each one to `[x]` as that fix's commit lands — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else are informational only. Each entry resolves to `harness-runs/skeptic_reviews/feat_clone_per_run_anchor_skeptic_review/finding_<K>.md`.

1. [x] **Finding 1** — Set `HARNESS_MAIN_REPO` as a one-launch prefix in `docs/watcher.md`'s hand-started-session block instead of a shell-wide `export` _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `docs/watcher.md` tells a person to `export HARNESS_MAIN_REPO` in their shell, so every later `claude` in that terminal, in any repository, resolves `<MAIN_REPO>` to the wrong main checkout
→ [finding_1.md](feat_clone_per_run_anchor_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

- **Verified-OK: the mention session carries no anchor.** `control_mention_session` launches with `--tools Read,Grep,Glob --restricted`, so no reader in it can run `printenv`. Leaving the variable unset there is correct, not a gap.
- **Verified-OK: `profile-main-anchor` never fails, even under `--remote-job`.** A job's checkout is its own main checkout, so the fallback names the same directory as the anchor would.
- `phases.parity` is `false`, so there is no parity call-out.
