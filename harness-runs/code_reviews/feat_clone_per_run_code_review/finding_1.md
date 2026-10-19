### 1. `hr_clone_create_var`'s rollback writes `copy_kind: ""` into a prior record that had none, then reports a full rollback

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_clone_create_var`): the existence read `if hr_registry_peek "$registry" "$branch" branch >/dev/null; then` and the rollback line `hr_registry_set "$registry" "$branch" worktree "$prev_wt" copy_kind "$prev_kind" 2>/dev/null`.

**Problem.** When `.runs[<branch>]` already exists, creation keeps only two strings from it: `prev_wt` and `prev_kind`, both read through `hr_registry_peek`. That function prints nothing for an absent key *and* for an empty one. On any failure after the record is written, the rollback calls `hr_registry_set` with those two strings, which:

- adds `"copy_kind": ""` to a record that never had a `copy_kind`. Every record `autonomous-watcher.sh` and `remote-run.sh` write today lacks one, so this is the ordinary re-launch case: creation proceeds whenever the recorded `worktree` path no longer exists;
- adds `"worktree": ""` to a record that had no `worktree`;
- rewrites `updated_at`, because `hr_registry_set` always stamps it.

The refusal then ends `and everything this call created was rolled back`, which is false: the record holds a key the call created. Task prompt goal 6 requires that *"a creation that fails part-way removes everything it created … and nothing it did not"*. Case (i) of `cli/test/clone-create-remove.test.mjs` misses this because its prior record already carries `copy_kind: 'worktree'`.

**Fix.**

1. Add a whole-record restore beside `hr_registry_drop`. It uses the same lock, temp file and `mv`, and jq 1.5 has `fromjson`:

```bash
# hr_registry_restore <file> <branch> <json> — set `.runs[<branch>]` back to
# <json>, the compact record a caller read from the same file, under
# `hr_registry_set`'s lock, temp file and `mv`; only `hr_clone_create_var`'s
# rollback calls it. 0 restored; 1, writing nothing, when <file> is absent,
# <json> is not an object, the lock cannot be taken or the write fails.
hr_registry_restore() {
  local file="${1-}" branch="${2-}" rec="${3-}" dir tmp status=0 written=0
  [ -n "$file" ] && [ -f "$file" ] && [ -n "$rec" ] || return 1
  dir=$(hr_registry_dir "$file")
  tmp=$(mktemp "$dir/.registry.XXXXXX") || return 1
  if ! hr_registry_lock "$file" "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  if jq --arg b "$branch" --arg r "$rec" \
    '($r | fromjson) as $p | if ($p | type) == "object" then .runs[$b] = $p else error("not a record") end' \
    "$file" >"$tmp"; then
    mv "$tmp" "$file" && written=1 || status=1
  else
    status=1
  fi
  [ "$written" -eq 1 ] || rm -f "$tmp"
  hr_registry_unlock "$file" "$tmp"
  return "$status"
}
```

2. In `hr_clone_create_var`, replace the locals `prev_wt=""` and `prev_kind=""` with `prev_json=""`. Replace the existence read with:

```bash
  if hr_registry_peek "$registry" "$branch" branch >/dev/null; then
    existed=1
    if ! prev_json=$(jq -c --arg b "$branch" '.runs[$b]' "$registry" 2>/dev/null) || [ -z "$prev_json" ]; then
      HR_CLONE_REFUSAL="$why: reading its existing record in $registry failed"
      return 1
    fi
  fi
```

   In the rollback, replace the `hr_registry_set … worktree "$prev_wt" copy_kind "$prev_kind"` line with:

```bash
    hr_registry_restore "$registry" "$branch" "$prev_json" 2>/dev/null \
      || undo="${undo:+$undo, }the registry record of '$branch'"
```

3. Update the comments that name the registry's writers, so they keep listing every writer:
   - write exception 2's `Written only by` list, and its lock-pair sentence (`… pair hr_registry_set and hr_registry_drop call`): add `hr_registry_restore` to both.
   - write exception 6's `the registry, through hr_registry_set and hr_registry_drop alone`: add `hr_registry_restore`.
   - the `A caller that calls no …` list: add `hr_registry_restore` beside `hr_registry_drop`.
   - the FILE DISCIPLINE pass-through sentence (`the registry's writers, hr_registry_init, hr_registry_set and hr_registry_drop`): add `hr_registry_restore`.
   - `hr_clone_create_var`'s own header: replace `else its previous worktree and copy_kind in one hr_registry_set` with `else the whole previous record through hr_registry_restore`.

4. In `cli/test/clone-create-remove.test.mjs`, add a case after (i). It seeds `{ ...BYSTANDER, [BRANCH]: { branch: BRANCH, worktree: <a path that does not exist>, status: 'completed', updated_at: '2026-01-01T00:00:00' } }`, a record with no `copy_kind`, and forces the population failure with the same `gitShim(f, ' read-tree --reset -u ', 'exit 1')`. It then asserts `deepEqual(doc.runs[BRANCH], <the seeded record>)` and `deepEqual(doc.runs.other, BYSTANDER.other)`. That test file is the one this fix edits, so it is the only test the fix runs: `npm test --workspace cli -- test/clone-create-remove.test.mjs`.
