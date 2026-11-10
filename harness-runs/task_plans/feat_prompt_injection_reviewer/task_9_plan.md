### Task 9 — Hold the script's check ids equal to the agent's

**Goal:** Add the one test that keeps the agent's check ids and the script's parser set from drifting apart.

**Depends on:** Task 8, which adds `plugin/agents/prompt-injection-reviewer.md`. Its `## The checks` table's first column holds the 14 ids, each backticked, in this order: `destructive-intent`, `attack`, `authority-claim`, `unrelated-request`, `foreign-execution`, `web-download`, `secret-access`, `harness-weakening`, `run-mode-abuse`, `backdoor`, `supply-chain`, `outside-checkout`, `hidden-instruction`, `pressure`.

**Depends on:** Task 4, which ships `PI_CHECK_IDS="…"` as one line of `cli/templates/scripts/prompt-injection-screen.sh`, carrying the same 14 ids in the same order, and creates `cli/test/prompt-injection-verdict.test.mjs`.

This task is in the `cli` layer and comes after Task 8 because the mirror case reads the agent's table, which Task 8 creates.

### Targets

- `cli/test/prompt-injection-verdict.test.mjs`

**Work:**

- [ ] **`prompt-injection-verdict.test.mjs` — the mirror case.** Add one case:
  - **The agent's set:** read `plugin/agents/prompt-injection-reviewer.md` from `WORKSPACE_ROOT` and take the backticked id in the first cell of every row of the table under `## The checks`.
  - **The script's set:** read `PI_CHECK_IDS` from `cli/templates/scripts/prompt-injection-screen.sh`.
  - **The assertion:** the two ordered lists are equal.
  - Extend the file's header with the second rule it now enforces: the parser's closed set is the agent's table, in order.

**Verification:**

- `npm test --workspace cli -- test/prompt-injection-verdict.test.mjs` passes. This task edits that file.
- Run the mirror case once with one id renamed in `PI_CHECK_IDS` in `cli/templates/scripts/prompt-injection-screen.sh`, in the working tree only, then restore that line. It fails, naming the id. The mutation stays inside this task's own `cli` layer and touches no `plugin/` file. Record that red-once run in the header, in the `RED ONCE (<what was mutated>) — <date>, <what failed>` form, and confirm `git diff --stat` shows only `cli/test/prompt-injection-verdict.test.mjs` afterwards.
