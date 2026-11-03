### Task 10 — PD30's fixture: T3's `fail` evidence over a lane log whose gate output quotes a refusal string

**Goal:** Pin T3's new `fail` evidence: every `FAIL` line and the suite's counts first, even when a gate's printed output earlier in the log carries a refusal string. Also pin that T2's evidence on the same inputs is unchanged.

**Depends on:** Task 6, which ships this interface in `scripts/lib/sandbox-probe/legs-local.sh`:

- `sp__t3_grade <stream> <launch command> <verdict file> <log file>`. On a `pending` answer with a `fail …` verdict it sets `SP_EVIDENCE` in this order: `the launcher answered pending; gates failed: <every ^  FAIL   line, leading spaces trimmed, joined by "; ">; suite counts: tests <n>, pass <n>, fail <n>, skipped <n>`. When a temporary-file pattern matched, it then adds `; first log line matching <names>, which may be a gate's printed output: <line>`. It then adds `; compare with the same call unsandboxed on the same tree before filing its row` and the two network-denial clauses. Each count is the last `^[[:space:]]*(#|ℹ) <name> [0-9]+$` line, `none` when absent. With no `FAIL` line the `== run-test-suite.sh: gate … exited <n> ==` line stands in.
- `sp__gate_log_failures <log>` prints `gates failed: …; suite counts: …` on one line, exit 0. An absent log is exit 1.
- `sp__t2_grade` is byte-identical in output to before.

Task 6 owns the script, and this task only tests it.

### Targets

- `cli/test/sandbox-probe-gates-legs.test.mjs`

**Work:**

- [ ] Add a test titled `PD30: T3's fail evidence names every FAIL line and the suite's counts`. Its lane log, written by the case, holds in order: a gate-6a printout line carrying `Read-only file system` inside an indented `./docs/…:<n>:` passage, as `scripts/run-gates.sh` indents a gate's tail; the lines `  FAIL  4 npm test (exit 1)` and `  FAIL  6a no machine paths (printed output, which is the finding)`; the indented counts `        # tests 3307`, `        # pass 3283`, `        # fail 2`, `        # skipped 22`; and `== run-test-suite.sh: gate test exited 1 ==`. The verdict file reads `fail …`, and the stream is the existing `pending` T3 launch fixture the `sp__t3_grade` test already uses. Under `SP_PLATFORM=linux`, assert `SP_EVIDENCE` starts with `the launcher answered pending; gates failed: FAIL  4 npm test (exit 1); FAIL  6a no machine paths (printed output, which is the finding); suite counts: tests 3307, pass 3283, fail 2, skipped 22`. Assert it carries the labelled temporary-file clause after that, and that `SP_VERDICT` is `fail`.
- [ ] In the same test: a log with no `FAIL` line and no counts gives `gates failed: == run-test-suite.sh: gate test exited 1 ==; suite counts: none in the log`. `sp__gate_log_failures` on an absent path exits 1.
- [ ] In the same test, the T2 twin, which pins that T2 kept its contract. `sp__t2_grade` with `SP_PLATFORM=linux` on the same verdict and log still opens its evidence with the first log line matching its patterns (the `Read-only file system` printout line), followed by `; compare with the same call unsandboxed on the same tree before filing its row`. That is the shape its `fail` arm has always produced, and the existing `sp__t2_grade` cases, left unedited, pin the rest.
- [ ] Update the file's header rule sentence. T3's `fail` evidence leads with the failed gates and the suite's counts (§5 PD30), and T3's log search for a Linux refusal line is kept, labelled as possibly a gate's printed output.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-gates-legs.test.mjs` passes, the existing `sp__t2_grade` and `sp__t3_grade` cases included and unedited.
- The title `PD30: T3's fail evidence names every FAIL line and the suite's counts` is present byte for byte, because Task 13 cites it in `docs/sandbox-verification.md` §5 PD30.
