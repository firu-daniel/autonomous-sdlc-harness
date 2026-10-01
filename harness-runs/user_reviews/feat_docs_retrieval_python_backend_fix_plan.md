# User-Review Fix Plan: feat_docs_retrieval_python_backend

## Context

**Branch:** `feat_docs_retrieval_python_backend`
**Source user review:** `harness-runs/user_reviews/feat_docs_retrieval_python_backend_review.md`
**Summary:** The user flagged 6 observations from a hand-run business-parity review of the Python docs-retrieval service against the TypeScript retrieval implementation — all 6 were verified valid in the current tree: one transport crash on a lone-surrogate snippet (Must Fix), four Should Fix items (multi-line driver messages in tool errors, a missing seam record for lost connections, an unmarked temporary remedy divergence, and `fetch-models` succeeding under the stub), and one Nice to Have (SIGTERM cancelling an in-flight call).

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else (including sub-step bullets inside the per-finding files) are informational only — they are never the iteration source and the committer never touches them.

Each entry resolves to a self-contained `harness-runs/user_reviews/feat_docs_retrieval_python_backend_fix_plan/finding_<K>.md` file via its `**Finding K**` reference (1-to-1 with the `### K. <title>` pointers below). Sorted "lowest blast-radius first" → "wider refactors last".

1. [x] **Finding 3** — Record in the README's `## The seam, as found` that the Postgres store holds one connection with no reconnect, so a dropped connection fails every later call. _(layer: general)_
2. [x] **Finding 4** — Add the entry-point deferred-work marker at the refresh-failure remedy in `service.py` → `answer`, and mark the README's wire difference as temporary. _(layer: general)_
3. [x] **Finding 5** — Make `fetch-models` refuse (exit 1) under the stub, as `docs fetch-models` does; update the README and `tests/test_self_check.py`. _(layer: general)_
4. [x] **Finding 2** — Add `store.py` → `driver_message` and use it in both `answer` failure texts so a driver error reaches the client on one line. _(layer: general)_
5. [x] **Finding 6** — Make SIGTERM stop the MCP transport and drain the in-flight call before closing the store, instead of cancelling it. _(layer: general)_
6. [x] **Finding 1** — Serialize lone surrogates as `\uXXXX` escapes on both Python transports (MCP stdio writer and HTTP responses), with unit and e2e cases. _(layer: general)_

---

## Must Fix

### 1. A snippet ending in a lone surrogate cannot be serialized on either Python transport, where the TypeScript server answers
→ [finding_1.md](feat_docs_retrieval_python_backend_fix_plan/finding_1.md)

---

## Should Fix

### 2. Tool-result failure text carries the whole multi-line driver message where `server.ts` carries only `error.message`
→ [finding_2.md](feat_docs_retrieval_python_backend_fix_plan/finding_2.md)

### 3. The README's seam record omits that a lost database connection fails every later call
→ [finding_3.md](feat_docs_retrieval_python_backend_fix_plan/finding_3.md)

### 4. The refresh-failure remedy diverges from `server.ts` with no deferred-work marker for the selection branch
→ [finding_4.md](feat_docs_retrieval_python_backend_fix_plan/finding_4.md)

### 5. `fetch-models` under the stub exits 0 having provisioned nothing, while every stub run still needs a fetched cache
→ [finding_5.md](feat_docs_retrieval_python_backend_fix_plan/finding_5.md)

---

## Nice to Have

### 6. SIGTERM cancels an in-flight call where `serveDocs` drains the queue before closing the store
→ [finding_6.md](feat_docs_retrieval_python_backend_fix_plan/finding_6.md)

---

## Out of scope / verified-OK

None. Every observation was verified against the current working tree and is valid. One location correction is recorded in `finding_5.md`: the stub `fetch-models` test expectation lives in `docs-retrieval-service/tests/test_self_check.py` → `test_fetch_models_under_the_stub_downloads_nothing`, not in `tests/test_cli.py` as the observation named.

