### Task 16 — Amend the rows whose call or expected result the probe now names: T2, TD2, CS3, CS4, P1b, R4, N3, N4, N5, S4, W7

**Goal:** Bring each row of `docs/sandbox-verification.md` that the probe's fixes change into line with the call the probe now issues and the result it now grades. Where the task prompt asks, say why. Record **no** result.

**Depends on:** Tasks 4–9. Each row below restates the call that task's leg now issues:

- **Task 4.**
  - T2 starts the gates with `bash scripts/run-test-suite.sh sbx_probe_t2` and collects with `--wait` (repeated, bounded). It is graded from the lane's `sbx_probe_t2.verdict` and `.log`, and the log's network denials are recorded, not graded.
  - TD2 resolves the session's `TMPDIR` with `printenv TMPDIR` in a session of its own, then issues `mktemp <tmpdir>/harness-gates.XXXXXX` as a literal. Any of TD2's calls refused at the permission layer is `not run`.
  - W7's session carries `--debug-file`.
- **Task 5.** CS3's `git fetch origin` is an expected refusal by the network allowlist (§7 OR2).
- **Task 6.**
  - N3 aims `curl -sS --max-time 5 http://127.0.0.1:<port>/sbx_n3.txt` at a listener the probe starts on loopback (`python3 -m http.server`, under its temp area), and is graded on whether the listener's body comes back.
  - N4 records curl's full `curl: (<n>) …` line, and is `not run` where that line cannot tell a refused connect from an unreachable host.
- **Task 7.** S4's call is `printenv <name> >/dev/null`, judged by exit status, never printing a value.
- **Task 8.** P1b's call is allowed through `--allowedTools` for exactly that command, and a permission-layer refusal of it is `not run`. CS4's leg already accepts the refresh's exit 3.
- **Task 9.** R4 adds a second session: the clone's own `bash <clone>/scripts/refresh-branch.sh --local <clone>`, with the clone's local `<default>` ensured first.
- **Task 2.** N5 grades `pass` on the tool's own `allowed_domains cannot widen network access` refusal.

**The one rule of this edit.** Change only the **check** (call) column and the **expected** column of the eleven rows named. Keep each row's **Observed** and **Verdict** cells byte-identical, so the 2026-10-27 record and every grade stand (*no measured result is invented*). Do not edit §0, §6, §7, the F rows, the TD1 row or the PD1–PD13 rows. Locate each row by its `| <id> |` first cell, never by a line number.

### Targets

- `docs/sandbox-verification.md`, rows T2, TD2 (§5), CS3, CS4 (§2 `### The clone layout (owed)`), P1b, R4 (§3), N3, N4, N5, S4, W7 (§4).

**Work:**

- [ ] **§2: CS3 and CS4.**
  - **CS3's expected:** `add`, `commit`, `stash push`/`pop` and `switch -c` each succeed, as now. **`git fetch origin` is refused by the network allowlist**, which is the clone layout's design: a run copy reaches its remote only through `<main>/scripts/` wrappers (§7 OR2). A fetch that reaches origin is a `fail`. The check column keeps CL4's calls and the `git remote get-url origin` record.
  - **CS4's expected:** *the refresh exits 0, 3 (nothing to do) or 4 per its contract*, in place of *0 or 4*.
- [ ] **§3: P1b and R4.**
  - **P1b's check:** add *through `--allowedTools "Bash(<that exact call>)"`, so the call reaches the sandbox instead of stopping at the permission layer*.
  - **P1b's expected:** add *a refusal at the permission layer never reached the sandbox or the `excludedCommands` match and is `not run`*.
  - **R4's check:** name the clone-layout form the probe takes. That is two sessions, cwd = `<clone>` on the real `<run profile>`:
    1. `bash <clone>/scripts/refresh-branch.sh <clone>`;
    2. `bash <clone>/scripts/refresh-branch.sh --local <clone>`, with the clone's local `<default>` created at `origin/<default>` first where absent.

    Keep fixture (d) as the 2026-10-14 worktree form it was measured with.
  - **R4's expected:** *the fetch fails sandboxed over SSH; `--local` exits 0, or 3 when there is nothing to merge; a `--local` refused with `Operation not permitted` is F1's shape*.
- [ ] **§4: N3, N4 and N5.**
  - **N3's check:** the probe starts a listener on loopback for the session (`python3 -m http.server --bind 127.0.0.1` on a free port, serving a token file from its temp area). The exact call is `curl -sS --max-time 5 http://127.0.0.1:<port>/sbx_n3.txt`. Keep the scratch-profile departure and the control as they are.
  - **N3's expected:** *no body comes back to the session while the listener answers the probe's own request; a body that comes back is a `fail`; a listener that does not answer, or a refusal at the permission layer, is `not run`*.
  - **N4's expected:** *refused at the network or sandbox layer; otherwise curl's full error line is recorded, and an error line that cannot tell a refused connect from an unreachable host is `not run`; a response is a `fail`*.
  - **N5's expected:** add the Bash tool's own refusal of the parameter, *`allowed_domains cannot widen network access …`*, to the refusals that grade `pass`.
- [ ] **§4: S4 and W7.**
  - **S4's check:** one exact `printenv <name> >/dev/null` per name, through `--allowedTools "Bash(printenv:*)"`, so a value is never printed.
  - **S4's expected:** *each call exits non-zero with no output. A variable found set exits 0 and is a `fail`, reported by name only*.
  - **W7's check:** add *the session launched with `--debug-file <tmp>/gates-w7.debug.log`, which W8 reads*.
- [ ] **§5: T2 and TD2.**
  - **T2's check:** the gates started in the run copy with `bash scripts/run-test-suite.sh <label>` and collected with `bash scripts/run-test-suite.sh --wait <label>`, repeated while it prints `pending`, judged from `<label>.verdict` and `<label>.log` under `<state_dir>/test_run_logs/<branch>/`. Then one sentence of why: a single foreground `bash scripts/test.sh` cannot outlast the Bash tool's 10-minute cap (the 2026-10-27 run), and this is the route real runs take (§7 OR6).
  - **T2's expected:** add *network denials in the log, such as `api.anthropic.com:443`, are recorded, not graded*.
  - **TD2's check:** the explicit form is spelled with the session's `TMPDIR` resolved first by `printenv TMPDIR` in a session of its own, and passed as a literal path, `mktemp <TMPDIR>/harness-gates.XXXXXX`, which `Bash(mktemp:*)` matches.
  - **TD2's expected:** add *a call refused at the permission layer, the control included, is `not run`*.

**Verification:**

- `git diff -- docs/sandbox-verification.md` touches only the eleven rows. In each changed row, the cells after the expected column (Observed, Verdict) are byte-identical to `HEAD`'s.
- Each check cell names the exact command its leg file now builds. Compare against `scripts/lib/sandbox-probe/legs-*.sh` for T2, TD2, N3, N4, S4, P1b and R4.
- No line number appears in any edited cell.
- The scope register's derivation entries 1 and 3, re-run, reach no row outside the register.
