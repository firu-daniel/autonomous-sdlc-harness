### Task 1 — Carry the untracked planning drafts in the remote state bundle and restore them in job mode without overwriting

**Goal:** Make the remote state bundle carry the planning artifacts a saved walk depends on, and make a job-mode restore put them back in a fresh checkout. Round 2 showed the failure this closes: three consecutive jobs each re-ran the task-plan writer from scratch, and the second job's bundle held exactly four files. The fix is direction (a) of the task prompt, which the story index's `## Context` states and argues.

**Where this layer's library stops.** This task changes the shared library's bundle writer and restorer, its format of record, and one lib-level test. `remote-run.sh`'s restore reporting, its `::warning::` text, its header and the end-to-end two-checkout test are **Task 2's**. Task 2 reads the two counters this task defines (below) and prints them. No document changes here: `docs/remote-execution.md` is Task 5's.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — header fence item 3; `THE REMOTE STATE BUNDLE` block; `hr_remote_names_var`; the new `hr_remote_planning_paths`; `hr_remote_bundle_write`; `hr_remote_bundle_restore`.
- `cli/test/outer-loop-scripts.test.mjs` — one new case beside `the remote state bundle carries a run through a job restore and a mirror restore, and places no run log`.

**The interface this task defines, and Task 2 consumes:**

