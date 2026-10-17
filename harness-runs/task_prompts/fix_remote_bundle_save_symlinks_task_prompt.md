`fix_remote_bundle_save_symlinks` stops `remote-run.sh save` from uploading a file the sandboxed session cannot read. The `run` job's post-session step `Save the state bundle` runs `remote-run.sh save` unsandboxed, in the checkout the session just wrote. `save` packs the state bundle through `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_write`, and the job uploads it as the Actions artifact `harness-state`. That function copies each bundle source with a plain `cp` / `cp -R` behind `[ -f ]` / `[ -d ]` tests. All of them follow a symbolic link.

So a session can replace a bundle source with a link to a file the sandbox will not let it read, such as a credential or token file on the runner. `save` then copies the target into the bundle. The bundle is readable by anyone who can read the repository's Actions runs, which on a public repository is everyone (`docs/remote-execution.md` → `## 11. Security` → **What a reader of the repository's Actions runs can see.**). The next job's `restore` also places it back in the checkout, where that job's session reads it. No sandbox escape is needed. `fix_watcher_worktree_git_calls` recorded this as a residual rather than closing it (`docs/cli.md` → `## 6. The failure modes the permission profile encodes` → `**Residuals, stated rather than hidden:**`, residual 1, the bundle-save item; `docs/remote-execution.md` §11 → **The post-session steps on a job that passed.**).

`save` also takes the state directory from the checkout's own `harness.config.json`. `hr_remote_bundle_write` and `verb_save` call `hr_state_dir "$root"` / `hr_state_path "$root" …`, so the directory `save` reads from is whatever that file names. The rest of the watcher family now reads configured values from a trusted copy.

This branch starts from a `dev` that carries `fix_watcher_worktree_git_calls`. Re-find every anchor named here by its quoted text or heading, never by line number.

## The goal

1. **Skip a linked bundle source, and log it.** In `hr_remote_bundle_write`, a bundle source is not copied when it is a symbolic link, or sits under a directory that is one. The save still writes the bundle without it. For each skipped path it prints one line on stderr naming the path and that it was a link, and the job's log carries it. The bundle sources are:
   - `remote_status.json`
   - the branch's clarification directory
   - `PAUSE_PROGRESS.md`
   - the walker state
   - the branch's run log
   - each planning path `hr_remote_planning_paths` lists

   Apply the same test to the files `verb_save` reads before the write: the status source it checks for the previous job's `run_id`, and `autonomous_logs/registry.json`, which `hr_remote_status_write` reads when the job wrote no status. Do not refuse the whole save. A planted link must not cost an honest run its pause state, ledger pointer or clarifications, and skipping protects the target just as well.
2. **Nothing under a copied directory may carry a link out.** For a directory source copied with `cp -R`, either copy without following links at any depth and drop any link from the copy, or walk the tree and skip each link. Verify what the runner's `cp -R` and `actions/upload-artifact` actually do with a link inside a copied directory. Do not assume that `cp -R` copies links as links, or that the upload does not follow one. Record the measured answer in the function's header.
3. **Take `stateDir` from the trusted configuration.** `save` resolves the state directory from the same trusted copy of `harness.config.json` the job already uses for `doctor --job-surfaces`: the configuration at `HARNESS_GITHUB_DEFAULT_COMMIT` that `Record the default branch's commit` writes to the job's environment. It does not read the checkout's own file. When the checkout's `stateDir` differs from the trusted one, `save` logs the difference and reads from the trusted path. `restore` places the bundle by the same value, so it uses the same resolution.
   - Reuse the existing primitives: `hr_run_main_git`, the `fileAtRef` read, or a small shared helper in the library. Do not add a second configuration parser.
   - Outside a job (local `sync`, mirror mode), say which source applies and why.
4. **Tests with planted links**, using the marker technique the other planted-payload suites use. Plant a sentinel file outside the state directory, then make each bundle source in turn a link to it: a file source, a directory source, a link nested inside the clarification directory, and a linked planning path. Drive the real `remote-run.sh save`. Assert that:
   - the sentinel's bytes appear nowhere in the bundle;
   - the bundle is still written with every non-linked source;
   - the skip line names the path.

   Add one case where the checkout's `harness.config.json` names a different `stateDir` that holds a sentinel, and assert that `save` reads the trusted path. Each case states the mutation that turns it red: restore the plain `cp`, or restore `hr_state_dir "$root"`. Run each mutation red once and record it.
5. **Docs.**
   - Close the bundle-save item of `docs/cli.md` §6 residual 1, or narrow it to exactly what remains, with the reason.
   - Correct `docs/remote-execution.md` §11 → **The post-session steps on a job that passed.**
   - Update `docs/watcher.md`'s summary of residual 1's items to match.
   - Add a checks file to `~/Work/future task prompts/harness/sandbox tests/` for anything that can only be verified on a real GitHub job after a release, such as the upload action's link behaviour if it cannot be measured locally.

## Constraints

- **An honest run's bundle is byte-for-byte what it is today.** That covers the same sources, the same layout, `status.json` unchanged, and the bundle schema staying `1`.
- **No existing refusal gets weaker.** That includes `save`'s handling of a previous job's `status.json`, its no-bundle rule, and `restore`'s lineage bound.
- **`restore`'s own writes through unchecked paths stay out of scope.** That is the separate residual-1 item for `hr_remote_bundle_restore`. Do not widen this branch into it, beyond sharing the trusted `stateDir` from goal 3.
- **Scripts stay bash 3.2-compatible.** The scripts also run on GNU coreutils on the runner, so every `cp` / `find` flag used must behave the same on BSD and GNU, or the code must branch on which one is present.
- `scripts/run-gates.sh` must pass.
