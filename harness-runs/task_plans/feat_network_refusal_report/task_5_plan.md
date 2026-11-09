### Task 5 — Show the network report in `branch-status` and name it in `AUTONOMOUS_FLOW.md`'s run-analytics row

**Goal:** For a focused branch, `/autonomous-sdlc-harness:branch-status` lists every refused network call and every possible network attempt the run's `run-analytics.json` records. It reads them from the record it already reads, once, and stays read-only. The flow document's run-analytics row names the new content.

**Depends on:** Task 2, which defines `.run.network` in the record, by these names:
```
network: {sessions_scanned, sessions_not_scanned,
          refusals: [{session, session_id, context, tool, command, host, port, line}],
          gate_logs_scanned,
          gate_log_matches: [{log_id, kind, test_file, count, line}]}
```
- `session` is the 1-based position, the `<k>` of `## Session <k>` in `run-analytics.md`.
- `command`, `host`, `port` and `test_file` may each be `null`.
- A record whose `.run` has no `network` key was rolled up before the report existed.
- Task 2 and Task 3 make the document `schema: 3` when it carries `gate_logs`. Schemas 1 and 2 keep their meaning.

**Where this task stops.** It changes no script, writes nothing, runs nothing new and adds no tunable. It does not change how the record is located or read: the local path and the remote `git show` stay as step 4 states them.

### Targets

- `plugin/commands/branch-status.md`: step 4's **Run analytics** bullet only.
- `plugin/docs/AUTONOMOUS_FLOW.md`: the "Run analytics — …" row only.

**Work:**

- [ ] **`branch-status.md`, the schema sentence.** "whose `schema` is neither `1` nor `2`" becomes "whose `schema` is not `1`, `2` or `3`". Keep the rest of the sentence: one line saying which, never a guess at its figures; an absent file prints nothing; name no tunable, write nothing, run no script.
- [ ] **`branch-status.md`, the network lines.** First restate the bullet's sentence "From the record read, print exactly three lines from its `.run` object" as "From the record read, print these three lines from its `.run` object, then the network lines below", so it no longer claims exactly three. After the three lines, from the same record's `.run.network`, print:
  - `Network refusals: none (<sessions_scanned> sessions scanned)`, or `Network refusals: <count of refusals> (<sessions_scanned> sessions scanned)`. When `sessions_not_scanned` > 0, append `; <sessions_not_scanned> recorded before refusals were scanned`.
  - Then one line per refusal, all of them, in record order: `  - session <session>: <command, or the tool name when command is null> — <host>:<port> — <line>`. Write `<host>` alone when `port` is null, and `host not named` when `host` is null.
  - `Possible network attempts in gate logs (best effort): none in <gate_logs_scanned> round logs`, or `<count of matches> in <gate_logs_scanned> round logs`, or `no round log scanned` when `gate_logs_scanned` is 0.
  - Then one line per match: `  - <log_id>: <test_file, or no test file named> — ×<count> — <line>`, and one closing line: `Best effort: run-analytics.md states what this cannot see.`
  - When `.run` has no `network` key, print the single line `Network refusals: not in this record (written before the report existed)` in place of all of the above.
  - Say that these lines are read, never re-derived from `.sessions` or `.gate_logs`, and that nothing here changes a verdict.
- [ ] **`AUTONOMOUS_FLOW.md`, the run-analytics row.** Add to its first cell, after the round-timings clause: "and the network calls the sandbox refused, from the stream, with possible network attempts in finished gate logs (best effort)". Leave the second cell unchanged.

**Verification:**

- `grep -n "neither \`1\` nor \`2\`" plugin/commands/branch-status.md` prints nothing, and `grep -n "exactly three lines" plugin/commands/branch-status.md` prints nothing.
- `grep -c 'Network refusals:' plugin/commands/branch-status.md` prints a non-zero count, and `grep -c 'sandbox refused' plugin/docs/AUTONOMOUS_FLOW.md` prints a non-zero count.
- **Wire sweep:** `grep -rn 'run-analytics.json' plugin` prints only lines whose reading of the record still holds after this change. The field names quoted in `branch-status.md` are exactly Task 2's (`sessions_scanned`, `sessions_not_scanned`, `refusals`, `gate_logs_scanned`, `gate_log_matches`, and each entry's keys).
- **By reading:** the closing read-only paragraph of `branch-status.md` is unchanged and still true. No new script, file write or polling was added.
