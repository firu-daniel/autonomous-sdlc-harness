### 6. SIGTERM cancels an in-flight call where `serveDocs` drains the queue before closing the store

**Severity:** Nice to Have. **Layer:** general (`docs-retrieval-service/` sits under the catch-all `path: "."`).

**File (site anchor, grep-verified in the current tree):** `docs-retrieval-service/src/harness_docs_retrieval/mcp_server.py` (`serve_mcp`) — "loop.add_signal_handler(signal.SIGTERM, scope.cancel)"

## Problem

`cli/src/retrieval/server.ts` (`serveDocs`): on `SIGTERM`, `shutdown` calls `server.close()`; the `finally` block then runs `await queue`, letting the in-flight `answer` (its refresh writes and its search) complete, and only then `await session.close()`.

Here `SIGTERM` cancels the `anyio.CancelScope` that encloses `server.run`. An `answer` in flight is cancelled mid-refresh — an embed batch can be rolled back or a batch boundary left unfinished — and then `session.close()` runs. The side-effect order differs from the reference: TypeScript finishes the write, then closes. Impact is small: the index is rebuildable, nothing stored is authoritative, and each upsert batch is its own transaction, so the next refresh repairs it.

## Fix

- [x] In `serve_mcp`, have `SIGTERM` stop the transport instead of cancelling in-flight handlers. The signal handler should end the incoming side so `server.run` returns on its own — e.g. close the read side of the stream pair `server.run` consumes (if finding 1 has already introduced your own stream pair around `stdio_server()`, close the receive side you control), rather than calling `scope.cancel`.
- [x] Before relying on that, confirm against the installed MCP SDK's `Server.run` that ending the incoming stream lets already-started request handlers finish (task-group exit waits for them) rather than cancelling them. If it cancels them, shield the locked body of the call instead (e.g. run `answer` inside `anyio.CancelScope(shield=True)` in `build_server` → `call_tool`), so a started call always completes.
- [x] In the `finally` block, wait for any call still holding the lock before closing the store — `async with session.lock: pass` — and only then `await session.close()`. A call that already holds the lock then completes before the store is closed, as `await queue` does in `server.ts`.
- [x] Keep the existing `NotImplementedError` fallback for event loops that take no signal handlers, and keep `remove_signal_handler` in the `finally`.

**Deviations from plan:**
- SDK check (mcp 2.2.0, `mcp/shared/jsonrpc_dispatcher.py` → `JSONRPCDispatcher.run`, the `finally` holding `tg.cancel_scope.cancel()` under the comment "Cancel in-flight handlers"): ending the incoming stream **cancels** started handlers. So both halves landed: `call_tool` runs `answer` under `anyio.CancelScope(shield=True)`, and `SIGTERM` ends the transport.
- Finding 1 has not landed, so no stream pair existed. `serve_mcp` now owns one: `_relay` forwards `stdio_server`'s read stream into a memory stream `server.run` consumes, and `SIGTERM` closes that stream's send side. Closing the *send* side rather than the receive side is what wakes a waiting receiver with end-of-stream in anyio. After `server.run` returns on a `SIGTERM`, the transport scope is still cancelled, because `stdio_server`'s stdin reader is blocked on a line that may never come. On the stdin-EOF path nothing is cancelled, same as before.
- `session.close()` sits in an inner `finally` around the lock wait, so the store is still closed if that wait is cancelled.
- New test file `docs-retrieval-service/tests/test_mcp_shutdown.py`: sends a real `SIGTERM` while a call's refresh is blocked, then asserts the refresh and `answer` finish before the store closes. I checked the test against a mutation with `shield=False` and it fails (events `['refresh started', 'store closed', 'released']`). I reverted the mutation before verifying. Single-file command: `bash scripts/python-service.sh test tests/test_mcp_shutdown.py` (`docs-retrieval-service/README.md` → `## Testing`). `.claude/context/conventions.md` states no Python single-file command.
