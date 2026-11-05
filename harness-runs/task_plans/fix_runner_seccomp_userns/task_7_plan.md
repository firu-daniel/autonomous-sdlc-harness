### Task 7 — Record the round-13 cause and the fix in `docs/sandbox-verification.md` §9, and restate the rows the fix changes

**Goal:** The record of measurement states what failed in Gate 12 round 13, why, and what this branch changed. The runner result for the fixed step is stated as owed to the Gate 12 redo, and **no measured result is invented**. The record's rows whose expectation the fix changes must say so, without rewriting what was observed before it.

**Depends on:** Tasks 3, 4 and 6.

- **Task 3:** the template step disables `/etc/apparmor.d/bwrap-userns-restrict` when present, writes and loads `/etc/apparmor.d/bwrap` with `apparmor_parser -r`, then always runs `bwrap --unshare-user --dev-bind / / -- unshare -U -r true` on Linux. It fails the job with an `::error::` quoting the child's `/proc/self/attr/current` and the check's stderr, unless `sandbox.optOut` is taken. On success it prints `The sandbox prerequisites are present.` on the early path, followed in every passing case by one line naming what it did.
- **Task 4:** `doctor`'s `sandbox-prerequisites` runs the same check on Linux and WSL2 when `bwrap` and `unshare` resolve. It FAILs in both modes when the check fails, and keeps the AppArmor file reading as context.
- **Task 6:** the probe runner's copy is identical, and IS3's grading is unchanged.

**This is a catch-all task.** Its targets are documents of record at the repository root. Per `.claude/context/conventions.md` → `## Documents of record`, a measured fact states what was measured, the command and the exact message.

### Targets

- `docs/sandbox-verification.md`: §9 *The GitHub-hosted runner legs* (a new block before its table, and row IS3), §8 rows DP1 and DP5, and §10 row FR2. §8's RF1–RF4 stay as they are (story index `## Scope register`, rows 31–34).
- `docs/development.md`: the **FR2** bullet's *"Source:"* sentence only.

**Work:**

- [ ] **§9: add a block after *"Reading a runner result."* and before the table**, under a bold lead such as **Round 13 (2026-11-05): no sandboxed command ran on Ubuntu 26.04.** It carries, from the task prompt's *"What was measured"* and nothing else:
  - **Probe run `41980588326`.** The stamps: `claude 2.1.318`, `ubuntu26` `20261026.180.1`, kernel `7.0.0-1017-azure`, `bubblewrap 0.11.1`, `kernel.apparmor_restrict_unprivileged_userns: 1`. IS1–IS4 passed and `doctor --remote-job` reported `PASS sandbox-prerequisites`. Then every sandboxed command answered the quoted `apply-seccomp: write /proc/self/setgroups (nested userns is capability-restricted; caller must provide CAP_SYS_ADMIN): Permission denied`, and the run ended 11 pass, 3 fail, 33 not run.
  - **The resumed harness job, run `41981613528`** (`ubuntu-26.04` `20261101.186.1`): its session stopped after 8 turns, quoting *"Every Bash call fails the same way, including the bare command `true`"*.
  - **The diagnosis**, on runs `41985478942`, `41985774282` and `41985915463` of `firu-daniel/harness-gate12`, branch `diag_seccomp_userns`, findings 1–4 in a few sentences each:
    - the stock `bwrap` / `unpriv_bwrap` profiles, `audit deny capability`, and why a local `allow` cannot override it;
    - `bwrap//&unpriv_bwrap (enforce)` read after the step's `tee` and `systemctl reload apparmor`, 18 of 18 reloads, and the one unexplained `bwrap (unconfined)` reading;
    - the sysctl ruled out on 26.04;
    - `srt` from `@anthropic-ai/sandbox-runtime@0.0.81` showing the same 24.04/26.04 split with no Claude involved.
  - **The fix measured by hand**, finding 5: the four commands in a fenced block, one per line; 9 of 9 on three runners and two image builds; and the three sandbox refusals that still held inside `srt`, each with its quoted message.
  - **Why IS1–IS4 and `doctor` passed anyway.** `doctor` judged from files (finding 6). IS4 starts `bwrap` with `--unshare-all` but never creates a namespace inside it.
  - **What this branch changed**, in one paragraph pointing at `docs/remote-execution.md` §8 and `docs/cli.md` §7: the step, the check, and the watcher's launch refusal.
  - One sentence: **the fixed step's runner result is owed to the Gate 12 redo after the next release.** No row's *Observed* or *Verdict* cell is filled by this branch.
