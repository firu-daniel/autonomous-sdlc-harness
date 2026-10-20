### Task 5 — Write-deny the main checkout's whole `.git`, narrow the sibling-glob `.git` entry to the six clone paths, and keep the `_README` true

**Goal:** Change the generated profile's write protection, in `cli/src/generators/writeProtection.ts`, which owns it:
- one `<main>/.git` directory entry replaces the per-file entries under the main checkout's `.git`;
- the sibling-glob `<work_root>/<projectName>-*/.git` entry, which on a clone covers the whole git directory and closes it to the clone's own sandboxed git (`docs/sandbox-verification.md` CL1–CL4), is replaced by six glob entries naming only the clone's trust files;
- the `_README` sentences that describe the set stay true.

This task also exports the two statements the watcher (Task 13) and `doctor` (Task 6) read.

**Where this layer stops.** This task defines the set and the shared constants. It does not render a per-run profile: that is the watcher's (Task 13), which mirrors `COPY_GIT_PATHS`, `fileToolDenyRules`' kind → rule map, `SANDBOX_OPT_OUT_MARKER`, `shippedSandboxSettings`' three strict values and `applySandbox`'s opt-out shape, and declares nothing back here beyond the mirror lines this task writes. The watcher's entry screen (a quote or a `*`) is its own rule, not a copy of `profileEntries.ts`'s refused set, so that module's header is untouched. It does not change `doctor`'s grading code. `doctor` grades whatever `protectedPaths` returns, and Task 6 adds the retired-entry report.

### Targets

- `cli/src/generators/writeProtection.ts`
- `cli/src/generators/sandboxProfile.ts` (header only)
- `cli/templates/claude/settings.autonomous.json` (`_README` lines only)
- `cli/test/profile.test.mjs`
- `cli/test/init.test.mjs` (only where an assertion reads a `.git` entry or a `_README` sentence this task changes)

**Work:**

- [ ] **`protectedPaths`.**
  - **The main checkout.** Replace the main checkout's per-file `.git` entries with one `{ path: join(repoRoot, '.git'), kind: 'directory' }`, giving its reason in one clause: objects reach the main checkout only through sync-in's fetch, and git and the unsandboxed wrappers follow its configuration, hooks, `commondir`, worktree records and legacy remotes. The per-file entries are `.git/hooks`, `.git/config`, `.git/config.worktree`, `.git/commondir`, the `worktrees/*` name entry and its three record files, `.git/remotes` and `.git/branches`.
  - **The sibling glob.** Replace the sibling-glob `.git` entry with one glob entry per row of a new exported `COPY_GIT_PATHS`:
    - `.git/config` — `file`;
    - `.git/hooks` — `directory`;
    - `.git/objects/info/alternates` — `file`;
    - `.git/commondir` — `entry`;
    - `.git/config.worktree` — `entry`;
    - `.git/objects/info/http-alternates` — `entry`.

    Each carries its reason: the runtime refuses the first three already, and they are restated so the protection does not rest on an undocumented default; the last three it leaves open (`docs/sandbox-verification.md` CL5).
  - **Unchanged:** the `scriptsDir` `.git` levels, the registry and every non-`.git` entry. Remove the `name` kind from `ProtectedPath` and `fileToolDenyRules` if no entry uses it any more, together with its doc text.
- [ ] **The two projections and the new exports.**
  - `copySurfacePaths` drops every glob entry whose relative path is `.git` or starts with `.git/`, so its output, and `hr_run_protected_rel_paths`, which mirrors it, is unchanged.
  - `jobSurfacePaths` already drops every `.git` segment. Confirm it is unchanged.
  - Export `COPY_GIT_PATHS` (each row's relative path and kind).
  - Export `retiredProtectedPaths({ repoRoot, workRoot, config })`, returning the sibling-glob `.git` entry an earlier release wrote, with a reason: on a clone it closes the whole `.git` to the run's own sandboxed git. Task 6 grades a profile still carrying it.
  - In the module header, declare the two new mirrors, both in `cli/templates/scripts/autonomous-watcher.sh` (Task 13) and both held equal by `cli/test/watcher-run-profile.test.mjs` (Task 14):
    - the watcher's copy of `COPY_GIT_PATHS` (each row's relative path and kind);
    - the watcher's copy of `fileToolDenyRules`' kind → rule map: `file` → `Edit(/<p>)`, `Write(/<p>)`; `directory` → the same on `<p>/**`; `entry` → the four rules, both forms of each tool. Any change to that map is an edit to the watcher's `run_profile_render` in the same change.
  - In `sandboxProfile.ts`'s header, declare on the same terms (in `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_check`, Task 13; held equal by `cli/test/watcher-run-profile.test.mjs`, Task 14) the watcher's mirrors of:
    - `SANDBOX_OPT_OUT_MARKER`;
    - the strict values of `sandbox.enabled`, `sandbox.failIfUnavailable` and `sandbox.allowUnsandboxedCommands` that `shippedSandboxSettings` reads from the template;
    - the opt-out shape `applySandbox` writes: `enabled` `false`, `failIfUnavailable` `false`, `allowUnsandboxedCommands` left at the template's value.

    Amend the header's existing sentence that `shippedSandboxSettings` reads the template *"rather than restating"* it, so it names this one declared copy outside TypeScript. Any change to `GRADED_SETTINGS`' template values for those three keys, or to `applySandbox`'s opt-out branch, is an edit to the watcher's `run_profile_check` in the same change.
