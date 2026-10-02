### Task 7 — Note the Python backend in `init`'s retrieval setup, and assert the key-absent install is unchanged

**Goal:** Settle `init` with the key set. It installs and downloads nothing for the Python backend, because the package, its weights and its Postgres are provisioned by hand. It **still installs the TypeScript runtime and downloads its models** when `python` is selected, so switching back costs nothing (the task prompt's stated default). With `python` it adds one note saying both. With the key absent, its output, its written tree and `.mcp.json` are exactly what they were, which is the install and `init` half of Acceptance 1.

**Depends on:**

- Task 1, which exports `pythonRetrievalApplies(config): boolean` and `retrievalBackend(config): 'typescript' | 'python'` from `cli/src/config/model.ts`. `retrievalApplies` is unchanged, so `init`'s existing gate on it still decides the install, the `.mcp.json` entry, the profile fragment and the ignore line.
- Task 2, which exports `PYTHON_RETRIEVAL_COMMAND = 'harness-docs-retrieval'` from `cli/src/retrieval/pythonBackend.ts`, the one owner of the console script's name.

**Where this task stops.** The note is the only new output. No flag, no prompt and no generator write is added: the key is set with `config set` (Task 11 documents that), and no generator writes it. The note's wording in the docs is Task 14's.

### Targets

- `cli/src/retrieval/setup.ts`
- `cli/src/commands/init.ts`
- `cli/test/init.test.mjs`

**Work:**

- [ ] `setup.ts`: `setUpRetrieval`'s options gain `backend: HarnessRetrievalBackend`, imported as a type from `config/model.ts`. When it is `'python'`, after the existing two steps, which run unchanged, push one note: *"docs.retrievalBackend is python: init installed and downloaded nothing for it — the `${PYTHON_RETRIEVAL_COMMAND}` package, its weights and its Postgres are set up by hand (docs/retrieval.md → Turning on the Python backend); the TypeScript runtime and models above are kept so switching back costs nothing"*. `setup.ts` imports `PYTHON_RETRIEVAL_COMMAND` from `./pythonBackend.js` and interpolates it, never spelling `harness-docs-retrieval`. Under `--dry-run` the same note is pushed. Add a bullet to the header stating the rule: no download for the Python backend, and the TypeScript setup is kept, with that reason.
- [ ] `init.ts`: at the existing `if (retrievalApplies(effective))` call site, pass `backend: retrievalBackend(effective)`. Nothing else in `init.ts` changes.
- [ ] `init.test.mjs`, the key-absent assertions (Acceptance 1). On a `--docs --docs-retrieval` fixture under the stub with a planted runtime and model cache, as the suite's existing retrieval cases set up:
  - the written `harness.config.json`'s `docs` object has exactly the keys it had (`root`, `retrieval`) and no `retrievalBackend`;
  - `.mcp.json`'s `harness-docs` entry deep-equals the suite's existing `DOCS_SERVER_ENTRY`;
  - `init`'s combined output contains neither `retrievalBackend` nor `Python backend`.
- [ ] `init.test.mjs`, the key-set case. Write `docs.retrievalBackend: "python"` into a retrieval-on fixture's config and re-run `init`:
  - the note appears once;
  - the existing "runtime already installed" note still appears, so the TypeScript setup ran;
  - a second run changes nothing it wrote (the suite's idempotence pattern).

**Verification:**

- `npm test -- test/init.test.mjs` from `cli/` passes.
- `bash scripts/typecheck.sh` exits 0.
- `git grep -n "harness-docs-retrieval" -- cli/src` matches only `pythonBackend.ts` and doc comments.
- The note is reached end to end by a real `init` in the key-set case above, not by calling `setUpRetrieval` directly.
