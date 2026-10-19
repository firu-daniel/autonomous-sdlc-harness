### Task 16 — Describe the watcher family's git on both arms in `docs/watcher.md` §2

**Goal:** Make `docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins` state the family's git on both arms, the linked worktree every run uses today and the registered clone the library now also handles, with the clone arm described as present and tested, and created by nothing yet.

**Depends on:**

- **Task 7.** The watcher family's clone arm in `cli/templates/scripts/lib/harness-run-lib.sh`:
  - `hr_run_copy_check_var` sets `HR_RUN_COPY_KIND`. On a clone it syncs in by calling `hr_copy_sync_in_var`: the main checkout fetches the clone's `refs/heads/<branch>` under the family's pins and fast-forwards its own ref by compare-and-swap, refusing a branch it has checked out, a behind clone or diverged tips. It then reads the tip from the main checkout.
  - `hr_run_copy_git` is unchanged on both arms (`GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<copy's gitdir>/index`, `GIT_WORK_TREE=<copy>`), so objects are read from the main checkout alone.
  - `hr_commit_paths_var` and `hr_run_fast_forward_var` sync the clone's ref out after they move the main checkout's, by `update-ref` with `GIT_DIR=GIT_COMMON_DIR=<clone>/.git` and `GIT_OBJECT_DIRECTORY=<main>/.git/objects`. A failed fast-forward sync-out returns 5.
  - `hr_run_reset_var`, `hr_run_surface_check_var` and `hr_run_worktree_diff_var` are unchanged.
  - `hr_run_main_set_var`'s main-checkout predicate is unchanged.
- **Task 11.** `setup-worktree.sh --target <clone>` writes `core.hooksPath` into the clone's own `.git/config` and nothing into the main checkout's.
- **Task 15.** `docs/cli.md` §6 gains a paragraph that is the document of record for the sync-in fetch's measured pins: each clone-side payload measured, the `cli/test/clone-sync.test.mjs` case that measures it, the observed outcome and the `git --version`. Task 15 ships before this task.
- **Task 1.** The clone arm of the copy check: the registry record, the derived path, no planted `commondir` / `config.worktree` / `objects/info/http-alternates`, alternates naming the main checkout's objects only, and the allow-listed `.git/config`.

**Where this task stops.** `docs/cli.md` §6 is **Task 15's**. The outer-loop table above the subsection, §1, §5 and §7 are unchanged: the registry's shape, its status vocabulary and its writers are what they were. Nothing here schedules the layout switch.

### Targets

- `docs/watcher.md` — the subsection `### Where the family runs git in a run's copy, and under what pins` only.

**Work:**

- [ ] **One opening sentence for the subsection,** after its first paragraph:
  - a run's copy is a linked worktree today;
  - the library also handles a clone the run registry records, which nothing creates yet;
  - every row below holds on both arms, with the differences the two new rows and **The pins.** state.
- [ ] **Two new table rows**, in the existing columns `Site | Class before | What reached it | How it runs now`:
  - **clone arm: sync-in at the copy check.** Class (c). What reached it: the clone's `.git/config`, its hooks, a planted `shallow` or `info/grafts`, and a substituted loose object. How it runs now: `git -C <main>` fetch of the clone's `refs/heads/<branch>` with no destination under the family's pins, `cat-file -e` proof, then a compare-and-swap `update-ref` in the main checkout. Cite `docs/cli.md` §6's measured-record paragraph on the sync-in fetch's pins (written by Task 15) for the measured clone-side keys and programs; `cli/test/clone-sync.test.mjs` may be named only as the suite that reproduces it, never as the record.
  - **clone arm: sync-out after a moved ref.** Class (c). What reached it: the clone's `.git/config` and a planted `commondir`. How it runs now: `update-ref` with `GIT_DIR` and `GIT_COMMON_DIR` set to the clone's `.git` and `GIT_OBJECT_DIRECTORY` set to the main checkout's objects, no hook.
- [ ] **The pins. paragraph, both arms.** After its sentence on how each call runs, add the clone arm:
  - the runners still run as `git -C <main>` or with `GIT_DIR=<main>/.git`;
  - they borrow `<clone>/.git/index` where a worktree's record `index` is borrowed, so no call reads the clone's object store, `.git/config` or hooks;
  - the clone itself is checked by `hr_wrapper_target_check_var`'s clone arm (its conditions in one clause) and its branch read once, from the registry-checked `HEAD`.

  Name `setup-worktree.sh --target`'s clone arm: the hooks path goes into the clone's own `.git/config`.
- [ ] **The closing "What this leaves open" sentence.** Keep its list. Add that on a clone the object store is borrowed through `objects/info/alternates` and fed only by sync-in's fetch, while every run that executes in a linked worktree still shares it (`docs/cli.md` §6, residual 6).

**Verification:**

- `git diff docs/watcher.md` touches only the subsection named above. Read it to confirm that every existing table row and sentence is byte-identical, apart from the additions.
- `grep -n 'clone' docs/watcher.md` shows each new mention inside that subsection.
- `grep -n 'clone-sync.test.mjs' docs/watcher.md` shows no line citing that file's header as the measurement; the sync-in row cites `docs/cli.md` §6.
- Every function the new text names exists in `cli/templates/scripts/lib/harness-run-lib.sh`. Confirm each name with `grep -n '<name>()' cli/templates/scripts/lib/harness-run-lib.sh`, one call per name.
