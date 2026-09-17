### Task 9 — Mirror the watcher template into `scripts/` and sweep `docs/watcher.md` and `docs/outer-loop-verification.md`

**Goal:** Bring this checkout's own watcher copy back to byte-identical with the template Task 1 changed. Then sweep the two watcher documents: prose mentions become qualified, and the engine-command cells follow the route Task 1 measured.

**Depends on:** Task 1. Task 1 set `ENGINE_COMMAND_TASK`, `ENGINE_COMMAND_USER_REVIEW` and `ENGINE_COMMAND_DOCS` in `cli/templates/scripts/autonomous-watcher.sh` to one route: either all `/autonomous-sdlc-harness:<name>` (route `prefixed`) or all bare `/<name>` (route `bare`). It recorded that decision in the comment block whose first line is `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.`, directly above `ENGINE_COMMAND_TASK=`. Read the route from that block and from the three assignments. Do not re-measure.

**Where this task stops.** `scripts/autonomous-watcher.sh` is `init`'s copied output in this checkout, and a copy is byte-for-byte by contract (`docs/cli.md`, *"Two families land in `scriptsDir`"*). So this task copies the template and never edits the copy by hand. The measured-fact record goes into `docs/development.md` §6, which is Task 11's. The exemptions for whatever this task leaves bare are Task 13's.

### Targets

- `scripts/autonomous-watcher.sh`
- `docs/watcher.md`
- `docs/outer-loop-verification.md`

**Work:**

- [ ] **Mirror.** Make `scripts/autonomous-watcher.sh` byte-identical to `cli/templates/scripts/autonomous-watcher.sh`. Apply the template's changed lines: the three header mapping lines, the measurement comment block and the three `ENGINE_COMMAND_*` assignments. Change nothing else.
- [ ] **`docs/watcher.md`, prose.** Qualify every slash spelling a person reads:
  - the drop paragraph (*"by `/branch-prompt`, by `/branch-user-review`"*)
  - the status-vocabulary contract sentence (`/branch-status`, `/branch-answer`, `/branch-pause`, `/branch-resume`)
  - the `parked` and `paused` rows (*"`/branch-answer` writes the paired `answer_<n>.md`"*, *"dropped by `/branch-resume`"*)
  - any other prose mention
- [ ] **`docs/watcher.md`, the drop-to-engine table** (the rows for `<branch>_task_prompt.md`, `<branch>_review[_<n>].md` and `<branch>_docs.md`). Its command cells state what the watcher launches today, so they take the spelling of the three assignments: qualified if the route is `prefixed`, left as they are if it is `bare`.
- [ ] **`docs/outer-loop-verification.md` → `### 2.2 The launch prompt`.** That table is *"Captured as the stub's `-p` argument"*, a dated record of what was dispatched, so its cells keep the spelling they were captured with, whatever the route. If the route is `prefixed`, add one sentence under the table saying that the three strings have since been respelled to the qualified form, and pointing to `docs/development.md` → `## 6. The roadmap this tree defers to` for the measurement. If the route is `bare`, add nothing. Qualify any other slash spelling in this file that is prose rather than part of that capture.

**Verification:**

- `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` exits 0.
- `grep -nE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)' docs/watcher.md docs/outer-loop-verification.md` prints only lines that fall in one of two places. The first is the drop-to-engine table rows, and only when the route is `bare`. The second is the `### 2.2` capture table rows. Any other line is a missed site.
- `bash scripts/test.sh` exits 0.

**Deviations from plan:** Route read as `bare` (the template's measurement block, `Route: \`bare\``; the three `ENGINE_COMMAND_*` assignments are bare), so the drop-to-engine table rows stay bare and `docs/outer-loop-verification.md` gains no sentence; the template's only change against the copy was the measurement block, so no header mapping line changed. `bash scripts/test.sh` exited 1, not 0: the sole failure is gate `6a no machine paths`, 12 other gates passed, and every hit is outside this task's diff — the untracked worktree `.git` pointer file, the untracked `harness-runs/scratch/t3npm.log`, and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`, tracked since `aa3d10f` on `main`.
