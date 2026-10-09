### Task 2 — Warn when `scriptsDir` is absent, share `INIT_SCRIPTS_DIR` with the suites, and prove both directories end to end in `scripts-dir.test.mjs`

**Goal:** A configuration that omits `scriptsDir` keeps meaning `scripts`, and is now told so: "set it explicitly". The test suites get one shared spelling of the directory a fresh `init` writes. A new suite proves the prompt's `Done when` first bullet against the compiled CLI:
- `doctor` passes after a fresh `init` and after `init --scripts-dir <dir>`;
- an existing `"scriptsDir": "scripts"` config is untouched by `init`, `init --force` and `doctor`;
- the absent-key case behaves as the story index decided.

**Depends on:** Task 1, which exports this from `cli/src/config/model.ts`:

```ts
export const INIT_SCRIPTS_DIR = 'harness-scripts';
```

Task 1 also makes `buildConfig` write `flags.scriptsDir ?? rebuiltScriptsDir ?? INIT_SCRIPTS_DIR`, and adds the `init` flag `--scripts-dir <dir>`. `DEFAULTS.scriptsDir` stays `'scripts'`, the absent-key meaning.

**Where this task stops.**
- It adds the warning and the shared constant, and its own suite.
- It does **not** edit any existing suite. Tasks 3–6 move every existing suite to `INIT_SCRIPTS_DIR`, and adjust any suite whose seeded config omits `scriptsDir` and asserts warning-free output, now that this warning exists.
- The documentation of the warning is Task 15's (`docs/cli.md` §7, the `config` check).

### Targets

- `cli/src/config/check.ts` — `DEFAULTS` added to the existing named import from `./model.js`, and the warning.
- `cli/test/helpers/fixture.mjs` — the shared re-export.
- `cli/test/scripts-dir.test.mjs` (new) — the end-to-end suite.

**Work:**

- [ ] **`cli/src/config/check.ts`: one warning-severity problem.** In `checkConfigShape`, after the top-level string checks, add a problem at path `scriptsDir` when `value['scriptsDir'] === undefined`. It is `severity: 'warning'`, emitted through the existing `Problems` warning method.
  - **The import.** Add `DEFAULTS` to the existing named import from `'./model.js'` (the block that already brings in `CONFIG_VERSION`, `STATE_DIR_PATTERN` and the rest of this module's vocabulary). The fallback directory is `DEFAULTS.scriptsDir`, which `model.ts` owns and which every CLI reader of the absent key resolves through (`cli/src/generators/scripts.ts` → `resolvedScriptsDir`, `cli/src/generators/outerLoopScripts.ts` → `outerLoopScriptsDir`, `cli/src/core/permissionProfile.ts`, `cli/src/core/layerCoverage.ts`), so the message interpolates it rather than retyping it (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`). The message does not name the directory a fresh `init` writes; if a later wording does, it interpolates `INIT_SCRIPTS_DIR` from the same import, never the literal.
  - **The message**, as a template literal:

    ```ts
    `is not set, so every reader falls back to ${DEFAULTS.scriptsDir} — the directory releases before 0.6.6 wrote into, which a fresh init no longer writes. Set it explicitly to the directory your scripts are in, with npx autonomous-sdlc-harness config set scriptsDir <dir>, so its meaning cannot change under you.`
    ```

  - **Why `check.ts`.** It is the one producer every consumer already shares: `doctor`'s `config` check, `init`'s kept-config warnings in `writeHarnessConfig`, and `config`.
  - **Why it never reaches a fresh `init`.** `writeHarnessConfig` filters the generated config's problems to errors, and a generated config always carries the key.
  - **The module header.** State why this one optional key is reported when absent while no other is: an absent value is the only one whose meaning differs from what `init` now writes.
- [ ] **`cli/test/helpers/fixture.mjs`: re-export `INIT_SCRIPTS_DIR`** from the compiled `../../dist/config/model.js`, under the same name. Its doc comment says three things:
  - it is the directory a fresh `init` writes its scripts into;
  - a suite addressing scripts that an `init` with no seeded config wrote reads it from here, never as a literal;
  - a suite that seeds its own config keeps that config's own value.

  Tasks 3–6 import it from here.
- [ ] **`cli/test/scripts-dir.test.mjs`: the header and the fresh-`init` case.**
  - **The header** opens with the rule it enforces: *a new adoption writes its scripts to `harness-scripts/`, an existing one never moves, and an absent key means `scripts`*.
  - **Fixtures** come from `createFixture` (`cli/test/helpers/fixture.mjs`), with a seed whose detection resolves every command — the `nodeProjectFiles()`-style `package.json` the watcher helper uses.
  - **The case: a configless `init`.** It writes `"scriptsDir": INIT_SCRIPTS_DIR`. The wrappers `typecheck.sh` and `test.sh`, and the outer-loop scripts, land under `harness-scripts/`, and no `scripts/` directory is created. `commands.test` is `bash harness-scripts/test.sh`. `doctor` then exits `0` with its `command-wrappers` and `command-permissions` lines not warning — read the line format from `cli/src/doctor/checks.ts` → those checks' ids.
- [ ] **`cli/test/scripts-dir.test.mjs`: three more cases.**
  - **`init --scripts-dir tools/harness`** writes that value and puts the scripts there. `doctor` exits `0` with the same two checks clean.
  - **A seeded `"scriptsDir": "scripts"` config** is untouched by `init` and by `init --force`: the config bytes are identical before and after, and scripts land under `scripts/` with no `harness-scripts/` created. `doctor` leaves the whole tree byte-identical (`snapshotTree`).
  - **A seeded config with no `scriptsDir`.** `init` writes its scripts under `scripts/`, and `doctor` exits `0` with a warning naming `scriptsDir`. The warning text matches `/scriptsDir/` and `/config set scriptsDir/`.
- [ ] **`cli/test/scripts-dir.test.mjs`: every refusal is graded on bytes, not on the message** (`.claude/context/cli.md` → *A refusal is asserted on the bytes on disk*). Where a case compares trees, it uses `snapshotTree` from the helper. No case reaches the network: `doctor` runs without `--check-github`.

**Verification:**

- `npm test --workspace cli -- test/scripts-dir.test.mjs`, run from the repository root as one foreground command. It is this task's own new file. It passes, and its counts show every case ran.
- Run `commands.typecheck` (`bash scripts/typecheck.sh`).
- Grep `cli/src/config/check.ts`: `git grep -nE "harness-scripts|'scripts'|\"scripts\"|back to .?scripts" -- cli/src/config/check.ts` returns nothing — neither directory name appears there as a literal, and the message reaches the fallback only through `${DEFAULTS.scriptsDir}`. The new problem is the only place the absent-key sentence is spelled. `doctor`'s `config` check and `init`'s kept path both reach it without a copy (`writeHarnessConfig`'s `warnings.push(...loaded.problems.filter(…'warning'))`).
- The seeded-`scripts` case is the story index's first `Top risks:` entry, asserted on bytes.
