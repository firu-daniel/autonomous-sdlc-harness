### Task 3 — Fix PD18 in the judge, and add the Linux refusal string and the `unrecognised` layer

**Goal:** Make `scripts/lib/sandbox-probe/judge.sh` able to read a Linux session, in two steps.

**First, fix PD18** (`docs/sandbox-verification.md` → §5 PD18). The `ran` arm of `sp__layer` quotes the first line of a result. For a call that exits non-zero, that line is the Bash tool's own `Exit code <n>` header, so the message under it never reaches the evidence. On Linux this would hide exactly the strings the next step needs. After the fix, the arm quotes `Exit code <n>: <the first non-empty line after it>`.

**Then add the Linux strings, on Linux only:**

- **`Read-only file system`** files a call under the `sandbox` layer. EROFS is what a write into a bubblewrap read-only bind mount returns.
- **A call the caller expects at the `sandbox` or `network` layer** that errors with no refusal string this judge knows gets the new layer value `unrecognised` and the verdict `not run`, naming the text, never `fail`. A Linux refusal string cannot be known before the first Linux run, and Gate 15 (Task 11) says such strings are added from that run's kept evidence.

**Depends on:** Task 1, which declares `SP_PLATFORM` in `scripts/lib/sandbox-probe/platform.sh`, and Task 2, which sets it:

- preflight refusal 2 sets it for `run` and `refusal`;
- the `judge` and `print-parity-script` dispatch sets it from `${SANDBOX_PROBE_UNAME:-Darwin}`.

Every new arm here tests `"${SP_PLATFORM:-}" = linux`. With it empty or `macos`, every verdict is today's.

**Where this task stops.**

- Callers that branch on `SP_LAYER` themselves rather than on `SP_VERDICT`, such as `sp__wp_dd_grade` and the git leg, learn the `unrecognised` value in Task 5.
- **Two network grades read a plain curl error as their data, not as a refusal**, and so must not stop at this arm's `not run`. They are `scripts/lib/sandbox-probe/legs-network.sh` → `sp__net_n3_grade`, which grades N3 on the body, and `sp__net_n4_grade`, which grades N4 by comparison with its unsandboxed control. Both call `sp_judge_call "$stream" network "$cmd"` and then `[ "$SP_VERDICT" = "not run" ] && return 0`. On Linux a direct `curl: (7) Failed to connect …` is exactly the `ran` + `error` result this arm turns into `unrecognised`. **Task 22** adapts both so an `unrecognised` result falls through to their existing curl-line logic. Task 23 tests them. This task edits neither.
- The `loopback` leg's grades (Task 9) judge their curl calls at `ran`, so this arm never applies to them.
- The `mktemp` and `gates` legs' own text matching is Task 4's.
- PD18's change to evidence text breaks one existing assertion. `cli/test/sandbox-probe-wrappers-legs.test.mjs`'s CW6 case expects `call answered by ran: Exit code 1`, and Task 15 updates it. Task 15 also adds the fixtures for everything here.

### Targets

- `scripts/lib/sandbox-probe/judge.sh`

**Work:**

- [ ] **`sp__message_line <text>`** (new). When the text's first line is exactly `Exit code` followed by one space and digits, and a later line is non-empty, it prints `<that first line>: <the first later non-empty line>`. Otherwise it prints what `sp__first_line` prints. It reads only its argument.
  - In `sp__layer`, the `ran` arm sets `SP_LAYER_EVIDENCE` from it in place of `sp__first_line`. No other caller of `sp__first_line` changes. That includes `sp__judge_matched`'s permission-denials evidence and the legs' own calls.
- [ ] **The Linux sandbox arm.** In `sp__layer`, after the `Operation not permitted` arm and only when `"${SP_PLATFORM:-}" = linux`, a line carrying `Read-only file system` sets `SP_LAYER=sandbox`, with that line as the evidence. The macOS precedence and strings are unchanged.
- [ ] **The `unrecognised` layer.** In `sp__judge_matched`, after `sp__layer` and before the verdict, four conditions together decide it:
  - `"${SP_PLATFORM:-}" = linux`;
  - the expected layer is `sandbox` or `network`;
  - `SP_LAYER` is `ran`;
  - `SP__STATUS` is `error`.

  When all four hold, set `SP_LAYER=unrecognised`, `SP_VERDICT="not run"` and `SP_EVIDENCE="no refusal string this judge knows on Linux, so not graded: <SP_LAYER_EVIDENCE><issued suffix>"`, and return.
  - A `ran` result that is **not** an error is still `fail` against an expected refusal, on Linux too: the call ran unrefused.
  - `sp_judge_cli`'s list of expectable layers is unchanged. `unrecognised` is a value the judge sets, never one a caller asks for.
- [ ] **The header's layer table** gains:
  - the Linux `sandbox` string, marked *Linux only*;
  - the `unrecognised` value, with its four conditions;
  - PD18's rule for the `ran` arm's evidence.

  It states that the Linux strings are taken from the first Linux run's kept evidence and added here, never guessed.

**Verification:**

- The type check passes.
- By hand, from the repository root, against the recorded fixture: `bash scripts/sandbox-probe.sh judge call cli/test/fixtures/sandbox-probe/cw6-sandboxed.jsonl ran "<CW6's exact command in that fixture>"`. The printed evidence now begins `Exit code 1: commit-on-branch.sh: refusing to commit:`, and the verdict is unchanged.
- `grep -n 'SP_PLATFORM' scripts/lib/sandbox-probe/judge.sh` shows every use inside the two new arms and the header. Nothing else reads it.
- `grep -rn '"Exit code' scripts/lib/sandbox-probe/` finds no leg that compares `SP_LAYER_EVIDENCE` or `SP_EVIDENCE` to a bare `Exit code <n>` string, and finds no `ran`-layer call whose verdict would change through the new evidence. S4's `printenv` calls produce `Exit code 1` with nothing after it, so their evidence is unchanged.

**Deviations from plan:**

- **Evidence downgrade — the by-hand CW6 judge run was not executed.** `bash scripts/sandbox-probe.sh judge call cli/test/fixtures/sandbox-probe/cw6-sandboxed.jsonl ran '<CW6 command>'` was refused by the permission layer (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`), as was a standalone `bash -n` of `judge.sh`; neither was routed around. The claim that the evidence now begins `Exit code 1: commit-on-branch.sh: refusing to commit:` rests on reading: the fixture's `tool_result` content is `Exit code 1\ncommit-on-branch.sh: refusing to commit: …`, whose first line matches `sp__message_line`'s `Exit code <digits>` test and whose second line is non-empty; the verdict is unchanged because `sp__layer` still returns `ran` (no refusal string in the text) and the Linux arms are off with `SANDBOX_PROBE_UNAME` unset. Parsing under bash 3.2 is evidenced by `bash scripts/typecheck.sh` (`check-shell-parse: 91 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`). Task 15's fixtures and the CW6 assertion update execute it.
- The `"Exit code` grep and an `SP_LAYER_EVIDENCE` grep over `scripts/lib/sandbox-probe/` were run: every leg-side `Exit code` match (`legs-settings.sh` S4, `legs-refresh.sh` R3 and R4) reads `SP__TEXT`, not `SP_LAYER_EVIDENCE` or `SP_EVIDENCE`, and no verdict branches on the evidence text.
</content>
</invoke>
