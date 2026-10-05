### 1. `remote-run.sh`'s REPRO block now predicts the wrong outcome for `trigger`, `dispatch`, `collect` and `control`

**File:** `cli/templates/scripts/remote-run.sh` (the header's `REPRO — every verb and every refusal` block) — "export GITHUB_EVENT_NAME=issues GITHUB_EVENT_PATH=e.json"

The header's REPRO block is the by-hand reproduction contract for every verb and every refusal. This branch changed what an unset `HARNESS_RUN_ACTORS` means, but did not update that block. None of its fixtures sets the variable, and none of its event files carries `.repository.owner`. So `run_actor_listed` takes its unset path, reads no owner from the event file, and admits nobody. Each line below now predicts the opposite of what the script does:

- **`trigger`** — the `trigger    bash scripts/remote-run.sh trigger -> 0` line. `alice` is a `write` user, so `authorise_actor` passes the permission call and then returns status `5`. The issue trigger refuses with exit `2`, sends no `workflow run`, and posts a comment naming `HARNESS_RUN_ACTORS`. The test `an unset HARNESS_RUN_ACTORS with no repository in the event fails closed` in `cli/test/remote-trigger.test.mjs` asserts exactly this.
- **`dispatch`** — the `dispatch   GITHUB_EVENT_NAME=repository_dispatch … -> 0` line. Its `e.json` carries no `sender`, so `sender_type` is empty. With the list unset, `run_actor_listed ""` fails, and the dispatch is refused with exit `2`.
- **`collect`** — the `collect    bash scripts/remote-run.sh collect feat_x -> 0; origin/feat_x gains …` line. `alice`'s review is dropped with a `dropped 1 item(s) by @alice` line, so no round is committed or dispatched.
- **`control`** — the `pause      bash scripts/remote-run.sh control -> 0; "$s.log" gains `workflow run …`` line. The comment is refused with exit `2`, and only a reply is posted.

The block also has no line for the refusal this branch adds: a writer the list does not admit. Yet the block's own heading promises *"every refusal"*.

**Fix:**

- [ ] In the `trigger needs start's setup …` paragraph, add `HARNESS_RUN_ACTORS='*'` to the `export` line. Every later setup (`report`, `deliver`, `collect`, `control`) chains from it ("needs trigger's setup", "needs report's setup", …), so the variable reaches all of them:

  ```
  #   {"permission":"write"}; export GITHUB_EVENT_NAME=issues GITHUB_EVENT_PATH=e.json
  #   GITHUB_REPOSITORY=o/r HARNESS_TRIGGER_LOOKUP_SECS=0 HARNESS_RUN_ACTORS='*':
  ```

- [ ] Directly under the `read       the permission answer {"permission":"read"} -> 2, …` entry, add one entry for the allow-list refusal:

  ```
  #   not listed HARNESS_RUN_ACTORS=bob -> 2, no `workflow run`, one comment
  #              naming HARNESS_RUN_ACTORS, the label removed
  #   unset      HARNESS_RUN_ACTORS= and e.json gaining
  #              "repository":{"owner":{"login":"alice","type":"User"}} -> 0, as
  #              `trigger`; the owner `bob` instead -> 2, the comment naming @bob
  ```

- [ ] Keep every other REPRO line byte-identical.

This edits a comment in a shell template only. It creates or edits no test file, so it runs no test.
