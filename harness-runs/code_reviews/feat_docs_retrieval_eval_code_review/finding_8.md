### 8. `docs/retrieval-eval.md`'s grade bullet reads "is a the middle grade"

**Site.** `docs/retrieval-eval.md` → `## The query-set format` → the **`grade`** bullet, the clause *"**`2`** is a the middle grade, for a section that is more than related but does not itself answer"*.

**The problem.** A dangling article from an edit, in the one statement of the query-set format — the sentence an author writing a new query set reads to decide what a `2` means. The rest of the bullet is correct and the machine check in `evals/docs-retrieval/queries.mjs` enforces the `1`–`3` range regardless, so nothing is ambiguous about the value; it is the sentence that is broken.

**The fix.** Drop the stray `a`:

> **`2`** is the middle grade, for a section that is more than related but does not itself answer
