### Task 1 — Skip linked bundle sources and resolve the trusted `stateDir` in `harness-run-lib.sh`

**Goal:** Give the shared run library what `save` and `restore` need:

- one helper that resolves the state directory from the trusted configuration in a job, and from the checkout outside one;
- one helper that says whether any component of a path is a symbolic link;
- one directory copy that never copies or follows a link.

Then rewrite `hr_remote_bundle_write` on top of them, so a linked source is skipped and logged while every other source is still written. Finally, make `hr_remote_bundle_restore` and `hr_remote_move_aside` resolve `stateDir` through the same helper.

**Where this layer stops.** This task edits the library only. It does **not** touch `cli/templates/scripts/remote-run.sh`. **Task 2** owns these parts of that file:

- `verb_save`'s pre-write reads of `remote_status.json` and `registry.json`, and their link test;
- `verb_restore`'s own `hr_state_path "$root" …` paths;
- the setup gate for `save` / `restore`;
- the difference line `save` / `restore` print when the checkout's `stateDir` differs from the trusted one.

It writes no test: **Task 3** owns `cli/test/remote-save-links.test.mjs`. Nor does it edit `docs/`, which belongs to **Task 4**, or the root `scripts/` copies, whose re-render is deferred on purpose.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the three new functions, the rewritten `hr_remote_bundle_write`, the `stateDir` resolution in `hr_remote_bundle_restore` and `hr_remote_move_aside`, and the file header.

### The contracts this task defines (Tasks 2 and 3 call or assert exactly these)

- **`hr_remote_state_dir_var <root>`** — call it directly, never inside `$(…)`. Sets:
  - `HR_REMOTE_STATE_DIR` — the repo-relative state directory, normalised exactly as `hr_state_dir` prints it;
  - `HR_REMOTE_STATE_FROM` — `trusted` or `checkout`;
  - `HR_REMOTE_STATE_WHY` — one sentence naming the source and why it applies;
  - `HR_REMOTE_STATE_CHECKOUT` — in `trusted` mode, the checkout's own `hr_state_dir "$root"` value, empty when that is unreadable. In `checkout` mode it equals `HR_REMOTE_STATE_DIR`.

  Every one of them is empty at entry. Returns `0` resolved, `1` a missing argument, and `2` unresolvable. **Trusted mode** applies when `HARNESS_GITHUB_DEFAULT_COMMIT` is non-empty. The value must be a full 40- or 64-character lower-case object id, and anything else is `2`. The function reads `harness.config.json` at that commit through `hr_run_main_set_var "$root"` and `hr_run_main_git cat-file blob "<commit>:harness.config.json"`, which runs with no hook, no replace refs and no grafts. It writes the blob into a private `mktemp -d` directory, and resolves `stateDir` there with the existing `hr_state_dir`, so **no second configuration parser** exists. It then removes that file and `rmdir`s the directory, never with a recursive removal. A commit, blob or configuration that cannot be read is `2`, with no fallback to the checkout. **Checkout mode** applies when the variable is empty or unset. That is outside a job: a local `sync` into a mirror, or the watcher locally. There is no recorded trusted commit then, so the source is `hr_state_dir "$root"`, and `HR_REMOTE_STATE_WHY` says so. Two obligations hold in both modes. **It leaves every `HR_RUN_*` global exactly as it found it**: save them before `hr_run_main_set_var` and restore them after, because the watcher's job mode calls `hr_remote_move_aside` while holding `HR_RUN_*` state. **It reads the checkout's configuration last**, so the library's per-process configuration cache ends keyed on `<root>`, not on the removed temporary directory.
- **`hr_remote_link_free_var <root> <rel>`** — call it directly. Returns `0` when no component of `<root>/<rel>` below `<root>` is a symbolic link, testing every prefix from the first segment of `<rel>` down to the leaf. Returns `1` otherwise, with `HR_REMOTE_LINKED` set to the absolute path of the first linked component. `HR_REMOTE_LINKED` is empty at entry. A component that does not exist is not a link. Builtins and `[ -L ]` only.
- **The skip line**, one per skipped path, on stderr. Task 3 asserts this wording, and Task 2 prints the same text after its own prefix:
  `remote state bundle: skipped <path>: <linked> is a symbolic link`
  `<path>` is the absolute source path. `<linked>` is the absolute linked component, equal to `<path>` when the source itself is the link.
- **`hr_remote_bundle_write`** keeps its signature `<root> <branch> <registry_file> <out_dir>` and its return codes. `2` now also covers `hr_remote_state_dir_var` returning `2`.

**Work:**

