### Task 6 — PD30: make T3's `fail` evidence name every `FAIL` line and the suite's counts

**Goal:** When T3's gate run ends `fail`, its evidence names the gates that failed and the suite's counts, read from the lane log, before anything else. A refusal string matched in some gate's printed output is never the first thing the evidence says.

**The finding (docs/sandbox-verification.md §5 PD30).** On 2026-11-03, after `the launcher answered pending;`, T3's evidence quoted a line of gate 6a's printed output, a passage of a document gate 6a's search matched, rather than the failed gates `FAIL  4 npm test (exit 1)` and `FAIL  6a no machine paths (printed output, which is the finding)`. The cause is `scripts/lib/sandbox-probe/legs-local.sh` → `sp__t2_grade`'s `fail` arm. It quotes the first log line matching any of its temporary-file patterns (on Linux, `Read-only file system` among them), and only falls back to the `== run-test-suite.sh: gate … exited <n> ==` line when none matches. Gate output pasted into the log matches those patterns.

**What T3's `fail` evidence reads after this task, in order:**

1. `the launcher answered pending; ` (unchanged).
2. `gates failed: ` followed by every lane-log line matching `^  FAIL  ` (two spaces, `FAIL`, two spaces: the shape `scripts/run-gates.sh` prints), each whole with its leading spaces trimmed, joined by `; `. When the log holds none, use the `== run-test-suite.sh: gate … exited <n> ==` line instead. When it holds neither, use `<verdict line> (no FAIL line or non-zero gate exit line in the log)`.
3. `; suite counts: tests <n>, pass <n>, fail <n>, skipped <n>`, each the **last** lane-log line matching `^[[:space:]]*(#|ℹ) (tests|pass|fail|skipped) [0-9]+$` for that name. A missing count reads `none`, and with none found at all the clause is `; suite counts: none in the log`.
4. When a temporary-file pattern matched, `; first log line matching <names>, which may be a gate's printed output: <line>`, so T2's temporary-file signal is kept, labelled for what it is.
5. `; compare with the same call unsandboxed on the same tree before filing its row`, then the two network-denial clauses exactly as today.

Every reading is whole. No `FAIL` line is truncated or counted-and-dropped (`harness-runs/lessons.md` → *"A measurement script stores and reports every reading in full"*).

**T2 is unchanged.** `sp__t2_grade`'s output for any input stays byte-identical, so every macOS T2 verdict and evidence stays what it is. Only `sp__t3_grade` builds the new evidence. Factor the log reading into a helper rather than editing `sp__t2_grade`'s `fail` arm.

**The interface Task 10 tests.** `sp__t3_grade <stream> <launch command> <verdict file> <log file>` keeps its signature and verdicts. On a `pending` answer with a `fail …` verdict, `SP_EVIDENCE` reads as above. A new helper `sp__gate_log_failures <log>` prints clauses 2 and 3 (`gates failed: …; suite counts: …`) on one line and nothing else. It exits 0 on a readable log and 1 when the log is absent.

### Targets

- `scripts/lib/sandbox-probe/legs-local.sh`

**Work:**

- [ ] Add `sp__gate_log_failures` as the interface states, with its line in the header's function list.
- [ ] Rewrite `sp__t3_grade` so that on a `pending` answer and `SP_VERDICT=fail` it rebuilds `SP_EVIDENCE` in the five-part order above. Read the temporary-file match and the denial clauses from the same sources `sp__t2_grade` reads. If needed, split `sp__t2_grade`'s denial-counting tail into a helper both call, keeping T2's output byte-identical.
- [ ] Update the header's T3 sentence and the comment above `sp__t3_grade`: T3's `fail` evidence leads with the failed gates and the suite counts (§5 PD30).

**Verification:**

- Reading the new `sp__t3_grade` against the 2026-11-03 lane log's quoted lines: a log ending with `  FAIL  4 npm test (exit 1)`, `  FAIL  6a no machine paths (printed output, which is the finding)` and `# tests 3307`, `# pass 3283`, `# fail 2`, `# skipped 22` yields evidence starting `the launcher answered pending; gates failed: FAIL  4 npm test (exit 1); FAIL  6a no machine paths (printed output, which is the finding); suite counts: tests 3307, pass 3283, fail 2, skipped 22`. Task 10 pins it.
- `git diff` on `sp__t2_grade` shows no change to the text it assigns to `SP_EVIDENCE` on any path.
  - **Deviations from plan:**
    - `sp__gate_log_failures` takes an optional second argument, the verdict line, because clause 2's last fallback (`<verdict line> (no FAIL line or non-zero gate exit line in the log)`) needs it and `<log>` alone cannot supply it. Called with one argument, that fallback reads `none (no FAIL line or non-zero gate exit line in the log)`. The one-argument interface Task 10 tests is unchanged.
    - When the log is absent, `sp__gate_log_failures` prints nothing and exits 1, and `sp__t3_grade` writes clause 2's neither-form and `suite counts: none in the log` itself.
    - T2's temporary-file search and network-denial tail moved into helpers both grades call (`sp__tmpfile_names`, `sp__tmpfile_line`, `sp__gate_denials`), so `git diff` on `sp__t2_grade` does show changed lines. The text it assigns is unchanged. That rests on a measurement, not a reading of the diff: probe `harness-runs/scratch/task6_pd30_probe.mjs`, run with `bash scripts/scratch-run.sh harness-runs/scratch/task6_pd30_probe.mjs` under `/bin/bash` 3.2.57. It compares HEAD's `sp__t2_grade` with the new one over SP_PLATFORM `''` and `linux`, verdict `pass` / `fail …` / junk / absent, seven log shapes (absent included), and two streams. Result: `t2 byte-identity: 112 cases, 0 differ`. The same probe ran the first Verification bullet as a measurement: `T3 pd30 starts with the plan string: true`.
