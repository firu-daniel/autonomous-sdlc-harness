### Task 9 — Restore `server.ts`'s refresh-failure remedy in the Python service

**Goal:** Execute the deferred-work marker the first branch left in `docs-retrieval-service/src/harness_docs_retrieval/service.py` → `answer`. It reads: *"`TODO: @claude add a follow up task for this: once feat_docs_retrieval_backend_selection makes doctor check this backend, restore server.ts's remedy text byte for byte: run \`npx autonomous-sdlc-harness doctor\` in this repository`"*. Task 5 makes `doctor` check this backend, so the client-visible divergence that marker justified now ends. After this task, a refresh failure reads the same from both backends.

**Depends on:** Task 5, which adds `retrieval-python-dependencies`, `retrieval-python-model-cache` and `retrieval-python-index` to `doctor`. The remedy now sends a reader to a command that answers for this backend.

**Where this task stops.** Only the remedy suffix of the refresh-failure text changes. The search-failure text, the refusal texts and every other wire byte are untouched. This is not a change to search behaviour, which the task prompt puts out of scope. The service README's **Deliberate wire differences** bullet that describes this difference is **Task 15's** to remove.

**Source:** `cli/src/retrieval/server.ts` → the refresh-failure branch of `answer`, which reads `${SEARCH_TOOL_NAME}: refreshing the docs index failed: ${messageOf(error)}; run \`${CLI} doctor\` in this repository`, where `CLI` renders `npx autonomous-sdlc-harness`. Confirm `CLI`'s value at its owner before typing the literal.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/service.py`
- `docs-retrieval-service/tests/test_service.py`
- `docs-retrieval-service/tests/test_http_app.py`

**Work:**

- [ ] `service.py` → `answer`: replace the remedy `"run harness-docs-retrieval self-check in this repository"` with `"run `npx autonomous-sdlc-harness doctor` in this repository"`, backticks included, so the whole failure text is byte-identical to `server.ts`'s. Delete the `TODO: @claude` comment block above it.
- [ ] `service.py` module docstring: delete the first **Departures from `server.ts` and `session.ts`** bullet, about the remedy naming `harness-docs-retrieval self-check`.
- [ ] `tests/test_service.py` and `tests/test_http_app.py`: update every expected string carrying the old remedy to the new one. Find them with `git grep -n "self-check in this repository" -- docs-retrieval-service`, which must return nothing afterwards.

**Verification:**

- `git grep -n "run harness-docs-retrieval self-check in this repository\|TODO: @claude" -- docs-retrieval-service/src docs-retrieval-service/tests` prints nothing.
- The new text equals `server.ts`'s literal with `CLI` substituted, read side by side.
- No conventions document states a single-file Python test command, so the unit **records the skip** for `tests/test_service.py` and `tests/test_http_app.py` in its return. Phase G's gate 13 (13c) runs them.
