# Architecture review — feat_sandbox_probe_linux_legs

## Context

Branch `feat_sandbox_probe_linux_legs`, reviewed 2026-10-28 against `dev`. The local checkout has no `dev` branch, so the diff was taken against `origin/dev`, the remote-tracking ref of that same branch: `git diff origin/dev...HEAD`. The review covered 50 changed files, in three segments:

- **The probe (`general`).** `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/*`: a new `platform.sh`, five new Linux-only leg libraries, and edits to `core.sh`, `judge.sh`, `preflight.sh`, `session.sh`, `legs-network.sh`, `legs-settings.sh`, `legs-local.sh` and `legs-protection.sh`.
- **The rows of record (`general`).** `docs/development.md` (Gate 15) and `docs/sandbox-verification.md`.
- **The suites (`cli`).** The suites under `cli/test/` and their JSONL fixtures under `cli/test/fixtures/sandbox-probe/`.

27 run-artifact files excluded from the reviewed diff.

**Headline.** The layering holds:

- **Placement.** Each new probe library sits beside its siblings under `scripts/lib/sandbox-probe/` with the `# <basename> — …` header and the sourced-library no-shell-options rule. The new suites follow the `cli/test/<kebab-case>.test.mjs` pattern, open with the rule each one enforces, and build their fixtures under `os.tmpdir()`.
- **Reuse.** Shared answers are taken from their owners rather than re-derived: `hr_lane_mtime`, `hr_sandbox_opted_out` and `hr_sandbox_prereq_probe_var` from `scripts/lib/harness-run-lib.sh`; the network listener from `legs-network.sh`; the CS7 Edit grade from `legs-protection.sh`.
- **Dependency direction.** It runs only `cli/test` → `scripts/`, the direction the earlier probe suites already established.
- **Cleanup.** No new recursive removal appears anywhere.
- **The one finding.** It is a Should Fix: in `legs-loopback.sh`, the probe's loopback-host constant is retyped in several places instead of being read from its existing owner.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Read the loopback host from `SP__NET_LOOPBACK_HOST` in `legs-loopback.sh` instead of retyping `127.0.0.1` _(layer: general)_

## Must Fix

_None._

## Should Fix

### 1. Read the loopback host from `SP__NET_LOOPBACK_HOST` in `legs-loopback.sh` instead of retyping `127.0.0.1`
→ [finding_1.md](feat_sandbox_probe_linux_legs_arch_review/finding_1.md)

## Nice to Have

_None._
