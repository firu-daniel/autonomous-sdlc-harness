### Task 10 — Restate `plan-round-commit.test.mjs` case (b) for a pause before the fan-out and a partial set

**Goal:** Replace the one pause scenario this suite describes that can no longer happen — a pause *between two reviewers* — with the two partial commits a parallel round still produces: a PAUSE honoured before the set goes out, and an overload self-pause after some of the set's dispatches returned and others died.

**Where this task stops.** The wrapper and the path sets are unchanged; this suite still proves only what a given call stages, and its header's *"Deliberately not covered: whether the orchestrator calls the wrapper at all, and when"* stands. When a fork takes each commit is **Tasks 13, 16 and 17**'s prose.

### Targets

- `cli/test/plan-round-commit.test.mjs` → case `(b)`.

**Work:**

- [ ] Retitle case `(b)` to `(b) a pause commit before the fan-out, then an overload self-pause with two of the set's files in, each takes only what changed`. Keep its first commit (`chore: Plan round 0 for <branch>`) and its pause-before-the-set commit (the writer's revision and its note, `chore: Plan round 1 partial for <branch>`), restating that step's comment to *"The writer returned; the set has not gone out"*.
- [ ] Replace its last step — one reviewer's file, *"the next has not run"* — with two of round 1's three gate files written (`architecture_reviews/<branch>/review_1.md` and `task_plan_reviews/<branch>/review_1.md`), commented *"Two dispatches of the set returned; the third died"*, landing once as `chore: Plan round 1 partial for <branch>` with exactly those two files in `HEAD`, and the unrelated `README.md` left alone as before.

**Verification:**

- `npm test --workspace cli -- test/plan-round-commit.test.mjs` passes, from the repository root, as one plain foreground command — the task's own test file.
- `grep -n "between two reviewers\|the next has not run" cli/test/plan-round-commit.test.mjs` finds nothing.
