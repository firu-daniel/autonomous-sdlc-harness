### 2. Share the one-JSON-object profile predicate instead of re-typing it in the launcher

**Severity:** Should Fix

**Sites:**

- `cli/templates/scripts/launch-sandboxed-gates.sh`, the function `lsg_json_object()`, whose body is `jq -s 'if length == 1 and (.[0] | type) == "object" then 1 else 0 end'`.
- `cli/templates/scripts/autonomous-watcher.sh`, the existing predicate that spells the same test as `jq -s 'length == 1 and (.[0] | type) == "object"'`.
- `scripts/launch-sandboxed-gates.sh` and `scripts/autonomous-watcher.sh`: this checkout's copies.

**Problem.**

The launcher decides whether the base profile and the per-run profile are trustworthy input with a new private predicate: one JSON value, and that value an object. The watcher already makes the same judgement over the same files with its own spelling of the same `jq` program. A file one script accepts and the other refuses is exactly how a profile gets accepted at launch and rejected at gate time, or the reverse.

`.claude/context/conventions.md` → `### Where a new responsibility goes` says to grep before adding a copy, and says a responsibility with a home gets no second one. `cli/templates/scripts/lib/harness-run-lib.sh` is the library both scripts source, and its header says it holds what the scripts "would otherwise each re-derive slightly differently".

This is a Should Fix rather than a Must Fix because the watcher's copy predates this branch. The branch adds the second copy; it does not create the missing home.

**Fix.**

1. Add `hr_json_single_object <file>` to `cli/templates/scripts/lib/harness-run-lib.sh`. It returns 0 only when `jq -s 'length == 1 and (.[0] | type) == "object"'` prints `true`, and returns 1 when `jq` is missing, fails, or prints anything else. Its comment names both callers.
2. Replace `lsg_json_object` in `cli/templates/scripts/launch-sandboxed-gates.sh` with that helper.
3. Replace the watcher's inline predicate in `cli/templates/scripts/autonomous-watcher.sh` with the same helper. The watcher sources the library early, so the helper is available.
4. Copy the changed templates over this checkout's `scripts/` copies, byte for byte.
5. Add a case for `hr_json_single_object` to the suite that covers the run library's helpers. Cover an object, an array, two concatenated objects and invalid JSON.
