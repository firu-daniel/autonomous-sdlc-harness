### 2. The `branch-status` digest says `<session>` can carry a `#<n>` suffix, but `.run.slowest_subagent.session` is an integer position

**File:** `plugin/commands/branch-status.md` (`## Steps`, step 4, the **Run analytics** bullet, the `Slowest sub-agent:` line): "`<session>` is printed as stored: a resumed session carries a `#<n>` suffix."

**The problem.** `cli/templates/scripts/lib/run-analytics-report.jq` → `run_of` builds `slowest_subagent` as `{type, description, duration_ms, session: ($i + 1)}`. The file's header states the field the same way: "`session (1-based position in .sessions)`". The value is always an integer. Only a record's `session_id` carries a `#<n>` suffix, and the digest never reads `session_id`. The sentence describes a shape the field never takes. A reader looking at a resumed run's digest would wait for a suffix that never appears, and could take `(session 3)` for a session id rather than the third section of `run-analytics.md`.

**Fix.** In that bullet, replace the sentence

> `<session>` is printed as stored: a resumed session carries a `#<n>` suffix.

with

> `<session>` is the session's 1-based position in the record — the `<k>` of its `## Session <k>` section in `run-analytics.md`.

Change nothing else. This file has no test to run.
