### 3. The `REMOTE_EXECUTION_CHECK` doc comment has one run-on line far past the file's wrap width

**File:** `cli/src/doctor/checks.ts` (the doc comment above `REMOTE_EXECUTION_CHECK`) — "both prefixed by that module's {@link pinnedCliCommand} so the two cannot name different packages"

The architecture-review fix (Finding 2 of that review) inserted this clause into an existing wrapped line, and the line was never re-wrapped. It now runs to about 210 characters and carries three sentences' worth of text. Every other line of the comment wraps at roughly 100 columns. The content is correct. Only the layout is off, and it makes the four-`warn` enumeration hard to read.

**Fix:** re-wrap the lines from " * dispatches through it. Four `warn`s:" through " * with no pin, or unreadable, is a note." so that no line exceeds the width of its neighbours. Keep the wording byte-for-byte except for the line breaks. For example:

```ts
 * dispatches through it. Four `warn`s: a `harness-run.yml` pinned (`remote/githubActions.ts` →
 * {@link renderedCliVersions}) to a version other than this CLI's — never a `fail`, because the job
 * installs its pin and the adopter may stay on it deliberately; the remedy is
 * `generators/githubWorkflows.ts` → {@link upgradeWorkflowsCommand}, the alternative `doctor` at the
 * pin, both prefixed by that module's {@link pinnedCliCommand} so the two cannot name different
 * packages, and under `--remote-job` the job runs `doctor` at its own pin, so this cannot arise
 * there. A file with no pin, or unreadable, is a note. No `harness-resume.yml`, because a
 * usage-paused hosted run then
```

Comment-only change: no test is owed.