- [ ] **The `_README` sentences.**
  - In `applyWriteProtection`'s appended line, rewrite the Linux-glob list (*"the worktree's hooks directory, MCP wiring, settings files and .git pointer, the worktree records and the files in them"*) to the globbed entries as they now stand.
  - Add one sentence there: the watcher passes each run a per-run copy of this file that adds that run's own copy's paths, and every other live worktree's `.git` pointer, by exact path, which holds on Linux too.
  - In the template's `THREE COMMANDS RUN OUTSIDE THE SANDBOX` line, replace *"which nothing creates yet"* with what now creates the clone (`create-worktree.sh`).
  - In the same line, restate the commit wrapper's exclusion reason, *"The commit wrapper is excluded because a sandboxed git cannot write a linked worktree's record (measured on Claude Code 2.1.299 on macOS, docs/sandbox-verification.md rows G1 and G2)"*, for both layouts. In a clone, a sandboxed commit cannot move the main checkout's branch, whose whole `.git` this profile write-denies. In a legacy worktree run it still cannot write the worktree's record; keep the G1/G2 citation as the measured basis of that half only. Keep the clause that follows it, that the wrapper runs no commit hook because a hook would run project content with full access. Task 25 re-renders the example from this line, so the restatement lands there too.
  - In the template's `TWO RESIDUALS, STATED RATHER THAN HIDDEN` line, restate the globbed list the same way.

  Every sentence names the key or the role, never this repository's value.
- [ ] **Headers.** Restate `protectedPaths`' JSDoc: the worktree-record paragraph, which argues the per-file record protection, becomes the reason for the whole `.git` directory entry; legacy worktree runs keep their records closed by the runtime (`docs/sandbox-verification.md` G2). Restate the module header's description of the set and of the two projections. State in the header that a clone's `.git` must never be covered as a whole, by glob or by exact path, and cite CL4.
- [ ] **`profile.test.mjs`.**
  - Assert `<dir>/.git` protected as a `directory`.
  - Assert `<dir>/.git/config`, `config.worktree`, `commondir`, `worktrees/*` and the record files no longer appear as separate entries.
  - Assert each `COPY_GIT_PATHS` row protected under the glob with its kind.
  - Assert `join(glob, '.git')` **unprotected**: neither a `denyWrite` entry nor an `Edit` / `Write` rule names it.
  - Assert `copySurfacePaths` unchanged against its existing expected list.

  Touch `init.test.mjs` only where one of its assertions reads a changed entry or sentence.

**Verification:**

- The configured type-check exits 0.
- `npm test --workspace cli -- test/profile.test.mjs` passes, and so does `npm test --workspace cli -- test/init.test.mjs` if this task edited it.
- `node cli/dist/cli.js init --non-interactive` against a throwaway fixture under the system temp directory writes a profile in which:
  - `jq '.sandbox.filesystem.denyWrite[]'` lists `<fixture>/.git` and the six `<work_root>/<project>-*/.git/…` entries;
  - no entry equals `<work_root>/<project>-*/.git`;
  - `node cli/dist/cli.js doctor`'s `profile-write-protection`, run against that fixture, passes;
  - `git grep -nF 'which nothing creates yet' -- cli/templates/claude/settings.autonomous.json` prints nothing, and the `THREE COMMANDS RUN OUTSIDE THE SANDBOX` line names the main checkout's write-denied `.git` as the clone half of the commit wrapper's exclusion reason.

- **Deviations from plan:**
  - The `profile.test.mjs` bullet asks to assert `copySurfacePaths` "against its existing expected list"; no suite held a literal list (`cli/test/outer-loop-scripts.test.mjs` compares `hr_run_protected_rel_paths` with `copySurfacePaths` itself). The new case `copySurfacePaths leaves out every path inside a run copy's .git` asserts the list `copySurfacePaths`' JSDoc states, for a default and a retrieval configuration. That list was confirmed against the pre-change build by a probe (`bash scripts/scratch-run.sh harness-runs/scratch/task5-copy-surface.mjs <repo_root>`, which prints both `copySurfacePaths` and `jobSurfacePaths` for the two configurations). After the change, the same probe's output was byte-identical (`diff` empty).
  - The `init` fixture verification ran under `$TMPDIR` (`t5fx.9y89/fixproj`). `denyWrite` listed `<fixture>/.git` and the six `<fixture>-*/.git/…` entries, and no entry equal to `<fixture>-*/.git` (`grep -cx` printed `0`). `doctor`'s `profile-write-protection` reported `PASS`. The fixture's `rm -rf` was refused by the permission layer, so the fixture directory is still on disk under the system temp directory.
