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

- **Deviations from plan:** (`cli` layer dispatch)
  - Step 1 placement: `hr_json_single_object` sits directly after `hr_profile_deny_paths` in `cli/templates/scripts/lib/harness-run-lib.sh`, beside the other per-run profile readers. It takes `"${1-}"`, so a call with no argument is a refusal rather than an unbound-variable abort under `set -u`.
  - Step 2 adds a comment-only edit the finding does not list: check 5 in the launcher's `THE CHECKS` header now names `hr_json_single_object`.
  - Step 3: the watcher's predicate was the named function `run_profile_one_object`, not an inline test. The function was deleted and its three call sites (`run_profile_render` once, `run_profile_check` twice) now call `hr_json_single_object`.
  - Step 4 (byte-identical copies under `scripts/`) lies outside `cli/`. It belongs to this finding's `general` dispatch, as Finding 1's step 5 did, and was not touched here. Until it lands, `scripts/launch-sandboxed-gates.sh` and `scripts/autonomous-watcher.sh` still carry `lsg_json_object` and `run_profile_one_object`.
  - Step 5: the case went into `cli/test/run-gates-lane-lib.test.mjs`. That suite sources a copy of the run library and pins its Run gates helpers; its header now names this predicate too. The case also covers an empty file and an absent path, both of which must answer 1. The suite reads one fixed file, so it owes no `treeGuards` entry.
  - Not run here, and deferred to the Run gates phase: `cli/test/launch-sandboxed-gates.test.mjs` and `cli/test/watcher-run-profile.test.mjs`. They pin the callers' behaviour, but this unit did not edit them, so `## The test-run rule` point 1 excludes them.
- **Deviations from plan:** (`general` layer dispatch, step 4)
  - Step 4 covers `scripts/lib/harness-run-lib.sh` too, not only the two scripts the finding's `**Sites:**` list. Step 1 changed that template, and the checkout copy has to carry `hr_json_single_object` for the two copied callers to resolve it.
  - The tool layer refused `cp` (don't-ask mode). The copies were made by applying the template diffs with the file-edit tool instead. Before the edit, `git diff HEAD:cli/templates/scripts/<f> HEAD:scripts/<f>` was empty for all three files. After it, `cmp cli/templates/scripts/<f> scripts/<f>` exits 0 with no output for each, so the copies are byte-identical. File modes are unchanged: `scripts/autonomous-watcher.sh` was already `100755` against the template's `100644` at HEAD.
  - `git grep -n -e lsg_json_object -e run_profile_one_object` now matches only run artifacts under `harness-runs/`.
