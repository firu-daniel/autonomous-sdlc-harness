### 6. `score-transcript.mjs` retypes arm A's letter, against the single-source rule three files state

**Site.** `evals/docs-retrieval/arm-a/score-transcript.mjs`, the declaration

```js
/** The arm letter these records carry. `evals/docs-retrieval/arms.mjs` owns the table; this is its one arm with no mode. */
const NAVIGATION_LETTER = 'A';
```

**The problem.** Three files state that the arm letters live in one place and are read rather than retyped:

- `evals/docs-retrieval/arms.mjs`'s header — *"no mode string and no arm letter is retyped anywhere else on this branch"*.
- `evals/docs-retrieval/README.md` → `## Two single sources this directory reads and never copies` — *"no arm letter and no mode string is retyped anywhere else here"*.
- `evals/docs-retrieval/metrics.mjs` and `evals/docs-retrieval/results.mjs`, each of which derives its letters from `ARMS` and says so.

This declaration is a second copy of arm A's letter, and its own doc comment names the module that owns the table in the act of not reading from it. `evals/docs-retrieval/run.mjs` already resolves the letter properly for the rendered row — `navigationArm()` finds the entry whose `mode` is `null` and the pushed result carries `letter: arm.letter` — and `scoreArm` never reads `record.arm`, so nothing observable is wrong today. What is wrong is that the rule the directory advertises is false, which is the same failure mode the arm table's load-time refusal exists to prevent: a reader who trusts the claim will not grep here when the table changes.

**The fix.** Read it off the table, the way every other module does:

- [x] Add `import { ARMS } from '../arms.mjs';` to the import block.
- [x] Replace the constant with the derivation, keeping the by-name refusal the rest of the eval uses:

  ```js
  /** Arm A's letter, read off the one declared table rather than retyped (`evals/docs-retrieval/arms.mjs`). */
  const NAVIGATION_LETTER = (() => {
    const arm = ARMS.find((entry) => entry.mode === null);
    if (arm === undefined) throw new Error('eval: the arm table declares no navigation arm for a transcript to score into');
    return arm.letter;
  })();
  ```

- [x] Leave the `arm: NAVIGATION_LETTER` field on each record as it is: the constant is now derived, and the field is what makes a record readable on its own.
