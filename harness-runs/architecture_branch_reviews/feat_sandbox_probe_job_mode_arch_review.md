# Architecture review — feat_sandbox_probe_job_mode

## Context

Branch `feat_sandbox_probe_job_mode`, reviewed 2026-11-01 in implemented-solution mode against `diff_base: dev`. There is no local `dev` ref in this checkout, so the diff was taken against its remote-tracking ref, `origin/dev...HEAD`.

What was reviewed: 55 files.
- The sandbox probe's entry point and libraries: `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/*.sh`, including the new `job.sh`, `legs-job.sh`, `legs-runner.sh` and `legs-runner-isolation.sh`.
- The runner workflow `scripts/sandbox-probe-runner.yml`.
- `docs/development.md` and `docs/sandbox-verification.md`.
- The `cli/test/sandbox-probe-*.test.mjs` suites and their fixtures under `cli/test/fixtures/sandbox-probe/`.

29 run-artifact files excluded from the reviewed diff.

**Conclusion: no layer-placement or dependency-direction violation, and no Must Fix.**
- Every new probe library sits under `scripts/lib/sandbox-probe/` in the `general` layer.
- Every new suite is a kebab-case `cli/test/*.test.mjs` file that opens with the rule it enforces, and builds its fixtures under `os.tmpdir()`.
- No file under `cli/src`, `cli/templates` or `plugin/` changed, and no shipped half reaches into the other.
- The new shell files carry `#!/usr/bin/env bash`, set no shell options as sourced libraries, shell out to no recursive removal, and stage nothing with `git add -A`/`.`.
- `sp_launch_args` is extended rather than forked. The job arms are additive hooks on the existing session API.

Two Should Fix items remain. Both are the same kind of problem: a second copy of a responsibility that already has a home.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — `sp__wp_mv_class` keeps a second copy of the judge's Linux refusal strings, and its header says the copy matches when it does not _(layer: general)_
2. [x] **Finding 1** — `sp__job_writable_root` is a second copy of the watcher's `placeholder_manifest_writable_root`, which the probe can call directly _(layer: general)_

## Must Fix

_None._

## Should Fix

### 1. `sp__job_writable_root` is a second copy of the watcher's `placeholder_manifest_writable_root`, which the probe can call directly
→ [finding_1.md](feat_sandbox_probe_job_mode_arch_review/finding_1.md)

### 2. `sp__wp_mv_class` keeps a second copy of the judge's Linux refusal strings, and its header says the copy matches when it does not
→ [finding_2.md](feat_sandbox_probe_job_mode_arch_review/finding_2.md)

## Nice to Have

_None._
