### Task 3 — The protected surfaces as two projections of `protectedPaths`, and the git reads they need

**Goal:** Make `cli/src/generators/writeProtection.ts` the one owner of two path sets derived from `protectedPaths`, so neither is a second list.

- **`copySurfacePaths(config)`**, the worktree-relative set an unsandboxed checkout must not install run-authored content at. The run library mirrors it in shell.
- **`jobSurfacePaths(config)`**, the repo-relative set a remote job runs or loads from its own checkout.

Add to `cli/src/core/git.ts`, the one module that invokes git, the three reads Task 4's check needs.

**Where this task stops.** It adds no check, no flag and no caller. **Task 4** consumes both sets and the three git reads in `doctor --job-surfaces=<branch>`. **Task 10** asserts the shell mirror against `copySurfacePaths` on an `init`-written fixture.

### Targets

- `cli/src/generators/writeProtection.ts`
- `cli/src/core/git.ts`

**The contract this task defines.** Task 4 restates and calls the TypeScript functions in it. Task 10 restates the mirror rule and tests it.

| Export | Contract |
|---|---|
| `copySurfacePaths(config: HarnessConfig): readonly string[]` | `protectedPaths`' entries that lie under the sibling-worktree glob, with the glob prefix stripped and the `.git` pointer entry dropped. For the default configuration that is `githooks`, `.mcp.json`, `.claude/settings.json`, `.claude/settings.local.json`. Where `retrievalApplies(config)`, it adds `<scriptsDir>/docs-search-server.sh` and `<scriptsDir>/lib`. Paths use `/`, carry no trailing `/`, and keep `protectedPaths`' order. **Its declared shell mirror is `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_protected_rel_paths`**, which must print the same lines in the same order. |
| `jobSurfacePaths(config: HarnessConfig): readonly string[]` | `protectedPaths`' entries that lie under `repoRoot` itself, made repo-relative. Dropped are every path inside `.git`, a `.git` at a `scriptsDir` level, plugin roots and anything outside the checkout. That leaves the main checkout's outer-loop scripts, `<scriptsDir>/lib`, `<githooksDir>`, `.mcp.json`, `.claude/settings.autonomous.json`, `.claude/settings.json`, `.claude/settings.local.json`, `harness.config.json`, and, where retrieval applies, `<scriptsDir>/docs-search-server.sh`. `/`-separated and deduplicated. Computed with a placeholder `repoRoot` and `workRoot`, so the caller needs no real paths. |
| `mergeBase(repoRoot, a, b): string \| undefined` (`core/git.ts`) | `git merge-base <a> <b>` as a fixed argument vector. `undefined` when there is none or git fails. |
| `fileAtRef(repoRoot, ref, repoRelativePath): string \| undefined` (`core/git.ts`) | `git show <ref>:<path>`'s stdout, untrimmed. `undefined` when the path or ref is absent. It reads a blob, so no textconv applies. |
| `changedPathsBetween(repoRoot, base, tip, pathspecs): readonly string[] \| undefined` (`core/git.ts`) | `git diff --name-only --no-renames --no-ext-diff --no-textconv <base> <tip> -- <pathspecs…>`, tree to tree, with no working tree read and no driver run. `undefined` when git fails. |

**Work:**

- [ ] **`writeProtection.ts`:** add `copySurfacePaths` and `jobSurfacePaths` as tabled. Derive both by filtering and projecting the result of `protectedPaths(...)`. Build no path by hand, so a path added there reaches both sets with no further edit.
- [ ] **`writeProtection.ts`'s module header:** add a paragraph naming the two projections and what each is for: refusing an unsandboxed checkout locally, and the remote job's surface check. Declare the shell mirror `hr_run_protected_rel_paths` in `cli/templates/scripts/lib/harness-run-lib.sh` in the way `cli/src/machine/registry.ts`'s header declares its one template mirror. Say a mirror this header does not declare is a defect, and that `cli/test/outer-loop-scripts.test.mjs` holds the two equal.
- [ ] **`core/git.ts`:** add `mergeBase`, `fileAtRef` and `changedPathsBetween` through the module's private `runGit`, each a fixed argument vector with no shell (the header's invariant 1). Extend the header's list of what the module answers with the three.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- `git grep -nE "copySurfacePaths|jobSurfacePaths" -- cli/src` shows each defined once, in `writeProtection.ts`.
- `git grep -nE "execFileSync|spawnSync" -- cli/src/generators/writeProtection.ts` finds nothing: the git reads live in `core/git.ts` alone.
- No test runs here. Task 4's `cli/test/doctor-job-surfaces.test.mjs` and Task 10's parity case in `cli/test/outer-loop-scripts.test.mjs` exercise these exports.

**Deviations from plan:**

- `mergeBase`, `fileAtRef` and `changedPathsBetween` return `undefined` without calling git when a revision argument is empty or starts with `-`. The argument vector stays exactly as tabled, and git can no longer read a caller's ref as an option. `fileAtRef` and `changedPathsBetween` read through a new private `runGitUntrimmed`, which has a 64 MiB `maxBuffer`. The default is 1 MiB, and an overflow would have read as an absent file: `cli/templates/scripts/remote-run.sh` is already 394846 bytes (`wc -c`).
- Each projection was checked by a probe of the compiled module (`harness-runs/scratch/task3_projections.mjs`, run through `bash scripts/scratch-run.sh`) against this repository's `harness.config.json`, against a variant with `scriptsDir: tools/harness` and `githooksDir: hooks/git`, and against a variant with retrieval on. `copySurfacePaths` printed the tabled four paths, plus `scripts/docs-search-server.sh` and `scripts/lib` with retrieval on, in `hr_run_protected_rel_paths`' order. `jobSurfacePaths` printed the tabled set. No test file was written, as the plan states.