- **Names.** `hr_remote_names_var` additionally assigns `HR_REMOTE_PLANNING_DIR='planning'`, the bundle directory the drafts travel in.
- **`hr_remote_planning_paths <branch>`.** It assigns `HR_REMOTE_PLANNING_PATHS`, newline-separated and with no command substitution, like the file's other `HR_` return variables. The value is exactly these eight paths, relative to `<state_dir>`, with no trailing slash:
  `story_plans/<branch>_story_plan.md`, `task_plans/<branch>`, `ui_test_plans/<branch>_ui_test_plan.md`, `ui_test_plans/<branch>`, `task_plan_reviews/<branch>`, `business_parity_reviews/<branch>`, `architecture_reviews/<branch>`, `ui_test_plan_reviews/<branch>`.
  It returns 1, assigning an empty value, for an empty `<branch>`. A `<branch>` containing `/` (the test suite's `feat/x`) makes nested paths, for example `story_plans/feat/x_story_plan.md`.
- **Unchanged signatures.** `hr_remote_bundle_write <root> <branch> <registry_file> <out_dir>` and `hr_remote_bundle_restore <bundle_dir> <root> <branch> <mode>` keep their signatures and exit codes.
- **Two counters.** `hr_remote_bundle_restore` additionally assigns `HR_REMOTE_PLANNING_PLACED` and `HR_REMOTE_PLANNING_KEPT`, both integers. It sets both to `0` at entry, so an inherited value is never believed, and they stay `0` in `mirror` mode. Task 2 prints them after a successful job restore.

**Work:**

- [ ] **Format of record, and why the schema stays `1`** (`THE REMOTE STATE BUNDLE` block).
  - Add `<bundle>/planning/<path under state_dir>` to `THE FORMAT OF RECORD`, naming the eight paths as `hr_remote_planning_paths` spells them.
  - Declare them a **mirror** of the plugin contracts that write them: `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 3` and `## Override 4` staging lists, and `cli/templates/scripts/flows/task_plan_writing.graph.json` → each node's `findingsFolder`. A path added there is an edit here.
  - Under `WHO READS EACH FILE`, add that the drafts are read by **the next job only, never a mirror**. Give the reason: an untracked draft left in the local mirror would make a later fast-forward of that working copy to `origin/<branch>` refuse, since the draft's own convergence commit adds the same path.
  - Replace the sentence *"NOTHING IN THE BUNDLE IS EVER COMMITTED: every file in it is gitignored machine-local state"*. It is no longer true of `planning/`: those files are untracked drafts that the flow commits itself at P1/P3 convergence, never the bundle.
  - Argue `HR_REMOTE_STATE_SCHEMA` staying `'1'`: the directory is additive, an older reader ignores it, and a newer reader of an older bundle finds none.
  - State the one-sentence reason only planning is carried: the walker's one graph is `task_plan_writing.graph.json`, and implementation-phase per-unit review folders never span a pause, because the pause waits for a clean tracked tree.
- [ ] **`hr_remote_planning_paths`, and the writer** (`hr_remote_bundle_write`).
  - Define `hr_remote_planning_paths` as specified above.
  - In `hr_remote_bundle_write`, after the files it already writes, copy each of the eight paths that exists under `<root>/<state_dir>/` into `<out_dir>/planning/<same relative path>`:
    - a regular file: `mkdir -p` its parent, then `cp`;
    - a directory: `mkdir -p` its parent, then `cp -R` of the source **without** a trailing slash (the BSD `cp -R dir/` trap the clarification copy already notes).
  - A path that is absent is skipped. A failed copy returns 1, as a failed copy already does.
  - A draft is copied whether or not the branch already tracks it: the restore rule below makes a tracked copy inert, and no git call is added to the write path.
- [ ] **The restorer, in `job` mode only** (`hr_remote_bundle_restore`).
  - After the walker state and **before** `status.json` is placed, walk every entry under `<bundle>/planning/` with `find … -type f` in a `while IFS= read -r` loop. For each regular file, take its path relative to `<bundle>/planning/`.
  - Place it only when **all** of these hold:
    - it is equal to, or lies under, one of `HR_REMOTE_PLANNING_PATHS` for `<branch>`;
    - no path segment is `..`;
    - nothing exists at `<root>/<state_dir>/<relative path>`, of any type.
  - To place a file: `mkdir -p` its parent, `cp`, and increment `HR_REMOTE_PLANNING_PLACED`.
  - Anything already present is left **byte-identical**, never moved aside or removed, and increments `HR_REMOTE_PLANNING_KEPT`. The fresh checkout's copy is the branch's committed record, and it wins.
  - A symlink, a non-regular entry, or a path outside the set is ignored and counted by neither counter.
  - A failed `cp` or `mkdir` returns 1.
  - `mirror` mode places nothing from `planning/`.
  - The unrecognised-bundle refusal (exit 2, touching nothing) is unchanged and still runs first.
- [ ] **Header fence and function docs.**
  - Header → `THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES` item 3: add the eight planning paths under `<root>/<state_dir>/` to the restore fence, and `<out_dir>/planning/` to the writer's.
  - Amend the `hr_remote_bundle_restore` doc comment's first paragraph (*"<mode> `job` places the clarification directory, …"*) to name the drafts, the never-overwrite rule and the two counters.
  - Amend `hr_remote_bundle_write`'s comment to name `planning/`.
  - Keep `FILE DISCIPLINE`'s rules true: no stdout or stderr output, no shell options set, no `$(…)` for the new return values.
- [ ] **Test: `cli/test/outer-loop-scripts.test.mjs`, one new case.** Use the file's existing `fixtureFor` / `initOk` / `libCall` / `plant` / `snapshotTree` helpers and `REMOTE_BRANCH`, which is `feat/x`.
  - **Write.** Plant, under the source fixture's state directory, a story index at `story_plans/feat/x_story_plan.md`, `task_plans/feat/x/task_1_plan.md` and `task_plan_reviews/feat/x/review_0.md`, beside a registry record. Run `hr_remote_bundle_write`. Assert the bundle holds exactly those three files under `planning/`, and that the existing top-level entries are unchanged.
  - **Job restore into a fresh fixture.** First plant a **different** `story_plans/feat/x_story_plan.md` there, standing in for the committed copy. Run the restore in `job` mode. Assert:
    - `task_1_plan.md` and `review_0.md` are placed byte-for-byte;
    - the pre-existing story index is byte-identical to what was planted;
    - `HR_REMOTE_PLANNING_PLACED` is `2` and `HR_REMOTE_PLANNING_KEPT` is `1`. Read them by echoing them from the same `libCall` script, since they are shell variables.
  - **Mirror restore.** It places no planning file.
  - **Hostile bundle.** A bundle whose `planning/` also carries `story_plans/other_story_plan.md` (outside the set) and a file reached through a `..` segment, if the filesystem lets the test create one: neither is placed anywhere.
  - Open the case with one sentence stating the rule it enforces, per the file's header convention.

**Verification:**

- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0.
- `outer-loop-scripts.test.mjs`, the test file this task edits, passes when run on its own through the single-file test command the conventions state. Where no document states one, the run is skipped and the skip recorded, per `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 3. Both its existing bundle case (the exact top-level layout with no planning file planted) and the new case pass.
- `commands.typecheck` exits 0.
- `grep -n "HR_REMOTE_PLANNING" cli/templates/scripts/lib/harness-run-lib.sh` shows every new name assigned inside a function that owns it, and none read before it is assigned.
- The header's `NOTHING IN THE BUNDLE IS EVER COMMITTED` sentence no longer claims every bundle file is gitignored.

**Deviations from plan:**

- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` was refused by the permission layer (approval required) — deferred to the Run gates phase. Syntax and bash 3.2 compatibility rest instead on a scratch probe (`harness-runs/scratch/planning_bundle_probe.mjs`, run through `scripts/scratch-run.sh`) that sourced the library under `/bin/bash` and exercised write, job restore (`2 1`, committed index kept), mirror restore (`0 0`, nothing placed), a hostile bundle (`3 0`, out-of-set file and symlink ignored) and `hr_remote_planning_paths ""` (rc 1, empty value).
- The `outer-loop-scripts.test.mjs` single-file run was skipped: no conventions document (`.claude/context/cli.md`, `.claude/context/conventions.md`) states a single-file test command — deferred to the Run gates phase per `## The test-run rule` point 3.
- Hostile-bundle case: a file reached through a `..` segment cannot be created on the filesystem, so the case plants a symlinked entry under `planning/task_plans/feat/x/` in its place; the restorer's `..` check stays in the code.
