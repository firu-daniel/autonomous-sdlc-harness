### Task 3 — Cover the new `init` behaviour in `init.test.mjs` and move its fresh-init paths to `INIT_SCRIPTS_DIR`

**Goal:** `cli/test/init.test.mjs` asserts every `init`-side behaviour Task 1 added. Its existing cases that address scripts written by a configless `init` read the directory from the shared constant instead of `'scripts'`.

**Depends on:**
- **Task 1**, which gives `init` the flag `--scripts-dir <dir>`. The `INIT_OPTIONS` row carries `configValue: 'scriptsDir'`, so a kept-config run names the flag in `discardedConfigFlagsWarning`. `assertUsableScriptsDir` refuses an empty, absolute, `..`-bearing or `.` value before the git gate, with an ordinary `HarnessError` (exit `1`) naming `--scripts-dir`. A `--reset-config` run without the flag re-reads `scriptsDir` from the file being rebuilt, absent read as `scripts`, and its start-over note names that. A fresh config's value is `INIT_SCRIPTS_DIR` (`'harness-scripts'`).
- **Task 2**, which re-exports `INIT_SCRIPTS_DIR` from `cli/test/helpers/fixture.mjs`, and makes a kept config that omits `scriptsDir` produce a `scriptsDir` warning through `init`'s kept-config warnings.

**Where this task stops.** Only `init.test.mjs` is edited here. The other suites are Tasks 4–6's, and `doctor`'s side of these cases is Task 2's `scripts-dir.test.mjs`.

### Targets

- `cli/test/init.test.mjs`

**Work:**

- [ ] **Move the existing fresh-init paths.** Import `INIT_SCRIPTS_DIR` from `./helpers/fixture.mjs`. The rule for each existing reference to the adopter's scripts directory as `scripts` / `scripts/…`:
  - Where the fixture had **no** `harness.config.json` when `init` first ran, the reference moves to `INIT_SCRIPTS_DIR`.
  - Where the case **seeded** a config, it keeps that config's own value.
  - Where a seeded config omits `scriptsDir` and the case asserts the warnings block, the assertion accounts for Task 2's warning, or the seed gains `"scriptsDir": "scripts"` when the case is not about that key.

  Paths into the package's own `templates/scripts/` never change.
- [ ] **Add the fresh and flag cases.**
  - **A configless `init`.** It writes `"scriptsDir": INIT_SCRIPTS_DIR`, and `commands.typecheck` / `commands.test` hold `bash harness-scripts/typecheck.sh` / `bash harness-scripts/test.sh`. The profile's allow entries name `harness-scripts/` in all three forms. Read the forms off `cli/templates/claude/settings.autonomous.json` `_README` and the existing profile assertions in this file.
  - **`init --scripts-dir tools/harness`.** It writes that value, and the wrappers land under `tools/harness/`.
  - **`--help`.** It lists `--scripts-dir <dir>`.
- [ ] **Add the kept-config cases.**
  - **A seeded `"scriptsDir": "scripts"` config.** It is byte-identical after `init` and after `init --force`, and no `harness-scripts/` directory exists afterwards.
  - **`init --scripts-dir x` against a kept config.** It exits `0`, leaves the config byte-identical, and warns naming `--scripts-dir` and `config set scriptsDir <value>`. This is the "dropped flag" rule (`docs/cli.md` §2, the `--default-branch` row).
- [ ] **Add the rebuild cases.**
  - **`init --reset-config` over a config holding `"scriptsDir": "scripts"`.** The rebuilt file still holds `scripts`.
  - **The same over a config with the key absent.** The rebuilt file holds `"scriptsDir": "scripts"`, written explicitly now.
  - **`init --reset-config --scripts-dir y`.** The rebuilt file holds `y`.
  - **The start-over note.** In the first case it names `scriptsDir` as re-read.
- [ ] **Add the refusal cases**, in the shape of the existing `a dot-named --state-dir` subtest and the table beside it: `--scripts-dir ''`, `--scripts-dir /abs`, `--scripts-dir ../out` and `--scripts-dir .`. Each exits `1` naming `--scripts-dir`, and leaves the fixture tree byte-identical (`snapshotTree`), with no `.bak` written.

**Verification:**

- `npm test --workspace cli -- test/init.test.mjs`, run from the repository root as one foreground command. This is the file this task edits. It passes, and its `# tests` / `# pass` counts include the new subtests.
- Grep `init.test.mjs` for `'scripts'` and `scripts/` after the edit. Every remaining hit is one of two things: a path into the package's own `templates/scripts/`, or a seeded config's own value.
- The kept and rebuild cases are the story index's first `Top risks:` entry, asserted on the bytes on disk rather than on the message.

**Deviations from plan:**

- The grep check leaves two hit families outside its two named classes, neither of them the adopter's `scriptsDir`: `initUnresolvedSlug` symlinks the package's own `cli/scripts/` (`for (const asset of ['templates', 'scripts'])`), and the plugin-root fixture beside `PLUGIN_HELPER` plants the plugin's own `scripts/`. Both left unchanged.
- `--scripts-dir ''` is refused by the argument parser (`--scripts-dir requires <dir>`, exit 1) before `assertUsableScriptsDir` sees it; the case asserts exit 1, `--scripts-dir` named and a byte-identical tree, which that refusal meets.
- Seeded configs that omitted `scriptsDir` (`recordingFixtureFiles`, `retrievalFixture`, the reserved-analyze-target case) gained `scriptsDir: SEEDED_SCRIPTS_DIR` rather than warning assertions: none of them is about that key. `DOCS_SERVER_ENTRY` became `docsServerEntry(scriptsDir)`, since its two users are one seeded and one configless fixture.
