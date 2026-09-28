# Skeptic Review: fix_remote_job_permission_profile

## Context

**Branch:** `fix_remote_job_permission_profile`
**Date:** 2026-09-28
**Reviewed:** the whole branch diff against `dev`, adversarially: 21 files, 987 insertions and 220 deletions, including the four code-review fix commits. This covers:
- the runtime-root `Read` grant and the `additionalDirectories` grant in `cli/src/generators/permissionProfile.ts`;
- `doctor --remote-job`, `profile-tracked` and the main-checkout profile resolution in `cli/src/doctor/checks.ts` and `cli/src/core/git.ts`;
- the job's preflight in `harness-run.yml`;
- the job-mode `--add-dir` extras in `autonomous-watcher.sh` → `spawn_engine`;
- `cli/src/core/defaultBranchPush.ts`;
- the managed `.gitignore` rule;
- `plugin/agents/qa-tester.md` → `## How it tests`, the **Mocking requests when a test needs it:** bullet (code-review Finding 1's fix, commit `b466d60`);
- the documentation.

27 run-artifact files were excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_remote_job_permission_profile_code_review.md` and its five findings, and `harness-runs/architecture_reviews/fix_remote_job_permission_profile/` (`review_0.md`, `review_1.md`). No business-parity review exists, because `phases.parity` is `false`. The findings in `harness-runs/lessons.md` were also treated as out of scope.

**Verified, not findings:**
- **Wiring.** Every new write path has a caller: `pluginRootDirectories` is reached from `generatedPluginRootEntries` → `renderProfile` → `writePermissionProfile` → `init`; `--remote-job` is reached from `harness-run.yml` → `parseOptions` → `buildCheckContext`; `mainWorktreeRoot` from `buildCheckContext`; and the job-mode extras are reached through `JOB_MODE=1` with `main_state` bound earlier in `spawn_engine`.
- **Root identity.** On a GitHub-sourced marketplace, `pluginRuntimeRoot` falls back to `pluginInstallRoot`. So `isRuntimeRoot` is true at the single root and the `Read` rule is emitted there, both by `init --plugin-root-entries` and by `doctor`'s requirement.
- **Directory grading.** The generator writes directories and `doctor` grades them through the same `pluginRootDirectories` and `normalizedRoot`.
- **Citations.** The `create-worktree.sh` → `worktree add … "origin/$default_branch"` and `hr_main_repo` citations resolve and say what the code claims. The self-adoption statement in `docs/development.md` matches `init.ts` → `SELF_ADOPT_ENV` (no workflow sets it) and `scripts/publish-main.sh` → `removed_paths`.
- **Import cycle.** The new cycle `projectSettings` → `permissionProfile` → `machine/plugins` → `projectSettings` touches the cyclic bindings only inside function bodies, so evaluation order cannot trip on it.
- **`plugin` layer — the `qa-tester` `browser_route` grant check (clean pass, against `.claude/context/plugin.md`).**
  - *No adopter literal* (`## What this layer is`): the only path the new text names is `.claude/settings.autonomous.json`. That is the harness's fixed `PROFILE_PATH` (`cli/src/generators/permissionProfile.ts` → `export const PROFILE_PATH = \`${CLAUDE_DIR}/settings.autonomous.json\``), not an adopter value. The checkout-local path is written as `<repo_root>/…`, a token `qa-tester.md` → `## Resolved values` already declares.
  - *Issuable unattended*: `git worktree` is in `plugin/hooks/lib/harness-config-lib.sh` → `hc_safe_prefixes`, so the bare `git worktree list --porcelain` auto-allows. The follow-up `Read` of the main checkout's profile is covered by the profile's own `Read(/{{repoRoot}}/**)` entry (`cli/templates/claude/settings.autonomous.json`), where `{{repoRoot}}` is the main checkout the profile is rendered in. `qa-tester`'s `tools:` allowlist already carries both `Read` and `Bash`.
  - *The cited resolution is real*: "the same resolution the watcher uses for its `--settings` flag" holds. `autonomous-watcher.sh` sets `MAIN_REPO="$(hr_main_repo "$SCRIPT_DIR")"` and `SETTINGS_PROFILE="$MAIN_REPO/.claude/settings.autonomous.json"`, and `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_main_repo` returns the first `worktree ` line of `git worktree list --porcelain`.
  - *No wire changed without its citers* (`## Verifying a change in this layer`): the bullet renames no heading, field or return literal. The `blocked` outcome and the `_README` pointer to `cli/templates/claude/settings.autonomous.qa.json` are unchanged. A grep for `browser_route` re-derives its other readers, `plugin/agents/ui-tests-plan-writer.md` and that template. Neither restates where the grant is read from, so neither needs a matching change.

**Headline:** one net-new defect, introduced by code-review Finding 4's own fix. The upgrade procedure in `docs/remote-execution.md` §7 claims a plain `init` changes nothing but the workflows, and commits only those. In a repository adopted before this release, `init` also merges this branch's new ignore lines into the tracked `.gitignore`. The next job's `init` step then fails on a changed tracked file.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, such as sub-step bullets inside a per-finding file, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves to `harness-runs/skeptic_reviews/fix_remote_job_permission_profile_skeptic_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order, and `K` is the finding's stable identity.

1. [ ] **Finding 1** — Say that the upgrade's plain `init` also merges the profile's ignore rule into `.gitignore`, and commit `.gitignore` with the workflows _(layer: general)_

---

## Must Fix

### 1. The §7 upgrade step says a plain `init` "touches nothing else" and commits only the workflows, but `init` also rewrites `.gitignore`, so the next job fails at its setup step
→ [finding_1.md](fix_remote_job_permission_profile_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation and this section has no parity call-out. The story index records two decisions of its own. Both were checked and both stand:
- **The `Read` exemption narrowed rather than dropped for the job.** It stays justified by the measurement cited in `PLUGIN_PERMISSIONS_CHECK`'s header.
- **Finding 5 of the task prompt corrected rather than made true.** `docs/remote-execution.md` → `### Your own allow entries` and the §6 row both record Run 3 as a measured negative, and neither claims the effect.
