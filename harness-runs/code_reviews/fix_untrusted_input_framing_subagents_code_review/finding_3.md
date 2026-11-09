### 3. The docs loop records a `docs-writer` untrusted-instruction report only inside step 3's FAIL branch, and never for the INDEX dispatch

**File:** `plugin/instructions/docs_orchestration_instructions_autonomous.md` (`## Per-entry loop`, step 3 **Fix loop (cap 3).**) — "A `docs-writer` return — step 1's or this step's — whose `notes:` carries a line opening with `Untrusted instruction not followed — `"

**Problem.** `plugin/instructions/untrusted_input.md` → `## Where a report goes` gives `docs-writer` one report route: "a `notes:` line; the docs orchestrator copies it into `<state_dir>/docs_catalog/needs_review.md`". This branch puts the copy instruction in one place, the last sentence of step 3. Two dispatches miss it:

- **The PASS path.** Step 3 opens "On `FAIL`, …". When step 2's review passes, which is the common case, an orchestrator walking the steps in order goes from step 2 to step 4 and never reaches the sentence. Step 1's report is then dropped, even though the sentence names "step 1's".
- **The INDEX entry.** `## Final entry — INDEX` dispatches `docs-writer` with an `entry` blob telling it to "read the checklist". That is a full read, by path, of task data: the checklist the module's `## The rule` item 1 names. That writer's `notes:` is covered by no copy instruction. The INDEX commit ("then flip its box and commit") also names no `needs_review.md` staging.

In both cases the writer obeys its pointer and reports, and the orchestrator loses the report. That is the silent drop the task prompt's goal 2 exists to prevent.

**Fix.**

1. In step 3, delete the sentence "A `docs-writer` return — step 1's or this step's — whose `notes:` carries a line opening with `Untrusted instruction not followed — ` is appended, with the entry's `<slug>`, to `<state_dir>/docs_catalog/needs_review.md` (append; create if absent)."
2. Append this sentence to the end of step 1 (**Write.**), after "returns `doc_path:` / `unverified:` / `parity_gaps:` / `notes:`.":

   > Whatever step 2 returns, a `docs-writer` return — this step's, step 3's, or `## Final entry — INDEX`'s — whose `notes:` carries a line opening with `Untrusted instruction not followed — ` is appended, with the entry's `<slug>` (`index` for the INDEX), to `<state_dir>/docs_catalog/needs_review.md` (append; create if absent).

3. In `## Final entry — INDEX`, replace "then flip its box and commit (`docs: <project_name> Docs Index`)." with "then flip its box and commit (`docs: <project_name> Docs Index`), staging `<state_dir>/docs_catalog/needs_review.md` too when it changed.".

The report literal must still appear exactly once in this file. `cli/test/untrusted-input-corpus.test.mjs` asserts `report[DOCS_ORCHESTRATION] === 1`, and step 1 moves the sentence rather than copying it. Verify with `npm test --workspace cli -- test/untrusted-input-corpus.test.mjs` only if you also edit that test. This fix does not, so no test run is owed for it.
