### 1. From a worktree, the script-allowlist guard does not grant the `<MAIN_REPO>` push spelling, so ten `"$REPO_ROOT"` push sites rely on a profile match the repository says cannot happen

**Files.** Each site is the fenced line `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"`, or the inline spelling of it in the first file.

- `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch`: "then `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"`, using the `$REPO_ROOT` the fork resolved at session start"
- `plugin/instructions/clarification_digest_instructions.md` → `## Push`
- `plugin/instructions/dispatch_discipline_instructions.md` → `## Push`
- `plugin/instructions/improvement_observations_instructions.md` → `## Push`
- `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`, the fence after "Then issue the push as its **own** Bash call"
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `### Override E — push after the Override D direct-`git` commit …`
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 3 — commit the UI-test plan after it converges` and `## Override 4 — commit the task plan after it converges`, one push fence each
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3 — commit the fix plan + source review after the gates converge`
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `### Override E — push after the Override D direct-`git` commit …`

**The problem.** Before this branch, each site pushed with `bash <scripts_dir>/push-branch.sh "$REPO_ROOT"`, a repo-relative path run from the worktree. The script-allowlist guard (`plugin/hooks/autonomous-script-allowlist-guard.sh`) granted that call. It allows a script that resolves under the session's own `scriptsDir`, and it explicitly admits a plain `$VAR` argument. `dispatch_discipline_instructions.md` → `## Commit mechanics` relies on this: "The args after the script path may be quoted and may carry a plain `$VAR` or `${VAR}`".

Tasks 8–10 moved the script path to `<MAIN_REPO>`, the main checkout. From a session whose root is a linked worktree, the guard does not grant that path:

- `under_allowed_scripts` accepts `<top>/<scriptsDir>/*`, where `<top>` is the worktree.
- `hc_in_workspace` (`plugin/hooks/lib/harness-config-lib.sh`) otherwise matches only `<work_root>/<project_name>-*`.
- The main checkout is `<work_root>/<project_name>`, with no `-`, so neither test matches.

**Reproduced** against the shipped guard, on a throwaway fixture (`projectName: "proj"`, main checkout `…/work/proj`, worktree `…/work/proj-feat_x`), with the payload `cwd` set to the worktree:

| Command | Guard output |
|---|---|
| `bash scripts/push-branch.sh "$REPO_ROOT"` | `allow` |
| `bash …/work/proj/scripts/push-branch.sh "$REPO_ROOT"` | *silent* |
| `bash …/work/proj/scripts/push-branch.sh …/work/proj-feat_x` | *silent* |

With the payload `cwd` at the main checkout, the second command is allowed. So the gap is specific to worktree runs, and every local unattended run is a worktree run.

With the guard silent, the only possible grant is the profile's `permissions.allow` entry `Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)`. The repository's own shipped headers say a command carrying a shell expansion cannot be matched that way:

- `cli/templates/scripts/commit-on-branch.sh` → `# WHY A WRAPPER EXISTS AT ALL`: "a command carrying a shell expansion (`$VAR` / `${…}` / `$(…)`) cannot be matched statically".
- `cli/templates/scripts/push-branch.sh`: "a `git push` command line assembled with a shell expansion is matched statically by neither and is refused in an unattended run".

Whether `sandbox.excludedCommands` matches a call carrying a variable argument is not among the task prompt's verified facts either.

**What follows at run time.** Under the new default `dontAsk` mode, a call that matches no `allow` entry is refused. A push from any of the ten sites is then refused and never runs. Each site calls its push best-effort and unconditional, and `dispatch_discipline_instructions.md` → `## Best-effort — never a gate` says "a push that did not land — is logged, and the flow proceeds unchanged". So the flow-progress ledger flips, the task and fix plans, the statistics, digest and observations commits, and the docs commits all stay local.

The story index lists this as a top risk: "A missed agent-issued push spelling fails silently". It was not caught because code-review Findings 2 and 5 checked the fence and the `<MAIN_REPO>` spelling, not whether anything grants the argument.

**Precedent.** `plugin/agents/committer.md` already gets this right. Both its push steps, `### Standard procedure` step 6 and `### ui_test_pass procedure` step h, run `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` "with both paths spelled literally". A literal command is one the profile's `allow` entry and the `excludedCommands` rule can both match as written. The fix brings the ten sites in line with it.

**Fix.**

- [ ] At every site listed above, replace `"$REPO_ROOT"` in the push command with `<repo_root>`, giving `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`. Change only the push line; leave the commit wrapper's `--repo "$REPO_ROOT"` as it is, because the guard grants that call from the worktree.
- [ ] Directly after each changed push fence, add this sentence. In `autonomous_pause_and_ledger.md` §1.6, which has no fence, put it after the sentence ending "runs outside the sandbox)." instead.

  > Spell both paths literally — `<MAIN_REPO>` and `<repo_root>` each as the absolute path it resolves to, never `"$REPO_ROOT"` or any other variable. From a worktree, the script-allowlist guard does not vouch for the main checkout's copy, so the profile's literal `allow` entry is this call's only grant, and a command carrying a shell expansion does not match it.

- [ ] In `autonomous_pause_and_ledger.md` §1.6, replace "using the `$REPO_ROOT` the fork resolved at session start (the commit wrapper's path" with "the commit using the `$REPO_ROOT` the fork resolved at session start (the commit wrapper's path".
- [ ] In the sentences that introduce the push, replace "using the same session-start `$REPO_ROOT`" with "naming the same worktree root the commit above used, spelled literally":
  - `clarification_digest_instructions.md` → `## Push`;
  - `improvement_observations_instructions.md` → `## Push`.

  In `dispatch_discipline_instructions.md` → `## Push`, replace "using the same `$REPO_ROOT` the commit above used" with the same text.
- [ ] Three files name `<repo_root>` and declare no row for it: `clarification_digest_instructions.md`, `dispatch_discipline_instructions.md` and `improvement_observations_instructions.md`. In each one's `## Resolved values` table, add this row directly after the `<MAIN_REPO>` row:

  `| <repo_root> | derived at runtime | The worktree root this run executes in — the value the activating flow's `<repo_root>` binding gives and `$REPO_ROOT` holds. In the push command, spell it as a literal absolute path, never through a substitution or a variable. |`

  Also add `<repo_root>` to the sentence in each file's table lead that names the tokens "derived at runtime", beside `<MAIN_REPO>`. The other six files already declare `<repo_root>`.

No test file covers these instruction files, so this fix runs no test.

- **Deviations from plan:** Two push-introducing sentences the fix list does not name still told the reader to push "using the `$REPO_ROOT` resolved once at session start", contradicting the new literal-spelling sentence beside them: `plan_orchestration_instructions_autonomous.md` → `### Override E` (the sentence ending "the Override D commit command") and the paragraph after the push fence in `user_review_fixes_instructions_autonomous.md` → `### Override E`. Both reworded to name the worktree root the commit above used, spelled literally. The commit-wrapper sentences that use `$REPO_ROOT` (`### Override D` in both files) are unchanged, per the fix's first bullet.
