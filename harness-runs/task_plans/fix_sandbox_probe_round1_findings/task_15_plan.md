### Task 15 — Test N3, N4, the credentials no-calls check, P1b's permission screen and R4's `--local` grading against recorded streams

**Goal:** Drive the grading functions of Tasks 6–9 with recorded stream fixtures:

- **N3** is graded on whether the listener's body comes back.
- **N4** is never `fail` on an ambiguous curl error.
- **The credentials leg** knows when its session issued no calls.
- **P1b** is `not run` when the permission layer refused it.
- **R4's `--local` half** is graded on its exit and its refusal layer.

**Depends on:** these functions, each reading only its arguments and the stream:

- **Task 6, `sp__net_n3_grade <stream> <command> <token> <listener answered: 1|0>`:**
  - absent, or permission / file-tool → `not run`;
  - token in the result → `fail`, `the listener's body came back to the sandboxed session: …`;
  - listener answered 0 → `not run`;
  - otherwise → `pass`, `no body came back while the listener answered the probe: <curl line>`.
- **Task 6, `sp__net_n4_grade <stream> <command>`:**
  - absent, or permission / file-tool → `not run`;
  - network / sandbox → `pass`;
  - non-error result → `fail`;
  - error → `not run`, `curl's error line cannot tell a refused connect from an unreachable host: <the full curl: (n) … line>`.
- **Task 7, `sp__cred_issued <stream> <control command>`:** status 0 when the stream holds that exact Bash call, 1 otherwise. On 1, the leg prints S1, S2, S4 and S5 `not run`, with evidence beginning `the session issued no calls`.
- **Task 8, `sp__wr_permission_screen <stream> <command>`:**
  - status 0, with `SP__WR_V="not run"` and `SP__WR_E="refused at the permission layer, so it never reached the sandbox or the excludedCommands match: …"`, when the call was answered at the permission layer;
  - status 1, setting nothing, otherwise.
- **Task 9, `sp__rf_r4_local_grade <stream> <command>`:**
  - absent, or permission → `not run`;
  - sandbox → `fail`, `the --local merge was refused sandboxed in the clone: …`;
  - non-error → `pass`, `--local exit 0: …`;
  - error with `Exit code 3` → `pass`, `--local exit 3, nothing to do: …`;
  - other error → `not run`.

### Targets

- New fixtures under `cli/test/fixtures/sandbox-probe/`:
  - `n3-body.jsonl`: `curl -sS --max-time 5 http://127.0.0.1:8765/sbx_n3.txt` answered `sbx_n3_fixture`.
  - `n3-no-body.jsonl`: the same call answered `is_error: true` with `Exit code 7` then `curl: (7) Failed to connect to 127.0.0.1 port 8765 after 0 ms: Couldn't connect to server`.
  - `n4-curl-error.jsonl`: `curl -sS --max-time 5 http://169.254.169.254/` answered `Exit code 7` then `curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server`.
  - `n4-refused.jsonl`: the same call answered with `curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms: Operation not permitted`.
  - `credentials-no-calls.jsonl`: init, prompt and a `result` event, with no `tool_use` at all.
  - `p1b-permission.jsonl`: `GIT_SSH_COMMAND=@FIXTURE_ROOT@/tmp/sbx_ssh_probe.sh bash @FIXTURE_ROOT@/scripts/push-branch.sh @FIXTURE_ROOT@/clone` refused with `Permission to use Bash has been denied because Claude Code is running in don't ask mode.`
  - `r4-local-ran.jsonl`: `bash @FIXTURE_ROOT@/clone/scripts/refresh-branch.sh --local @FIXTURE_ROOT@/clone` answered `is_error: true` with `Exit code 3` and a `refresh-branch.sh: … already contains … — nothing to do` line.
  - `r4-local-sandbox.jsonl`: the same call answered with `fatal: Unable to create '…/index.lock': Operation not permitted`.
- `cli/test/sandbox-probe-remote-legs.test.mjs` (new).

**Work:**

- [ ] **The suite's header and harness.**
  - Open with the rule: *a refusal is graded only at the layer the row measures — a permission-layer refusal is `not run`; N3 fails only on a body that came back; N4 never fails on an error line that cannot tell; a session that issued no calls grades nothing.*
  - Source `core.sh`, `judge.sh`, `controls.sh` and the one leg file each case needs (`legs-network.sh`, `legs-settings.sh`, `legs-wrappers.sh` or `legs-refresh.sh`) through `runBash` from `./helpers/fixture.mjs`, with `SP_VERSION` blanked. Print `"$SP_VERDICT|$SP_EVIDENCE"`, or the variables named above.
- [ ] **N3 and N4.**
  - `n3-body` with token `sbx_n3_fixture` and listener answered 1 → `fail`.
  - `n3-no-body` with 1 → `pass`, whose evidence quotes the `curl: (7)` line.
  - `n3-no-body` with 0 → `not run`.
  - `n4-curl-error` → `not run`, whose evidence carries the whole `curl: (7) … Couldn't connect to server` line and not merely `Exit code 7`.
  - `n4-refused` → `pass`.
- [ ] **The credentials and P1b screens.**
  - `sp__cred_issued credentials-no-calls.jsonl 'cat @FIXTURE_ROOT@/clone/harness.config.json'` → status 1.
  - On a fixture that holds that call (`ran.jsonl`'s shape, written for the case) → status 0.
  - `sp__wr_permission_screen p1b-permission.jsonl '<the fixture command>'` → status 0 with the `not run` pair.
  - On `sandbox-dd.jsonl` with its own command → status 1.
- [ ] **R4's `--local` half.**
  - `r4-local-ran` → `pass`, `--local exit 3, nothing to do: …`.
  - `r4-local-sandbox` → `fail`.
  - `ran.jsonl` (no such call) → `not run`.
- [ ] **Fixture hygiene.** Every fixture follows `ran.jsonl`'s event shape and uses `@FIXTURE_ROOT@` for every path. The port `8765` and the token `sbx_n3_fixture` are fixture literals, not a listener.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-remote-legs.test.mjs` passes.
- No case starts a listener, a session or a network call. The suite sources libraries and reads fixtures only.
