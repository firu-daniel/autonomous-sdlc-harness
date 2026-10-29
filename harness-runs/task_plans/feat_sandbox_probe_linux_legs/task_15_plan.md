### Task 15 — Test PD18's evidence and the judge's Linux layers against recorded streams

**Goal:** Hold Task 3's judge changes to fixtures, through the `judge` subcommand:

- PD18's `Exit code <n>: <message>` evidence;
- `Read-only file system` as a sandbox refusal on Linux only;
- the `unrecognised` layer's `not run`, never `fail`;
- each Linux fixture graded a second time with no platform, showing its macOS verdict unchanged.

Also update the one existing assertion PD18 changes: the CW6 case in `cli/test/sandbox-probe-wrappers-legs.test.mjs`.

**Depends on:**

- **Task 3** (`scripts/lib/sandbox-probe/judge.sh`):
  - **`sp__message_line <text>`.** When the first line is exactly `Exit code <digits>` and a later line is non-empty, it gives `<first line>: <first later non-empty line>`; otherwise it gives the first line. The `ran` arm's evidence uses it.
  - **The Linux sandbox string.** With `SP_PLATFORM=linux`, a line carrying `Read-only file system` is layer `sandbox`, after the `Operation not permitted` arm.
  - **The `unrecognised` layer.** With `SP_PLATFORM=linux`, an expected `sandbox` or `network` layer, layer `ran` and an error result give `SP_LAYER=unrecognised`, `SP_VERDICT="not run"` and `SP_EVIDENCE="no refusal string this judge knows on Linux, so not graded: <evidence>"`. A non-error `ran` stays `fail`.
- **Task 2.** The `judge` subcommand sets `SP_PLATFORM` from `${SANDBOX_PROBE_UNAME:-Darwin}`, so a case selects Linux by passing `SANDBOX_PROBE_UNAME: 'Linux'`.

**Where this task stops.** It tests the judge only. The legs' own Linux grading is tested by Tasks 16, 17 and 18–20.

### Targets

- `cli/test/sandbox-probe-judge.test.mjs`
- `cli/test/sandbox-probe-wrappers-legs.test.mjs`
- `cli/test/fixtures/sandbox-probe/linux-erofs.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/linux-unrecognised.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/exit-code-message.jsonl` (new)

**Work:**

- [ ] **Three fixtures**, hand-written in the existing fixtures' shape. Each holds an `assistant` `tool_use` for one Bash call and its `user` `tool_result` with `is_error: true`. They spell every path `@FIXTURE_ROOT@`, as the suite passes them unsubstituted.
  - `linux-erofs.jsonl`: the command `dd if=/dev/null of=@FIXTURE_ROOT@/clone/.mcp.json conv=notrunc`, with result `Exit code 1\ndd: failed to open '@FIXTURE_ROOT@/clone/.mcp.json': Read-only file system`.
  - `linux-unrecognised.jsonl`: the same command, with result `Exit code 1\ndd: failed to open '@FIXTURE_ROOT@/clone/.mcp.json': Device or resource busy`.
  - `exit-code-message.jsonl`: the command `git status`, with result `Exit code 2\n\nsbx: a message after a blank line`.
- [ ] **A new `test(...)` in `sandbox-probe-judge.test.mjs`, *PD18: the ran arm quotes the message under the Exit code line*:**
  - `judge call <exit-code-message> ran "git status"` gives `pass` with evidence `Exit code 2: sbx: a message after a blank line`;
  - the existing `ran.jsonl` case's evidence is unchanged.
  - The header's rule gains PD18 and the Linux layers.
- [ ] **A new `test(...)`, *the Linux refusal string and the unrecognised layer, on Linux only*:**
  - with `SANDBOX_PROBE_UNAME: 'Linux'`, `judge call <linux-erofs> sandbox "<command>"` gives `pass` with evidence the `dd: failed to open …: Read-only file system` line;
  - with no `SANDBOX_PROBE_UNAME`, the same call gives `fail`, exit 4, with evidence `Exit code 1: dd: failed to open …: Read-only file system`: the macOS verdict is today's;
  - with `Linux`, `judge call <linux-unrecognised> sandbox "<command>"` gives `not run`, exit 0, with evidence `no refusal string this judge knows on Linux, so not graded: Exit code 1: dd: failed to open …: Device or resource busy`;
  - with no `SANDBOX_PROBE_UNAME`, the same call gives `fail`;
  - with `Linux`, `judge call <linux-unrecognised> ran "<command>"` gives `pass`: an expected `ran` is never re-graded;
  - with `Linux`, the existing `ran.jsonl` fixture, a non-error result judged against `sandbox`, still gives `fail`.
- [ ] **`sandbox-probe-wrappers-legs.test.mjs`.** The CW6 assertion `… call answered by ran: Exit code 1` becomes `… call answered by ran: Exit code 1: commit-on-branch.sh: refusing to commit: cannot sync branch 'sbx_probe' in from '@FIXTURE_ROOT@/clone': the fetch of refs/heads/sbx_probe failed`. That is `cw6-sandboxed.jsonl`'s message line, with the path spelled as the suite spells it. The verdict it asserts is unchanged. No other assertion in that file changes.
- [ ] **Before finishing**, run `grep -n 'Exit code' cli/test/sandbox-probe-*.test.mjs`. For any other assertion that quotes the `ran` arm's evidence for a fixture whose result has a message under its `Exit code` line, update it in one of this task's two files, verdict unchanged, or record in the task's return that none exists.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs` passes, run from the repository root as one plain foreground command.
- `npm test --workspace cli -- test/sandbox-probe-wrappers-legs.test.mjs` passes, the same way.
- Each Linux case has its twin without `SANDBOX_PROBE_UNAME`, and the twin asserts the verdict the judge gave before Task 3.
</content>
</invoke>
