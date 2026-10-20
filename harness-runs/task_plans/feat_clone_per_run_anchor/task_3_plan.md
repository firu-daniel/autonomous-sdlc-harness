### Task 3 — Set `HARNESS_MAIN_REPO` in the watcher's engine subshell, and prove no other outer-loop script names it

**Goal:** Make every unattended session the watcher launches carry the main checkout's path in `HARNESS_MAIN_REPO`, set from the watcher's own `MAIN_REPO`, and nowhere else. That means one `export` inside `spawn_engine`'s detached subshell, so the engine and every Bash call it makes inherit it, while `create-worktree.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh`, the notifier and the formatter run as today. **No outer-loop script reads the variable.** The excluded wrappers and the watcher's scripts keep placing the main checkout from their own location.

**Depends on:** Task 1, which owns the name: `MAIN_REPO_ANCHOR_VARIABLE = 'HARNESS_MAIN_REPO'` in `cli/src/core/mainRepoAnchor.ts`, whose header declares `spawn_engine`'s `export HARNESS_MAIN_REPO="$MAIN_REPO"` as the mirror this task writes. The test imports that constant from `../dist/core/mainRepoAnchor.js` and asserts the template spells the same literal.

**Every launcher, found rather than assumed.** `grep -rn '"\$AGENT_CLI"' cli/templates/scripts` names two call sites:

- `autonomous-watcher.sh` → `spawn_engine`, which every local launch, resume and job-mode run (`autonomous-watcher.sh job`, the remote job's entry) reaches. **It sets the anchor.**
- `remote-run.sh` → `control_mention_session`, the control job's mention reader. It runs `--tools Read,Grep,Glob` in a fresh temporary directory, so it can run no command and has no reader of `<MAIN_REPO>` to serve. **It is left unset**, with a one-line comment there saying why. The first Work bullet re-runs the grep and stops with a blocker if a third site appears.

**Where this task stops.** The plugin readers are Tasks 7–13. `docs/watcher.md` is **Task 16's**, `ARCHITECTURE.md`'s launch contract **Task 18's**, and the sandbox row that proves a sandboxed call sees the value **Task 15's** to write and a person's to take. The root `scripts/` copies are `init`'s output in this checkout and are not touched.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — the export, its header lines, and the comment at the mention session's call site.
- `cli/templates/scripts/remote-run.sh` — the one comment at `control_mention_session`.
- `cli/templates/scripts/lib/harness-run-lib.sh` — `hr_main_repo`'s comment only.
- `cli/templates/scripts/setup-worktree.sh` — the comment at its non-`--target` `hr_main_repo "$top"` call only.
- `cli/test/watcher-main-anchor.test.mjs` (new).

**Work:**

- [ ] **Confirm the launch sites.** Re-run `grep -rn '"\$AGENT_CLI"' cli/templates/scripts` and read each hit. If a site other than the two above starts an agent session, stop with a blocker naming it.
- [ ] **The export.** In `spawn_engine`'s subshell, right after `cd "$worktree" || exit 97`, add `export HARNESS_MAIN_REPO="$MAIN_REPO"`. It is set **inside** the subshell, so no other child of the watcher sees it, and set unconditionally, so a value the watcher inherited is overwritten rather than passed on.
  - In the header's *"The flag string, in full"* block, add the environment line `HARNESS_MAIN_REPO=<MAIN_REPO>` above the `<agent cli> -p` line, with one sentence: the plugin's readers read it with a bare `printenv HARNESS_MAIN_REPO`, and no outer-loop script reads it, because an assignment prefix on an excluded call could set it.
  - Keep bash 3.2 compatibility: a plain `export NAME="value"`.
- [ ] **The comments, behaviour unchanged.**
  - `remote-run.sh` → at `control_mention_session`: the mention session carries no anchor, because its tool set runs no command.
  - `harness-run-lib.sh` → `hr_main_repo`'s comment, two sentences: inside a clone it answers the clone itself; it never reads `HARNESS_MAIN_REPO`, because its callers run unsandboxed and place the main checkout from their own location.
  - `setup-worktree.sh` → at the non-`--target` `hr_main_repo "$top"` call, one sentence: this mode bootstraps the checkout the script sits in, which in a clone resolves to the clone, while a clone is bootstrapped through the main checkout's `--target` mode, which places the main checkout from its own location (`hr_wrapper_main_of`).
- [ ] **`cli/test/watcher-main-anchor.test.mjs`.** Open with the rule it enforces. Drive the written watcher through `createWatcherFixture` from `./helpers/watcher.mjs`, using the parked-run resume path `cli/test/watcher-park-resume.test.mjs` uses (`writeQuestion`, `seedRecord`, `writeAnswer`, `tick`). The stub body records `${HARNESS_MAIN_REPO-unset}` into a file under the fixture with `setStub`.
  - **(a)** After one `tick`, the recorded value equals the fixture's main checkout path. The fixture directory is already `realpath`-resolved, so compare the strings as they stand.
  - **(b)** The same with `tick({ HARNESS_MAIN_REPO: <a second temp directory> })`: the stub still records the fixture's main checkout, never the inherited value.
  - **(c) Source guard.** Read every file under `cli/templates/scripts/`, recursively. Outside comment lines, `MAIN_REPO_ANCHOR_VARIABLE`'s value appears **only** in `autonomous-watcher.sh`, and there exactly once, in the line `export HARNESS_MAIN_REPO="$MAIN_REPO"`. Built from the imported constant, so a renamed constant fails here until the template follows.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- `npm test --workspace cli -- test/watcher-main-anchor.test.mjs`, from the repository root as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status: `# fail 0`.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` and `bash -n cli/templates/scripts/remote-run.sh` exit 0.
- `git diff cli/templates/scripts/lib/harness-run-lib.sh cli/templates/scripts/setup-worktree.sh cli/templates/scripts/remote-run.sh` shows comment lines only. Read it to confirm.

- **Deviations from plan:** `### Targets` lists "the comment at the mention session's call site" under `autonomous-watcher.sh`, but the watcher has no mention session: the only other `"$AGENT_CLI"` launch is `remote-run.sh` → `control_mention_session` (re-run of `grep -rn '"\$AGENT_CLI"' cli/templates/scripts`; its third hit, `remote-run.sh`'s `command -v "$AGENT_CLI"`, is a PATH probe, not a launch). The comment went there, as the Work bullet says; the watcher got only the export and the header lines.
