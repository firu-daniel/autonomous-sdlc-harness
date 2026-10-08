### 2. `arms.mjs` → `runArm` keeps inline copies of the record logic it extracted for the Python path

**File:** `evals/docs-retrieval/arms.mjs` (`runArm`) — "const records = new Map(" and "if (repetition === 0) {"

**Problem.** Task 4 added two helpers, `emptyRecord(query, arm)` and `recordRepetition(record, result, repetition)`, and `runPythonArm` uses them. The TypeScript `runArm` still builds the same record object inline, and folds each repetition with an inline copy of `recordRepetition`'s body: the same first-repetition assignment and the same non-determinism warning text. So the logic that decides which repetition is scored, and what a repetition-mismatch warning says, now has two bodies. The `runArm` doc comment notes that `evals/docs-retrieval/floor.json`'s numbers come from these records, and the two backends' records are compared field by field by `backend-comparison.mjs`. A later edit to one copy would make the two backends' records differ in ways the comparison would read as a backend difference. `.claude/context/conventions.md` → `### Where a new responsibility goes` → *"Before adding a copy of anything, grep for it."*

The helpers' bodies are field-for-field and statement-for-statement the inline code, in the same key order, so calling them does not change a byte of the TypeScript path's output.

**Fix.** In `runArm`, after the early `return` for a Python session and the two `counting…` wrappers:

- [ ] Replace the inline record construction with:

  ```js
  const records = new Map(queries.map((query) => [query.id, emptyRecord(query, arm)]));
  ```

- [ ] In the repetition loop, keep `performance.now()` bracketing the `searchDocs` call and the `record.durationMs.push(performance.now() - started);` line. Then replace everything from `const refs = refsOf(result);` to the end of the `else if` block with:

  ```js
  recordRepetition(record, result, repetition);
  ```

The return object is unchanged. No test file covers this module, so no test runs. The full gate set runs later, in the Run gates phase.
