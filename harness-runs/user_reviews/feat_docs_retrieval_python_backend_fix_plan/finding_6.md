### 6. SIGTERM cancels an in-flight call where `serveDocs` drains the queue before closing the store

**Severity:** Nice to Have. **Layer:** general (`docs-retrieval-service/` sits under the catch-all `path: "."`).

**File (site anchor, grep-verified in the current tree):** `docs-retrieval-service/src/harness_docs_retrieval/mcp_server.py` (`serve_mcp`) — "loop.add_signal_handler(signal.SIGTERM, scope.cancel)"

## Problem

`cli/src/retrieval/server.ts` (`serveDocs`): on `SIGTERM`, `shutdown` calls `server.close()`; the `finally` block then runs `await queue`, letting the in-flight `answer` (its refresh writes and its search) complete, and only then `await session.close()`.

Here `SIGTERM` cancels the `anyio.CancelScope` that encloses `server.run`. An `answer` in flight is cancelled mid-refresh — an embed batch can be rolled back or a batch boundary left unfinished — and then `session.close()` runs. The side-effect order differs from the reference: TypeScript finishes the write, then closes. Impact is small: the index is rebuildable, nothing stored is authoritative, and each upsert batch is its own transaction, so the next refresh repairs it.

## Fix

- [ ] In `serve_mcp`, have `SIGTERM` stop the transport instead of cancelling in-flight handlers. The signal handler should end the incoming side so `server.run` returns on its own — e.g. close the read side of the stream pair `server.run` consumes (if finding 1 has already introduced your own stream pair around `stdio_server()`, close the receive side you control), rather than calling `scope.cancel`.
- [ ] Before relying on that, confirm against the installed MCP SDK's `Server.run` that ending the incoming stream lets already-started request handlers finish (task-group exit waits for them) rather than cancelling them. If it cancels them, shield the locked body of the call instead (e.g. run `answer` inside `anyio.CancelScope(shield=True)` in `build_server` → `call_tool`), so a started call always completes.
- [ ] In the `finally` block, wait for any call still holding the lock before closing the store — `async with session.lock: pass` — and only then `await session.close()`. A call that already holds the lock then completes before the store is closed, as `await queue` does in `server.ts`.
- [ ] Keep the existing `NotImplementedError` fallback for event loops that take no signal handlers, and keep `remove_signal_handler` in the `finally`.
