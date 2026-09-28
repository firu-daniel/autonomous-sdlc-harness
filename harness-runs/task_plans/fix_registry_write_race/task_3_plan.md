### Task 3 — Batch `remote-run.sh`'s registry writes, and race a `stop` against watcher writes

**Goal:** `remote-run.sh` writes the same registry as the local watcher, from a separate process and at any moment. Make each of its outcomes land as one write, so a watcher pass never reads a record half-way through a `sync` or a `stop`. Prove that a `stop` racing a watcher write loses neither write.

**Depends on:** Task 1, which widens `hr_registry_set` to `hr_registry_set <file> <branch> <key> <value> [<key> <value> …]`: serialized by a lock at `<file>.lock`, one `mv` per call, returning 1 and writing nothing on an odd pair count. That serialization is what makes a racing write safe. This task makes each outcome atomic as well. Task 1 created and owns `cli/test/registry-writer.test.mjs`; this task appends one case. It is ordered after Task 2 only so the two appends to that file do not collide.

**Where this task stops.** The poller's handling of a bundle with no readable `usage_resume_at` (`poll_pass`'s *"is usage-paused with no readable usage_resume_at; skipped"*) is unchanged. Task 4 makes job mode always record a usable time before it hands a run to the poller, so that arm is a corrupt-bundle guard, not the lost-update path.

### Targets

- `cli/templates/scripts/remote-run.sh` → `verb_stop`'s registry update, `set_or_fail`, and the `sync` outcomes that call it in sequence. The header's `stop` paragraph (*"to `failed` through `hr_registry_set`"*) says the record changes in one write.
- `cli/test/registry-writer.test.mjs` (appends one case; created by Task 1).

**Work:**

- [ ] `verb_stop`: replace the chained `hr_registry_set … remote_stopped_at … && hr_registry_set … status failed` with one call writing both keys. Keep the existing *"stopped on GitHub, but the local record of $branch could not be updated"* stderr line on failure.
- [ ] Add a multi-pair sibling to `set_or_fail` (for example `set_many_or_fail k1 v1 k2 v2 …`) with the same failure message form and exit. Use it for each consecutive run of `set_or_fail` calls in `verb_sync` and its helpers:
  - the `expired` block;
  - the `running` block;
  - the finished-bundle block (`status`, `pause_reason`, `usage_resume_at`, `park_loop_cycles`, `remote_run_id`, `remote_run_url`, `remote_detail`, `remote_synced_at`);
  - the `killed` block;
  - the no-bundle `failed` block.

  A value computed with a command substitution is computed into a local variable first, so one failed read cannot abort half a batch.
- [ ] Append a case to `cli/test/registry-writer.test.mjs`: **a `remote-run.sh stop` racing a watcher write.** Use a fixture `init` wired with `execution.target` `github-actions`, a `gh` recorder in the style of `cli/test/remote-run.test.mjs` → `remoteFixture` / `remoteRun` (a stub answering `run list` with no active run), and a seeded record for `feat_x`. Start at once:
  - (i) `bash scripts/remote-run.sh stop feat_x` with the stub on `HARNESS_GH_CLI`;
  - (ii) several `registry_set feat_x key_<i> v_<i>` calls through the sourced watcher (`bash -c '. "$1" status >/dev/null; registry_set …'`).

  Afterwards `status` is `failed`, `remote_stopped_at` is numeric, and every `key_<i>` is present. Loop enough iterations to show the invariant.

**Verification:**

- Your new case in `cli/test/registry-writer.test.mjs` passes, and so do Task 1's and Task 2's cases, unchanged.
- Grep `remote-run.sh` for two consecutive `set_or_fail` lines, and for a chained `hr_registry_set … && hr_registry_set`, and find neither.
- `bash scripts/typecheck.sh` passes.

**Deviations from plan:**

- No single-file test command is stated in `.claude/context/conventions.md` or `.claude/context/cli.md`; the new case and Task 1's and Task 2's cases were run with the stated runner on one file, `node --test test/registry-writer.test.mjs` from `cli/`, after `bash scripts/typecheck.sh` had built `cli/dist`. All 7 cases passed.
- `set_or_fail` is kept for the one lone write left (`remote_synced_at` in `verb_sync`'s already-applied case). The finished-bundle block's two command-substitution values are read into the locals `resume_at` and `cycles` first; a failed read gives an empty value, as `|| :` did before.
