### Task 1 — Recognise network refusals in `run-analytics.jq`: each session's `network_refusals`, and mode `gate_logs`

**Goal:** Teach `cli/templates/scripts/lib/run-analytics.jq` to recognise a refused network call. Mode `sessions` gives each new session record a `network_refusals` array, and a new mode `gate_logs` turns finished Run gates logs into lists of possible network attempts, deciding which logs are new. Both read only strings a recorded run measured, except the four connect-error names, which are labelled unmeasured.

**Where this task stops.**
- It adds no Markdown and no roll-up: `.run.network` and both rendered sections are **Task 2's** (`lib/run-analytics-report.jq`).
- It finds no file, calls nothing and merges nothing: handing each finished round's log to mode `gate_logs`, the `--slurpfile` of the recorded entries, the merge and the schema are **Task 3's** (`run-analytics.sh`).
- The self-adopted copy `scripts/lib/run-analytics.jq` and the mirror note in `scripts/lib/sandbox-probe/judge.sh`'s header are **Task 6's**.

### Targets

- `cli/templates/scripts/lib/run-analytics.jq`: the string table, the session record's new key, mode `gate_logs` and the header.
- `cli/test/fixtures/run-analytics-network.jsonl` (new): one stream, one session per refusal shape.
- `cli/test/run-analytics-network-parse.test.mjs` (new): runs both modes directly with `jq`, in the way `cli/test/run-analytics-rounds-parse.test.mjs` does. It reads two fixed files besides its fixture (`judge.sh` and this program), so it is not a tree guard.

**Work:**

