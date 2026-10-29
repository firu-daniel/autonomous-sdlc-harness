### 2. List the absent-path manifest among the machine state directory's contents in `machineStateDir`'s header

**Severity:** Should Fix · **Layer:** cli

**Site:** `cli/src/machine/paths.ts` → `machineStateDir`, the doc comment's sentence *"the watcher's per-run profiles, `run-profiles/<slug>/<branch>.json`, whose path `hr_run_profile_file` in the generated `lib/harness-run-lib.sh` owns"*.

**Problem.** This branch adds a second watcher-written artifact to the machine state directory, `run-profiles/<slug>/<branch>.absent`. Its name is owned by `hr_run_profile_absent_file`. The watcher writes it at every spawn on a bubblewrap host, and `cleanup-merged-worktrees.sh` removes it. `machineStateDir`'s header is the CLI's enumeration of *"what lives in it"*, and it still lists only the `.json` profile. A reader who uses that header to find every piece of machine-scoped state, and its owner, will miss the manifest.

Rule: `.claude/context/cli.md` → `## How a module in this layer is written`, *"Machine-scoped state is not an adopter's file. What this layer writes outside the repository it was aimed at is enumerated and each piece has one owner"*. `## What "done" means here` says *"A reviewer holds a change to its module's own header"*.

**Fix.** In that doc comment, after the per-run profile clause, add the absent-path manifest beside it: `run-profiles/<slug>/<branch>.absent`, the bubblewrap-host absent-path manifest, whose path `hr_run_profile_absent_file` in the generated `lib/harness-run-lib.sh` owns and `docs/watcher.md` §2 `### The per-run profile` publishes. Change only that comment; no code changes. The change is comment-only, so no test is owed.
