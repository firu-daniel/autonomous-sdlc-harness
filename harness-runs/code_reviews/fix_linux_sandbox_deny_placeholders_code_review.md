# Code review — fix_linux_sandbox_deny_placeholders

Branch `fix_linux_sandbox_deny_placeholders`, reviewed 2026-10-29. The configured diff base is `dev`. No local branch of that name exists in this checkout, so the diff was taken against the remote-tracking ref `origin/dev` (`git diff origin/dev...HEAD`).

**What was reviewed.** 26 files, in four segments:

1. `cli/src`: `doctor/checks.ts`, `generators/writeProtection.ts` and `machine/paths.ts`.
2. The shipped outer-loop templates: `cli/templates/scripts/autonomous-watcher.sh`, `cleanup-merged-worktrees.sh` and `lib/harness-run-lib.sh`. Their self-adopted copies under `scripts/` are byte-identical to them.
3. The `cli/test` suites: two new ones, plus the seam defaults in the existing watcher suites.
4. `docs/` and the new hand-written script `scripts/sandbox-absent-path-check.sh`.

25 run-artifact files excluded from the reviewed diff.

**Pass 0.** The mechanical sweep ran over the 2,405 added lines. It looked for raw `console` calls, `process.exit`, recursive removals, `git add -A`, `set -e`, absolute machine paths, hand-built `EXIT.INTERNAL` errors and line-number citations, and found nothing. Every new run-library function has a caller outside its own definition.

**Headline.** The route holds together. The trio's `bubblewrapDenyWrite` column lives in `COPY_GIT_PATHS`, and the watcher's declared mirror carries it. The leftover test, the live-run rule and manifest enumeration each have one home in the run library. Every new behaviour is gated on the placeholder-host probe, which the test passes turn off by default, so macOS behaviour is unchanged. The sweep removes only a 0-byte, read-only regular file owned by this user, at a path a manifest recorded as absent, and the suites check both removals and refusals against the files on disk.

**Tests.** Each new behaviour comes with a case in `cli/test/placeholder-sweep-lib.test.mjs` or `cli/test/watcher-placeholder-host.test.mjs`. Neither suite reads a tree of files, so neither needs a tree-guard entry. Running the suites was not part of this review.

**Parity.** `phases.parity` is `false`, so no parity review applies.

**Findings.** Three Should Fix, none Must Fix:

- The quiet pass-start sweep logs every kept path on every poll.
- The live notes-app fixture still says the per-run copy's exact entries hold on Linux. Task 10's write to it was refused.
- `docs/cli.md` §6 residual 12 refers to "this branch" and cites a run artifact.

**Pass 2.** No per-unit review folders exist under the supplied `per_task_findings_root`, so it reconciled nothing.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Remove "this branch" and the run-artifact citation from `docs/cli.md` §6 residual 12 _(layer: general)_
2. [x] **Finding 2** — Re-render the notes-app profile's write-protection `_README` line, which still says the per-run copy's exact entries hold on Linux _(layer: general)_
3. [ ] **Finding 1** — Stop the quiet pass-start sweep from logging every kept path on every poll _(layer: cli, general)_

## Must Fix

None.

## Should Fix

### 1. Stop the quiet pass-start sweep from logging every kept path on every poll
→ [finding_1.md](fix_linux_sandbox_deny_placeholders_code_review/finding_1.md)

### 2. Re-render the notes-app profile's write-protection `_README` line, which still says the per-run copy's exact entries hold on Linux
→ [finding_2.md](fix_linux_sandbox_deny_placeholders_code_review/finding_2.md)

### 3. Remove "this branch" and the run-artifact citation from `docs/cli.md` §6 residual 12
→ [finding_3.md](fix_linux_sandbox_deny_placeholders_code_review/finding_3.md)

## Nice to Have

None.

## Call-outs — intentional divergences from the reference implementation

None. `phases.parity` is `false`, so this project has no reference implementation.
