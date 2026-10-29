### Task 19 — Test the detached and loopback legs' grading

**Goal:** A new suite, `cli/test/sandbox-probe-detached-loopback-legs.test.mjs`, holds the grading of the `detached` and `loopback` legs to their contracts:

- **BG9** passes only on a worker that outlived the session and finished, and a worker that stopped with the session is `fail`.
- **WF5** passes only on an advancing `hr_lane_mtime`.
- **LB1–LB4** record whether the token came back on the plain and `--noproxy` calls.
- **LB5** records whether a sandbox-started listener is reachable from outside, and never records *unreachable* for a listener that was no longer running.
- **The proxy line** names host and port and never a credential.
- A permission-refused call is `not run` in every function.

**Depends on:**

- **Task 8** (`scripts/lib/sandbox-probe/legs-detached.sh`):
  - **`sp__bg9_grade <stream> <start command> <session end epoch> <last beat epoch> <done: 1|0>`**:
    - `not run` when the start call was refused at the permission layer, absent, or carried no `sbx_bg9_started` line;
    - `pass` when done is `1` and the last beat is after the session end;
    - `fail` when the last beat is at or before session end + 1 and done is `0`;
    - otherwise `not run`.
  - **`sp__wf5_grade <mtimes file>`.** The file is a line `stat -f %m: <raw>`, then `mtime <n>` lines.
    - two integers, the second greater than the first, the first greater than 0 → `pass`, `hr_lane_mtime advanced <a>..<b> …`;
    - equal → `fail`, `did not advance`;
    - a `0` → `fail`, `neither stat arm answered`;
    - missing or short → `not run`.
- **Task 9** (`scripts/lib/sandbox-probe/legs-loopback.sh`):
  - **`sp__lb_proxy_line <stream> <helper command>`** prints `proxy: <NAME>=<value>, …` from the helper's `sbx_lb_proxy <NAME> <value>` lines, or `proxy: not recorded (<why>)`. It strips any `<user>[:<password>]@` still in a value.
  - **Both loopback grades judge every call at `ran`**: `sp_judge_call <stream> ran <command>`. Task 3's `unrecognised` arm applies only to an expected `sandbox` or `network` layer, so it never fires for them. Only three things are read from the judge: its `not run`, meaning absent or no result; `SP_LAYER`, to screen out `permission` and `file-tool`; and `SP__TEXT` / `SP_LAYER_EVIDENCE` for the outcome.
  - **`sp__lb_grade <stream> <plain command> <noproxy command> <token> <listener answered: 1|0>`**:
    - `not run` when either call got the judge's `not run`, or was at the `permission` or `file-tool` layer, or when answered is not `1`;
    - otherwise `pass`, `plain: <outcome>; --noproxy: <outcome>`. An outcome is `the token came back`, or `no body: <the curl: ( line>`, or, when there is none, `no body: <SP_LAYER>: <SP_LAYER_EVIDENCE>`.
  - **`sp__lb5_grade <stream> <start command> <outside reply> <token> <listener alive: 1|0|?>`**:
    - `not run` when the start call got the judge's `not run`, was at the `permission` or `file-tool` layer, or printed `sbx_lb5_no_listener`;
    - `pass`, `reachable from outside the sandbox: …`, when the reply carries the token, whatever alive says;
    - `not run`, `the listener was no longer running when the probe called it, …`, when alive is `0`;
    - `not run`, `could not tell whether the listener was still running …`, when alive is `?`;
    - otherwise, alive `1`, `pass`, `unreachable from outside the sandbox while the listener was running: …`.
- **Task 3** (`judge.sh`). PD18's `Exit code <n>: <message>` evidence, and the Linux layers.

**Where this task stops.** No case launches a session, a worker or a listener. Each function is fed a fixture and the values the leg would pass.

### Targets

- `cli/test/sandbox-probe-detached-loopback-legs.test.mjs` (new)
- `cli/test/fixtures/sandbox-probe/bg9-started.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/bg9-permission.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/lb-session.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/lb-permission.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/lb5-listening.jsonl` (new)

**Work:**

