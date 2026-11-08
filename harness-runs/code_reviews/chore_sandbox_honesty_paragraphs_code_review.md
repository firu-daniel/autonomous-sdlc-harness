# Code Review: chore_sandbox_honesty_paragraphs

## Context

**Branch:** `chore_sandbox_honesty_paragraphs`
**Date:** 2026-11-07
**Reviewed:** the whole branch diff against `dev` (taken as `origin/dev`, the merge base `6ea73051`; there is no local `dev` ref in this run copy). That covers the `cli` templates and generator string (`cli/templates/scripts/scratch-run.sh`, `cli/templates/scripts/commit-on-branch.sh`, `cli/templates/state-dir/scratch/README.md`, `cli/templates/claude/settings.autonomous.json`'s `_README`, `cli/src/generators/writeProtection.ts` → `applyWriteProtection`'s `_README` line, `cli/src/doctor/checks.ts`'s doc comment), the new `cli/test/profile.test.mjs` case, the `plugin` prose (`plugin/hooks/README.md`, `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`), the self-adopted copies (`scripts/scratch-run.sh`, `scripts/commit-on-branch.sh`, `harness-runs/scratch/README.md`), and the `general` documents (`docs/cli.md` §6, `docs/watcher.md`, `docs/remote-execution.md`, `docs/outer-loop-verification.md` §3, `docs/development.md` §6, `docs/sandbox-record.md` §7, `README.md`, `ROADMAP.md`, `llms.txt`). 17 run-artifact files excluded from the reviewed diff.

The branch keeps to its no-behaviour-change constraint: the only runtime-visible change is `_README` text, no guard, deny entry or exported symbol moves, and the Pass 0 sweep over added lines found no line coordinate, no machine path and no new export. The three self-adopted copies are byte-identical to their templates (`cmp`). The statuses the branch writes into `docs/remote-execution.md` (FR1, FR3, FR5, FR6, RJ2, RJ3, SB2, SB3, SB4, JS1, JS3, JS3N, JS4), `docs/cli.md` §6 (CS2, CS6, RG1–RG3, AP7, AP9, N1/N2 and their Linux rows), `docs/watcher.md` (AP1–AP8) and `ROADMAP.md` / `docs/development.md` row 20 (IS1–IS4, FR2) were checked against the verdict cells of `docs/sandbox-verification.md` and the leg table of `docs/sandbox-record.md` §4, and match. Roadmap items 22, 23 and 25 are marked shipped with matching *Since then* sentences in the record's §7. The accompanying test is present (`cli/test/profile.test.mjs` → `the _README says what the sandbox leaves outside and points at its document of record`); whether it passes is the Run gates phase's to establish. Parity is off (`phases.parity` is `false`). Three findings are left: one overclaim in the whiteboard's sandbox row, one `_README` line that understates and contradicts its own evidence row, and one smaller overclaim in the whiteboard.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Stop the whiteboard's `**5. The sandbox**` row saying hooks and MCP servers are held by the permission profile _(layer: plugin)_
2. [x] **Finding 3** — Qualify the whiteboard's "every command the run executes" with the excluded scripts _(layer: plugin)_
3. [x] **Finding 2** — Make the profile `_README`'s headless-parity line name HP1's three calls, and repoint its test _(layer: cli)_

---

## Must Fix

### 1. The whiteboard's sandbox row says hooks and MCP servers are held by the permission profile, which the record says they are not
→ [finding_1.md](chore_sandbox_honesty_paragraphs_code_review/finding_1.md)

---

## Should Fix

### 2. The `_README` line says HP1 compared one call and "nothing else", while HP1 compared three and `docs/cli.md` now says so
→ [finding_2.md](chore_sandbox_honesty_paragraphs_code_review/finding_2.md)

### 3. The whiteboard's prompt-data paragraph puts "every command the run executes" inside the sandbox, the four excluded scripts included
→ [finding_3.md](chore_sandbox_honesty_paragraphs_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences.

- **Verified-OK — the guard header left as is.** `plugin/hooks/autonomous-script-allowlist-guard.sh`'s header still calls the guard *"capability containment for an unattended run"*, while the `plugin/hooks/README.md` row now says it bounds command strings. The story index's `## Scope register` row 26 leaves it to sandbox10 with a reason (a guard edit is re-measured in `docs/guard-verification.md`), so it is out of scope here, not a missed site.
- **Verified-OK — the notes-app profile.** `examples/notes-app/.claude/settings.autonomous.json` still carries the old `WHETHER A HEADLESS` and `TWO RESIDUALS` lines. The story index's `**Manual setup required:**` makes that a supervised post-merge re-render, and no gate checks that fixture against the template.
- **Pass 2.** The per-unit findings root `harness-runs/task_plan_point_reviews/chore_sandbox_honesty_paragraphs_task_plan/` does not exist in this checkout, so there were no per-unit findings to carry over.