---

## Source observations

Verbatim copy of the source user review (`harness-runs/user_reviews/feat_docs_retrieval_python_backend_review.md`), so this fix plan is self-contained: the implement flow does NOT re-read the user-review file. **This section stays in the index.**

> Findings from a business-parity review of the branch diff against `dev`, run by hand after the branch completed, with the TypeScript retrieval implementation (`cli/src/retrieval/`) as the reference. Each item below is one observation.

1. **A snippet ending in a lone surrogate cannot be serialized on either Python transport, where the TypeScript server answers**

   **Severity:** Must Fix. **Layer:** general.

   **Site.**
   - `docs-retrieval-service/src/harness_docs_retrieval/search.py` → `snippet_of` (`return f"{js_trim_end(cut[:space] if space > 0 else cut)}..."`), which correctly reproduces the lone surrogate.
   - `docs-retrieval-service/src/harness_docs_retrieval/mcp_server.py` → `serve_mcp` (`async with stdio_server() as (read_stream, write_stream):`). The response is serialized by the MCP SDK's stdio writer.
   - `docs-retrieval-service/src/harness_docs_retrieval/http_app.py` → `search` (`return JSONResponse(`).
   - `docs-retrieval-service/tests/test_backend_parity_e2e.py`, module docstring (`Not covered here: a snippet cut that leaves a lone surrogate.`).

   **Reference.** `cli/src/retrieval/search.ts` (`snippetOf`) cuts at 240 UTF-16 units with `text.slice(0, SNIPPET_CHARS)`. When the cut text holds no space after index 0 (`space > 0` is false), it keeps the whole cut, so an astral character straddling units 239–240 leaves a lone high surrogate before the `...`. `cli/src/retrieval/server.ts` (`textResult`) returns that text, and the TypeScript MCP SDK serializes it with `JSON.stringify`, which writes the lone surrogate as the well-formed escape `\ud83d`. The client gets a normal result.

   **The problem.** `search.py` → `snippet_of` reproduces the lone surrogate faithfully (`tests/test_search.py` → `test_snippet_with_no_space_keeps_the_lone_surrogate_of_a_straddling_pair`). Neither Python transport can then emit it:

   - MCP: `types.CallToolResult(...).model_dump_json(by_alias=True, exclude_none=True)` raises `PydanticSerializationError: … UnicodeEncodeError: 'utf-8' codec can't encode character '\ud83d' … surrogates not allowed`. This was reproduced in this checkout's synced environment.
   - HTTP: `json.dumps(..., ensure_ascii=False).encode("utf-8")`, which is what Starlette's `JSONResponse` renders with, raises `UnicodeEncodeError` the same way.

   So for that query the TypeScript backend answers and the Python backend fails to deliver a response. That is a client-visible difference, against the task prompt's deliverable 2: *"A client must not be able to tell which backend answered it."*

   The trigger is rare but realistic. It needs a section body whose first 240 units hold no space and an astral character at units 239–240. Unspaced CJK prose with an emoji or a CJK Extension-B ideograph, or a long URL or token run, can produce it.

   **The exclusion basis is not valid.** The e2e test's docstring leaves this case out because *"a mismatch there would grade the MCP SDKs' encoders rather than the port"*. That is a test-file comment. It is not a prompt exclusion: the task prompt's `## Out of scope` does not mention it. It is not an entry-point deferred-work marker either. And the README's **Deliberate wire differences** list does not record it. The SDK encoder is part of the port's wire, so the omission is unjustified.

   **Fix.** Make both Python transports emit a lone surrogate the way `JSON.stringify` does, as a lowercase `\uXXXX` escape inside otherwise ordinary JSON. The parsed text the client receives then equals the TypeScript server's.

   - [ ] Add one JSON encoder helper to `jscompat.py`, beside `json_stringify_str`. It serializes a JSON-compatible value with every lone surrogate escaped as `\udXXX` (`json.dumps(value, ensure_ascii=False)` cannot do this, but `json.dumps(value, ensure_ascii=True)` escapes every non-ASCII code point, lone surrogates included, and parses back to the identical string). Either form is acceptable, provided the parsed text equals the TypeScript side's.
   - [ ] MCP (`mcp_server.py` → `serve_mcp`): do not rely on the SDK's `model_dump_json` for outgoing messages. Wrap the `write_stream` that `stdio_server()` yields, or supply your own stdio writer, so that each outgoing `SessionMessage` is dumped with `model_dump(mode="json", by_alias=True, exclude_none=True)` and written to stdout through the helper above, one message per line. Keep stdout carrying nothing but the transport.
   - [ ] HTTP (`http_app.py` → `search` and `_error`): return a `Response(content=<helper output>, media_type="application/json")` built from the same dict, instead of `JSONResponse`.
   - [ ] Add a case for it. In `tests/test_backend_parity_e2e.py`, add a corpus section whose body has no space and an astral character at units 239–240, assert both backends answer it with equal parsed text, and delete the docstring's `Not covered here:` paragraph. Running that file is a Phase G / container-gate matter, not this unit's. Also add a non-container unit case to `tests/test_mcp_parity.py` or `tests/test_http_app.py`: a `FakeSession` answer whose text ends in `"\ud83d..."` must reach the client as that same string. Those are the unit's own edited test files.