- [ ] **The header** states the rule the suite enforces: **a detached worker that dies with its session is a finding, not a pass; the heartbeat must advance; and the loopback rows record what came back, never what was expected, with the proxy recorded by host and port only.**
  - It sources `core.sh`, `platform.sh`, `judge.sh`, `controls.sh`, `session.sh`, `legs-network.sh` and the two leg files through `runBash`, with `SP_PLATFORM=linux`.
  - Its temporary files are `mkdtemp`s under `os.tmpdir()`.
- [ ] **The fixtures**, hand-written in the existing shape, unsubstituted:
  - **`bg9-started`:** `bash @FIXTURE_ROOT@/bg9-start.sh` with result `sbx_bg9_started`.
  - **`bg9-permission`:** the same call refused at the permission layer.
  - **`lb-session`.** It holds:
    - the proxy helper call, with result lines `sbx_lb_proxy http_proxy localhost:3128`, `sbx_lb_proxy HTTPS_PROXY localhost:3128` and `sbx_lb_proxy no_proxy localhost,127.0.0.1`, plus `unset` lines for the rest;
    - the four curl calls on port `8765`. The `127.0.0.1` plain call returns the token `sbx_n3_tok`. The `127.0.0.1` `--noproxy '*'` call returns `Exit code 7\ncurl: (7) Failed to connect to 127.0.0.1 port 8765 after 0 ms: Couldn't connect to server`. Both `localhost` calls return `Exit code 56\ncurl: (56) CONNECT tunnel failed, response 403`.
  - **`lb-permission`:** the `127.0.0.1` plain call refused at the permission layer.
  - **`lb5-listening`:** `bash @FIXTURE_ROOT@/lb5-start.sh` with result `sbx_lb5_listening 9876`, and a second form of it with `sbx_lb5_no_listener`. Put the second form in this file under a different command, or in an inline case file.
- [ ] **BG9 and WF5:**
  - `sp__bg9_grade` on `bg9-started` gives `pass` with session end `100`, last beat `115` and done `1`;
  - it gives `fail` with end `100`, beat `100` and done `0`;
  - it gives `not run` with end `100`, beat `110` and done `0`;
  - it gives `not run` for `bg9-permission`.
  - `sp__wf5_grade` on written temp files gives `pass` for `stat -f %m: ?` / `mtime 100` / `mtime 103`, `fail` for two `100`s, `fail` for a `0`, and `not run` for a one-line file and for a missing path.
- [ ] **LB1–LB4 and the proxy line:**
  - `sp__lb_grade` on `lb-session` for the `127.0.0.1` pair, token `sbx_n3_tok`, answered `1` → `pass`, `plain: the token came back; --noproxy: no body: curl: (7) …`;
  - for the `localhost` pair → `pass`, both `no body: curl: (56) CONNECT tunnel failed, response 403`;
  - the same `127.0.0.1` pair case, run once more with `SP_PLATFORM` empty, gives the identical string. With the grade judging at `ran`, Linux's `curl: (7)` is never turned into `unrecognised`;
  - answered `0` → `not run`;
  - `lb-permission` → `not run`.
  - `sp__lb_proxy_line` on `lb-session` prints a line naming `http_proxy=localhost:3128` and `no_proxy=localhost,127.0.0.1`.
  - A second proxy case feeds a helper output line carrying `user:secret@` and asserts the printed line does not contain `secret`. This holds the helper's stripping contract at the point the line is read back.
- [ ] **LB5:** `sp__lb5_grade` on `lb5-listening`:
  - with an outside reply containing the token and alive `1` → `pass`, `reachable from outside the sandbox`. The same with alive `0` is still `pass`, `reachable …`;
  - with a `curl: (7)` reply and alive `1` → `pass`, `unreachable from outside the sandbox while the listener was running: curl: (7) …`;
  - **the dead-listener case:** a `curl: (7)` reply with alive `0` → `not run`, evidence beginning `the listener was no longer running when the probe called it`;
  - a `curl: (7)` reply with alive `?` → `not run`, evidence beginning `could not tell whether the listener was still running`;
  - the `sbx_lb5_no_listener` form → `not run`.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-detached-loopback-legs.test.mjs` passes, run from the repository root as one plain foreground command.
- The suite reads fixed fixture files and its own temporary files, never a tree of repository files, so it owes no `treeGuards` entry (`unit_loop_core.md` → `## The test-run rule` point 8's boundary).
</content>
</invoke>