- [ ] **§9 row IS3: restate the *Expected on the runner* cell.** The step writes `/etc/apparmor.d/bwrap` when the sysctl reads `1` and the file is absent or carries no `userns,` line, **or** when `/etc/apparmor.d/bwrap-userns-restrict` exists. IS3 grades only the first rule. A write made only because the stock profile exists, with the sysctl not at `1`, reads `not run`. That mirrors the comment Task 6 wrote in `legs-runner.sh`. Leave every other cell of IS3 and every other IS row as they are.
- [ ] **§8 rows DP1 and DP5: restate the *Expected* cell only, prefixed *"Since `fix_runner_seccomp_userns`:"*.**
  - **DP1:** with both packages and `unshare` on `PATH`, the check also runs `bwrap --unshare-user --dev-bind / / -- unshare -U -r true`. A pass needs that check to pass, and a failed check is a `FAIL` in both modes.
  - **DP5:** an uncertain AppArmor answer is a warning only where the nested check did not run. Where it ran, the file reading is context and the check is the verdict.
  - In each, keep the old expectation's words that still hold.
  - State that the 2026-10-29 *Linux run 1* observation predates the nested check. Leave the *Observed* and *Verdict* cells as they are. State also that the container's result for the nested check is **owed to the next Gate 15 Linux run** and is not measured here. In DP1's restatement, add that the watcher's launch probe now refuses on the same failed check, and that no existing row grades that refusal: its result is owed to the same Gate 15 run.
- [ ] **§10 row FR2: restate the *Expected* cell only, prefixed *"Since `fix_runner_seccomp_userns`:"*.** Keep *"what it installs is recorded, and `Preflight with doctor` then passes"*, and add: the step's nested user-namespace check (`bwrap --unshare-user --dev-bind / / -- unshare -U -r true`) passes and the step prints its success line before `Preflight with doctor` runs; a failed check stops the job at the step with one `::error::`, which is a `fail` for this row. Leave the *Observed* and *Verdict* cells at `not yet measured`, and every other FR row as it is.
- [ ] **`docs/development.md` → the FR2 bullet's *"Source:"* sentence.** Keep `The sandbox prerequisites are present.` as a quoted output of the early path, and add the rest of what the step now prints:
  - the success line naming whether `bwrap-userns-restrict` was disabled, whether the profile was loaded, and that the nested check passed;
  - a `::warning::` per thing it could not do;
  - one `::error::` that fails the job before `Run the harness` when the nested check fails, unless `sandbox.optOut` is taken.

  Leave the rest of FR2 and every other FR row as they are.

**Verification:**

- Every run id, version, image build, count and quoted message added to §9 appears in `harness-runs/task_prompts/fix_runner_seccomp_userns_task_prompt.md`. Check each one against that file. A figure that is not there is removed, never kept.
- `grep -nE '^\| (DP1|DP5|IS3|FR2) \|' docs/sandbox-verification.md` shows the four restated rows. A `git diff` of §8, §9 and §10 shows no change to any *Observed* or *Verdict* cell, and no change to any RF row.
- The four remedy commands sit in a fenced block, one command per line (lessons ledger, *Adopter-facing documentation*). Each matches `bwrapUsernsRestrictRemedy()` in `cli/src/doctor/sandboxPrerequisites.ts` byte for byte.
- No new sentence cites a line number. Every cross-reference is a section number or a quoted heading.
  - **Deviations from plan:** The figure-by-figure check of §9's new block against the task prompt was planned as one scripted `grep -F` loop; that compound command was refused by the permission layer (don't-ask mode). The check rests instead on reading: every run id, stamp, count and quoted message in the block was copied from the task prompt's *"What was measured"* as read in this session, and compared against it by eye. The remedy block's fourth line drops the prompt's trailing comment (`# the profile the step already writes`) so the four lines match `bwrapUsernsRestrictRemedy()` byte for byte; the comment's content is carried as the sentence after the block.
