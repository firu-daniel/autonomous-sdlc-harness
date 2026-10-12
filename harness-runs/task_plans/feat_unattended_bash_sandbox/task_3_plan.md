### Task 3 — Protect every path that runs outside the sandbox, on both sides of the profile

**Goal:** Enforce goal 7's rule in the generated profile: *anything that runs outside the sandbox must not be writable from inside it*. Every such path is protected twice: by a `sandbox.filesystem.denyWrite` entry for sandboxed commands, and by an `Edit` and a `Write` deny rule for Claude's file tools. The file tools run outside the sandbox, and the profile's own `Edit(//<repoRoot>/**)` / `Write(//<repoRoot>/**)` allows would otherwise reach these paths.

**Depends on:** Task 2. It adds the template's `"sandbox": { "filesystem": { "denyWrite": [] } }` list this task fills. It also flags the two rows of `OUTER_LOOP_SCRIPTS` (`cli/src/generators/outerLoopScripts.ts`) whose main-checkout copy is excluded, as `runsUnsandboxed: true`: `push-branch.sh` and `refresh-branch.sh`. This task reads that flag rather than naming either file.

**Where this task stops.** It protects files; it changes no script. The wrappers' refusal of an untrusted `config.worktree` and their hooks pin are **Tasks 4–5's**. Grading a profile on disk against this task's set is **Task 7's**, which calls the two exports under **Exports** below with the profile's own `permissions.additionalDirectories`.

### Targets

- `cli/src/generators/writeProtection.ts` (new) — the protected set and its two rule forms.
- `cli/src/generators/permissionProfile.ts` — call it at the end of `renderProfile`.
- `cli/test/profile.test.mjs` — the accompanying cases.

**Exports** (`writeProtection.ts`), consumed by Task 7:

