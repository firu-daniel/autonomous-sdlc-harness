### Task 2 — Accept schema 3 in `run-analytics-report.jq`, roll up `.run.network` and render the two network sections

**Goal:** `cli/templates/scripts/lib/run-analytics-report.jq` accepts a schema-3 document. Its `rollup` adds `.run.network`, the report `branch-status` reads, and its `markdown` always renders `## Network refusals` and `## Possible network attempts in gate logs (best effort)`. A run with no refusal says so, and a session recorded before the report existed is counted as *not scanned*, never as clean.

**Depends on:** Task 1, which defines the two shapes this task reads, by these names:
- A session record's `network_refusals: [{context, tool, command, started_at, host, port, line}]`. `host` is a string or `null`, `port` a number or `null`, `command` `null` for a tool that is not `Bash`. A record **without** the key predates the report.
- A gate-log entry `{log_id, matches: [{kind, test_file, line, count}]}`. `kind` is `proxy` or `connect`, `test_file` a string or `null`, `count` a positive integer. `log_id` is the round's label, or `<label>#<N>` for a changed re-run.

Task 3 decides the document's schema. Its rule, which this task checks:
- **schema 1:** neither `rounds` nor `gate_logs`.
- **schema 2:** a `rounds` array, no `gate_logs`.
- **schema 3:** a `gate_logs` array and a `rounds` array, which may be empty.

**Where this task stops.** It reads no file and builds no document: the merge and the schema choice are **Task 3's**. `branch-status`'s reading of `.run.network` is **Task 5's**. The self-adopted copy `scripts/lib/run-analytics-report.jq` is **Task 6's**. It changes no existing `.run` key and no existing section's bytes.

### Targets

- `cli/templates/scripts/lib/run-analytics-report.jq`
- `cli/test/run-analytics-report-rounds.test.mjs`: two existing assertions updated (Work bullet 4).
- `cli/test/run-analytics-report-network.test.mjs` (new): runs `rollup` and `markdown` directly with `jq` over documents it builds, in the way `cli/test/run-analytics-report-rounds.test.mjs` does. It is not a tree guard.

**Work:**

- [ ] **`check_doc` and the header's `Document:` paragraph.**
  - Accept `schema` 1, 2 or 3. Any other value is the error `run-analytics-report.jq: document schema <n> is not supported; expected 1, 2 or 3`.
  - Keep the schema-1 `rounds` refusal and the schema-2 non-array refusal.
  - Add `a schema <n> document carries .gate_logs; only schema 3 may` for schema 1 or 2.
  - Add `schema 3 document's .rounds is not an array` and `schema 3 document's .gate_logs is not an array`.
  - Restate the three schemas in the header exactly as **Depends on** gives them.
  - Restate the header's opening `Owns:` sentence so the roll-up's inputs include `.gate_logs`: "recomputing a run-analytics document's `.run` from its `.sessions` and its `.gate_logs`", the rest of the paragraph unchanged.
  - `rollup` leaves `.rounds` and `.gate_logs` untouched.
- [ ] **`.run.network`, built by a new `network_of` over the whole document — not in `run_of`.** `run_of` is called over the sessions array (`.run = (.sessions | run_of)`, and `whole_run` calls it on `$ss`), so `.gate_logs` is not reachable inside it. Add `def network_of:` (input: the whole document; comment `# Input: the document. Output: the .run.network object the header lists.`), and change the `rollup` branch to `.run = ((.sessions | run_of) + {network: network_of})`, where `network_of` is evaluated against the document (bind it first, e.g. `network_of as $n | .run = ((.sessions | run_of) + {network: $n})`). `run_of`'s own keys, body and its `# Input: .sessions` comment stay unchanged, so `whole_run`'s table is byte-identical. Add `network` to the header's `Mode rollup` key list and to its sentence naming what `branch-status` reads (`network`, a fixed name):
  ```
  network: {sessions_scanned, sessions_not_scanned,
            refusals: [{session, session_id, context, tool, command, host, port, line}],
            gate_logs_scanned,
            gate_log_matches: [{log_id, kind, test_file, count, line}]}
  ```
  - `sessions_scanned` counts the sessions whose `network_refusals` is an array, and `sessions_not_scanned` counts the rest.
  - `refusals` flattens every scanned session's entries in session order, then entry order. `session` is the session's 1-based position in `.sessions`, as `slowest_subagent.session` is, and `session_id` is the record's.
  - `gate_logs_scanned` is `(.gate_logs // []) | length`, evaluated on the document inside `network_of`.
  - `gate_log_matches` flattens every entry's matches in document order.
  - Nothing is cut or sorted.
