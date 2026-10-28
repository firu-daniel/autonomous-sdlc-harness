### Task 12 — Amend the call and Expected columns of the rows whose grading this branch changes

**Goal:** Bring the Check (call) and Expected columns of `docs/sandbox-verification.md` in line with what the probe now calls and how it now grades, for every row Tasks 2–6 changed. **The branch records no result:** every Observed and Verdict cell, and every line outside the amended cells, stays byte-identical. That includes the §5 F7 and PD rows, the §2 intro and **Stamp.** paragraphs, and the §6 bullets, even where they now call CS8 (b) a hand row. The record branch after the rerun restates those.

**Depends on:** Tasks 2–6. The behaviour each amended cell describes is restated per bullet below, so this task needs no other per-task file.

**How a row is edited.** A row is one Markdown table line, `| # | Check | Expected | Observed | Verdict |`. Edit only the second and third cells, and find each row by its `| <id> |` anchor, never by a line number. Where only a clause is added, append it to the existing Expected text as a final sentence and leave the rest as it is. The clause is: *"A call refused at the permission layer never reached the layer this row measures and is `not run`."* Use the row's own noun in place of "call" (`dd`, wrapper call, `git config`).

### Targets

- `docs/sandbox-verification.md` — rows CS1, CS2, CS3, CS4, CS7, CS8, CS15, CL5 (§2); P3, P1c, CW2, CW5, CW6, C1, C2, K2, CW3, CW4 (§3); N4 (§4).

**Work:**

- [ ] **The wrappers rows** (Task 2 now screens every measured call; CW6 is allowed through its own rule):
  - **CS4, P3, CW2:** append the permission clause to Expected.
  - **P1c and CW5:** remove the clause that counts a permission-layer refusal as staying sandboxed. In P1c that is *"or the call is refused at the permission layer"*; in CW5, *"or the call is refused at the permission layer; record which"*. Keep CW5's *"and whether `refs/heads/<branch>` moved"* requirement, and append the permission clause in its place.
  - **CW6 Check:** say that the call is issued in P1b's session through `--allowedTools "Bash(<that exact call>)"`, as P1b's is, so it reaches the sandbox instead of stopping at the permission layer.
  - **CW6 Expected:** append that a permission-layer refusal never reached the sandbox or the `excludedCommands` match and is `not run`, and that the result names the layer that answered the call.
- [ ] **The planted-config rows** (Task 4: `sp__pc_refusal` grades a permission-layer refusal `not run`): **C1, CW3, C2, K2, CW4, CS15**. Append the permission clause to Expected, naming the wrapper call. Each row's existing *"A wrapper that proceeds is a `fail`"*-style sentence stays.
- [ ] **The write-protection and git rows** (Task 3):
  - **CS1, CS2, CS7:** append to Expected *"A `dd` refused at the permission layer never reached the sandbox and is `not run`."* In CS7, leave every word about its `Edit` half as it is.
  - **CS3:** append *"A call refused at the permission layer never ran and is `not run`."* Its fetch sentence is unchanged.
  - **CL5:** append *"In the probe's `git` leg, a `git config sbx.probe true` refused at the permission layer never reached the sandbox and is `not run`."*
- [ ] **CS8** (Task 6):
  - **(b)'s Check:** replace the hand procedure (back up and edit the base, drop a throwaway task, wait for a tick, restore and `cmp`) with the probe's form. In the `invalid-profile` leg, the probe sources `<main>/scripts/autonomous-watcher.sh status` read-only in a child shell and calls the watcher's own pre-launch check, `run_profile_check <bad> <clone>`, on (a)'s `<bad>`. The control is the same check on the unmodified `<run profile>`. No run is launched and the live watcher is untouched.
  - **(b)'s Expected:**
    - **`pass`:** refused before launch with *"`<bad>` does not carry sandbox.enabled true, sandbox.failIfUnavailable true and sandbox.allowUnsandboxedCommands false, and names no sandbox opt-out"*.
    - **`fail`:** accepted, which is a watcher finding for a follow-up task prompt.
    - **`not run`:** a refusal by any other clause, or a control the check refused.
  - **(a)'s Expected:** append that a call on `<bad>` refused at the permission layer, or never issued, is `not run`.
- [ ] **N4** (Task 5):
  - **Check:** add that, right after the session, the probe issues the same `curl -sS --max-time 5 http://169.254.169.254/` itself, from its own shell, outside any session and unsandboxed, as L2's call is. Nothing is bound to a link-local address.
  - **Expected:** keep the refusal-string and response sentences, and replace *"an error line that cannot tell a refused connect from an unreachable host is `not run`"* with the comparison:
    - `pass` when the control got a response or ended with a different curl exit code;
    - `not run` when it ended with the same code. That is the stock-Mac case where the two cannot be told apart, and the row says so in those words.
    - Elapsed time is not compared, because an interface with no link-local route fails at once too.

**Verification:**

- For every amended row, the Observed and Verdict cells are byte-identical. Split each changed line of `git diff -U0 -- docs/sandbox-verification.md` on ` | ` and compare fields 4 and 5 of the `-` line with those of the `+` line; they must be equal for every pair.
- `git diff --stat -- docs/sandbox-verification.md` changes exactly as many lines as the rows listed under Targets, and no other line.
- `grep -nE '^\| (CS1|CS2|CS3|CS4|CS7|CS8|CS15|C1|C2|K2|CW2|CW3|CW4|CW5|CW6|P3|P1c|CL5|N4) \|' docs/sandbox-verification.md` lists each amended row once, and each amended row still splits into exactly five cells.
- No new line coordinate, measured value, date or Claude Code version appears in an amended cell.

**Deviations from plan:**

- P1c and CW5: the permission clause uses the rows' own noun, *"A compound call refused at the permission layer …"*, and is appended to P1c as well as CW5, so that removing P1c's counts-as-sandboxed clause does not leave a permission-layer refusal ungraded.
- CW5: removing *"or the call is refused at the permission layer; record which"* word for word would have left *"fails as CW2, and whether …"* with no verb. The kept requirement now reads *"the wrapper fails as CW2; record whether `refs/heads/<branch>` moved."*
- The verification bullets were run by a scratch script (`harness-runs/scratch/t12_verify.py`, through `scripts/scratch-run.sh`) that splits each `-`/`+` pair of `git diff -U0` on ` | `. All 19 pairs split into 5 cells on both sides, with the id, Observed and Verdict cells equal. `git diff --stat` shows 19 insertions and 19 deletions, one line per Targets row, and the anchor `grep -cE` returns 19.
