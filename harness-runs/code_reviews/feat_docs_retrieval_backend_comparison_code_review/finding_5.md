### 5. Step 7's TypeScript leg prescribes the `config set` that stopped the TypeScript server in the recorded session

**File:** `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one` → step **7. One real agent session per backend, through `.mcp.json`**, the sentence "Then the same for the TypeScript backend, with the same question:" and the fenced block after it

**Problem.** The TypeScript leg tells the operator to run `config set docs.retrievalBackend typescript`, then `doctor`, then the session. In the sitting this branch records, that sequence failed. The launcher's TypeScript server is the published runtime that `init` installed machine-wide, not this checkout's build. That runtime predates the key, so it refused `harness.config.json` with *"docs.retrievalBackend: unknown key"*, and `harness-docs` was `failed` at `system/init`. The operator recovered by deleting the key by hand (`docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### One agent session through .mcp.json`; the scratch `agent-session.md`).

The write-up files the version skew as a finding for its own branch, but the procedure still prescribes the failing step with no word about it. Who reaches the wrong answer: the next operator who follows step 7 before a runtime carrying the key is published. They get the same failed TypeScript session, and with nothing in the procedure pointing at the cause, they may record it as the TypeScript server failing to start.

**Fix.** In `docs/retrieval-eval.md`, directly before the sentence "Then the same for the TypeScript backend, with the same question:", add this paragraph. Leave the fenced commands as they are.

> The TypeScript server the launcher starts is the runtime `init` installed machine-wide, not this checkout's build. When that runtime predates the `docs.retrievalBackend` key, it refuses `harness.config.json` with *"docs.retrievalBackend: unknown key"*, and the session's `system/init` shows `harness-docs` as `failed` (`docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### One agent session through .mcp.json`). In that case, skip the `config set … typescript` line below. Delete the `docs.retrievalBackend` key from `<repo>`'s `harness.config.json` by hand instead, because an absent key selects the TypeScript backend. Then run `doctor` and the session as below, and record in `agent-session.md` that the key was deleted rather than set.

Documentation only, so no test runs.
