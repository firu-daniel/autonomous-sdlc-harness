### Task 20 — Respell the `config`, `doctor`, `daemon` and profile suites

**Goal:** Bring the suites for `config`, `doctor`, `daemon`, the permission profile, the machine registry and docs retrieval in line with the renamed config file, the defaults, the markers, `/devscene:analyze` and the systemd unit `devscene-watcher@<slug>.service`.

**Depends on:** Tasks 1–4, which produce every value these suites read through the built CLI:
- `CONFIG_FILENAME`, `DEFAULTS` and no absent-`scriptsDir` warning (Task 1).
- The markers and `TASK_OFFER_PATH` (Task 2).
- `SYSTEMD_UNIT_PREFIX = 'devscene-watcher@'` (Task 3).
- `doctor`'s respelled messages (Task 4).

Task 10's guard defaults are what `profile.test.mjs`'s guard-facing cases exercise.

**Where this task stops.** Cases assert new values. None asserts an old name is absent or refused. `config-command.test.mjs`'s case for the removed absent-`scriptsDir` warning is rewritten to assert that `config` reports nothing for an absent key. `profile.test.mjs`'s absent-key constant near its top (*"Stays `scripts` on purpose"*) becomes `devscene-scripts`, and its comment is rewritten to say that value is the one default. `doctor.test.mjs`'s collision case (*"at `scripts`, the absent-key `scriptsDir`"*) moves to `devscene-scripts`, or sets the key explicitly, whichever keeps the collision it tests.

### Targets

- `cli/test/config-command.test.mjs`, `cli/test/config-sandbox.test.mjs`, `cli/test/config-tree-guards.test.mjs`
- `cli/test/doctor.test.mjs`, `cli/test/doctor-branch-protection.test.mjs`, `cli/test/doctor-job-surfaces.test.mjs`, `cli/test/doctor-keep-awake.test.mjs`, `cli/test/doctor-profile-sandbox.test.mjs`, `cli/test/doctor-sandbox-prerequisites.test.mjs`, `cli/test/doctor-tree-guards.test.mjs`
- `cli/test/daemon.test.mjs`, `cli/test/profile.test.mjs`, `cli/test/registry-writer.test.mjs`, `cli/test/docs-retrieval.test.mjs`

**Work:**

- [ ] `doctor.test.mjs`: apply rows 1–6 and 9 of `## Context`'s spelling table. That covers `UNFILLED_MARKER`, `SETUP_PENDING_OPEN` / `_CLOSE`, `ANALYZE_COMMAND = '/devscene:analyze'`, the `test ! -e .claude/devscene-no-offer` substitution, the remedy text `run \`/devscene:analyze\` in a session here …`, every fixture path, and the collision case as above.
- [ ] The six `doctor-*.test.mjs` files: apply rows 1 and 2 to fixture config paths, state-directory paths and comments.
- [ ] `daemon.test.mjs`: apply rows 1, 2, 3 and 8, the expected unit name `devscene-watcher@<slug>.service` and `LIB_IN_REPO` comments included. `registry-writer.test.mjs`, `docs-retrieval.test.mjs`: apply rows 1–3.
- [ ] `config-command.test.mjs`, `config-sandbox.test.mjs`, `config-tree-guards.test.mjs`: apply row 1, and rewrite the absent-`scriptsDir` case as above.
- [ ] `profile.test.mjs`: apply rows 1–3 and the absent-key constant change above.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-task-offer|harness-no-offer|harness-analyze|harness-watcher@|harness:unfilled|harness:setup-pending|before 0\.6\.6' --` followed by this task's fourteen target paths prints nothing.
- Each target test file passes through `npm test --workspace cli -- test/<name>.test.mjs`, from the repository root, one plain foreground command per file.

**Deviations from plan:**
- `config-command.test.mjs` carries no absent-`scriptsDir` case on this branch (`git grep -n -E "'scripts'|scripts/|scriptsDir"` over the three `config-*` suites finds none, and `git log -S "before 0.6.6"` over the suite and `cli/src/commands/config.ts` returns nothing), so there was nothing to rewrite; only row 1 was applied there.
- `profile.test.mjs`: `SCRIPTS_DIR` is now `devscene-scripts`, as planned. The plugin-root read-back case needs a `scriptsDir` of exactly `scripts` for its collision (`bashScriptRuleTarget` in `cli/src/generators/permissionProfile.ts` matches only that basename), so a second constant, `COLLIDING_SCRIPTS_DIR = 'scripts'`, now seeds that case explicitly.
- `doctor.test.mjs`: the collision case sets the key explicitly. It runs `config.scriptsDir = 'scripts'` then a second `init --qa`, following the run-watcher case's pattern. The stale "Kept at `scripts` on purpose" comment above `SCRIPTS_DIR`, whose value is already `INIT_SCRIPTS_DIR`, was cut to its first sentence.
- `docs-retrieval.test.mjs` also held two regex-escaped `harness\.config\.json` assertions, which the plan's verification grep does not match. Both were respelled under row 1 after the first run failed on them.
- Five other `doctor-*` suites only had row 1 applied, because they hold no `sdlc-harness` value. `doctor-job-surfaces.test.mjs` keeps its explicit `scriptsDir: 'scripts'`, which the plan's rows do not touch.
