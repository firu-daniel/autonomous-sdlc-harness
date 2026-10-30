# Architecture review — fix_linux_sandbox_deny_placeholders

## Context

Branch `fix_linux_sandbox_deny_placeholders`, reviewed 2026-10-29 in implemented-solution mode against the diff base `dev`. That name does not resolve as a local ref in this checkout, so the diff was taken against its remote-tracking ref `origin/dev` (`git diff origin/dev...HEAD`). Reviewed: 25 files in four segments. (1) `cli/src`: `doctor/checks.ts` and `generators/writeProtection.ts`. (2) The shipped outer-loop templates `cli/templates/scripts/{autonomous-watcher.sh, cleanup-merged-worktrees.sh, lib/harness-run-lib.sh}`, together with their self-adopted copies under `scripts/`, which are byte-identical to them. (3) The `cli/test` suites. (4) `docs/` and the new hand-written `scripts/sandbox-absent-path-check.sh`. 21 run-artifact files excluded from the reviewed diff.

Headline: the layering holds. The new `bubblewrapDenyWrite` column extends `COPY_GIT_PATHS` in its owner, the header of that module declares the watcher's mirror, and `doctor` imports the column rather than restating it. The leftover test, the live-run rule and the manifest path each have a single home in the run library, and no file crosses the `cli`/`plugin` boundary. One Must Fix: the watcher locates manifests by building their directory from a dummy branch and globbing the `.absent` suffix itself, and it does this twice. That names the library-owned persisted artifact at its use site. Two Should Fix items cover machine-state documentation drift and a hardcoded state directory in the new check script.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — List the absent-path manifest among the machine state directory's contents in `machineStateDir`'s header _(layer: cli)_
2. [x] **Finding 3** — Resolve the state directory in `sandbox-absent-path-check.sh` through the run library, not a `harness-runs` literal _(layer: general)_
3. [x] **Finding 1** — Move manifest enumeration into the run library instead of globbing `*.absent` twice in the watcher _(layer: cli, general)_

## Must Fix

### 1. Move manifest enumeration into the run library instead of globbing `*.absent` twice in the watcher
→ [finding_1.md](fix_linux_sandbox_deny_placeholders_arch_review/finding_1.md)

## Should Fix

### 2. List the absent-path manifest among the machine state directory's contents in `machineStateDir`'s header
→ [finding_2.md](fix_linux_sandbox_deny_placeholders_arch_review/finding_2.md)

### 3. Resolve the state directory in `sandbox-absent-path-check.sh` through the run library, not a `harness-runs` literal
→ [finding_3.md](fix_linux_sandbox_deny_placeholders_arch_review/finding_3.md)