```ts
export interface ProtectedPath {
  readonly path: string;                  // absolute, or a worktree-glob pattern
  readonly kind: 'file' | 'directory';
  readonly reason: string;                // one clause, rendered into _README and doctor's message
}
export function protectedPaths(input: {
  readonly repoRoot: string; readonly workRoot: string; readonly config: HarnessConfig;
  readonly additionalDirectories: readonly string[];
}): readonly ProtectedPath[];
export function fileToolDenyRules(entry: ProtectedPath): readonly string[];
// file      -> [`Edit(/${path})`, `Write(/${path})`]
// directory -> [`Edit(/${path}/**)`, `Write(/${path}/**)`]
// (path brings its own leading slash, so each rule carries the `//` absolute prefix)
export function applyWriteProtection(profile: JsonObject, input: {
  readonly repoRoot: string; readonly workRoot: string; readonly config: HarnessConfig;
}): void;
```

**Work:**

- [ ] `writeProtection.ts`, `protectedPaths`: open with a module header stating *"The rule this module exists to enforce"* (goal 7's rule, verbatim from the story's context), and the set below. Each item takes its value from its owner; none is retyped.
  1. For each `OUTER_LOOP_SCRIPTS` row with `runsUnsandboxed`: `<repoRoot>/<scriptsDir>/<file>`, kind `file`. Build it as `outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(row))`.
  2. The directory those rows source their library from: `<repoRoot>/<scriptsDir>/lib`, kind `directory`. Build it as `outerLoopScriptPath(repoRoot, config, libRow.subdir)`, where `libRow` is the `OUTER_LOOP_SCRIPTS` row whose `file` is `harness-run-lib.sh`.
  3. The hooks directory git runs `pre-push` from, using `resolveGithooksDir(config)` from `cli/src/generators/githooks.ts` and never a second read of `githooksDir`: `<repoRoot>/<githooksDir>` and `<worktreeGlob>/<githooksDir>`, kind `directory`. `worktreeGlob` comes from `core/paths.ts`. Also `<repoRoot>/.git/hooks`, kind `directory`: it is the other directory Task 4's pin accepts (git's default when `core.hooksPath` is unset). The sandbox already write-protects it; this adds the file-tool side.
  4. The local MCP launch surface: `<repoRoot>/<MCP_PATH>` and `<worktreeGlob>/<MCP_PATH>`, kind `file`. `MCP_PATH` comes from `generators/repoRoot.ts`. When `retrievalApplies(config)`, also add:
     - `<repoRoot>/<scriptsDir>/<DOCS_SEARCH_SERVER_SCRIPT_NAME>`, kind `file`, built as `outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(docsRow))`, where `docsRow` is the `OUTER_LOOP_SCRIPTS` row whose `file` is `DOCS_SEARCH_SERVER_SCRIPT_NAME`;
     - the same file under `<worktreeGlob>`, kind `file`, built by joining `worktreeGlob(...)` to `outerLoopScriptsDir(config)` and then to `outerLoopRelativePath(docsRow)`;
     - `<worktreeGlob>/<scriptsDir>/lib`, kind `directory`, built by joining `worktreeGlob(...)` to `outerLoopScriptsDir(config)` and then to `libRow.subdir`.

  `outerLoopScriptPath`, `outerLoopScriptsDir` and `outerLoopRelativePath` are all imported from `cli/src/generators/outerLoopScripts.ts`, the owner of the scripts directory. No item joins `scriptsDir` by hand: `outerLoopScriptsDir` applies `normalizeRepoDir` and `DEFAULTS.scriptsDir`, so a hand join would protect a directory the writer never wrote to.
  5. Every `additionalDirectories` entry except the state directory's absolute path, kind `directory`. These are the plugin roots the guard hooks run from.
  6. The main repository's own git configuration, which the unsandboxed wrappers and the watcher read: `<repoRoot>/.git/config` and `<repoRoot>/.git/config.worktree`, kind `file`. Task 4's pin reads `core.hooksPath` from the first. The second is read by every git call in the main checkout once `extensions.worktreeConfig` is on. The sandbox already protects `.git/config` and leaves `.git/config.worktree` writable from a linked worktree.
  7. The main checkout's own configuration file, `<repoRoot>/<CONFIG_FILENAME>` (`CONFIG_FILENAME` from `cli/src/config/model.ts`), kind `file`. Task 4's pin compares the hooks directory it reads from `.git/config` against the `githooksDir` this file names, so the value compared against must not be writable by the run. The sandbox cannot write it already (it is outside every `allowWrite` entry); this adds the file-tool side. A run edits its **worktree's** copy, never the main checkout's, so no legitimate edit is refused.

  If importing `MCP_PATH` from `repoRoot.ts` closes a cycle through `permissionProfile.ts` (`repoRoot.ts` imports `PROFILE_PATH` from it), use the binding at call time only and state the cycle in the header.
- [ ] `writeProtection.ts`, `applyWriteProtection`:
  - append each path to `sandbox.filesystem.denyWrite` and each of its `fileToolDenyRules` to `permissions.deny`, adding none twice;
  - append one `_README` line naming the set, with each item's reason;
  - state there that Linux skips a `denyWrite` entry containing `*`, so items 3, 4 and the retrieval items hold on Linux on the file-tool side only — residual 2 in the story's context;
  - state that a run's own edits under a protected worktree path, such as a change to its `githooks/` directory or to `.mcp.json`, are refused by design.
- [ ] `permissionProfile.ts`: call `applyWriteProtection` last before the final assertions in `renderProfile`, **after** the plugin-root generation and the `--force` carry-forward, so `additionalDirectories` is final when it is read. The `deny` additions must not trip `assertNoBrowserDeny` or `assertEveryScriptListed`. The latter counts `allow` only; confirm it, and say so in a comment if a reader could doubt it. The opt-out does not skip this step: the file-tool rules still apply with the sandbox off.
- [ ] `profile.test.mjs`: on an `init` fixture, assert:
  - `denyWrite` and `deny` carry both sides of every item, built in the test from the fixture's root, `scriptsDir`, `githooksDir` and the work-root glob;
  - with `phases.docs` and `docs.retrieval` on, the docs-search-server items appear, and with retrieval off they do not;
  - on an `init` fixture whose `scriptsDir` carries a trailing slash (`"scripts/"`), the `lib/` `denyWrite` entry is still rendered as `<root>/scripts/lib`;
  - under `--plugin-root-entries` with a fake plugin record (reuse the suite's existing machine-records fixture), each plugin root is protected and the state directory is not;
  - with `sandbox.optOut` set, the `Edit`/`Write` rules are still present;
  - `<root>/.git/hooks` and `<root>/harness.config.json` carry both sides, and no worktree-glob `harness.config.json` rule exists.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` passes. Then run `commands.typecheck` as written.
- No entry in `denyWrite` names the worktree's own `push-branch.sh` or `refresh-branch.sh`. Those copies are never excluded (Task 2), so they run sandboxed and need no protection.
- In a rendered profile, the state directory's path appears in `sandbox.filesystem.allowWrite` and in no `denyWrite` or `Edit`/`Write` deny entry.
- **Deviations from plan:**
  - `cli/src/generators/repoRoot.ts` was edited, though not a Target: importing `MCP_PATH` from it closed the cycle `permissionProfile.ts` → `writeProtection.ts` → `repoRoot.ts` → `permissionProfile.ts`, and `repoRoot.ts` read `QA_TEMPLATE_PATH` / `RETRIEVAL_TEMPLATE_PATH` at module evaluation (the `BROWSER_FRAGMENT` / `RETRIEVAL_FRAGMENT` constants), which threw `ReferenceError: Cannot access 'QA_PROFILE_FRAGMENT' before initialization` on loading `dist/generators/permissionProfile.js`. Using the binding at call time in `writeProtection.ts` alone could not fix it; the two constants became the functions `browserFragment()` / `retrievalFragment()`, and both module headers state the cycle.
  - The existing case `an outer-loop script an agent runs is allow-listed in three forms, and every other one is named nowhere` in `cli/test/profile.test.mjs` now reads `allow` and `ask` only: `deny` now carries the `Edit`/`Write` rules for the two unsandboxed wrappers, which are refusals, and counting them as forms failed it.
  - The plugin-records fixture: `cli/test/profile.test.mjs` had none to reuse (the existing one, `pluginMachine`, is file-local to `cli/test/init.test.mjs`), so the new case plants the same `installed_plugins.json` shape inline under a throwaway `CLAUDE_CONFIG_DIR`.
  - `githooksDir` is screened with `assertUsableInEntry` (adopter-fixable exit) in `applyWriteProtection` before any rule is built: no earlier screen covers it, and `assertRunnable` would otherwise report it as this CLI's fault.
  - Deferred to the Run gates phase: every other suite under `cli/test/` (run by `commands.test`), which the `repoRoot.ts` change and the new `deny` / `denyWrite` entries could touch — `init.test.mjs` and the doctor suites in particular.