- [ ] **The string table and its helpers** (jq 1.5: no regex, every `if` with an `else`, no jq keyword as a name).
  - `def n5_refusal_string: "allowed_domains cannot widen network access";` — the value `judge.sh` → `SP_N5_CANNOT_WIDEN` holds.
  - `def network_refusal_strings:` — exactly `"<sandbox_violations>"`, `"CONNECT tunnel failed"`, `"host is not on the allow list"`, `"This proxy requires authentication"` (the strings of `judge.sh` → `sp__layer`'s `network` arm, in its order) followed by `n5_refusal_string`.
  - `def gate_proxy_strings: network_refusal_strings - [n5_refusal_string];` and `def connect_error_strings: ["ECONNREFUSED", "ENETUNREACH", "EHOSTUNREACH", "EAI_AGAIN"];`.
  - `def redact_text:` — `redact_path`, then the two `strip_home` steps, **with no cut**. Redefine `redact` as `redact_text | .[0:160]` so its output is byte-for-byte unchanged.
  - `def redact_file:` — for a gate-log `test_file`: `redact_path`, then a home step **anchored at the start of the string only**: when the value begins with `/Users/` or `/home/`, that prefix and the segment after it (`seg_len`) become `~`; any other value is left as `redact_path` gives it. Add it as a helper `def strip_home_lead($pre):` beside `strip_home`, using `startswith`, `length` and `seg_len` (no regex). Why not `redact_text`: the header above `def redact_path` states that the unanchored `strip_home` would turn the relative `src/home/a.test.ts` and `src/home/b.test.ts` both into `src~`, and mode `gate_logs` merges identical `{kind, test_file, line}`, so two files would be recorded as one. Why not `redact_path` alone, as mode `rounds` does: mode `rounds` relies on validation refusing a file starting with `/`, while a gate log can name an absolute test file (`file:///Users/…`) that the redaction pairs may not cover. A relative path never begins with `/`, so the anchored step never collapses one.
  - `def host_port:` over one line, returning `{host, port}`: after `deny network-outbound `, the text up to the next space; or after `sandbox proxy: `, the text up to the next `: 403`. Split that text at its **last** `:`; `host` is the part before it, `port` the part after it as a number when it is all digits, else `null`. Any other line gives `{host: null, port: null}`. `Received disconnect from UNKNOWN port 65535` (P1) is not parsed: it names no target.
- [ ] **Mode `sessions`: `network_refusals` on every new session record.**
  - `add_call` keeps the Bash call's raw `input.command` in the call's state under a **new** field `raw_command` (a field `finalize` never projects into `tools.items`). The existing `command` field — the command through `redact`, cut to 160 characters — and the `polling` rows `finalize` groups on it (`select(.tool == "Bash" and .command != null)`, `group_by([.context, .command])`) stay unchanged, so no existing output changes.
  - `on_user`, per `tool_result` whose call is in `.calls`: take its text (string content, or the `text` parts of an array joined with `\n`) and split it into lines. The result **counts** when either (a) `is_error` is `true` and some line carries a `network_refusal_strings` member, or (b) some line, as given, begins with `<sandbox_violations>`. A non-error result that only quotes a string mid-line (a `Read` or a `grep` of a document) does not count.
  - A counting result appends one entry to a new state array (initialised in `new_session`): `{context, tool, command, started_at, host, port, line}`. `context` and `started_at` are the call's. `command` is the call's `raw_command` through `redact_text`, or `null` for a tool that is not `Bash`. `line` is the first line carrying a table string, through `redact_text`. `host` and `port` are `host_port` of the first line that names them, else `null`.
  - `finalize` emits that array as `network_refusals` (`[]` when nothing counted), so "none" and "not scanned" stay distinct: a record from before this branch has no key.
  - Not a refusal here: a permission-layer refusal (`Permission to use … has been denied`), a `permission_denials` listing, N4's `curl: (7) Failed to connect …` and N3's returned body.
- [ ] **Mode `gate_logs`**, the only mode that reads a log. Its call, which Task 3 makes:
  `jq -n -R -c -S -f run-analytics.jq --arg mode gate_logs --argjson idle_threshold_s 1 --slurpfile known <file holding the document's .gate_logs array, or []> --argjson redact '<pairs>' --argjson suspend '[]' --arg suspend_source none < <concatenated logs>`
  - **Input.** A line that `fromjson?` parses to an object with a string `run_analytics_gate_log` (the round's label) starts that log. The lines up to the next marker are its lines, less exactly one empty line at its end, because the caller appends a newline after each file. Lines before the first marker are ignored. `$known` must be exactly one array, as in mode `rounds`, else the mode stops with an error.
  - **Attribution.** A line, after leading spaces, that begins `ok `, `not ok ` or `# Subtest: ` is a test-name line. It may set the current test file and is never matched. The test file named by a line is its first space-separated token that contains `.test.`, `.spec.` or `_test.`, with a leading `file://`, `(`, `'` or `"` removed, cut at the first `:` after that marker, and with trailing `)`, `'`, `"` and `,` removed. Every other line first sets the current test file when it names one.
  - **Matching.** A line carrying a `gate_proxy_strings` member is kind `proxy`; otherwise one carrying a `connect_error_strings` member is kind `connect`. Its `test_file` is the line's own, else the current one, else `null`. `line` goes through `redact_text`; `test_file` goes through `redact_file`, never `redact_text`. Identical `{kind, test_file, line}` are one match with a `count`, in first-occurrence order.
  - **Output.** `{"gate_logs": [{log_id, matches: [{kind, test_file, line, count}]}]}`, one entry per log, **including logs with no match**. New versus recorded uses mode `rounds`' rule: compare `matches` with the **last** `$known[0]` entry whose `log_id | split("#")[0]` is the label. No such entry: emitted as the label. Equal: emitted nowhere. Different: emitted as `"<label>#<k + 1>"`, where k is the number of entries carrying that label. Order the output as mode `rounds` orders labels.
- [ ] **The header.**
  - Opening `Owns:` paragraph: add finished Run gates logs (mode `gate_logs`).
  - `EVERY MODE TAKES EVERY VARIABLE`: name mode `gate_logs` beside `rounds` as a mode that binds `$known` by `--slurpfile`.
  - Add a `Mode gate_logs` block in the shape of `Mode rounds`'s. It must state: the call; the input; the attribution and matching rules; the output; the novelty rule; **the redaction split** — `test_file` goes through `redact_file`, whose home step is anchored at the start, because the unanchored `strip_home` would merge two relative test files under a `home/` segment (the reason the comment above `def redact_path` gives), while `line` is free text in which an absolute path can sit anywhere, so it takes `redact_text`'s unanchored step, and two lines differing only in the segment after a `home/` are kept as one match whose `count` sums both, an accepted residual; **the blind spots** (a test that catches the error and passes leaves no trace; a plain connect error cannot be told apart from an unreachable host; on macOS, Seatbelt's own violation records go to the system log, not to the test output; a test whose name or output quotes a string is matched too, except on the test-name lines above); and that **the four connect names are Node's and libc's error-code names, not strings a recorded run measured**.
  - In the free-text bullet of `Mode sessions`: name `redact_text`, used for the refusal fields and gate-log fields uncut, with `redact` defined as it plus the cut.
  - In the `Session record` key list: add `network_refusals: [{context, tool, command, started_at, host, port, line}]`. State: the counting rule (a) and (b); the docs rows each string is quoted from (`docs/sandbox-verification.md` N1, N5, CS3, P1); that N3 and N4 are not matched; the two residuals (a refused call whose command swallowed the error and whose result carries no line beginning `<sandbox_violations>` is missed; a failing command whose output quotes a string is listed); and that a record without the key predates the report.
  - **The mirror, declared:** `network_refusal_strings` mirrors `scripts/lib/sandbox-probe/judge.sh` → `sp__layer`'s `network` arm plus `SP_N5_CANNOT_WIDEN`, which exist only in the harness's own repository. A string added there is added here, and `cli/test/run-analytics-network-parse.test.mjs` fails when one is missing.
- [ ] **The fixture and the suite.**
  - `cli/test/fixtures/run-analytics-network.jsonl`, one session per shape, built like the files in `cli/test/fixtures/sandbox-probe/`.
    - **Each refusal text is copied verbatim from the docs row it names:**
      - N1 macOS: `curl: (56) CONNECT tunnel failed, response 403`.
      - N1 runner: `curl: (7) CONNECT tunnel failed, response 403`.
      - N1, 2026-10-14: the row's two strings `CONNECT tunnel failed, response 403` and `<sandbox_violations> deny network-outbound example.com:443 (host is not on the allow list)`, one per line.
      - N5: the `<tool_use_error>allowed_domains cannot widen network access in this session: …</tool_use_error>` text of `cli/test/fixtures/sandbox-probe/n5-cannot-widen.jsonl`, on a call carrying `allowed_domains`.
      - CS3: `sandbox proxy: github-firu:22: 403 host is not on the allow list`, on `git fetch origin`.
      - P1: `Received disconnect from UNKNOWN port 65535:1: This proxy requires authentication`.
    - **Not to be listed:** N4's `curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms: Couldn't connect to server` (error); N3's body `sbx_n3_<token>` (not an error); a non-error `Read` result quoting `CONNECT tunnel failed, response 403` mid-line.
    - **Also:** one refused call from a sub-agent context (`parent_tool_use_id` set by an `Agent` dispatch), and one session with no refusal.
    - **No result invented:** the event envelopes around each text are constructed, as every fixture there is, and no refusal string is invented.
  - `cli/test/run-analytics-network-parse.test.mjs`.
    - **Header.** Opens with its rule: *every refusal shape a recorded run measured is listed once per call with its host and port where the line names them, nothing that merely quotes one is, and a gate log's matches are kept whole and recorded once per change*. It maps each fixture session to its docs row, and states that the gate-log lines are constructed from the error-code names, not recorded logs.
    - **Session cases:**
      - each refusal session yields exactly one entry, with the expected `host` / `port`: `example.com` / `443` for the two-line N1 shape, `github-firu` / `22` for CS3, `null` otherwise;
      - `line` is the first carrying line;
      - `command` is the call's, uncut past 160 characters (one case uses a longer command);
      - the sub-agent entry carries its subagent type as `context`;
      - the not-to-be-listed sessions and the clean session yield `network_refusals: []`;
      - every other key of a session record is unchanged by the new key's presence: compare `tools`, `requests`, `cost` and `reliability` against a run of the same stream with the key removed.
    - **The mirror case.** Read `scripts/lib/sandbox-probe/judge.sh` as text. Take the double-quoted strings after `"$text"` on the line carrying `sp__line_with "$text" "<sandbox_violations>"`, and the value of `SP_N5_CANNOT_WIDEN=`. Assert each appears as a JSON string literal on the `def network_refusal_strings` line(s) of the program. Its header says why this is a source guard: the two files are in different languages, and nothing shares them at run time.
    - **Gate-log cases** (marker plus lines plus one newline, `$known` through `--slurpfile` from a throwaway file):
      - a `# Subtest: test/fetch.test.mjs` line followed by `Error: connect ECONNREFUSED 127.0.0.1:443` gives one `connect` match attributed to `test/fetch.test.mjs`;
      - a `curl: (56) CONNECT tunnel failed, response 403` line gives `proxy`;
      - an `ok 2 - a CONNECT tunnel failed result is judged network` line gives nothing;
      - the same line twice gives `count` 2;
      - a line carrying the redaction pair's `from` path is recorded with its `to` value;
      - two `Error: connect ECONNREFUSED 127.0.0.1:443` lines, one after `# Subtest: src/home/a.test.ts` and one after `# Subtest: src/home/b.test.ts`, give two matches whose `test_file` values are `src/home/a.test.ts` and `src/home/b.test.ts` unchanged, each with `count` 1;
      - a line naming `file:///Users/someone/proj/test/x.test.mjs:3:9` (not covered by the redaction pairs) is attributed to `~/proj/test/x.test.mjs`;
      - a log with no match is emitted with `matches: []`;
      - re-running with the output as `$known` emits nothing;
      - a changed log under a recorded label is emitted as `<label>#2`;
      - a `$known` that is not one array exits non-zero.

**Verification:**

- `cli/test/run-analytics-network-parse.test.mjs` passes.
- `grep -nE 'test\(|match\(|capture\(|sub\(|splits\(' cli/templates/scripts/lib/run-analytics.jq` prints nothing: no call to jq's regex builtins, the 1.5 floor. It printed nothing when this plan was written.
- **No existing output changes (by reading):** `redact`'s output is unchanged (it is `redact_text | .[0:160]`), `tools.items` gains no key, and the only new session-record key is `network_refusals`.
- Reading the header: the `Session record` list names `network_refusals`, the `Mode gate_logs` block states the four blind spots, that the connect names are unmeasured, and why `test_file` takes `redact_file` while `line` takes `redact_text` (with the `line` merge named as an accepted residual), and the mirror sentence names `judge.sh` and this suite.
