### Task 25 — Respell the outer-loop-scripts, walker, prompt-injection, analytics and test-suite suites

**Goal:** Bring the suites for the shipped script table, the flow walker, the prompt-injection screen, run analytics and the gate-lane runner in line with `devscene.config.json`, the `devscene/` state directory and `devscene-scripts`.

**Depends on:**
- Tasks 5 and 8: the run library, the walker, the screen, analytics and `run-test-suite.sh` read `devscene.config.json`.
- Task 12: `plugin/agents/prompt-injection-reviewer.md`, which `prompt-injection-verdict.test.mjs` reads from this checkout, carries its respelled `<state_dir>` and `<scripts_dir>` rows.

**Where this task stops.** `outer-loop-scripts.test.mjs` compares the copies `init` writes byte for byte with the templates, which is its stated contract. It needs only its own literals respelled: the fixture config, state directory and scripts directory. `cli/test/helpers/walker.mjs` reads the config by the constant `CONFIG_PATH`, which becomes `'devscene.config.json'`.

### Targets

- `cli/test/outer-loop-scripts.test.mjs`
- `cli/test/flow-walker.test.mjs`, `cli/test/flow-walker-resume.test.mjs`, `cli/test/flow-walker-ui-and-reentry.test.mjs`, `cli/test/helpers/walker.mjs`
- `cli/test/prompt-injection-park.test.mjs`, `cli/test/prompt-injection-plan.test.mjs`, `cli/test/prompt-injection-verdict.test.mjs`
- `cli/test/run-analytics.test.mjs`, `cli/test/run-analytics-network.test.mjs`, `cli/test/run-analytics-rounds.test.mjs`, `cli/test/run-analytics-tokens.test.mjs`
- `cli/test/run-test-suite.test.mjs`, `cli/test/run-gates-lane-lib.test.mjs`

**Work:**

- [ ] `outer-loop-scripts.test.mjs`: apply rows 1–3 of `## Context`'s spelling table to every literal and comment.
- [ ] `helpers/walker.mjs`: `CONFIG_PATH = 'devscene.config.json'`, with rows 2 and 3 in comments. The three `flow-walker*` suites: rows 1–3. `flow-walker-ui-and-reentry.test.mjs`'s stale-library case keeps matching `harness-run-lib\.sh predates this walker`, because the library's file name is kept.
- [ ] The three `prompt-injection-*` suites: rows 1–3.
- [ ] The four `run-analytics*` suites: rows 1–3.
- [ ] `run-test-suite.test.mjs`, `run-gates-lane-lib.test.mjs`: rows 1–3.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts' --` followed by this task's fourteen target paths prints nothing.
- Each target test file passes through `npm test --workspace cli -- test/<name>.test.mjs`, from the repository root, one plain foreground command per file. `helpers/walker.mjs` is exercised by the walker suites.

**Deviations from plan:**
- The Work list names rows 1–3 only. Two targets also pinned the old absent-`scriptsDir` fallback `scripts`, which `DEFAULTS.scriptsDir` (`cli/src/config/model.ts`) now gives as `devscene-scripts`. With rows 1–3 alone, `outer-loop-scripts.test.mjs` failed 5 cases: they sourced `scripts/lib/harness-run-lib.sh`, which `init` no longer writes. Following spelling-table row 14, I changed `outer-loop-scripts.test.mjs` → `SEEDED_SCRIPTS_DIR` and `run-test-suite.test.mjs` → `WRAPPER` from `scripts` to `devscene-scripts`, and updated the doc comment above each. Both suites pass after this change.
- Not changed, because they are synthetic transcript command strings and not paths `init` writes: `run-analytics.test.mjs` (`<repo_root>/scripts/x.sh`, `<main_repo>/scripts/y.sh`) and `run-analytics-rounds.test.mjs` → `WAIT` (`bash scripts/run-test-suite.sh --wait …`). Both suites pass with these strings unchanged.
- The first `outer-loop-scripts.test.mjs` run was piped through `grep`, which breaks the test-run rule's point 6. It was rerun as one plain foreground command, and that rerun is the result recorded.
