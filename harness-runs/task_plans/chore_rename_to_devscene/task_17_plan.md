### Task 17 — Bring this repository's self-adopted script and hook copies to the renamed template bytes

**Goal:** This repository has adopted its own harness, so `scripts/` and `githooks/` at the root hold `init`'s output. Bring every byte-identical copy of a template this branch renamed back to byte identity with its template, and respell the header line of the three rendered copies.

**Depends on:** Tasks 3, 5 and 6, which renamed the templates copied here. Before this branch, each of the ten copied files below was byte-identical to its template (`git diff --no-index --stat cli/templates/scripts scripts` lists each with `0` changes), so a byte copy carries exactly the rename and nothing else.

**Where this task stops.** Three targets are **rendered**, not copied, and only their line-2 `` `autonomous-sdlc-harness init` `` header changes:
- `scripts/test.sh` and `scripts/typecheck.sh` carry this repository's own command lines.
- `githooks/pre-push` carries the rendered `main|dev)` arm where the template has `{{protectedBranchesCase}})`, plus a hand-added `publish)` arm (*"refusing to push to 'publish' - it is staged by the publish workflow alone…"*), and its mode is `100755` against the template's `100644`. Copying the template over it would put a literal `{{protectedBranchesCase}}` pattern in the live hook and drop the `publish` refusal, so pushes to `main`, `dev` and `publish` would no longer be refused locally. It is never copied.

`cli/test/sandbox-probe-job-launch.test.mjs` sources this repository's `scripts/lib/harness-run-lib.sh` and pins the placeholder directory. Task 18 respells it right after this task, against the copy made here.

### Targets

- `scripts/autonomous-notify.sh`, `scripts/autonomous-watcher.sh`, `scripts/cleanup-merged-worktrees.sh`, `scripts/create-worktree.sh`, `scripts/docs-search-server.sh`
- `scripts/flow-walker.sh`, `scripts/lib/harness-run-lib.sh`, `scripts/prompt-injection-screen.sh`, `scripts/remote-run.sh`, `scripts/restart-watcher.sh`
- `scripts/test.sh`, `scripts/typecheck.sh`
- `githooks/pre-push`

**Work:**

- [ ] Copy each of the first ten targets from `cli/templates/scripts/<same path>` byte for byte, one plain `cp cli/templates/scripts/<path> scripts/<path>` per file. Copying onto an existing file keeps its mode. Check each mode with `git ls-files -s -- <path>` before and after the copy.
- [ ] `githooks/pre-push`: change only line 2's `` `autonomous-sdlc-harness init` `` to `` `devscene init` ``. The `main|dev)` and `publish)` case arms and the file mode stay exactly as they are.
- [ ] `scripts/test.sh` and `scripts/typecheck.sh`: change only line 2's `` `autonomous-sdlc-harness init` `` to `` `devscene init` ``.

**Verification:**

- `git diff --no-index --stat cli/templates/scripts scripts` lists every copied file with `0` changes, and `test.sh` / `typecheck.sh` with only the differences they carried before this branch.
- `git diff --no-index cli/templates/githooks/pre-push githooks/pre-push` shows only the differences it showed at `HEAD`: the mode change `100644` → `100755`, the `{{protectedBranchesCase}})` → `main|dev)` line and the added `publish)` arm. No header-line difference remains.
- `git grep -n -F 'autonomous-sdlc-harness' -- scripts/autonomous-notify.sh scripts/autonomous-watcher.sh scripts/cleanup-merged-worktrees.sh scripts/create-worktree.sh scripts/docs-search-server.sh scripts/flow-walker.sh scripts/lib/harness-run-lib.sh scripts/prompt-injection-screen.sh scripts/remote-run.sh scripts/restart-watcher.sh scripts/test.sh scripts/typecheck.sh githooks/pre-push` prints nothing.
- `git ls-files -s` shows every target's mode unchanged from `HEAD`.

**Deviations from plan:**

- The plain `cp cli/templates/scripts/<path> scripts/<path>` was refused by the session's permission mode (*"Permission to use Bash has been denied because Claude Code is running in don't ask mode"*). Every template-vs-copy difference was the literal `autonomous-sdlc-harness` → `devscene` substitution (plus, in `autonomous-watcher.sh`, the inserted comment line `# respelled here.):` after `spelled each way (Taken under the product's earlier name; only the name is`), and `git grep -c -F 'autonomous-sdlc-harness'` over the ten templates printed nothing, so the copies were produced with Edit (`replace_all`, plus that one insert). Byte identity rests on `git diff --no-index --stat cli/templates/scripts scripts`, which lists all ten with `0` changes (`lib/harness-run-lib.sh` drops out of the list because its mode matches too); `git diff --summary` shows no mode change.
- `githooks/pre-push` line 2: the first iteration's Edit was refused twice (*"File is in a directory that is denied by your permission settings."*). On re-dispatch the working tree already carried the respelling; this iteration made no edit to it. `git diff HEAD -U0 -- githooks/pre-push` shows only line 2 (`autonomous-sdlc-harness init` → `devscene init`) with mode `100755` unchanged, and `git diff --no-index cli/templates/githooks/pre-push githooks/pre-push` shows only the mode, `main|dev)` and `publish)` differences. All four verification bullets now hold: the third prints nothing.
