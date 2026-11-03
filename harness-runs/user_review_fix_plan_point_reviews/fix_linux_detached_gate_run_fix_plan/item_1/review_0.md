# cli review — 1. The gate launcher accepts the main checkout as its target in local mode — iteration 0

## Should Fix
1. **`hr_json_single_object`'s caller list no longer names all its callers** — `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_json_single_object`) — "Its callers: `autonomous-watcher.sh` → `run_profile_render` and `run_profile_check`, and `launch-sandboxed-gates.sh` checks 5 and 8."
   The header says this is "THE ONE HOME of the test, so a profile one caller accepts the other cannot refuse", and then lists its callers. This diff adds a third library-side caller, `hr_registry_foreign_copy_var` (`[ -f "$file" ] && [ -r "$file" ] && hr_json_single_object "$file" || return 2`), and with it launcher check 6. The list was not updated. `.claude/context/cli.md` → `## What "done" means here` says a change either satisfies its module's header or amends it in the same edit. A maintainer who later narrows or widens the test by reading this list would leave out the registry reader. Confirmed by `grep -n hr_json_single_object` over `cli/templates/scripts/`.
   **Fix:** Extend the sentence to read: "Its callers: `autonomous-watcher.sh` → `run_profile_render` and `run_profile_check`, `launch-sandboxed-gates.sh` checks 5 and 8, and `hr_registry_foreign_copy_var` (launcher check 6)." Make the same edit in the root copy `scripts/lib/harness-run-lib.sh` when sub-step 5 lands.

## Nice to Have
1. **Fixture (p) covers only two of the four live statuses and none of the fail-closed worktree arms** — `cli/test/launch-sandboxed-gates.test.mjs` (`(p) local mode: …`) — "for (const status of ['running', 'parked'])"
   The plan asked for `running` and `parked`, and those are what (p) tests. The function's comment also makes `park_loop`, `paused`, an empty `worktree` and an unresolvable `worktree` count as foreign (fail-closed), and no case exercises any of them. A regression in the `select(...)` status list or in the empty-worktree branch would pass the suite.
   **Fix:** Widen the loop to `['running', 'parked', 'park_loop', 'paused']`. Add one record with `worktree: ''` and one with a relative `worktree` such as `'copy'`, each asserting `accepted only in job mode`.
