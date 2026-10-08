### 6. `backend-comparison.mjs` keeps a second backend list, `SIDES`, that nothing checks against `BACKENDS`

**File:** `evals/docs-retrieval/backend-comparison.mjs` (`SIDES`) — "const SIDES = Object.freeze(['typescript', 'python']);"

**Problem.** `evals/docs-retrieval/backends.mjs` states its rule in its header: *"the backend set is declared once, here, and every flag check, block key and provenance line reads it"*. The story index says the same: *"The vocabulary is declared once … so no second list exists."* `backend-comparison.mjs` declares its own `SIDES` array with both names retyped, and builds every block key it reads from that array (`readSide` → `corpusBlockId(corpusId, backend)`). Nothing ties `SIDES` to `BACKENDS`. If a backend is renamed in `BACKENDS`, this module goes on asking for `<corpus>@<old name>`. It then fails at run time with a missing-block refusal that never says the vocabulary moved.

The same module already has the right pattern for the arm modes it names: `LEXICAL_MODE` and `RERANK_MODE` are checked against `ARMS` at load, *"so a renamed mode is refused here by name rather than matched by nothing"*. `SIDES` has to stay a two-name list, because `assertPair` and `compareAbstention` compare exactly `typescript` against `python`. So the fix is the same load-time check, not a replacement of the list.

**Fix.** In `evals/docs-retrieval/backend-comparison.mjs`:

- [ ] Change the `./backends.mjs` import to `import { backendFor, corpusBlockId } from './backends.mjs';`.
- [ ] Directly after the `SIDES` declaration, add:

  ```js
  // Each side is a BACKENDS entry, refused by name at load if the vocabulary moves (`backends.mjs` → `backendFor`).
  for (const side of SIDES) backendFor(side);
  ```

- [ ] Extend the doc comment on `SIDES` to say: *"Each is checked against `evals/docs-retrieval/backends.mjs` → `BACKENDS` at load."*

No test file covers this module, so no test runs.
