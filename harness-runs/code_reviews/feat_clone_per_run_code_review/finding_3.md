### 3. `hr_clone_target_check_var` reads the registry twice, though its header and the library header say once

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_clone_target_check_var`): the condition `&& kind=$(hr_registry_peek "$registry" "$branch" copy_kind) \` followed by `&& wt=$(hr_registry_peek "$registry" "$branch" worktree) && [ -n "$wt" ]; then`.

**Problem.** The function's header says *"Every record is read once, and the registry is only peeked at"*. The library's opening header says the clone arm reads *"the main checkout's registry and configuration … once each"*. The code reads the registry file twice, once per key, in two separate `jq` processes. The watcher rewrites that file by `mktemp` plus `mv`, so the two reads can come from two versions of the file: `copy_kind` from one and `worktree` from another. Both are legitimate writes, so nothing is trusted that should not be. But the read-once guarantee the header states, and that `.claude/context/cli.md` → `## What "done" means here` holds a reviewer to (*"a header a review reads as a guarantee is worth exactly what the code under it still does"*), does not hold.

**Fix.** Read both keys in one `jq` call, with the same non-creating guards `hr_registry_peek` applies, and decode them through the TSV unescaper `hr_clone_remove_var` already uses. Add `line=""` and `tab=$'\t'` to the function's `local` list, then replace the whole `if [ -n "$branch" ] && registry=$(hr_state_path …) … fi` block with:

```bash
  if [ -n "$branch" ] && registry=$(hr_state_path "$main" autonomous_logs/registry.json) \
    && [ -f "$registry" ] && [ -r "$registry" ] \
    && line=$(jq -r --arg b "$branch" '
      .runs[$b] | if type == "object"
        then [(.copy_kind // "" | tostring), (.worktree // "" | tostring)] | @tsv
        else error("absent") end
    ' "$registry" 2>/dev/null); then
    hr_tsv_unescape_var "${line%%"$tab"*}"
    kind=$HR_CFG_VALUE
    hr_tsv_unescape_var "${line#*"$tab"}"
    wt=$HR_CFG_VALUE
    if [ -n "$wt" ]; then
      wt_c=$(hr_canonical_path_nogit "$wt") || wt_c=""
    fi
  fi
```

The refusal sentence that follows (`its .git is not a regular pointer file, and the run registry records no clone of $main at that path`) stays byte-identical, so `cli/test/clone-trust-check.test.mjs` and `cli/test/wrapper-target-check.test.mjs` keep matching it. The fix edits no test file, so it runs none.
