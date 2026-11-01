### 3. The group-3 record in `docs/development.md` repeats the quoted 53.0 s message in a trailing clause

**File:** `docs/development.md` (the paragraph "**The suite on Linux, by hand.**"): ", the sweep taking 53.0 s against the 3 s ceiling."

The hand-reproduction sentence quotes the failure verbatim, *"the sweep took 53.0s against a 3s ceiling — the fetch's transport is still holding the pipe"*. It then appends ", the sweep taking 53.0 s against the 3 s ceiling", which restates the quote word for word. No reader learns anything from the clause, and this is a standing document of record that every later reader loads, so the clause is padding.

**Fix:** delete the trailing clause, so that the sentence ends at the quoted message:

> … `npm test --workspace cli -- --test-name-pattern="terminal is attached" test/outer-loop-scripts.test.mjs` failed with *"the sweep took 53.0s against a 3s ceiling — the fetch's transport is still holding the pipe"*.
