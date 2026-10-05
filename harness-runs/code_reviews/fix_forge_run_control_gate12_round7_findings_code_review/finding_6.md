### 6. `check-rendered-workflows.mjs` cites "Task 2", a plan this branch's run artifacts own, in a durable comment

**File:** `scripts/check-rendered-workflows.mjs` (`negativePath`) — "/** The 0.6.1 fixture, repo-relative, exactly as committed by Task 2. */".

**Problem.** `scripts/check-rendered-workflows.mjs` is a hand-written gate script that lasts beyond this branch. Its doc comment ties the fixture's provenance to "Task 2", a unit number from this branch's plan under `harness-runs/task_plans/`. A later maintainer reading the script has no way to tell which branch's Task 2 is meant. The provenance that lasts is already stated in `cli/src/generators/githubWorkflows.ts` → `UNPARSEABLE_CONTROL_RELEASES`: git blob `1b4f0fc33200d876e4089ebe4013120e48a45335`, from `a4ae3c8` through `31a2d55`.

**Fix.** Replace that doc comment with:

```js
/**
 * The 0.6.1 fixture, repo-relative: byte for byte the `harness-control.yml` 0.6.1 shipped (git blob
 * `1b4f0fc33200d876e4089ebe4013120e48a45335`, `cli/src/generators/githubWorkflows.ts` →
 * `UNPARSEABLE_CONTROL_RELEASES`).
 */
```

This is a comment-only edit and runs no test.