- [ ] **The two sections in `markdown`.** Both always render, in this order, after `## Whole run` and before `## Gate rounds`. They are computed from the document, never read from `.run`, and every cell goes through `cell`.
  - **`## Network refusals`.**
    - A first line: `<sessions_scanned> of <sessions> sessions scanned.` When `sessions_not_scanned` > 0, follow it with ` <sessions_not_scanned> recorded before refusals were scanned.`
    - Then either `No refused network call.`, or a table `| Session | Context | Tool | Command | Host | Port | Refusal line |`, one row per refusal. `Command` is `—` when null, and `Host` and `Port` are `—` when null.
    - With no session scanned at all, `No session was scanned for refusals.` replaces both.
  - **`## Possible network attempts in gate logs (best effort)`.**
    - A fixed paragraph first: these are lines in finished Run gates logs that carry a proxy refusal string or a plain connect error (`ECONNREFUSED`, `ENETUNREACH`, `EHOSTUNREACH`, `EAI_AGAIN`), listed as possible attempts, not refusals.
    - Then the blind spots, as a bullet list, each its own bullet:
      - a test that catches the error and passes leaves no trace;
      - a plain connect error cannot be told apart from a host that is unreachable for another reason;
      - on macOS, Seatbelt's own violation records go to the system log, not to the test output;
      - a test whose name or output quotes one of these strings is listed too.
    - Then `No Run gates round log was scanned.` when `gate_logs` is absent or empty. Otherwise `No possible network attempt in <gate_logs_scanned> round logs.`, or a table `| Log | Kind | Test file | Count | Line |` (`Test file` `—` when null).
  - Lines render whole: the JSON keeps them whole, and this display adds no cut either.
  - Update the header's `Mode markdown` paragraph with both sections, their order and their *none* lines.
- [ ] **`cli/test/run-analytics-report-rounds.test.mjs`, the two assertions this change makes false.** Change nothing else in the file.
  - The schema-1 head-headings case now expects `['# Run analytics — feat_x', '## Whole run', '## Network refusals', '## Possible network attempts in gate logs (best effort)']`. Rename the test so its title no longer says *only the whole-run table*.
  - The refusal case's `schema: 3` input becomes `schema: 4`, matched against `/schema 4 is not supported; expected 1, 2 or 3/`. Rename that case's title, `schema 3, a schema-1 document carrying rounds and a schema-2 one without an array are refused`, so it opens `schema 4` instead of `schema 3`, as Task 3 renames its parallel title in `cli/test/run-analytics-rounds.test.mjs`.
  - The `schema-2 … renders as its schema-1 twin` case is unchanged and must still hold.
- [ ] **`cli/test/run-analytics-report-network.test.mjs`.**
  - **Header.** Opens with its rule: *every refusal recorded in a scanned session is rendered and rolled up, an unscanned session is never reported clean, and the gate-log section always states its blind spots*.
  - **Fixtures.** Build every session with `network_refusals` except where a case removes it, which satisfies the stand-in rule in `harness-runs/lessons.md` → *Evidence and measurement*.
  - **Cases:**
    1. Two sessions, one with two refusals (one with `host`/`port`, one with both `null` and `command` `null`). `.run.network.refusals` has both, with `session` 2. The table renders both rows, with `—` in the null cells. `sessions_scanned` is 2.
    2. No refusal: `No refused network call.` and `2 of 2 sessions scanned.`
    3. One session without the key: `1 of 2 sessions scanned. 1 recorded before refusals were scanned.` and `sessions_not_scanned` 1. With every session without it: `No session was scanned for refusals.`
    4. Schema 3 with two gate-log entries, one with a `connect` match (count 3, `test_file` set) and one with `matches: []`: `gate_logs_scanned` 2, one table row, and the blind-spot bullets present. Schema 1: `No Run gates round log was scanned.`
    5. A refusal `line` longer than 300 characters renders whole in the Markdown and is whole in `.run`.
    6. A cell carrying `|` and a newline renders escaped on one line.
    7. Two renders of one document are byte-identical.
    8. Each new refusal of `check_doc`: schema 1 or 2 carrying `gate_logs`; schema 3 without either array.

**Verification:**

- `cli/test/run-analytics-report-network.test.mjs` and the edited `cli/test/run-analytics-report-rounds.test.mjs` pass.
- **Sections in order:** for a schema-3 document with rounds, `## Whole run` < `## Network refusals` < `## Possible network attempts in gate logs (best effort)` < `## Gate rounds` < `## Session 1` in the rendered text (case 4 asserts it).
- **No other existing assertion breaks (this check is made by reading the named suites):** `grep -rn "expected 1 or 2" cli/test` prints nothing once the edit lands. `cli/test/run-analytics.test.mjs`'s section-order check only requires `## Whole run` < `## Session 1` < `## Session 2`, which still holds.
- `grep -nE 'test\(|match\(|capture\(|sub\(|splits\(' cli/templates/scripts/lib/run-analytics-report.jq` prints nothing (the jq 1.5 floor).
