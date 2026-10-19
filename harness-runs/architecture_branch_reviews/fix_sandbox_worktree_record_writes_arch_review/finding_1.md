### 1. `runsUnsandboxed` doc comment cites a rule `sandboxProfile.ts`'s header does not hold

**Severity:** Should Fix (non-blocking).

**Site:** `cli/src/generators/outerLoopScripts.ts` → `OuterLoopScript.runsUnsandboxed`, the doc-comment sentence this branch added: *"Set it only on a script carrying the excluded-wrapper checks `generators/sandboxProfile.ts`'s header requires."*

**Problem.** The sentence names `cli/src/generators/sandboxProfile.ts`'s module header as the owner of the checks a script must carry before it may be flagged `runsUnsandboxed`. That header does not state those checks. Its rule is *"no command runs outside the sandbox unless this module names it, and it names only a file the sandbox cannot write"*, followed by the exclusion spelling and the shared path producer. The list it does not carry is in `cli/templates/scripts/lib/harness-run-lib.sh`, in the header's `JURISDICTION` paragraph and the wrapper functions it names:

- `hr_git_env_drop`
- `hr_wrapper_main_of`
- `hr_wrapper_target_check_var`
- `hr_worktree_config_check_var`
- `hr_pinned_hooks_path`
- `hr_wrapper_branch_var`
- the main-checkout protected set

The three excluded wrappers' own headers say the same (`commit-on-branch.sh` → **THE TARGET IS NOT TRUSTED** through **THE INHERITED GIT ENVIRONMENT IS DROPPED**).

A maintainer who follows the pointer before flagging a fourth wrapper finds no requirement, so the gate the sentence exists to impose has no reachable owner. `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"A responsibility that already has a home does not get a second one"*) and `.claude/context/cli.md` → `## What "done" means here` (*"A reviewer holds a change to its module's own header … a header a review reads as a guarantee is worth exactly what the code under it still does"*) both require a header citation to resolve to the place that actually holds the rule.

**Fix.** In `cli/src/generators/outerLoopScripts.ts` → the `runsUnsandboxed` doc comment, change the final sentence so it cites the real owner. For example: *"Set it only on a script carrying the excluded-wrapper checks `cli/templates/scripts/lib/harness-run-lib.sh` → the header's `JURISDICTION` paragraph names (`hr_git_env_drop`, `hr_wrapper_main_of`, `hr_wrapper_target_check_var`, `hr_worktree_config_check_var`, `hr_pinned_hooks_path`, `hr_wrapper_branch_var`, and the main checkout's protected set)."*

The other option is to add that requirement to `cli/src/generators/sandboxProfile.ts`'s module header, beside its existing rule, and leave the citation as it is. Do one or the other, not both: the requirement must have exactly one home. This is a comment-only change, and no test or code path changes.
