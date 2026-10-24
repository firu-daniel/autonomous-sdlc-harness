# Task plan review — iteration 0

## Must Fix
1. **Index structure — the scope register's "what the sweep does" derivation reaches only table rows, so prose sites stating what the sweep removes are not rows** — story index (`fix_swept_run_profile_leak_story_plan.md`), `## Scope register`.
   The register's own predicate paragraph says the reading "reaches every document that states where the profile lives or what the sweep removes". But the only derivation entry for the second half, `git grep -nE '^\| \`cleanup-merged-worktrees\.sh\`' -- '*.md' ':!harness-runs' ':!examples'`, matches only lines that **begin** with a table cell naming the script. It cannot reach prose that states what the sweep removes. I re-ran both command entries and re-walked both procedure entries. Every site they reach is a row (12 of 12). Disposition (ii) still applies, because sites exist that state what the sweep removes and that no entry reaches. Verified:
   - `docs/outer-loop-verification.md` → `### 1.4 \`cleanup-merged-worktrees.sh\``: the **Owed a re-drive on the clone layout.** paragraph. It is a living list of what changed in the sweep since the dated rows (*"What moved: the sweep finds a gone branch's copy in its run-registry record … The real-sweep row's "working copy removed" therefore now depends on a registry record naming the copy"*). It names `cli/test/cleanup-run-copies.test.mjs` as the suite that asserts the arms until a re-drive. After this branch the sweep also removes the run's profile, which this paragraph does not list. The section's **the real sweep** row ("`feat_gone`'s working copy removed and its branch deleted") is also a statement of the sweep's effect.
   - `docs/watcher.md` → the legacy-worktree-run paragraph (*"`cleanup-merged-worktrees.sh` sweeps it from its registry record through the worktree arm, all unchanged (`cli/test/run-copy-migration.test.mjs`)"*). Task 3 changes that very suite to assert profile removal on this arm.
   - `plugin/commands/branch-user-review.md` (*"`cleanup-merged-worktrees.sh` never writes the registry, so a merged-and-swept branch keeps its `completed` record … that sweep force-deleted the local branch"*).

   The command below is strictly wider than the second command entry: every line that entry matches, it matches too. It also reaches every other mention of the script, so the writer can decide each candidate. Besides the rows already in the register (4, 5, 9, 10, 11, 12), it newly reaches:
   - `ARCHITECTURE.md` (the guards paragraph naming `DENY_SCRIPT_BASENAMES`)
   - `cli/templates/state-dir/autonomous_logs/README.md` (*"… `<scripts_dir>/cleanup-merged-worktrees.sh` all read it before they act"*)
   - `docs/cli.md` §6 residual 1 (*"The watcher family's git calls in a working copy …"*)
   - `docs/outer-loop-verification.md`, nine hits: the executable-change list entry, the *"Executable change: seven"* line, the scripts-directory-outside-a-repository row, the `### 1.4` heading and its section, the reachability paragraph, the guard paragraph, the `push-branch.sh && cleanup-merged-worktrees.sh` row, the `git branch -D` consequence paragraph, the `agentInvocable` paragraph, and the **CLOSED — two script headers…** entry
   - `docs/watcher.md`, the legacy-worktree-run paragraph above
   - `plugin/agents/task-plan-writer.md` (the deny-listed basenames bullet)
   - `plugin/commands/branch-user-review.md`, quoted above
   - `plugin/docs/AUTONOMOUS_FLOW.md` (the *Working-copy lifecycle* row)

   Most of these will be `no-change`, but each must be a row, or be covered by a decision rule that names why it is not a candidate.
   **Fix:** In `## Scope register`, replace the second derivation entry with a wider one. Use the command form `git grep -nE 'cleanup-merged-worktrees\.sh' -- '*.md' ':!harness-runs' ':!examples'`, with a stated decision rule: *a hit's enclosing paragraph, bullet or table row (for a heading hit, that section's prose and rows) is a site when it states what the sweep removes, keeps or leaves behind*. Then add one row per site the entry reaches, with a `Disposition` and reason for each. At minimum add the `docs/outer-loop-verification.md` §1.4 paragraph (`change` owned by Task 4, adding the profile removal to its "What moved" list, or `no-change` with a reason), the `docs/watcher.md` legacy-worktree-run paragraph, and the `plugin/commands/branch-user-review.md` sentence. If any becomes `change`, add it to Task 4's `### Targets` and `**Work:**` in `task_4_plan.md`. Keep `## Phase 2 Readiness` immediately after `## Context`. Keep the closure invariant stated as a property, not a count.

## Should Fix

## Nice to Have
