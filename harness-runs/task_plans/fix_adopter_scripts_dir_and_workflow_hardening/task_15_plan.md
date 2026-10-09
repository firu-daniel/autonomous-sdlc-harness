### Task 15 — State the new default in the schema description, `docs/config.md` and `docs/cli.md`

**Goal:** The configuration contract and the CLI reference say what this branch does:
- `init` writes `harness-scripts`;
- an absent key means `scripts`, and `doctor` warns about it;
- `--scripts-dir <dir>` sets the value on a generated config, and is dropped with a warning on a kept one;
- four shapes of it are refused;
- `--reset-config` re-reads the directory.

The schema's `default` stays `"scripts"`. Only its `description` changes, so `npm run validate:config` and the negative fixtures are unaffected.

**Depends on:**
- **Task 1**, for these facts:
  - `INIT_SCRIPTS_DIR = 'harness-scripts'` in `cli/src/config/model.ts`;
  - the `INIT_OPTIONS` row `--scripts-dir <dir>`, `configValue: 'scriptsDir'`;
  - `assertUsableScriptsDir`, which refuses an empty, absolute, `..`-bearing or `.` value before the git gate, because the script-allowlist guard grants nothing there;
  - a `--reset-config` run without the flag re-reads `scriptsDir` from the file being rebuilt, absent read as `scripts`.
- **Task 2**, for `cli/src/config/check.ts`'s warning at path `scriptsDir` when the key is absent, reported by `doctor`'s `config` check, `init`'s kept path and `config`.

**Where this task stops.** These three files only. `docs/remote-execution.md` and `docs/retrieval.md` are Task 16's, and `README.md` and `llms.txt` are Task 18's.

### Targets

- `schemas/harness.config.schema.json` — `properties.scriptsDir.description`.
- `docs/config.md` — `## 5. Key reference`, the `scriptsDir` row.
- `docs/cli.md` — `## 2. \`init\`` and `## 7. \`doctor\``.

**Work:**

- [ ] **`schemas/harness.config.schema.json` → `properties.scriptsDir.description`.** Append, to the existing sentence about stability:

  > `init` writes `harness-scripts` into a configuration it generates; the default below is what an absent key means — `scripts`, where releases before 0.6.6 wrote — kept so a configuration that omits the key never silently moves.

  Leave `"default": "scripts"`, `type` and `minLength` byte-identical. Check `cli/src/config/model.ts` → `HarnessConfig.scriptsDir`'s one-line doc against the new wording (`.claude/context/conventions.md` → *These four are one contract in four places*). If it no longer condenses the description, note that in the return for Task 1's owner rather than editing a `cli` file here.
- [ ] **`docs/config.md` → `## 5. Key reference`, the `scriptsDir` row.** Keep `scripts` in the default column, as the absent-key meaning. Add to the description:
  - a fresh `init` writes `harness-scripts`, and `init --scripts-dir <dir>` writes another value;
  - `doctor`'s `config` check warns while the key is absent;
  - set it to the directory your scripts are in, because changing the value does not move scripts already on disk — a re-run of `init` writes new copies there.
- [ ] **`docs/cli.md` → `## 2. \`init\``, the flag table, the refusals and the rebuild.**
  - **The flag table.** Add, after the `--state-dir <dir>` row: `--scripts-dir <dir>` — "Repo-relative directory the wrapper and outer-loop scripts are written to. Defaults to `harness-scripts` on a generated config. A value is refused — see below." The existing `--default-branch` row's sentence already covers it as a dropped flag on a kept run, because it applies to every flag whose value is written to a `harness.config.json` key.
  - **The refusals list.** Add a bullet beside "`--state-dir` names, or reaches through, a dot-directory": `--scripts-dir` empty, absolute, `.` or carrying `..`, raised before the git gate, because the script-allowlist guard grants nothing there.
  - **The `--reset-config` paragraph.** Where it says the rebuild is re-derived rather than restored, add that `scriptsDir` is re-read from the file being rebuilt, as `appDir` is, unless `--scripts-dir` is given. So a rebuild never strands the scripts on disk.
- [ ] **`docs/cli.md` → `## 7. \`doctor\`.**
  - **The `config` check.** In the bullet describing the `config` check's grading, add that an absent `scriptsDir` is a **warning** — it never moves the exit status — and why: an absent key means `scripts`, while a fresh `init` writes `harness-scripts`, so the repository should state which.
  - **The `daemon-path` example.** In the `daemon-path` bullet, change the illustration `npm (commands.test → scripts/test.sh)` to `harness-scripts/test.sh` (story index → `## Scope register`, row 8).
- [ ] **One command per fenced block.** Any command these edits show an adopter goes in its own fenced block, one command per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`). For example:

  ```
  npx autonomous-sdlc-harness config set scriptsDir scripts
  ```

**Verification:**

- **The schema still validates.** A probe under `harness-runs/scratch/`, run through `bash scripts/scratch-run.sh <probe>`, parses `schemas/harness.config.schema.json` as JSON. It confirms `properties.scriptsDir.default` is still `"scripts"`. The schema gates 3a/3b run at Run gates.
- **The stale prose is gone.** Re-run the story index's derivation **D1**. Its only hits in `docs/config.md` and `schemas/` are the rows rewritten here, and none still states `scripts` as what a fresh `init` writes.
- **The refusal wording matches.** Read the four refused shapes and the warning's remedy in the docs against the actual text of `assertUsableScriptsDir` (`cli/src/commands/init.ts`) and the `check.ts` warning. The wording names the same conditions.
