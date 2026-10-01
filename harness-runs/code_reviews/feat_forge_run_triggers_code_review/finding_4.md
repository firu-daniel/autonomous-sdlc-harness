### 4. The registry's field list still says only `launch_remote_run` writes `execution`, and omits `remote_adopted_at`

> **Self-contained per-finding file** for the `feat_forge_run_triggers` code-review index (`harness-runs/code_reviews/feat_forge_run_triggers_code_review.md`). The implementer reads only this file. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/autonomous-watcher.sh`, the header's run-registry field list, at "#   execution           `github-actions` on a record launch_remote_run wrote, and" and after the `remote_dispatched_at` entry.

**Problem.** That comment block is the only place the run registry's per-record fields are listed; neither `docs/watcher.md` nor any other document names `remote_dispatched_at` or `pause_relayed_at`. This branch adds a second writer of a remote record and a new field:

- `remote-run.sh adopt` writes `execution: github-actions` through `lib/harness-run-lib.sh` → `hr_remote_record_init`. That function is now also `launch_remote_run`'s body.
- `remote-run.sh` → `adopt_one` writes `remote_adopted_at` ("hr_registry_set \"$registry\" \"$b\" status running remote_adopted_at").

The field list still says `execution` is on "a record launch_remote_run wrote", and it has no `remote_adopted_at` entry. Its `remote_dispatched_at` entry also does not say the field stays empty on an adopted record. A reader tracing why a remote record has an empty `remote_dispatched_at` will not find the answer. This is a wrong durable statement with no consumer decision on it, so this is Should Fix.

**Fix.**

- [ ] Change the `execution` entry to: `` `github-actions` on a remote record — one `launch_remote_run` wrote, or one `remote-run.sh adopt` wrote for a run started on GitHub, both through lib/harness-run-lib.sh's `hr_remote_record_init` — and absent on a local one. Fixed for the run's life: a later pass reads this field, never `execution.target` ``. Keep the entry's column alignment and `#` comment prefix.
- [ ] Extend the `remote_dispatched_at` entry with: `; always empty on a record remote-run.sh adopt wrote, since no local dispatch happened`.
- [ ] Add an entry directly after `remote_dispatched_at`:

  ```
  #   remote_adopted_at   the epoch second `remote-run.sh adopt` wrote this record
  #                       for a run started on GitHub (a trigger's, or another
  #                       machine's); absent on every other record
  ```

This is a comment-only edit to a shipped template. `cli/test/outer-loop-scripts.test.mjs` compares the written copy to the template byte for byte, so it keeps passing unchanged. No test run is owed.
