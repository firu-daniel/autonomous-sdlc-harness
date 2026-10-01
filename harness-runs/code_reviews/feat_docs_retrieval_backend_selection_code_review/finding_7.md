### 7. The new negative fixture differs from the worked configuration in three places, where its directory's README requires one

**File:** `schemas/negative/docs-retrieval-backend-unknown.json`: "\"docs\": { \"root\": \"packages/storefront/docs\", \"retrieval\": true, \"retrievalBackend\": \"java\" }" and "\"phases\": { \"qa\": true, \"docs\": true, \"parity\": false }"

**Problem.** `schemas/negative/README.md` opens: *"Each one isolates a single constraint — it is otherwise a copy of the worked configuration in `examples/harness.config.json`, so the only thing that can make it fail is the constraint it is named for."*

A `diff` against `examples/harness.config.json` shows three changes besides the re-based `$schema`:

- `phases.docs` turned `true`;
- `docs.retrieval: true` added;
- `docs.retrievalBackend: "java"` added.

The sibling enum fixture `execution-target-unknown.json` changes exactly one thing. The schema puts no condition on `retrievalBackend` that depends on the other two keys, and `"java"` fails the enum whatever they hold. So the extra two changes isolate nothing and only make the fixture harder to read against its README.

**Fix.**

- [ ] In `schemas/negative/docs-retrieval-backend-unknown.json`, set `"phases": { "qa": true, "docs": false, "parity": false }` (the worked configuration's value).
- [ ] In the same file, set `"docs": { "root": "packages/storefront/docs", "retrievalBackend": "java" }`.

Nothing else changes. The fixture is still wired into `validate:config:negative`. That `npm` script belongs to the full gate run, which the Run gates phase executes, so this fix runs no test of its own.
