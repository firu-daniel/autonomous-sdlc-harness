### Task 10 — Add `remote-run.sh adopt` and `adopt --list` for runs started on GitHub

**Goal:** Make a trigger-started run visible to, and controllable by, the local commands (acceptance 5). Those commands work on a registry record and a mirror working copy, and `sync` exits 2 on *no record* and on *no mirror* (`remote-run.sh` → its header's test notes). A run the local watcher never dispatched has neither. The new verb has two modes:

- `remote-run.sh adopt [--repo <root>]` finds `harness run <branch>` runs the local registry does not know and, for each, creates the mirror with `create-worktree.sh --existing` and writes the record with `execution: github-actions`. It then runs the existing `sync`, which does the rest.
- `remote-run.sh adopt --list` prints the same candidates and writes nothing, for `/autonomous-sdlc-harness:branch-status`, which never syncs.

**Depends on:**

- Task 9's `hr_remote_record_init <registry> <branch> <worktree> <log_path> <engine>`. It writes `worktree`, `log_path`, `engine`, `execution: github-actions`, `started_at`, the empty `pid` and the reset counters, returns 1 on a failed write, and never sets `status`.
- Task 8, which last edited `remote-run.sh`.

The run title contract is `docs/remote-execution.md` → `## 5.`: `run-name` is `harness <action> <branch>`.

**Where this task stops.** The verb adopts on request only. The watcher's tick never calls it: a tick-time adopt would spend a `gh` listing on every poll and create working copies nobody asked for, against `docs/remote-execution.md` → `## 1.`'s *"Nothing flows from GitHub to this machine unless the user asks"*. The four commands that call it before they sync are Task 16's. `branch-status`'s call of `--list` is Task 17's. Relays of an adopted run still need the local watcher running when the maintainer acts, exactly as for a locally dropped remote run.

### Targets

- `cli/templates/scripts/remote-run.sh` — the verb, its header, usage line and REPRO.
- `cli/test/remote-adopt.test.mjs` (new) — the verb's contract.

**Work:**

- [ ] **Arguments and gate.** Add `adopt` to the verb list and `usage()`. It takes no branch; `--list` is an `adopt` option only. It falls under the sending-verb gate: `execution.target` other than `github-actions` → exit 2, nothing written. `root` is `hr_main_repo`. The registry path is `hr_state_path "$root" autonomous_logs/registry.json`, tested with `-f` before any read, because `hr_registry_get` creates an absent registry and `--list` writes nothing.
- [ ] **Candidates.** Read one bounded listing of the run workflow with the script's existing `ALL_RUNS_LIMIT` (the `list_all_runs` helper `remote_branch_stopped` reads, or the same call). A listing failure → exit 3, nothing written. Keep the runs titled exactly `harness run <branch>`, newest first, one per branch; never a `harness pause`, `stop` or `warm` title. Drop a branch when:
  - the registry has any record for it;
  - `hr_branch_is_protected` does not answer 1;
  - it is not a live head on `origin`, read with one `git -C "$root" ls-remote --heads origin`. A merged-and-deleted branch is not adopted, which bounds adopt to runs still worth working. A failed `ls-remote` → exit 3.

  `--list` prints `remote-run.sh: not adopted: <branch> <newest run url>` per candidate, or `remote-run.sh: nothing to adopt`, and exits 0.
- [ ] **Adopt each candidate**, in order, one failure never stopping the next:
  1. Run `bash "$script_dir/create-worktree.sh" --existing "$branch"`, with its output to stderr. A non-zero exit — typically 2, the branch already checked out elsewhere — prints `remote-run.sh: could not adopt <branch>: create-worktree.sh exited <n>` and moves on.
  2. `hr_remote_record_init "$registry" "$branch" "$(hr_worktree_dir "$root" "$branch")" "<the main checkout's <state_dir>/autonomous_logs/<branch>.log>" task`.
  3. One `hr_registry_set` of `status` `running` and `remote_adopted_at` `<epoch>`.
  4. `bash "$script_dir/remote-run.sh" sync "$branch" --repo "$root"`.
  5. When the run `sync` recorded (`remote_run_id`) has a downloaded `status.json` under `<state_dir>/autonomous_logs/remote_download/<branch>/<id>/` whose `engine` passes `valid_engine`, set the record's `engine` to it. Every trigger-started run is `task`, and a run another machine dropped may not be.
  6. Print `remote-run.sh: adopted <branch> (<newest run url>)`.

  Exit 0 when every candidate was adopted or there were none, and 4 when at least one could not be.
- [ ] **Header**:
  - add `adopt` and `adopt --list` to *THE VERBS AND THE EXIT MAP* with the codes above;
  - add a paragraph *`adopt` MAKES A RUN STARTED ON GITHUB LOCAL*, covering what it reads, its three filters and their reasons, why only on request, and that `--list` writes nothing;
  - amend *WHAT IT NEVER DOES* for the registry records and mirrors `adopt` writes;
  - add REPRO lines for `--list`, an adopt, and a repeat that finds nothing.
- [ ] **`cli/test/remote-adopt.test.mjs`** opens with its rule: *adopt writes a record and a mirror only for a live, unprotected, unrecorded branch whose newest run is titled `harness run <branch>`, and `--list` writes nothing*. The fixture has a bare `origin` carrying `feat_x`, and a `gh` stub whose `run list` answers:
  - `harness run feat_x` (`in_progress`, with a `url`);
  - `harness pause feat_x`;
  - `harness run feat_gone`, whose branch is not on `origin`;
  - `harness run main`.

  Cases:
  - `adopt --list` prints `feat_x` only, and the registry file is still absent;
  - `adopt` creates the mirror at `hr_worktree_dir`, writes `.runs.feat_x` with `execution` `github-actions`, `worktree` at that path and `status` `running` (the stub's newest run is not completed, so `sync` sets `running`), and prints `adopted feat_x`;
  - a second `adopt` prints `nothing to adopt` and changes no byte of the registry beyond `updated_at`;
  - a branch already recorded is skipped;
  - `execution.target` `local` → exit 2;
  - a stub failing `run list` → exit 3 with no registry written;
  - `feat_x` already checked out in another working copy → exit 4 and a `could not adopt feat_x` line.

**Verification:**

- `npm test -- test/remote-adopt.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `grep -n "adopt" cli/templates/scripts/autonomous-watcher.sh` prints nothing: the tick never adopts.
