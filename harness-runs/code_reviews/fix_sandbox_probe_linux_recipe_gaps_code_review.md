# Code Review: fix_sandbox_probe_linux_recipe_gaps

## Context

**Branch:** `fix_sandbox_probe_linux_recipe_gaps`
**Date:** 2026-11-02
**Reviewed:** the whole branch diff against `dev` (`origin/dev`, since this run copy has no local `dev`). That covers:
- **Task 1 (`cli`):** the new fixture `cli/test/fixtures/sandbox-probe/linux-busy-inter-device.jsonl`, plus its case and header lines in `cli/test/sandbox-probe-judge.test.mjs`.
- **Task 2 (`general`):** Gate 15's *A Linux run, in a local container* recipe in `docs/development.md`, together with the absent-path, refusal and recording paragraphs that reuse its lines.
- **Task 3 (`general`):** the PD20–PD23 follow-up cells in `docs/sandbox-verification.md` §5.

8 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**
- **Tests:** Task 1 changes no judge code. It adds the inter-device fixture and pairs it with a no-platform twin, so the macOS grade is shown unchanged. The case goes inside the existing `PD23: Permission denied and Device or resource busy are sandbox refusals, on Linux only` test. That test file existed before this branch, so it needs no registration. The fixture is reached only through `fixture(c.stream)`.
- **Parity:** `phases.parity` is `false`, so no parity review ran.
- **The recipe:** every task-prompt fix is present:
  - PD20: the sysctl read and set lines, named as a departure.
  - PD21: the `~/.ssh/config` placeholder, byte-identical to `scripts/sandbox-probe-runner.yml`'s `ssh-config` step.
  - PD22: `useradd -m -s /bin/bash`, `${PIPESTATUS[0]}` after each `tee`, a dry-run push that caches the credential before the first probe clone, and a `docker cp` copy-out of the evidence directory, `~/.claude/projects` (never the whole `~/.claude`) and both logs.

  Every new command sits in a fenced block, one per line.
- **The recipe's claims match the probe's code:**
  - The evidence directory is created under `${TMPDIR:-/tmp}` by `scripts/lib/sandbox-probe/session.sh` → `sp__td_keep_evidence`.
  - No probe session redirects `HOME` or `CLAUDE_CONFIG_DIR`.
  - HP1 records no session files, so the single `<suffix>` the copy-out names is the only evidence directory a container run produces.
- **The record:** each citation the PD23 row adds resolves:
  - AP5 on `fc5aab79` lists the seven non-trio placeholders.
  - §8 RG2 (Linux) and RG3 (Linux) record `pass` with `Device or resource busy`.
  - `SP__LINUX_SANDBOX_STRINGS` holds the three shapes.
  - The test name exists.

  None of the four rows claims a measured result. Each says the next container run confirms it.
- **Pass 2:** there was nothing to reconcile, because the per-unit findings root does not exist (per-unit review was off).
- **Pass 0:** the sweep table has no project regexes, so half (a) did not run. Half (b) found no new exported symbol.

One finding remains.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Replace the judge test header's restated PD23 evidence decision with a pointer to the PD23 row, and rewrap the over-long line _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The judge test's header restates PD23's evidence decision that `docs/sandbox-verification.md` §5 PD23 owns, and its reflow left one over-long line
→ [finding_1.md](fix_sandbox_probe_linux_recipe_gaps_code_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section is empty.
