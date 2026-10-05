### 1. The upgrade-report test still forbids every `gh variable set`, but the upgrade now prints the `HARNESS_RUN_ACTORS` one by design

**File:** `cli/test/init.test.mjs`, in `test('init --upgrade-workflows re-pins an older workflow after a .bak, and nothing else does', …)`, subtest `'an upgrade prints its own commit-and-push steps and the in-flight sentence, not the first-setup block'` — "for (const name of ['Add the harness workflows', 'gh secret set', 'gh variable set', 'Do not commit the .bak files'])" (around line 8721, a navigation hint only).

**Failing test:** `cli/test/init.test.mjs` — `an upgrade prints its own commit-and-push steps and the in-flight sentence, not the first-setup block` (subtest of `init --upgrade-workflows re-pins an older workflow after a .bak, and nothing else does`, inside the `init` suite).

**Failure, from the gate 4 `npm test` output (round 1):**

```
  FAIL  4 npm test (exit 1)
                not ok 3 - an upgrade prints its own commit-and-push steps and the in-flight sentence, not the first-setup block
            not ok 117 - init --upgrade-workflows re-pins an older workflow after a .bak, and nothing else does
        not ok 140 - init
        # pass 1514
        # fail 2
        npm error path cli
```

The log carries no assertion message; the cause below was established by reading the test and the code it drives in the current tree.

**Class:** first gate round on this branch (no earlier log) — introduced by this branch.

**Diagnosis.** The subtest runs `init --upgrade-workflows` over an aged fixture and asserts that stdout carries none of the first-setup block's strings: `'Add the harness workflows'`, `'gh secret set'`, `'gh variable set'`, `'Do not commit the .bak files'`. This branch's Task 9 (commit `5a9e4d9`, "Init states what an unset HARNESS_RUN_ACTORS means") deliberately added to `reportWorkflowUpgrade` in `cli/src/commands/init.ts` — after the push command, before `IN_FLIGHT_RUNS_NOTE` — the paragraph "The re-rendered `harness-run.yml` refuses to launch for a person the repository variable `HARNESS_RUN_ACTORS` does not admit, … Set it before the next run:" followed by the indented command `gh variable set ${RUN_ACTORS_VARIABLE} --body <login,...>` (grep: "command(`gh variable set ${RUN_ACTORS_VARIABLE} --body <login,...>`);" inside `reportWorkflowUpgrade`). Task 9's plan requires exactly that line on an upgrade, because an existing adopter's run job starts enforcing the list once re-rendered. So the upgrade report now contains `gh variable set`, and the blanket negative assertion fails. The source is correct; the assertion is stale — its intent was "the first-setup block's variable steps are not printed", and the first-setup-only variable commands are the `HARNESS_RUNNER` one (`gh variable set ${RUNNER_VARIABLE} --body <runner-label>` in `reportGithubSteps`) and the trigger pair (`HARNESS_TRIGGER_LABEL`, `HARNESS_TRIGGER_ALLOWED_BOTS`).

The parent test (`not ok 117`) and the `init` suite (`not ok 140`) fail only because this subtest fails; nothing else in either is reported failing (`# fail 2`).

**Fix** (test-only; do not change `reportWorkflowUpgrade`):

- [ ] In the subtest's forbidden-strings array, replace `'gh variable set'` with `'gh variable set HARNESS_RUNNER '` (trailing space, so it cannot match `HARNESS_RUN_ACTORS`), and add `'gh variable set HARNESS_TRIGGER_LABEL'` and `'gh variable set HARNESS_TRIGGER_ALLOWED_BOTS'` beside it, so the assertion still proves the first-setup block's variable steps are absent.
- [ ] In the same subtest's `present` array, add `'gh variable set HARNESS_RUN_ACTORS --body <login,...>'`, so the upgrade's own allow-list step is pinned where the old blanket check used to forbid it.
- [ ] Leave `'Add the harness workflows'`, `'gh secret set'` and `'Do not commit the .bak files'` in the forbidden list unchanged.

The edited file is `cli/test/init.test.mjs`; under `## The test-run rule` (3) the implementer may run that one file only.
