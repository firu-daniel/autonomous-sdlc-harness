### 1. `init --reset-config` re-reads an unusable `scriptsDir` unscreened: an empty or non-string value aborts as a CLI fault, and an absolute or `..` value is written back

**File:** `cli/src/commands/init.ts` (`run`): "rebuiltScriptsDir = loaded.config.scriptsDir ?? DEFAULTS.scriptsDir"
**Also:** `cli/src/commands/init.ts` (`assertUsableScriptsDir`); `cli/src/generators/harnessConfig.ts` (`writeHarnessConfig`): "init assembled a ${CONFIG_FILENAME} that is already invalid"; `docs/cli.md` → `## 2. \`init\``, the `--reset-config` paragraph: "**`scriptsDir` is re-read the same way**"; `cli/test/init.test.mjs` → `test('init writes scriptsDir fresh, keeps it on a kept config, and re-reads it on a rebuild'`

**The problem.** This branch makes a `--reset-config` run with no `--scripts-dir` re-read `scriptsDir` from the file it rebuilds. `loadConfig` (`cli/src/config/io.ts`) returns `config` for **any** file that parses as a JSON object, shape errors included, so the re-read value is whatever the file holds. Only `undefined` and `null` are caught, by the `?? DEFAULTS.scriptsDir`. That breaks two ways:

1. **An empty or non-string value makes the documented repair route abort and blame the CLI.** With `"scriptsDir": ""` (or `5`, or `[]`), `rebuiltScriptsDir` is that value. `buildConfig` writes it into the generated config, and `writeHarnessConfig`'s `checkConfigShape(generated)` reports `scriptsDir: must not be empty` (or `must be a string`). The run then throws `HarnessError(…, EXIT.INTERNAL)` with *"init assembled a harness.config.json that is already invalid … This is a fault in this CLI rather than in the repository it was run against"*. Before this branch the rebuild always wrote a fixed value, so `--reset-config` repaired this file. Now it cannot repair it without `--scripts-dir`, and the message points the adopter at a CLI bug instead of the flag. `docs/cli.md` §2 calls `--reset-config` the route for a broken configuration, and `resolveDetectionAppDir`'s header in the same file argues the rule this breaks: a config-sourced value that cannot be used falls back with a warning, *"so a refusal sourced from the very file being rebuilt would make a repository with a bad `appDir` unrepairable by the one command documented to repair it"*.
2. **An absolute, `..`-bearing or `.` value is carried into the rebuilt file without a word.** `assertUsableScriptsDir` refuses exactly these shapes on `--scripts-dir`, because the script-allowlist guard grants nothing under them and an unattended run then stalls on every wrapper. The rebuild writes the same shape back from the old file with no warning, so a start-over keeps the stall the flag refusal exists to prevent.

No test covers either case. The new subtests seed only `"scripts"`, an absent key, and `--scripts-dir` over a re-read value. The unreadable-file arm (`loaded.config === undefined`) has no case either.

**Fix.** Screen the re-read value with the same rule the flag uses. Where the value cannot be used, take the precedent the unreadable-file arm of the same block already sets: write `INIT_SCRIPTS_DIR` and warn, naming `--scripts-dir`.

- [ ] In `cli/src/commands/init.ts`, split the reason computation out of `assertUsableScriptsDir` into a function that returns the reason string or `undefined`, and keep the refusal calling it:

  ```ts
  /** Why `value` cannot be a `scriptsDir` the script-allowlist guard grants anything under, or `undefined`. */
  function unusableScriptsDirReason(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed === ''
      ? 'is empty'
      : isAbsolute(trimmed)
        ? 'is absolute'
        : trimmed.split(/[\\/]/).includes('..')
          ? "carries a '..' segment"
          : posix.normalize(trimmed).replace(/\/+$/, '') === '.'
            ? "normalises to '.'"
            : undefined;
  }

  function assertUsableScriptsDir(value: string | undefined): void {
    if (value === undefined) return;
    const reason = unusableScriptsDirReason(value);
    if (reason === undefined) return;
    throw new HarnessError(/* the existing message, unchanged */);
  }
  ```

- [ ] In `run`, replace the `else` arm of the rebuild block with a screen:

  ```ts
  } else {
    const kept = loaded.config.scriptsDir ?? DEFAULTS.scriptsDir;
    const reason =
      typeof kept !== 'string' ? `is not a string (${JSON.stringify(kept)})` : unusableScriptsDirReason(kept);
    if (reason === undefined) {
      rebuiltScriptsDir = kept;
    } else {
      warnings.push(
        `${CONFIG_FILENAME}'s scriptsDir ${reason}, so the rebuilt file writes scriptsDir as ${INIT_SCRIPTS_DIR}; pass ${SCRIPTS_DIR_FLAG} <dir> to name the directory your scripts are in.`,
      );
    }
  }
  ```

  Update the comment above the block to say an unusable value answers nothing, the same as an unreadable file.
- [ ] In `docs/cli.md` → `## 2. \`init\``, in the `--reset-config` paragraph's `scriptsDir` sentence, change "a file that cannot be parsed supplies none, and the run warns that the rebuild writes `harness-scripts` and names `--scripts-dir`" to "a file that cannot be parsed, or whose `scriptsDir` is not a string or is a value `--scripts-dir` would refuse, supplies none, and the run warns that the rebuild writes `harness-scripts` and names `--scripts-dir`".
- [ ] In `cli/test/init.test.mjs`, inside `test('init writes scriptsDir fresh, keeps it on a kept config, and re-reads it on a rebuild'`, add subtests that seed a config and run `init --reset-config`. Each asserts exit 0, `scriptsDir` equal to `INIT_SCRIPTS_DIR` in the rebuilt file, and a stderr warning naming `--scripts-dir`:
  - `"scriptsDir": ""`;
  - `"scriptsDir": "/abs"`;
  - a `harness.config.json` that does not parse as JSON (the existing unreadable-file arm).

  Run only that file: `npm test --workspace cli -- test/init.test.mjs`.

**Deviations from plan:**
- The `docs/cli.md` sub-step was not done on this dispatch: `docs/` is outside the `cli` layer's path scope (`cli`), so it needs a catch-all (`general`) dispatch. Done on the `general` dispatch, wording as specified.
- The rebuild screen narrows with `reason === undefined && typeof kept === 'string'` and types the re-read value as `unknown`, so no cast is needed; behaviour as specified.
