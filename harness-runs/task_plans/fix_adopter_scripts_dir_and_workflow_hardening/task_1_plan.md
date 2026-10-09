### Task 1 — Write `harness-scripts` into a generated config, add `init --scripts-dir`, and keep the directory on a rebuild

**Goal:** A fresh `init` with no `harness.config.json` writes `"scriptsDir": "harness-scripts"`. `init --scripts-dir <dir>` sets the value on a generated config the way `--state-dir` does. `init --reset-config` re-reads the directory from the file it rebuilds instead of moving it. An **absent** key still means `scripts` everywhere it is read. That is the story index's "scripts-directory decision": this task changes only what `init` *writes*.

**Where this task stops.**
- **No test file.** Task 3 covers this behaviour in `cli/test/init.test.mjs`, and Task 2 covers `doctor` and the absent-key warning. So this task's own verification is the type check and the reading checks below.
- **Not the absent-key warning.** That is Task 2's, in `cli/src/config/check.ts`.
- **No documentation.** That is Task 15's.
- **Package-internal `scripts` paths are left alone:**
  - `cli/src/machine/plugins.ts` → `SCRIPTS_DIRNAME`;
  - `cli/src/core/paths.ts` → `packageScriptsDir`;
  - `TEMPLATE_DIR` in `cli/src/generators/scripts.ts` and in `cli/src/generators/outerLoopScripts.ts`.

  Each one's own doc comment says it names the package's or the plugin's own layout.

### Targets

- `cli/src/config/model.ts` — the new constant, and the `DEFAULTS` doc comment.
- `cli/src/generators/harnessConfig.ts` — the flag on `HarnessConfigFlags`, the rebuild input, the precedence in `buildConfig`, and the start-over note.
- `cli/src/commands/init.ts` — `INIT_SCRIPTS_DIR` added to the existing named import from `../config/model.js` (the block that already brings in `CONFIG_FILENAME`, `DEFAULTS` and `STATE_DIR_DOT_PATTERN`), the flag row, its refusal, the rebuild resolution, and the unreadable-config warning. **Task 12 also edits this file** (spelling in prose only) and `**Depends on:**` this task.

**Work:**

- [ ] **`cli/src/config/model.ts`: add the constant**, beside `DEFAULTS`:

  ```ts
  export const INIT_SCRIPTS_DIR = 'harness-scripts';
  ```

  Its doc comment states three things:
  - It is the `scriptsDir` `init` writes into a configuration it generates.
  - It is deliberately not `DEFAULTS.scriptsDir`. `DEFAULTS.scriptsDir` stays `'scripts'`, because it mirrors the schema `default`, which is the **absent-key** meaning: the directory every release before 0.6.6 wrote into, and still where a configuration that omits the key keeps its scripts.
  - Changing the absent-key meaning would strand those scripts silently.

  Add one sentence to the `DEFAULTS` doc comment pointing at `INIT_SCRIPTS_DIR` as the one key whose generated value differs from its default, and why. **Exported**: Task 2 re-exports it to the test suites under the same name, and Tasks 3–6 consume it from there.
- [ ] **`cli/src/generators/harnessConfig.ts`: carry the flag and the rebuild value.**
  - **The flag.** Add `readonly scriptsDir?: string` to `HarnessConfigFlags`, documented as `` `--scripts-dir`. Defaults to {@link INIT_SCRIPTS_DIR}. ``
  - **The rebuild value.** Add `readonly rebuiltScriptsDir?: string` to `BuildConfigOptions` and to `HarnessConfigOptions`, forwarded by `writeHarnessConfig` into `buildConfig`. It is the value the file being rebuilt carried, with an absent key read as `DEFAULTS.scriptsDir`, and it is set only on a `--reset-config` run.
  - **The precedence.** In `buildConfig`, replace `const scriptsDir = DEFAULTS.scriptsDir;` with:

    ```ts
    flags.scriptsDir ?? rebuiltScriptsDir ?? INIT_SCRIPTS_DIR
    ```

    The `scriptsDir` field and `buildCommands(scriptsDir, …)` both keep reading this one local, so the config value, the wrapper invocations and — downstream — the wrapper files and the profile entries stay one string (`.claude/context/cli.md` → *One string, one producer*).
- [ ] **`cli/src/generators/harnessConfig.ts`: name the re-read in the start-over note.** In the `resetConfig && configExists(repoRoot)` note, extend the `consequence` sentence beside the `appDirClause`. When `rebuiltScriptsDir` was used, it says:

  > `scriptsDir` is re-read from the file being rebuilt as `<value>`, so the scripts already on disk stay where every reader looks for them; pass `--scripts-dir <dir>` to move it.

  Keep the dry-run and real-run variants in the same tense split the note already has. Update the module header's choice list wherever it enumerates what a rebuild re-reads.
