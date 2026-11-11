### Task 9 — Respell the suites that pin the shell library's machine paths and the script templates

**Goal:** The suites that exercise `cli/templates/scripts/lib/harness-run-lib.sh`, `docs-search-server.sh`, the keep-awake lock, the run-profile path and the placeholder manifest expect `devscene` in each path and name. They pass against the renamed templates.

**Depends on:** Tasks 1, 5, 6 and 7. The values pinned here, and their owners:

- Under each XDG base: the cache directory `devscene` (`$HOME/.cache/devscene` when `XDG_CACHE_HOME` is empty, `/x/devscene` for `XDG_CACHE_HOME=/x/`), the config directory `~/.config/devscene` and the state directory `…/devscene/run-profiles/…` (Task 6, mirroring Task 1's `MACHINE_DIR_NAME`).
- The keep-awake `--who=devscene` (Task 6's `HR_KEEP_AWAKE_WHO`, mirroring Task 1's `KEEP_AWAKE_WHO`).
- `$RUNNER_TEMP/devscene-placeholders/<branch>.absent` (Task 6).
- The runtime entry `devscene/retrieval/runtime/node_modules/devscene/dist/cli.js` (Task 6's `docs-search-server.sh`).
- The `npx devscene doctor` / `npx devscene init` refusals (Tasks 5 and 6).
- The fixture helpers (Task 7).

### Targets

- `cli/test/outer-loop-scripts.test.mjs`
- `cli/test/placeholder-sweep-lib.test.mjs`
- `cli/test/keep-awake-lib.test.mjs`
- `cli/test/cleanup-run-copies.test.mjs`
- `cli/test/watcher-run-profile.test.mjs`
- `cli/test/watcher-background-wait.test.mjs`
- `cli/test/watcher-placeholder-host.test.mjs`
- `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`

**Work:**

- [ ] `outer-loop-scripts.test.mjs`: both `RUNTIME_ENTRY` segments become `'devscene'`; the `npx devscene init` refusal assertion; and the two `hr_cache_dir` expectations `${home}/.cache/devscene\n` and `/x/devscene\n`.
- [ ] `placeholder-sweep-lib.test.mjs`: the `run-profiles` state directory under `devscene`, the expected `${runnerTemp}/devscene-placeholders/feat-x.absent` and the `devscene-placeholders` directory. `keep-awake-lib.test.mjs`: `--who=devscene` in `LOCK_FLAGS`.
- [ ] `cleanup-run-copies.test.mjs` and `watcher-run-profile.test.mjs`: the `…/devscene/run-profiles/…` paths. `watcher-background-wait.test.mjs`: `configDir = join(f.dir, 'home', '.config', 'devscene')`. `watcher-placeholder-host.test.mjs`: `JOB_MANIFEST_DIR = 'devscene-placeholders'`. `sandbox-prerequisites-shell-mirror.test.mjs`: the refusal comparison `'npx devscene doctor'`.
- [ ] Run each edited suite through `npm test --workspace cli -- test/<name>.test.mjs` from the checkout root, one plain foreground command each.

**Verification:**

- All eight edited suites pass.
- `git grep -n -F 'autonomous-sdlc-harness' -- cli/test/outer-loop-scripts.test.mjs cli/test/placeholder-sweep-lib.test.mjs cli/test/keep-awake-lib.test.mjs cli/test/cleanup-run-copies.test.mjs cli/test/watcher-run-profile.test.mjs cli/test/watcher-background-wait.test.mjs cli/test/watcher-placeholder-host.test.mjs cli/test/sandbox-prerequisites-shell-mirror.test.mjs` prints nothing.
