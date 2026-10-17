### Task 4 — Narrow the bundle-save residual in `docs/` and write the post-release checks file

**Goal:** Bring the documents of record in line with what Tasks 1–3 shipped:

- narrow the bundle-save item of `docs/cli.md` §6 residual 1 to exactly what remains, with the reason;
- correct the `stateDir` sentence of the `hr_remote_bundle_restore` item beside it;
- correct `docs/remote-execution.md` §11 → **The post-session steps on a job that passed.**;
- update `docs/watcher.md`'s summary of residual 1's items;
- write a checks file outside this repository for what only a real GitHub job after a release can verify.

**Depends on:** Tasks 1, 2 and 3, which are all landed when this catch-all task runs. It describes what they built and changes nothing in `cli/`. The facts it states come from these places:

- **The skip rule** (Task 1's `hr_remote_bundle_write` and `hr_remote_copy_tree`). A bundle source that is a symbolic link, or sits under a directory that is one, is skipped. That covers `remote_status.json`, the clarification directory, `PAUSE_PROGRESS.md`, the walker state, the run log and each planning path. One stderr line `remote state bundle: skipped <path>: <linked> is a symbolic link` is printed for each skip, and the bundle is written from everything else. A directory source is copied with no link copied or followed at any depth.
- **`save`'s own two reads** (Task 2). `save` applies the same test to the status source and `autonomous_logs/registry.json` before the write, treating a linked one as absent.
- **The `stateDir` source** (Task 1's `hr_remote_state_dir_var`, used by `save`, `restore` and the bundle functions). In a job, `stateDir` comes from `harness.config.json` at `HARNESS_GITHUB_DEFAULT_COMMIT`, and a differing checkout value is logged. Outside a job, such as a local `sync` into a mirror, it comes from the checkout's own configuration, because no recorded commit exists there.
- **What was measured and what was not.** Read this from `hr_remote_bundle_write`'s header in `cli/templates/scripts/lib/harness-run-lib.sh`, and from the `RED ONCE` list in `cli/test/remote-save-links.test.mjs`'s header. Quote neither from memory.

**How this task's implementer reads the conventions.** As the catch-all task, read every configured layer's conventions document. The documents-of-record rules are in `.claude/context/conventions.md` → `## Documents of record`: a measured fact states what was measured, the command and the exact message.

### Targets

- `docs/cli.md` — `## 6. The failure modes the permission profile encodes` → `**Residuals, stated rather than hidden:**`, residual 1, items 4 and 5.
- `docs/remote-execution.md` — `## 11. Security` → **The branch's own files are checked before the job trusts them.** → the **The post-session steps on a job that passed.** bullet.
- `docs/watcher.md` — `### Where the family runs git in a run's copy, and under what pins`, the closing paragraph beginning "What this leaves open".
- `~/Work/future task prompts/harness/sandbox tests/fix_remote_bundle_save_symlinks checks.md` (new, **outside this repository and never committed**) — the post-release checks.

**Work:**

- [ ] **`docs/cli.md` residual 1, item 5 (`hr_remote_bundle_write`).** Rewrite it to exactly what remains after this branch, keeping its number so item 6 stays item 6. It opens with what is now closed, the link skip and the trusted `stateDir`, citing `lib/harness-run-lib.sh` → `hr_remote_bundle_write` and `hr_remote_state_dir_var`. Then it names each remaining exposure with its reason, drawing only on what Task 1's header records. Expect these, and keep only the ones that are still true:
  - the window between a source's link test and its copy, for a process the session left running, since the runner reaps orphans only at job end;
  - the trusted configuration being read through the object store item 6 describes;
  - whatever of `cp -R` / `actions/upload-artifact` was not measured locally, with why it no longer decides what is published.

  Close the item outright only if Task 1's header records that none of these remains.
- [ ] **`docs/cli.md` residual 1, item 4 (`hr_remote_bundle_restore`).** Replace its clause "in both the state directory is read from that checkout's own `harness.config.json`" with the two sources:
  - `restore` in a job reads `stateDir` from the trusted configuration at `HARNESS_GITHUB_DEFAULT_COMMIT`;
  - `sync`, outside any job, reads it from the mirror checkout's own configuration, with the reason.

  Leave the rest of the item, its unchecked writes, as it stands: that residual is out of this branch's scope.
- [ ] **`docs/remote-execution.md` §11, the post-session bullet.** Replace the clause "`save` does too, but it reads each bundle file with a `cp` that follows a symbolic link, so a link the session planted in the state directory has `save` upload the file it names" with three statements:
  - `save` skips a linked source with one line in the job's log;
  - it copies no link out of a directory source;
  - it takes `stateDir` from the configuration at the commit `Record the default branch's commit` recorded.

  Keep the citation of `cli.md` residual 1 for what remains. Add one sentence, in that same bullet, saying the check on a real job follows the release that carries this branch, and naming what it will observe.
- [ ] **`docs/watcher.md`, the "What this leaves open" paragraph.** Replace "the bundle save's reads" with wording that matches item 5 as narrowed above, for example "the bundle save's test-to-copy window". Leave the paragraph's other items and its citation as they are.
- [ ] **The checks file.** Write `~/Work/future task prompts/harness/sandbox tests/fix_remote_bundle_save_symlinks checks.md` in the shape of the sibling `sandbox1c fix_watcher_worktree_git_calls checks.md` in that directory: a title, the release it waits for, the source of record (`docs/remote-execution.md` §11's post-session bullet), setup in `firu-daniel/harness-gate12` reset to seed, then numbered checks, each with **Expect:**. It covers:
  1. an honest job's `harness-state` artifact, unchanged in layout and bytes, restored by the next job;
  2. a job whose session plants a link at a bundle source, and one nested inside `clarifications/<branch>/`. The job's `Save the state bundle` log carries the skip line, the downloaded artifact holds neither the target's bytes nor a link, and the next job restores the rest;
  3. a job whose session rewrites the checkout's `stateDir`. `save` logs the difference line and saves from the trusted directory;
  4. each runner behaviour Task 1's header records as not measured locally, such as GNU `cp -R` or `actions/upload-artifact` meeting a link.

  If the write is refused because the path lies outside this checkout, report that in your return and leave the rest of the task done. Never place the file inside this repository instead.

**Verification:**

- Re-run the story index's `## Scope register` derivation entries 1 and 2 verbatim. Every site they print appears as a register row, and every `change` row is edited as stated.
- `grep -n 'follows a symbolic link' docs/remote-execution.md` prints no hit inside the post-session bullet. In `docs/cli.md`, that phrase survives only in item 4, whose subject this branch leaves alone.
- Every fact the edited sentences state about measurement or mutations matches `hr_remote_bundle_write`'s header and the suite's `RED ONCE` list word for word in substance. No line coordinate is written into any document.
- Every command added to a document sits in its own fenced block, one command per line (the lessons ledger's adopter-facing documentation rule).

- **Deviations from plan:**
  - Item 5's test-to-copy window is not recorded in `hr_remote_bundle_write`'s header. It is kept because it is still true on reading the function body (`hr_remote_bundle_source_ok`, the `[ -f ]` / `[ -d ]` test and the `cp` are separate steps, as are `hr_remote_copy_tree`'s per-entry test and `cp`). The plan's "the runner reaps orphans only at job end" is not stated: nothing in this session measured it, so the item says whether such a process survives into `Save the state bundle` is not measured, and the checks file's check 4 asks for that observation.
  - Item 5 restates the header's `cp -R` measurement with its command split one per line in a fenced block (the lessons ledger's adopter-facing documentation rule); the header's own text joins commands with `;`.
  - Verification rests on reading and on the configured typecheck: `bash scripts/typecheck.sh` printed `PASS: typecheck`; both scope-register derivation commands were re-run after the edits, and every hit falls in rows 1–10 (the new hits on `docs/cli.md` sit inside item 5, row 1). `grep -n 'follows a symbolic link'` hits only `docs/cli.md` item 4.