- [ ] **`cli/src/commands/init.ts`: the flag row and its refusal.**
  - **The constant.** Add `const SCRIPTS_DIR_FLAG = '--scripts-dir';` beside `STATE_DIR_FLAG`.
  - **The import.** Add `INIT_SCRIPTS_DIR` to the existing named import from `'../config/model.js'`. Every string in this file that names the directory a generated config gets is built from it; `harness-scripts` is never typed out here (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`, shared constants are imported from their owner; `.claude/context/cli.md` → *One string, one producer*).
  - **The row.** Add an `INIT_OPTIONS` row directly after the `stateDir` row: `key: 'scriptsDir'`, `flag: SCRIPTS_DIR_FLAG`, `kind: 'value'`, `placeholder: '<dir>'`, `configValue: 'scriptsDir'`, and a summary built as a template literal from the constant:

    ```ts
    summary: `Repo-relative directory the wrapper and outer-loop scripts are written to (default: ${INIT_SCRIPTS_DIR})`,
    ```
  - **What the row buys for free.** `initOptions`'s completeness check now requires it, `--help` prints it, and `discardedConfigFlagsWarning` drops and names it on a kept-config run with no further code.
  - **The refusal.** Add `assertUsableScriptsDir(value: string | undefined): void`, called beside `assertUsableStateDir(flags.stateDir)` in `run`, so it is settled before the git gate. It throws an ordinary `HarnessError` naming `SCRIPTS_DIR_FLAG` and the value when the trimmed value is:
    - empty;
    - absolute (`isAbsolute`);
    - carrying a `..` segment;
    - normalising to `.`.

    The message gives the reason: the plugin's script-allowlist guard grants nothing for a `scriptsDir` that is empty, absolute, `.` or `..`-bearing (`plugin/hooks/autonomous-script-allowlist-guard.sh`, the header's outcome table, row "`scriptsDir` empty, absolute, `.`, or `..`-bearing"). So an unattended run would stall on every wrapper.

    Task 3 asserts the refusal leaves the tree byte-identical, so the message text is free. Task 15 documents the four refused shapes in `docs/cli.md` §2 using this function's wording.
- [ ] **`cli/src/commands/init.ts`: resolve the rebuild value.** In `run`, before `writeHarnessConfig`:
  - **When it applies.** When `flags.resetConfig && flags.scriptsDir === undefined && configExists(repoRoot)`, call `loadConfig(repoRoot)`.
  - **A readable file.** Pass `rebuiltScriptsDir: loaded.config.scriptsDir ?? DEFAULTS.scriptsDir`.
  - **An unreadable file.** Pass nothing, and push one **unconditional** warning, a statement about this invocation on the `resolveDetectionAppDir` precedent. Build it as a template literal from the imported constants, never with the directory typed out:

    ```ts
    `${CONFIG_FILENAME} could not be read, so the rebuilt file writes scriptsDir as ${INIT_SCRIPTS_DIR}; pass ${SCRIPTS_DIR_FLAG} <dir> to keep the directory your scripts are in.`
    ```

  - **The doc comments.** Extend the `InitFlags.resetConfig` doc comment's flag list (`--preset`, `--app-dir`, …, `--state-dir`) with `--scripts-dir`. Extend the `run` header's sentence on the generator order if it names where scripts land.

**Verification:**

- Run `commands.typecheck` (`bash scripts/typecheck.sh`). The compiler's `initOptions` completeness check is what proves the row covers the new `InitFlags` key, and it fails on a missing row.
- **No second spelling of the generated value.** `git grep -n 'harness-scripts' -- cli/src` reaches no line but the `INIT_SCRIPTS_DIR` declaration in `cli/src/config/model.ts` (its doc comment names the constant, never the value) — any other hit is a second spelling and fails this check. The `--help` summary and the unreadable-config warning in `cli/src/commands/init.ts` both interpolate `${INIT_SCRIPTS_DIR}`.
- Grep the three targets: in `cli/src/generators/harnessConfig.ts`, `INIT_SCRIPTS_DIR` is read in exactly one generator expression (the `buildConfig` precedence); in `cli/src/commands/init.ts` it is read only by the `INIT_OPTIONS` summary and the unreadable-config warning; and `DEFAULTS.scriptsDir` is unchanged at `'scripts'`. Every other `DEFAULTS.scriptsDir` reader is unchanged:
  - `cli/src/generators/scripts.ts` → `resolvedScriptsDir`;
  - `cli/src/generators/outerLoopScripts.ts` → `outerLoopScriptsDir`;
  - `cli/src/core/layerCoverage.ts`.

  So an absent key still resolves to `scripts` in every CLI reader.
- Read `discardedConfigFlagsWarning` against the new row: with `configValue: 'scriptsDir'` set, `--scripts-dir x` on a kept-config run is named in the warning with the remedy `config set scriptsDir <value>`. Task 3 asserts it end to end.
- The fresh, flag, kept and rebuild paths, and the refusal, are exercised end to end by Task 3's new `init.test.mjs` cases. The `doctor` side is exercised by Task 2's `scripts-dir.test.mjs`.
