### 1. The watcher and the remote job run the main checkout's other outer-loop scripts unsandboxed, and the run can still write them

**File:** `cli/src/generators/writeProtection.ts` (`protectedPaths`): "for (const row of OUTER_LOOP_SCRIPTS.filter((script) => script.runsUnsandboxed === true))"

**The problem.** The module header states its rule as *"anything that runs outside the sandbox must not be writable from inside it"*. `protectedPaths` protects only three things under the main checkout's `scriptsDir`: the two `runsUnsandboxed` rows (`push-branch.sh` and `refresh-branch.sh`) and the `lib/` directory. The run watcher runs several other outer-loop scripts from its own directory, the main checkout's `scriptsDir`, outside any sandbox. `cli/templates/scripts/autonomous-watcher.sh` names them: "NOTIFY=\"$SCRIPT_DIR/autonomous-notify.sh\"", "FORMAT_STREAM=\"$SCRIPT_DIR/autonomous-format-stream.sh\"", "CREATE_WORKTREE=\"$SCRIPT_DIR/create-worktree.sh\"", "CLEANUP_SCRIPT=\"$SCRIPT_DIR/cleanup-merged-worktrees.sh\"", "COMMIT_ON_BRANCH=\"$SCRIPT_DIR/commit-on-branch.sh\"" and "REMOTE_RUN=\"$SCRIPT_DIR/remote-run.sh\"". The watcher itself and `restart-watcher.sh` live there too.

None of those files is protected, and each is writable from inside a run:

- **By the file tools, in every run.** The profile allows `Edit(//<repoRoot>/**)` and `Write(//<repoRoot>/**)`, where `<repoRoot>` is the main checkout. Nothing in `deny` names these files, so a run in a worktree can rewrite `<main>/<scriptsDir>/autonomous-notify.sh`. The watcher then executes it unsandboxed at its next event, with full network access and the credentials the sandbox withholds.
- **By sandboxed commands, in a remote job.** There the run's working directory is the main checkout, which the sandbox can write by default. That is why `push-branch.sh` and `refresh-branch.sh` carry explicit `denyWrite` entries, and it applies equally to the scripts the job's watcher runs next.

The profile's own `_README` line repeats the same claim and is therefore false as well: "WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT". So is the `docs/cli.md` paragraph "**Everything that runs outside the sandbox is write-protected on both sides**". `cli.md` requires a change to satisfy its module header's rule, or to amend the header in the same edit. This one does neither.

**Fix.** Protect the main checkout's copy of every top-level outer-loop script on both sides. Keep the two `runsUnsandboxed` rows' entries and reasons as they are.

- [ ] In `protectedPaths`, directly after the existing `runsUnsandboxed` loop and before the `lib` entry, add one `file` entry per remaining top-level row. Skip the docs-retrieval launcher, which keeps its own retrieval-gated entry:

  ```ts
  for (const row of OUTER_LOOP_SCRIPTS.filter(
    (script) =>
      script.subdir === undefined && script.runsUnsandboxed !== true && script.file !== DOCS_SEARCH_SERVER_SCRIPT_NAME,
  )) {
    paths.push({
      path: outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(row)),
      kind: 'file',
      reason: `the run watcher, the remote job or a person runs the main checkout's ${row.file} outside the sandbox`,
    });
  }
  ```

  `applyWriteProtection` and `doctor`'s `profile-write-protection` both read `protectedPaths`, so the `denyWrite` entries, the `Edit`/`Write` deny rules, the `_README` line and the check all follow from this one change.
- [ ] Update the `protectedPaths` doc comment's list ("the unsandboxed wrappers and their library, …") to name the main checkout's outer-loop scripts.
- [ ] In `cli/test/profile.test.mjs`, case "every path that runs outside the sandbox is write-protected on both sides", add an `assertProtected(profile, join(dir, SCRIPTS_DIR, row.file), 'file')` for each such row, and assert that the worktree-glob copy of `autonomous-notify.sh` stays unprotected, as the existing loop does for the unsandboxed rows. That is the test file this fix edits, so it is the one the fix runs.
- [ ] In `docs/cli.md` → `### The sandbox block and the permission mode`, in the paragraph starting "**Everything that runs outside the sandbox is write-protected on both sides**", replace "The set is the main checkout's two excluded wrappers and the `lib/` directory they source;" with "The set is the main checkout's copy of every top-level outer-loop script: the two excluded wrappers, and the scripts the run watcher, the remote job or a person runs there outside the sandbox. It also holds the `lib/` directory they source;".
- [ ] Re-render `examples/notes-app/.claude/settings.autonomous.json` for the new entries, in the file's existing `/workspace/notes-app` spelling and in `protectedPaths` order. Add each new path to `sandbox.filesystem.denyWrite` after `/workspace/notes-app/scripts/refresh-branch.sh`, and add its `Edit(//…)` and `Write(//…)` pair to `permissions.deny` after the `refresh-branch.sh` pair. The example's `_README` "WHAT RUNS OUTSIDE THE SANDBOX…" line takes the same `<path> - <reason>` items in the same place. Then recount the `/workspace` occurrences and lines and update the sentence in `examples/notes-app/README.md` that begins "The file now carries 106" so that it matches.
