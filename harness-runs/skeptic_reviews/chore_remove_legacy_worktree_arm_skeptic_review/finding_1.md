### 1. `hr_run_target_check_var`'s doc comment says it reads no run registry, but its clone acceptance is a registry read

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_run_target_check_var`, its doc comment) — "Reads no run registry and no tip,"

**Problem.** This branch adds `hr_run_target_check_var` as the single owner of the rule "a linked worktree is not a run copy". Its doc comment ends:

```
# `HR_TARGET_BRANCH` as that check set them. Reads no run registry and no tip,
# prints nothing; call it directly, never inside `$(…)`. Its callers:
```

That is false for every clone target. The function's first line is `hr_wrapper_target_check_var "${1-}" "${2-}" || return 1`. For a target whose `.git` is a real directory, that function hands off to `hr_clone_target_check_var`, which reads the run registry:

- `hr_state_path "$main" autonomous_logs/registry.json`;
- then the `jq -r --arg b "$branch" '.runs[$b] | … [(.copy_kind …), (.worktree …)] | @tsv' "$registry"` call.

So each of the three callers named in that same comment reads the registry when it is given a clone: `hr_run_copy_check_var`, `launch-sandboxed-gates.sh` check 6, and `setup-worktree.sh --target`. `docs/cli.md` §6 says so for the last two: from those callers, an unresolvable `<main>/harness.config.json` produces the clause *"the run registry that would record a clone of <main> cannot be located"*. The function's own refusal sentence also defines a run copy as *"a clone the run registry records"*.

**Who gets it wrong.** Picture a maintainer choosing a check for a new unsandboxed caller that must not depend on the registry, for example one that runs before the configuration can be resolved. That maintainer reads this comment as a guarantee: "it accepts a clone and reads no registry, so it is safe here." The registry dependency then surfaces only as a refusal at run time. `.claude/context/cli.md` → `## What "done" means here` holds a change to its module's own header, and this comment states a property the code does not have. The story index makes the same over-claim ("reading no registry and no tip"), so the comment repeats a plan error rather than a deliberate design statement.

This changes no behaviour. It is a wrong statement in a durable code comment, so it is graded Should Fix.

**Fix.** This is a comment-only edit in `cli/templates/scripts/lib/harness-run-lib.sh`, inside `hr_run_target_check_var`'s doc comment. Replace

```
# `HR_TARGET_BRANCH` as that check set them. Reads no run registry and no tip,
# prints nothing; call it directly, never inside `$(…)`. Its callers:
```

with

```
# `HR_TARGET_BRANCH` as that check set them. Adds no read of its own: the run
# registry is read only by that check's clone arm (`hr_clone_target_check_var`),
# and no tip is read. Prints nothing; call it directly, never inside `$(…)`.
# Its callers:
```

Leave the rest of the comment and the function body unchanged. This fix edits no test file and runs no test. The full suite runs in the Run gates phase.
