### 5. The run library's NAMING header omits `HR_TARGET_REFUSAL`

**Severity:** Should Fix. **Layer:** cli.

**Site:** `cli/templates/scripts/lib/harness-run-lib.sh`, the header's `# NAMING.` paragraph, at the substring `` `HR_INBOX_KIND`, `HR_INBOX_BRANCH`, `HR_WT_CONFIG_REFUSAL`, ``. The function that sets the variable is `hr_wrapper_target_check_var`.

**Problem.** The library header's NAMING paragraph lists every `HR_`-prefixed variable the file touches outside a `local`. This branch adds four such variables: `HR_WT_CONFIG_REFUSAL`, `HR_PINNED_HOOKS_PATH`, `HR_PINNED_HOOKS_REFUSAL` and `HR_TARGET_REFUSAL`. It adds the first three to the list but not `HR_TARGET_REFUSAL`, which `hr_wrapper_target_check_var` assigns and both `push-branch.sh` and `refresh-branch.sh` read. `.claude/context/cli.md` → `## What "done" means here` says *"A reviewer holds a change to its module's own header … a header a review reads as a guarantee is worth exactly what the code under it still does."* The rule is written for `cli/src` modules. The run library is a `cli/templates` asset whose header plays the same role, so this is graded Should Fix.

**Fix.** In the `# NAMING.` paragraph of `cli/templates/scripts/lib/harness-run-lib.sh`, add `` `HR_TARGET_REFUSAL`, `` beside `` `HR_WT_CONFIG_REFUSAL`, ``. Keep the comment's line wrapping. Re-render the worked example only if `examples/notes-app/` carries this file. It does not: the outer-loop scripts carry no token and are omitted there by that README's keep rule.
