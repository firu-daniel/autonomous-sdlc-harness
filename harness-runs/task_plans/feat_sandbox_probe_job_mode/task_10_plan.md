### Task 10 — Grade N4 against the runner's metadata-service control

**Goal:** On a GitHub-hosted runner, N4's link-local host `169.254.169.254` is Azure's Instance Metadata Service. It refuses a request without the `Metadata: true` header with HTTP 400 (`Required metadata header not specified`), so **any HTTP status line counts as an answer**, 400 included. Whether a hosted runner can reach it at all is not documented. The workflow's unsandboxed step tries it first, with no `Metadata` header, and records the status code only, never a body (Task 14). The prompt's rule:

- **If the control answered**, a response to the sandboxed call is a `fail`, and anything else that reached the call is a `pass`.
- **If it did not**, N4 is graded as on macOS since #192, by comparison with the probe's own unsandboxed call.

**Depends on:**

- **Task 7:** `sp_runner_control imds-control` prints `http <code>`, `no answer: curl exit <n>`, or `unrecorded` with status 1.
- **Task 1:** `SP_JOB_MODE`.

The existing grade is `sp__net_n4_grade <stream> <command> [<control exit> <control line>]` in `scripts/lib/sandbox-probe/legs-network.sh`, called from `sp_leg_network` with the probe's own control `SP__NET_N4_CTL_RC` and `SP__NET_N4_CTL_LINE`.

**Where this task stops.** It edits `legs-network.sh` only. The sandboxed N4 call, its session and the probe's own control are unchanged. Tests are Task 20's.

### Targets

- `scripts/lib/sandbox-probe/legs-network.sh`

**Work:**

- [ ] **`sp__net_n4_grade` takes an optional fifth argument, `<runner control>`**, the `imds-control` value. With four arguments or fewer it is byte-for-byte as today. With a fifth that starts `http `:
  - the judge's permission or file-tool layer → `not run`, as today;
  - the call ran without error (a body, an HTTP response) → `fail`, *the metadata service answered the workflow's unsandboxed control (<value>) and the sandboxed call got a response: <first line>*;
  - network or sandbox layer, an `unrecognised` error, or any curl error line → `pass`, *the workflow's control got <value>; the sandboxed call got none: <line>*.

  With a fifth that does not start `http ` (no answer, or unrecorded), it falls through to today's comparison with the probe's own control, and the evidence gains `; the workflow's control: <value>`.
- [ ] **`sp_leg_network`** passes the fifth argument only when `SP_JOB_MODE` is `1` and `sp_runner_control imds-control` returns 0. Elsewhere the call is unchanged.
- [ ] **The header**'s N4 paragraph and the grading signature line gain the runner arm, citing that the workflow keeps the status code only and never a body.

**Verification:**

- The type check passes.
- `git diff scripts/lib/sandbox-probe/legs-network.sh` shows the four-argument path unchanged: the new arm is reached only with `$# -ge 5`.
</content>
</invoke>