2. **Tool-result failure text carries the whole multi-line driver message where `server.ts` carries only `error.message`**

   **Severity:** Should Fix. **Layer:** general.

   **Site.** `docs-retrieval-service/src/harness_docs_retrieval/service.py` → `answer`, the two failure returns:
   - `f"{SEARCH_TOOL_NAME}: refreshing the docs index failed: {error}; "`
   - `return _failure(f"{SEARCH_TOOL_NAME}: the search failed: {error}")`

   **Reference.** `cli/src/retrieval/server.ts` (`answer`, with `messageOf`) builds both texts from `error.message`. For a PGlite database error, that is the server's primary message alone, one line. For example: `relation "chunks" does not exist`.

   **The problem.** `answer` interpolates `str(error)`. For a `psycopg.Error`, that is libpq's full message. It can span lines: a `LINE 1: …` pointer with a caret line, `DETAIL:` and `HINT:` lines, or the `\n\tThis probably means the server terminated abnormally` tail of a lost connection. The package already knows this. `errors.py` → `one_line` says *"a driver message can span lines (DETAIL, HINT)"*, and `store.py` → `open_postgres_store` uses it. `answer` does not. A store failure therefore reaches the client as a multi-line tool error. The TypeScript server's equivalent is one line in the shape `<prefix>: <primary message>; <remedy>`, and the remedy clause ends up stranded after the extra lines.

   **Fix.**
   - [ ] Add a function to `store.py`, the module that owns the driver. Call it `driver_message(error: BaseException) -> str`. For a `psycopg.Error` whose `error.diag.message_primary` is non-empty, it returns that, matching PGlite's `error.message`. Otherwise it returns the first non-blank line of `str(error)`, falling back to `type(error).__name__`.
   - [ ] In `service.py` → `answer`, interpolate `driver_message(error)` in both failure texts in place of `{error}`. The prefixes and the remedy clause stay unchanged.
   - [ ] Add a case to `tests/test_service.py` (the unit's own edited test file): a fake store raising an exception whose `str` spans lines yields a one-line failure text. A `psycopg.Error` subclass with a `diag.message_primary` yields exactly that primary message.

3. **The README's seam record omits that a lost database connection fails every later call**

   **Severity:** Should Fix. **Layer:** general.

   **Site.** `docs-retrieval-service/README.md` → `## The seam, as found`, the numbered list. Item 3, **Connection by string, not by directory.**, is the nearest one.

   **Reference.** `cli/src/retrieval/store.ts` (`openPgliteStore`) opens an in-process PGlite. The `DocStore` it returns cannot lose its connection, and `cli/src/retrieval/server.ts` (`serveDocs`) opens it once for the server's lifetime.

   **The problem.** `store.py` → `open_postgres_store` opens one `psycopg.AsyncConnection` for the session's lifetime, and nothing reconnects. If the Postgres restarts or drops the connection while `serve-mcp` or `serve-http` is running, every later `search_docs` call fails with `refreshing the docs index failed: …`, and the stale `RetrievalSession` stays until the process is restarted. This is a place where `DocStore`'s contract did not carry over unchanged: a store that can disconnect, with no recovery. The task prompt's deliverable 10 requires `## The seam, as found` to record *"every place `DocStore`'s statements or contract did not carry over unchanged, each with its reason"*. The section does not mention it.

   **Fix.**
   - [ ] Add a numbered item to `## The seam, as found` in `docs-retrieval-service/README.md`. It records that PGlite is in-process and cannot disconnect, while the Postgres store holds one connection for the server's lifetime with no reconnect. A dropped connection therefore fails every later call until the server process is restarted. Name it as something the selection branch has to settle, either reconnect-on-failure or a supervisor restart.
   - [ ] Do not change `store.py` in this unit. The finding is the missing record. Adding reconnection is a design decision for the selection branch.

4. **The refresh-failure remedy diverges from `server.ts` with no deferred-work marker for the selection branch**

   **Severity:** Should Fix. **Layer:** general.

   **Site.** `docs-retrieval-service/src/harness_docs_retrieval/service.py` → `answer`, the refresh-failure return (`"run harness-docs-retrieval self-check in this repository"`). The divergence is recorded in the module header's `Departures from server.ts and session.ts:` and in `docs-retrieval-service/README.md` → **Deliberate wire differences**.

   **Reference.** `cli/src/retrieval/server.ts` (`answer`): ``refreshing the docs index failed: ${messageOf(error)}; run `npx autonomous-sdlc-harness doctor` in this repository``.

   **The problem.** The tool result an agent reads names a different remedy, and in a different form (no backticks), so a client can tell the backends apart on this path. That contradicts the task prompt's deliverable 2: *"A client must not be able to tell which backend answered it."* The divergence was tested against the obvious-reference-bug exception:

   - **Leg 1 fails as a bug claim.** `server.ts`'s remedy is not a bug. It is the right advice for the TypeScript backend. The divergence rests on context instead: in this branch `doctor` knows nothing of the Python backend, and the task prompt's `## Out of scope` assigns *"doctor checks"* to `feat_docs_retrieval_backend_selection`.
   - **The context is temporary.** The prompt's deliverable 1 builds `self-check` precisely so that *"the second branch only has to call them"* from `doctor`. Once that branch lands, `npx autonomous-sdlc-harness doctor` is the right remedy for both backends, and this divergence becomes a stale, client-visible difference that nothing in the code flags.

   It is documented and has a prompt-grounded reason for now, so it is graded Should Fix rather than Must Fix. But it must not outlive the condition that justifies it.

   **Fix.**
   - [ ] At the refresh-failure return in `service.py` → `answer`, add the entry-point deferred-work marker: `# TODO: @claude add a follow up task for this: once feat_docs_retrieval_backend_selection makes doctor check this backend, restore server.ts's remedy text byte for byte: run \`npx autonomous-sdlc-harness doctor\` in this repository`.
   - [ ] In `docs-retrieval-service/README.md` → **Deliberate wire differences**, add to the first bullet that the difference is temporary and is reverted when `doctor` checks this backend.

5. **`fetch-models` under the stub exits 0 having provisioned nothing, while every stub run still needs a fetched cache**

   **Severity:** Should Fix. **Layer:** general.

   **Site.** `docs-retrieval-service/src/harness_docs_retrieval/cli.py` → `_run_fetch_models`:

   ```python
       # The only call that downloads. Where `docs fetch-models` refuses under the stub, this
       # succeeds: a stub needs no weights, and the cache check is a separate step.
       if stub_models_selected():
           print(f"fetch-models: stub models ({RETRIEVAL_STUB_ENV} set) need no download")
           return 0
   ```

   **Reference.**
   - `cli/src/commands/docs.ts` (`docs fetch-models`, the line opening `if (stubModelsSelected())`) refuses before loading anything: *"docs fetch-models: refusing to download while AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB is set, because a stub run never downloads; unset it to fetch the real models"*. This file is outside the configured `parity.referenceImplPath`, but it is the TypeScript verb this sub-command ports.
   - `cli/src/retrieval/setup.ts` (`stubModelsSelected` note, *"stub models (…) need no download"*) is `init`'s setup-step note, not a fetch command. The Python line copies its wording.
   - `cli/src/retrieval/session.ts` (`openRetrieval`) checks `modelFilesPresent` under the stub too.

   **The problem.** The code comment justifies the divergence with *"a stub needs no weights"*. In this package that is false. `service.py` → `open_session` runs `model_files_present` before `resolve_models`, under the stub too, and the README says so: *"So a stub run still needs a fetched cache."* An operator who runs `fetch-models` with the stub variable still set gets exit 0 and a reassuring line. No manifest is written, and every later sub-command, stub or not, then refuses with a missing-cache error. `docs fetch-models` exists to prevent exactly that outcome, and it refuses for this reason. The divergence fails Leg 1 of the exception: the reference refusal is not a bug. The README notes the behaviour (*"unset it before fetching"*), so this is graded Should Fix rather than Must Fix.

   **Fix.**
   - [ ] In `cli.py` → `_run_fetch_models`, replace the exit-0 branch with a refusal. Raise `ServiceError(f"fetch-models: refusing to download while {RETRIEVAL_STUB_ENV} is set, because a stub run never downloads; unset it to fetch the real models")`, so it prints one line and exits `1`, mirroring `docs.ts`. Delete the comment's *"this succeeds: a stub needs no weights"* justification.
   - [ ] Update `docs-retrieval-service/README.md` → `## Weights, precision and ids` → **Provisioning**: under the stub, `fetch-models` refuses.
   - [ ] Update the matching expectation in `tests/test_cli.py` (the unit's own edited test file).

6. **SIGTERM cancels an in-flight call where `serveDocs` drains the queue before closing the store**

   **Severity:** Nice to Have. **Layer:** general.

   **Site.** `docs-retrieval-service/src/harness_docs_retrieval/mcp_server.py` → `serve_mcp` (`loop.add_signal_handler(signal.SIGTERM, scope.cancel)`).

   **Reference.** `cli/src/retrieval/server.ts` (`serveDocs`). On `SIGTERM`, `shutdown` calls `server.close()`. Then the `finally` block runs `await queue`, which lets the in-flight `answer` (its refresh writes and its search) run to completion, and only then `await session.close()`.

   **The problem.** Here `SIGTERM` cancels the `anyio.CancelScope` that encloses `server.run`. An `answer` in flight is cancelled mid-refresh, which can leave an embed batch rolled back or a batch boundary unfinished, and then `session.close()` runs. The side-effect order differs from the reference (check (g)): TypeScript finishes the write, then closes. The impact is small. `refresh.ts`'s rule is that the index is rebuildable and nothing stored is authoritative, and each upsert batch is its own transaction, so the next refresh repairs it.

   **Fix.**
   - [ ] In `serve_mcp`, have SIGTERM stop the transport rather than cancel in-flight handlers. For example, the signal handler closes the read side so `server.run` ends, and the `finally` block waits on `session.lock` (`async with session.lock: pass`) before `await session.close()`. Then a call that already holds the lock completes before the store is closed, as `await queue` does in `server.ts`.
