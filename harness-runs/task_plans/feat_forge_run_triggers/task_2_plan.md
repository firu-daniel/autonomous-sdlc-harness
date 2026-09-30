### Task 2 — Move the inbox filename routing into the run library, and add the library's `forge` reader

**Goal:** Make `cli/templates/scripts/lib/harness-run-lib.sh` the one owner of two answers the trigger needs and that today live in one place each or nowhere:

- the inbox filename patterns and the branch each one derives, currently spelled only inside the watcher's `process_inbox_file`;
- the value of `forge`, which no shell script reads today.

Task 3's branch-name derivation checks every derived name against these same patterns, and Task 7's trigger reads `forge` at run time. Neither may carry a second copy.

**Where this task stops.** It moves the routing without changing it, adds one reader, and changes no behaviour of the watcher: a drop routes exactly as it does today (acceptance 6). The branch-name functions that call `hr_inbox_route_var` are Task 3's; the trigger that calls `hr_forge` is Task 7's.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — `hr_inbox_route_var`, `forge` in the configuration load, and `hr_forge`.
- `cli/templates/scripts/autonomous-watcher.sh` — `process_inbox_file` step (1) calls the library.
- `cli/test/outer-loop-scripts.test.mjs` — library cases for both functions.
- `cli/test/watcher-remote-dispatch.test.mjs` — one watcher-level routing case.

**Work:**

- [ ] **`hr_inbox_route_var <filename>`** in the library. It sets `HR_INBOX_KIND` (`task` | `user_review` | `docs`) and `HR_INBOX_BRANCH`, and returns 0 on a match. On no match it returns 1 with both variables empty. The three `sed -nE` expressions move here from `process_inbox_file` byte for byte, tested in the same order (task first): `^(.+)_task_prompt\.md$`, `^(.+)_review(_[0-9]+)?\.md$`, `^(.+)_docs\.md$`. Carry the watcher's explanatory comment block with them: the suffixes are mutually exclusive by construction, POSIX leftmost-longest decides a round-suffixed name, and the watcher derives only the branch, never the round. The `_var` suffix follows the library's convention for a function that assigns rather than prints (`hr_cfg_scalar_var`). Add the function to the header's opening list of what the library is the one place for.
- [ ] **`process_inbox_file` step (1)** calls `hr_inbox_route_var "$fname"` and reads `branch` and `engine_kind` from the two variables. The rejection arm stays exactly as it is: the same log line, the same `rejected_<timestamp>_` archive name, `return 0`. Afterwards the watcher spells none of the three regexes in code. Its comment above `process_inbox_file` keeps the pattern → engine table and points at the library as the owner.
- [ ] **`hr_forge <root>`** in the library. Add `s("forge"; try .forge catch null)` to `hr_config_load`'s one `jq` program, then add the reader beside `hr_execution_target`, in the same form and with a header comment stating its contract. It prints `github`, `gitlab` or `none` and returns 0 when the key holds one of them. It prints nothing and returns 1 when the key is absent: *not yet decided*, which is not the same as `none`, and the schema withholds a default on purpose. It prints nothing and returns 2 when the configuration is unresolvable or the value is outside the enum, a refusal rather than a guess. It is the shell mirror of `cli/src/config/model.ts` → `FORGE_KINDS`, and its comment says so.
- [ ] **`outer-loop-scripts.test.mjs`**: add one `test(...)` for each function, using the file's existing `sourceAndCall` helper.
  - `hr_inbox_route_var` must route every example the moved comment names: `foo_review_task_prompt.md` → task on `foo_review`; `foo_task_prompt_review.md` → user_review on `foo_task_prompt`; `foo_review_2.md` → user_review on `foo`; `foo_review_2_review.md` → user_review on `foo_review_2`; `foo_docs.md` → docs on `foo`. `notes.txt` must return 1.
  - `hr_forge` must answer absent → 1 and empty; `github` → 0 and `github`; `"bitbucket"` → 2.
- [ ] **`watcher-remote-dispatch.test.mjs`**: add one case with the key absent, so the drop takes the local path the file's key-absent case already drives. A drop named `<name>_review_task_prompt.md` launches the task engine on branch `<name>_review`, and a file matching no pattern is archived under `rejected_…` with nothing launched. This exercises the moved routing through the watcher itself rather than only through the library.

**Verification:**

- `npm test -- test/outer-loop-scripts.test.mjs` and `npm test -- test/watcher-remote-dispatch.test.mjs` from `cli/` pass, the latter with every case it carried before this task unchanged.
- `grep -nF "sed -nE 's/^(.+)_" cli/templates/scripts/autonomous-watcher.sh` prints nothing: no routing expression is left in the watcher's code. The same fixed-string grep over `cli/templates/scripts/lib/harness-run-lib.sh` finds all three expressions.
- `grep -n "hr_forge\|hr_inbox_route_var" cli/templates/scripts/lib/harness-run-lib.sh` shows each defined once, with its contract comment.
