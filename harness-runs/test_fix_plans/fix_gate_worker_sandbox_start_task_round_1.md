# Test Fix Plan: fix_gate_worker_sandbox_start — task round 1

## Context

- **Branch:** `fix_gate_worker_sandbox_start`
- **Log:** `harness-runs/test_run_logs/fix_gate_worker_sandbox_start/task_round_1.log`
- **Summary:** The typecheck gate passed. The test gate failed on two checks. Gate 4 (`npm test`) had 10 failing tests, all in `cli/test/launch-sandboxed-gates.test.mjs`, all for one reason: the launcher's own `nohup` launch line, which this branch left in place, exits at once inside the session's macOS sandbox (`nohup: can't detach from console`, this branch's F17). Gate 6a (no machine paths) flagged the flow walker's gitignored, machine-local state file `harness-runs/.flow_walker_state`.

Gates 13a–13c reported `BLOCKED` (the Python service environment is not provisioned), and 13d and 14d reported `SKIPPED`. The wrapper does not count these as failures (`run-gates: 2 failed, 22 passed`), so they yield no finding and no not-fixable entry.

---

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. The loop walks the `[ ]` entries from top to bottom, and only the committing role flips an entry to `[x]`. A `[ ]` marker anywhere else, such as a sub-step bullet inside a per-finding file, is informational only. Each entry resolves to a self-contained `finding_<K>.md` through its `**Finding K**` reference. The entries are sorted lowest blast-radius first. Finding 2 is the suspected root cause of Findings 3–11, so it comes before them. Each of those still keeps its own entry.

1. [x] **Finding 1** — Gate 6a: exclude the flow walker's machine-local state file `harness-runs/.flow_walker_state` from `scripts/check-machine-paths.sh`. _(layer: cli, general)_
2. [x] **Finding 2** — Start the launcher's supervisor through `( trap '' HUP; exec … )` instead of `nohup`; fixes `(g)(h) a started run is pending…`. _(layer: cli, general)_
3. [x] **Finding 3** — `(i) a bwrap that exits at once: did not start, quoting its line` gets `nohup`'s line instead of the bwrap stub's. _(layer: cli)_
4. [x] **Finding 4** — `(k) a registered clone takes its protected paths from the recorded per-run profile…` refused before `pending`. _(layer: cli)_
5. [x] **Finding 5** — `(r) a clone whose record only the sandbox probe's sp__render wrote is launched…` refused before `pending`. _(layer: cli)_
6. [x] **Finding 6** — `(q) job mode: the registry run_job leaves accepts the main checkout…` refused before `pending`. _(layer: cli)_
7. [ ] **Finding 7** — `(s) job mode: the wrappers leg's control-clone record…` refused before `pending`. _(layer: cli)_
8. [ ] **Finding 8** — `(t) F15: job mode with <main>/scripts/.git protected and absent…` refused before `pending`. _(layer: cli)_
9. [ ] **Finding 9** — `(n) a redirected XDG_STATE_HOME or HOME does not choose the clone's profile` refused before `pending`. _(layer: cli)_
10. [ ] **Finding 10** — `(l) the vector binds the target's .git read-only…` refused before `pending`. _(layer: cli)_
11. [ ] **Finding 11** — `(m) the vector pins Claude Code's built-in protected paths…` refused before `pending`. _(layer: cli)_

---

## Must Fix

### 1. Gate 6a flags the flow walker's machine-local state file
→ [finding_1.md](fix_gate_worker_sandbox_start_task_round_1/finding_1.md)

### 2. The launcher's `nohup` supervisor launch does not start in the macOS session sandbox — test (g)(h)
→ [finding_2.md](fix_gate_worker_sandbox_start_task_round_1/finding_2.md)

### 3. Test (i): the refusal quotes `nohup`'s line, not the bwrap stub's
→ [finding_3.md](fix_gate_worker_sandbox_start_task_round_1/finding_3.md)

### 4. Test (k): registered clone launch refused before `pending`
→ [finding_4.md](fix_gate_worker_sandbox_start_task_round_1/finding_4.md)

### 5. Test (r): `sp__render`-recorded clone launch refused before `pending`
→ [finding_5.md](fix_gate_worker_sandbox_start_task_round_1/finding_5.md)

### 6. Test (q): job-mode main-checkout launch refused before `pending`
→ [finding_6.md](fix_gate_worker_sandbox_start_task_round_1/finding_6.md)

### 7. Test (s): job-mode launch with a status-less control-clone record refused before `pending`
→ [finding_7.md](fix_gate_worker_sandbox_start_task_round_1/finding_7.md)

### 8. Test (t): F15 job-mode launch refused before `pending`
→ [finding_8.md](fix_gate_worker_sandbox_start_task_round_1/finding_8.md)

### 9. Test (n): redirected `XDG_STATE_HOME` / `HOME` clone launch refused before `pending`
→ [finding_9.md](fix_gate_worker_sandbox_start_task_round_1/finding_9.md)

### 10. Test (l): `.git` read-only vector case refused before `pending`
→ [finding_10.md](fix_gate_worker_sandbox_start_task_round_1/finding_10.md)

### 11. Test (m): built-in protected paths vector case refused before `pending`
→ [finding_11.md](fix_gate_worker_sandbox_start_task_round_1/finding_11.md)

---

## Not fixable on this branch

None. The `BLOCKED` Python gates (13a–13c: `python-service: not provisioned: no synced environment at <home>/.cache/devscene-docs-retrieval/venvs/1280089236; run bash scripts/python-service.sh sync`) and the `SKIPPED` 13d and 14d are not failures by the wrapper's own count, so they are not listed here.

---

## Source failures

All failures are classed *new this round*, because the prompt names no earlier-round log.

**Gate `typecheck` (`commands.typecheck`):** exited 0. No failures.

**Gate `test` (`commands.test`):** exited 1.

| Failure (as the log names it) | Maps to | Class |
|---|---|---|
| gate 4 `npm test`: `not ok 507 - (g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept` | Finding 2 | new this round |
| gate 4 `npm test`: `not ok 508 - (i) a bwrap that exits at once: did not start, quoting its line` | Finding 3 | new this round |
| gate 4 `npm test`: `not ok 510 - (k) a registered clone takes its protected paths from the recorded per-run profile, and refuses without one` | Finding 4 | new this round |
| gate 4 `npm test`: `not ok 511 - (r) a clone whose record only the sandbox probe's sp__render wrote is launched, and refused before it` | Finding 5 | new this round |
| gate 4 `npm test`: `not ok 513 - (q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding` | Finding 6 | new this round |
| gate 4 `npm test`: `not ok 514 - (s) job mode: the wrappers leg's control-clone record, which carries no status, does not refuse the main checkout` | Finding 7 | new this round |
| gate 4 `npm test`: `not ok 515 - (t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder` | Finding 8 | new this round |
| gate 4 `npm test`: `not ok 516 - (n) a redirected XDG_STATE_HOME or HOME does not choose the clone's profile` | Finding 9 | new this round |
| gate 4 `npm test`: `not ok 519 - (l) the vector binds the target's .git read-only after every denyWrite entry, closing the omit trio` | Finding 10 | new this round |
| gate 4 `npm test`: `not ok 520 - (m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry` | Finding 11 | new this round |
| gate 6 `6a no machine paths` | Finding 1 | new this round |

Gate 4 itself (`FAIL 4 npm test (exit 1, 1765 s)`, `# fail 10`) is fully accounted for by the ten rows above.
