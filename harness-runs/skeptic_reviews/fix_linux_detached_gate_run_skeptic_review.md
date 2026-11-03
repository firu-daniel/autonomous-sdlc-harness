# Skeptic Review: fix_linux_detached_gate_run

## Context

**Branch:** `fix_linux_detached_gate_run`
**Date:** 2026-11-03
**Reviewed:** the whole-branch diff against `dev`. This run copy has no local `dev`, so the diff was taken against `origin/dev`: 52 files across the `cli`, `plugin` and `general` layers. 38 run-artifact files excluded from the reviewed diff. The review read:

- the launcher `launch-sandboxed-gates.sh`, end to end;
- `run-test-suite.sh`'s `--no-detach` form, with its run and wait forms;
- the run library's lane owner and placeholder sweep;
- Phase G's G.1 step 2 and the `<gate_launcher>` bindings in the cores and the four forks;
- the probe's `gate-sandbox` leg and T3's change;
- residual 13 in `docs/cli.md` §6, and the F10, GS, T3, WF5 and PD25–PD28 rows of `docs/sandbox-verification.md`.

**De-duplicated against:**

- the committed code review `harness-runs/code_reviews/fix_linux_detached_gate_run_code_review.md`, whose findings 1 and 2 are both applied;
- the architecture review `harness-runs/architecture_branch_reviews/fix_linux_detached_gate_run_arch_review.md`, whose findings 1 and 2 are both applied.

`phases.parity` is `false`, so no parity review exists and check 2's parity leg does not apply.

**Headline: one net-new Must Fix.** The code review's finding 2 closed the run copy's `.git` trio in the gate worker. The worker is still wider than the session's sandbox elsewhere. Claude Code's own built-in protected paths at the target's root, as one recorded session read them, are left writable:

- `.claude/agents`, `.claude/commands`, `.claude/skills`, `.claude/hooks` and the rest under `.claude/`;
- `.gitmodules`, `.vscode` and the other root-level ones.

`docs/sandbox-verification.md` records that inside the session's sandbox each of these read as a read-only `/null` mount whatever the profile said (§6, **Claude Code's built-in protected paths in a run copy:**), but the launcher's vector carries none of them. Session-written gate code can therefore plant project configuration that the next session in the run copy loads.

**Checked and clear:**

- **Check 1 (wiring).** Every new library and probe function has a caller.
- **Check 3 (citations).** The `§5 F10`, `§5 F9`, `§5 AP2`, `AP8` and `PD20` citations each resolve to a row that says what the code claims.
- **Check 4 (divergences).** The branch marks no intentional divergence.
- **Check (plugin layer).** Graded against `.claude/context/plugin.md`, over the eight `plugin` files the branch changes: `plugin/docs/AUTONOMOUS_FLOW.md`, `plugin/instructions/mode_contract.md`, `plugin/instructions/plan_orchestration_instructions_core.md`, `…_autonomous.md` and `…_semi_autonomous.md`, and `plugin/instructions/user_review_fixes_instructions_core.md`, `…_autonomous.md` and `…_semi_autonomous.md`. Each of these holds:
  - `## Cores, forks and the single-owner rule`, rule 1. Both cores that run Phase G declare `<gate_launcher>` in their binding tables: `plan_orchestration_instructions_core.md` directly, and `user_review_fixes_instructions_core.md` as **Consumed by the cited `## Phase G — Run gates`**. All four forks bind it: the two autonomous forks to `bash <MAIN_REPO>/<scripts_dir>/launch-sandboxed-gates.sh <repo_root> <gate_key>_round_<gate_round>`, and the two semi-autonomous forks to the explicit value `none`.
  - Rule 4. Neither core carries the launcher's spelling, a slash-command name or an absolute path. Both name only the binding. The `launch-sandboxed-gates.sh` spelling sits in the two autonomous forks, plus the flow document's Run gates row, which is not a core.
  - `## Registries — a name routed to an implementation`. `mode_contract.md` → `## Binding vocabulary` carries the `<gate_launcher>` row. Both declaring cores were already listed under `## Which files use this`, so that registry needs no new member.
  - `## Wires: dispatch in, return out` and `## Writing agent prose` → *Never paraphrase a wire literal or a cited anchor*. G.1 step 2's `pending` and `in-session` literals, and its **No stdout line** refusal branch, match the launcher's header `Exit map`: exit 3 prints `pending`, exit 4 prints `in-session`, and exit 2 prints one `launch-sandboxed-gates.sh: <reason>` stderr line and nothing on stdout (`cli/templates/scripts/launch-sandboxed-gates.sh`). The **No verdict line** branch and the core's stop-condition bullet name the launcher's stderr refusal in place, without restating another core. `user_review_fixes_instructions_core.md` reaches G.1 by citation, not by copy.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Pin Claude Code's built-in protected paths at the target's root in the gate worker's `bwrap` vector (`.claude` read-only whole, the root-level ones by path), with its test and the header and residual 13 updates _(layer: cli, general)_

---

## Must Fix

### 1. The gate worker can write Claude Code's built-in protected paths in the target, which the session's own sandbox refuses
→ [finding_1.md](fix_linux_detached_gate_run_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None: the branch declares no intentional divergence, and `phases.parity` is `false`.