- [ ] **Add `hr_remote_state_dir_var`** with exactly the contract above. In its header comment, state which source applies in a job and outside one, and why: outside a job there is no recorded commit, and the checkout is the user's own mirror or main checkout. Also record that the trusted read goes through the shared object store, whose loose-object substitution is `docs/cli.md` §6 residual 1, item 6.
- [ ] **Add `hr_remote_link_free_var`, and a tree copy `hr_remote_copy_tree <src> <dst>`.** The copy recreates every directory, empty ones included, and copies every regular file, dot-files included, with a plain `cp` of that file. It never copies or follows a symbolic link at any depth, and prints the skip line for each link it meets. It skips any other non-regular entry with the same line form ending `is not a regular file`. Walk with `find "$src" … -print0`, read with `IFS= read -r -d ''`, which is bash 3.2-safe. Use no `-L` or `-H`, so the walk follows no link on BSD or GNU. **Measure before you rely on it, and record the measured answer in `hr_remote_bundle_write`'s header**, in the documents-of-record form: what was run, the command, the exact output. Measure two things:
  1. what this machine's `cp -R` does with a link inside a copied directory, and with a command-line argument that is a link;
  2. the same under GNU coreutils, where a GNU `cp` is reachable without the network (for example, a locally present `ubuntu` container image).

  If GNU cannot be reached, write that it was not measured, and say why the walk does not depend on it. The same goes for `actions/upload-artifact`, which cannot be run locally: write that the bundle now holds no link at all, so whether the upload follows one no longer decides what is published. Task 4 carries both unmeasured items to the post-release checks file.
- [ ] **Rewrite `hr_remote_bundle_write`'s source handling.** Resolve the state directory through `hr_remote_state_dir_var "$root"` in place of `hr_state_dir "$root"`, mapping its `2` to `2`. Before each source is tested or copied, run `hr_remote_link_free_var "$root" "<state_dir>/<source rel>"`, and on `1` print the skip line and move on to the next source. The sources are `autonomous_logs/remote_status.json`, `clarifications/<branch>`, `PAUSE_PROGRESS.md`, `.flow_walker_state`, `autonomous_logs/<branch>.log` and each `HR_REMOTE_PLANNING_PATHS` entry. Copy file sources with the same plain `cp` as today, and directory sources with `hr_remote_copy_tree` in place of `cp -R`. A linked `remote_status.json` falls through to the existing registry-derived `status.json`, exactly as an absent one does. Keep the destinations, the `planning/` layout, the empty-or-absent `<out_dir>` rule and every return code unchanged, so an honest bundle is byte-for-byte today's.
- [ ] **Resolve `stateDir` the same way in `hr_remote_bundle_restore` and `hr_remote_move_aside`.** Replace each one's `hr_state_dir "$root"` with `hr_remote_state_dir_var "$root"`, mapping its `2` to the function's existing `2`. Change nothing else in either function. Their writes through unchecked paths are the separate residual this branch leaves alone, and the planning-draft and lineage rules stay as they are.
- [ ] **Amend the library header to keep its guarantees true.**
  - `FILE DISCIPLINE`: add `hr_remote_bundle_write`'s and `hr_remote_copy_tree`'s skip lines on stderr as a stated exception to "no diagnostics on stdout OR stderr".
  - The write exceptions near the header's top (the paragraph listing what `hr_remote_status_write`, `hr_remote_bundle_write`, `hr_remote_bundle_restore` and `hr_remote_move_aside` may write): add `hr_remote_state_dir_var`'s private temporary directory, removed before it returns.
  - `NAMING`: add `HR_REMOTE_STATE_DIR`, `HR_REMOTE_STATE_FROM`, `HR_REMOTE_STATE_WHY`, `HR_REMOTE_STATE_CHECKOUT` and `HR_REMOTE_LINKED` to the list of `HR_` variables, each assigned before it is read.
  - Update `hr_remote_bundle_write`'s own header for the skip rule and the measured answer.

**Verification:**

- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0, and the file uses no bash 4 construct: no associative array, `mapfile`, `${var,,}` / `${var^^}` or `local -n`.
- By hand, in a throwaway `git init` directory under the system temp directory (never this checkout), source the library and run `hr_remote_bundle_write` four times:
  1. Honest sources only. The output tree holds every source at today's path, with identical bytes.
  2. Each file source in turn replaced by a link to a sentinel outside the state directory. The sentinel's bytes appear nowhere in the output, the skip line names the path, and every other source is present.
  3. A link nested inside `clarifications/<branch>/`. `find <out_dir> -type l` prints nothing.
  4. `HARNESS_GITHUB_DEFAULT_COMMIT` set to a committed configuration whose `stateDir` differs from the working tree's. The bundle is read from the committed `stateDir`, and `HR_REMOTE_STATE_FROM` is `trusted`.
- After `hr_remote_state_dir_var` runs with `HR_RUN_MAIN` and `HR_RUN_TRUSTED_BASE` pre-set to sentinel values, both still hold them.
- `grep -n 'hr_state_dir "\$root"' cli/templates/scripts/lib/harness-run-lib.sh` shows no hit inside `hr_remote_bundle_write`, `hr_remote_bundle_restore` or `hr_remote_move_aside`.
