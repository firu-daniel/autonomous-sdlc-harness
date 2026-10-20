### Task 6 — Have `doctor` report a profile still carrying the sibling-glob `.git` entry, and say what the `worktrees` check is for now

**Goal:** Make `doctor` grade what Task 5's profile produces.
- `profile-write-protection` already grades the new set, because it computes the expected set from `protectedPaths`. It now also reports, by name, a profile still carrying the sibling-glob `.git` entry an earlier release wrote, because that entry closes every clone's git to its own sandboxed git.
- The `worktrees` check keeps its id and says what `git worktree list` is needed for now: the one-live-copy rule and sync-in's checked-out test read it, and legacy worktree runs live in it.
- `machineStateDir`'s JSDoc in `cli/src/machine/paths.ts`, which lists what lives in the machine state directory, names the third artifact this branch puts there: the watcher's per-run profiles (`.claude/context/cli.md` → **Machine-scoped state is not an adopter's file.**).

**Depends on:** Task 1, whose `hr_run_profile_file <repo slug> <branch>` in `cli/templates/scripts/lib/harness-run-lib.sh` prints `<lane dir>/run-profiles/<slug>/<sanitized branch>.json`, the per-run settings copy the watcher (Task 13) writes at every local spawn; and Task 5, which exports `retiredProtectedPaths({ repoRoot, workRoot, config })`: the sibling-glob `.git` entry, as a `ProtectedPath` with its reason. Its file-tool rules come from the existing `fileToolDenyRules`. This task reads that export and never restates the path.

### Targets

- `cli/src/doctor/checks.ts`
- `cli/test/doctor-profile-sandbox.test.mjs`
- `cli/test/doctor.test.mjs` (only where an assertion reads the `worktrees` check's title or message)
- `cli/src/machine/paths.ts` (`machineStateDir`'s JSDoc only)

**Work:**

- [ ] `PROFILE_WRITE_PROTECTION_CHECK`: after the missing-entry findings, find every `retiredProtectedPaths` entry still present in `sandbox.filesystem.denyWrite`, and every `fileToolDenyRules` rule for it still in `permissions.deny`. Report each by path, side and reason, under the check's existing grading: `warn`, and `fail` under `--remote-job`. Name `init --force` as the remedy, as the check's other findings do. Under a taken opt-out, grade only the file-tool side, as the check already does for missing entries. Extend the check's JSDoc with the reason this entry is stale, not merely extra.
- [ ] `WORKTREE_CHECK` (id `worktrees`, unchanged): restate its title, its JSDoc and its two messages. `git worktree list` answering is what lets `hr_run_copy_live_var` and sync-in see a checkout that has a branch checked out, and what lists a legacy worktree run. The `warn` grading stays. Update `cli/test/doctor.test.mjs` only where it asserts the check's old title or message text.
- [ ] Update `cli/test/doctor-profile-sandbox.test.mjs`: its helper that finds the main checkout's `denyWrite` entry ending in `/<file>` must still find what its cases read, now that the main checkout's `.git` files are one directory entry. Point any case that deleted a per-file `.git` entry at `<main>/.git` instead.
- [ ] Add to `doctor-profile-sandbox.test.mjs`:
  - a case that pushes the retired sibling-glob `.git` entry and its two rules back into a freshly generated profile, and expects a `warn` naming the path, both sides and the reason, then a `fail` under `--remote-job`;
  - its perturbation, the fresh profile untouched, which passes.
- [ ] **`machineStateDir`'s JSDoc** (`cli/src/machine/paths.ts`): its sentence *"What lives in it is … the usage lane's two artifacts … and the registry of initialized repositories"* gains a clause for the per-run profiles, `run-profiles/<slug>/<branch>.json`, owned by `hr_run_profile_file` in the generated `lib/harness-run-lib.sh` and published in `docs/watcher.md` (§2 `### The per-run profile`, listed in §5's tree by Task 21). JSDoc only: no code in the module changes, and no TypeScript caller reads the path.

**Verification:**

- The configured type-check exits 0.
- `git grep -n 'run-profiles' -- cli/src/machine/paths.ts` prints the new clause in `machineStateDir`'s JSDoc, and `git diff -U0 cli/src/machine/paths.ts` changes comment lines only.
- `npm test --workspace cli -- test/doctor-profile-sandbox.test.mjs` passes, and so does `npm test --workspace cli -- test/doctor.test.mjs` if this task edited it.
- Against a throwaway fixture under the system temp directory, initialised by the built CLI, then given the retired entry by hand with `jq`, `node cli/dist/cli.js doctor` prints `profile-write-protection` as a warning naming `<work_root>/<project>-*/.git`.
