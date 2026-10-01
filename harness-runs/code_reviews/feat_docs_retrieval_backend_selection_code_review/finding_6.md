### 6. `PYTHON_SERVE_SUB_COMMAND`'s doc comment says the launcher `exec`s it; the launcher deliberately runs it as a child

**File:** `cli/src/retrieval/pythonBackend.ts` (`PYTHON_SERVE_SUB_COMMAND`): "/** The sub-command the launcher \`exec\`s to serve MCP over stdio. */"

**Problem.** The launcher's Python branch is the one place in `docs-search-server.sh` that does **not** `exec`. Its header gives the reason under `# WHY THE PYTHON BRANCH IS NOT \`exec\`ED.`: exit `3` could not be reported through an `exec`. The doc comment on the constant that owns the mirrored sub-command name states the opposite. A reader who takes the owner module as the contract would conclude that the exit-`3` path cannot exist.

**Fix.**

- [ ] Replace
  ```ts
  /** The sub-command the launcher `exec`s to serve MCP over stdio. */
  ```
  with
  ```ts
  /** The sub-command the launcher runs as its child to serve MCP over stdio, never `exec`ed. */
  ```

This edits a comment only, so the fix runs no test. The full suite runs later, in the Run gates phase.
