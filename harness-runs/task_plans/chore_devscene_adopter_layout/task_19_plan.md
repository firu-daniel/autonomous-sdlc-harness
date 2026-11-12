### Task 19 — Respell the `init`, scripts-directory, offer and preset suites with the fixture helper

**Goal:** Bring the suites that pin what `init` writes in line with the renamed names: the config file, the `devscene/` state directory, the `devscene-scripts` scripts directory with no absent-key special case, the offer file and opt-out marker, the two markers, `/devscene:analyze`, the `devscene: ` placeholder prefix and the schema's file name.

**Depends on:**
- Task 1: `CONFIG_FILENAME`, `DEFAULTS`, `INIT_SCRIPTS_DIR = DEFAULTS.scriptsDir`, `ANALYZE_COMMAND`, and no absent-`scriptsDir` warning.
- Task 2: `.claude/devscene-task-offer.md`, `<!-- devscene:unfilled -->`, `<!-- devscene:setup-pending -->` / `<!-- /devscene:setup-pending -->`.
- Task 4: `harness_fail "devscene: …"`.
- Tasks 8 and 9: the opt-out check and the `.gitignore` rule `.claude/devscene-no-offer`.
- Task 15: `schemas/devscene.config.schema.json`, which `stack-presets.test.mjs` opens by name.

**Where this task stops.** A case asserts the new value. No case asserts that an old name is absent or is refused, because no code path knows the old names. A case that existed only to pin the removed absent-`scriptsDir` warning, or the claim that an absent key means `scripts`, is rewritten to the single-value contract: an absent key means `devscene-scripts`, the value `init` writes. It is not kept as a guard against something that no longer exists. Each file's header states the rule it enforces (`.claude/context/conventions.md` → `## The testing bar`), so a header naming the split is rewritten in the same edit.

### Targets

- `cli/test/init.test.mjs`, `cli/test/helpers/fixture.mjs`
- `cli/test/scripts-dir.test.mjs`, `cli/test/script-root.test.mjs`, `cli/test/self-adopt-force.test.mjs`, `cli/test/state-dir-bak-note.test.mjs`, `cli/test/state-dir-readme-force.test.mjs`
- `cli/test/task-offer-allow-rule.test.mjs`, `cli/test/task-offer-fence.test.mjs`, `cli/test/trigger-workflow-init.test.mjs`
- `cli/test/wrapper-carry-forward.test.mjs`, `cli/test/wrapper-root-placement.test.mjs`, `cli/test/branch-naming.test.mjs`, `cli/test/stack-presets.test.mjs`

**Work:**

- [ ] `init.test.mjs`: apply rows 1–6, 9 and 13 of `## Context`'s spelling table to every literal and comment. That covers `UNFILLED_MARKER`, `SETUP_PENDING_OPEN` / `_CLOSE`, `ANALYZE_COMMAND`, `ANALYZE_FIRST_REMEDY`, the `.claude/devscene-no-offer` managed-block assertions, the `/harness_fail "devscene: put the deploy command line in deploy\.sh"/` match and every fixture config path.
- [ ] `scripts-dir.test.mjs`: rewrite the header and every case to the single-value contract. A generated config carries `scriptsDir: devscene-scripts`. An absent key resolves to `devscene-scripts` too. `config` reports no warning for an absent key. Remove the cases and header lines about releases before 0.6.6. `helpers/fixture.mjs`: respell its header and the `writeFile(… 'devscene.config.json' …)` helper with `stateDir: 'devscene'`. Its `INIT_SCRIPTS_DIR` re-export stays.
- [ ] `script-root.test.mjs`, `self-adopt-force.test.mjs`, `state-dir-bak-note.test.mjs`, `state-dir-readme-force.test.mjs`, `branch-naming.test.mjs`, `wrapper-root-placement.test.mjs`, `wrapper-carry-forward.test.mjs`: apply rows 1–3 and 13. That includes the fixture `'typecheck.sh': 'harness_fail "devscene: set commands.typecheck in devscene.config.json"'` and every `devscene-scripts` literal.
- [ ] `task-offer-fence.test.mjs`, `task-offer-allow-rule.test.mjs`, `trigger-workflow-init.test.mjs`: apply rows 1, 4 and 5 (`MARKER = join('.claude', 'devscene-no-offer')`, `ALLOWED_SPANS`, the offer path). `trigger-workflow-init.test.mjs`'s recorded 0.6.1 fixture file is a recorded-release fixture and is not edited.
- [ ] `stack-presets.test.mjs`: `corpusFile('schemas', 'devscene.config.schema.json')` and its message, plus rows 1 and 6 in comments and in the `` "`/devscene:analyze`'s to propose" `` keys.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-task-offer|harness-no-offer|harness-analyze|harness:unfilled|harness:setup-pending|harness_fail "harness: |before 0\.6\.6' --` followed by this task's fourteen target paths prints nothing.
- Each target test file passes through `npm test --workspace cli -- test/<name>.test.mjs`, run from the repository root as one plain foreground command per file. `helpers/fixture.mjs` is not a test file of its own.

**Deviations from plan:**
- `self-adopt-force.test.mjs`: its `CONFIG` omitted `scriptsDir` and placed the wrappers at `scripts/` on the old absent-key meaning, so all four cases failed with `ENOENT … scripts/typecheck.sh`. Per `## Context` → *Goal 2* ("moves them, or sets the key explicitly"), `CONFIG` now sets `scriptsDir: 'scripts'`, which is also this repository's own self-adopted value. Not in the plan's rows 1–3 and 13 for that file.
- `init.test.mjs`: beyond rows 1–6, 9 and 13, the absent-key prose and case were rewritten to the single-value contract under *Where this task stops*: the `INIT_SCRIPTS_DIR` / `SEEDED_SCRIPTS_DIR` comments, the `scriptsDir` test's header, `seededScriptsDirFiles`'s absent-key wrapper directory (`INIT_SCRIPTS_DIR`, was `SEEDED_SCRIPTS_DIR`), and the case `--reset-config over a config with no scriptsDir writes devscene-scripts explicitly` (asserted `"scripts"` before). Four regex literals spelling `harness\.config\.json` were respelled too. The plan's verification grep does not match the escaped form, so it would not have caught them. The first test-file run failed 4 subtests on them.
- `scripts-dir.test.mjs`: "`config` reports no warning for an absent key" is asserted as no `! WARN config` line from `doctor` and no `scriptsDir` mention on `init`'s stderr. The two `DEFAULTS.scriptsDir`-not-created assertions were dropped because that directory is now `INIT_SCRIPTS_DIR` itself. An `assert.equal(config.scriptsDir, DEFAULTS.scriptsDir)` pins the single value.
- `task-offer-fence.test.mjs`: case `the opt-out script in every run-copy layout` fails at fixture setup, outside this unit's change: `hr_clone_create_var feat_reg exited 1: … the protected set in '…/main/devscene.config.json' cannot be resolved`. `cli/test/helpers/run-copy-layouts.mjs` still writes `harness.config.json`, which the respelled template run library no longer reads, and that helper is Task 21's target. Evidence: with that helper temporarily respelled (`harness.config.json` → `devscene.config.json`, both occurrences), the file ran 22/22 pass. The temporary edit was then reverted, and `git status` shows the helper unmodified. Task 21 or the Run gates phase verifies it.
