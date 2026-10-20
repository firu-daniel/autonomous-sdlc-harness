### 1. The relevance subsection asserts that the held-another / fresh-insert pair isolates the dead rows, which no reading measured

**File:** `docs/retrieval-eval-results.md` (`### Whether either mechanism moves relevance` → **The three states.** → the **held-another** bullet) — "so the pair isolates the dead rows"

The **held-another** bullet ends with *"Both its rows and the fresh-insert's are newly inserted, so the pair isolates the dead rows."* That is stated as a fact, but no reading supports it:

- The launcher reads no memtable count. The same subsection says so for **after-spill**, under **Why a reopen stands for the spill**: *"The launcher reads no memtable count, so this run cannot say whether the after-spill index held one."*
- In held-another, `X`'s rows are inserted into a store that held `Y`. The memtable `Y`'s run left behind, after its close and reopen, is unknown. `### The candidate end-state rule, at refresh level` records a reopen that left 5 memtable documents (the TypeScript `fixture-catalog` `file-added` scenario). `### The score each index state ranks by` records size-threshold spills on a `self-docs` fresh insert: 3 segments plus 7 memtable documents at `t0`.
- Leftover memtable rows can move the point at which the size threshold spills `X`'s rows into a segment. So the two states can differ in mechanism 2 as well as in dead rows, and the pair does not isolate mechanism 1.

The recommendation then attributes the held-another figures to the dead rows alone. `### The recommendation for the fix branch` → **Goal 6: …** says *"the dead rows move arm B's recall@3 …"*. A maintainer reading it takes as measured an attribution between the two mechanisms that this branch never measured. The route does not depend on the attribution, which is why this is graded Should Fix.

**Fix:** a wording change in two places in `docs/retrieval-eval-results.md`. No figure changes.

1. In the **held-another** bullet, replace

   ```
   Both its rows and the fresh-insert's are newly inserted, so the pair isolates the dead rows.
   ```

   with

   ```
   Both its rows and the fresh-insert's are newly inserted. The launcher reads no memtable count, so
   whether `X`'s rows sat in the memtable in both states, and so whether this pair isolates the dead rows
   from mechanism 2, was not measured.
   ```

2. In `### The recommendation for the fix branch` → the **Goal 6: ranking quality on `fixture-catalog`, score parity only on `self-docs`.** paragraph, replace

   ```
   the dead rows move arm B's recall@3
   ```

   with

   ```
   the held-another comparison, which adds the dead rows, moves arm B's recall@3
   ```

   Leave the rest of that sentence as it is.

This fix edits no test file and runs no test.
