### Task 1 — Own the anchor's name in `cli/src/core/mainRepoAnchor.ts` and allow-list its read in the generated profile

**Goal:** Give the main-checkout anchor one owner in the package, and make every generated unattended profile allow the plugin readers' one literal read of it. The constants are `MAIN_REPO_ANCHOR_VARIABLE = 'HARNESS_MAIN_REPO'`, `MAIN_REPO_ANCHOR_READ = 'printenv HARNESS_MAIN_REPO'` and `MAIN_REPO_ANCHOR_RULE = 'Bash(printenv HARNESS_MAIN_REPO)'`. The profile gains that rule in `permissions.allow`, plus one `_README` line saying why. A profile without the rule leaves every reader on its fallback, so `doctor` grades it (Task 2).

**Where this task stops.** The `doctor` check is **Task 2's**. The watcher's export of the variable is **Task 3's**, the test suite's blanking of it is **Task 4's**, and the worked example's re-render is **Task 19's**. This task changes no shell file and no template file: the rule and its `_README` line are appended in code, so the template carries no second spelling of the name.

### Targets

- `cli/src/core/mainRepoAnchor.ts` (new) — the three constants and the header.
- `cli/src/generators/permissionProfile.ts` — append the rule and its `_README` line in `renderProfile`.
- `cli/test/profile.test.mjs` — the cases below.

**Work:**

- [ ] **`cli/src/core/mainRepoAnchor.ts`.** Export the three constants, each built from the one before: `MAIN_REPO_ANCHOR_READ` is `` `printenv ${MAIN_REPO_ANCHOR_VARIABLE}` `` and `MAIN_REPO_ANCHOR_RULE` is `` `Bash(${MAIN_REPO_ANCHOR_READ})` ``. The rule is exact, with no `:*`, so it matches the bare read and nothing else.
  - The header opens with *"The rule this module exists to enforce"*: the main checkout's anchor has one name, the launcher sets it, the plugin's readers read it with this one literal command, and **no unsandboxed outer-loop script reads it**, because an assignment prefix on an excluded call could set it.
  - The header declares the mirrors outside the package that must spell the same literal, in the form `cli/src/machine/registry.ts` uses for `MACHINE_REGISTRY_FILENAME`:
    - `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`'s `export HARNESS_MAIN_REPO="$MAIN_REPO"` (Task 3);
    - `plugin/hooks/lib/harness-config-lib.sh` → `hc_main_root` (Task 7);
    - the plugin's `<MAIN_REPO>` resolution row and clause (Tasks 8–13), which are prose and cannot import.
- [ ] **`renderProfile`.** After the browser and retrieval fragments are merged, append `MAIN_REPO_ANCHOR_RULE` through the module's existing `appendAllow`, so a template or fragment that already carried it is not duplicated.
  - Then `appendReadme` (from `cli/src/generators/profileEntries.ts`) one line built from the constants, never retyped. It opens with an upper-case heading and says: the plugin's readers find the main checkout with a bare `printenv HARNESS_MAIN_REPO`, which the watcher sets for every session it launches, and fall back to the first `git worktree list` entry when it prints nothing, so removing the rule costs only the fallback.
  - The entry carries no quote or shell operator, so `assertRunnable` accepts it unchanged.
  - Extend the module header's list of what the profile carries by one clause naming the rule's owner.
- [ ] **`cli/test/profile.test.mjs`.** Import the constants from `../dist/core/mainRepoAnchor.js`, following the file's existing `dist` imports. Add cases on a throwaway fixture's `init`:
  - `permissions.allow` carries `MAIN_REPO_ANCHOR_RULE` exactly once, and no `ask` or `deny` entry names it;
  - `_README` carries exactly one line containing `MAIN_REPO_ANCHOR_READ`;
  - after `init --force` over that profile, the rule is still there exactly once;
  - with `phases.qa` on and `qa.driver` `web-playwright`, so the browser fragment merges, the rule is there exactly once.

**Verification:**

- `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0.
- `npm test --workspace cli -- test/profile.test.mjs`, from the repository root as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status: every case passes, `# fail 0`.
- `grep -rn "HARNESS_MAIN_REPO" cli/src` prints only lines of `cli/src/core/mainRepoAnchor.ts`. Every other module takes the name through an import.
