### Task 3 — Respell the commands, core paths, daemon unit and detection modules in `cli/src`

**Goal:** Make the CLI entry point, the four command modules, the two path modules, the daemon unit writer and stack detection name `devscene.config.json`, `/devscene:analyze` and the systemd unit `devscene-watcher@<slug>.service`.

**Depends on:** Task 1, which sets `CONFIG_FILENAME`, `DEFAULTS` and `ANALYZE_COMMAND`. Every message in these modules that interpolates one of them already changes. This task respells the literal spellings and the doc comments.

**Where this task stops.** `doctor/checks.ts`, the remaining generators, `remote/githubActions.ts` and `retrieval/` are Task 4's. The `daemon.test.mjs` and `init.test.mjs` suites are Tasks 20 and 19.

**The contract with Task 17.** `scripts/check-command-spelling.sh` exempts one line of `cli/src/commands/init.ts` by the substring `claude -p "/analyze" --permission-mode plan`. The measured-record comment in `init.ts`, the `Headless first-message leg, re-measured:` block, must carry exactly that substring once after this task. It respells `claude -p "/harness-analyze" --permission-mode plan …` to `claude -p "/analyze" --permission-mode plan …`. The other lines of that block respell `devscene:harness-analyze` to `devscene:analyze` and `harness-analyze` to `analyze`.

### Targets

- `cli/src/cli.ts`
- `cli/src/commands/daemon.ts`, `cli/src/commands/doctor.ts`, `cli/src/commands/init.ts`, `cli/src/commands/registry.ts`
- `cli/src/core/paths.ts`, `cli/src/core/repoPaths.ts`
- `cli/src/daemon/units.ts`, `cli/scripts/daemon/systemd.service.template`
- `cli/src/detect/presets.ts`, `cli/src/detect/signals.ts`

**Work:**

- [ ] `daemon/units.ts`: `SYSTEMD_UNIT_PREFIX = 'devscene-watcher@'`. Apply row 8 of `## Context`'s spelling table to every comment, including the `~/.config/systemd/user/devscene-watcher@<slug>.service` path. `cli/scripts/daemon/systemd.service.template`: apply row 8 to its header comment, keeping every `{{…}}` token.
- [ ] `commands/init.ts`: apply rows 1, 2, 3 and 6 to every comment and literal message, with the measured-record block as stated above. Its `INIT_SCRIPTS_DIR` and `DEFAULTS.scriptsDir` reads stay as code. Respell the `--reset-config` scriptsDir comment so it describes one default value rather than an absent-key meaning that differs from `init`'s.
- [ ] `cli.ts`, `commands/daemon.ts`, `commands/doctor.ts`, `commands/registry.ts`, `core/paths.ts`, `core/repoPaths.ts`: apply rows 1 and 6 to every comment and message.
- [ ] `detect/presets.ts`, `detect/signals.ts`: apply rows 1 and 6 to every comment (the many *"is `/devscene:harness-analyze`'s"* lines) and every literal message. `ANALYZE_COMMAND` interpolations stay as they are.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-analyze|harness-watcher@' -- cli/src/cli.ts cli/src/commands/daemon.ts cli/src/commands/doctor.ts cli/src/commands/init.ts cli/src/commands/registry.ts cli/src/core/paths.ts cli/src/core/repoPaths.ts cli/src/daemon cli/scripts cli/src/detect` prints nothing.
- `git grep -nF 'claude -p "/analyze" --permission-mode plan' -- cli/src/commands/init.ts` prints exactly one line.
- `commands.typecheck` passes.
