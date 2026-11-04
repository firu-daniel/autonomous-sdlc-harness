### Task 3 — Point `docs/remote-execution.md`'s unmeasured records at the round and add its Gate 12 rows

**Goal:** Make the three post-release records in `docs/remote-execution.md` name where they are now taken: the install step's, the job-surface check's and the state bundle's. Add the `sandbox1e4` §10 behaviours as rows of `## 6. What is not verified here`, the document's "Gate 12 rows". Every record stays *not yet run* or *not yet measured*.

**Depends on:** Task 1, which defines `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round` and its row ids, and Task 2, which defines `docs/development.md` → **Gate 12** → **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.** and **The sandbox series round (#170 step 4) — not yet run.** This task cites those anchors and ids byte for byte, as the story index's `## Context` fixes them. It restates no procedure and no expectation beyond one line per site: the gate is Task 2's and the rows are Task 1's.

### Targets

- `docs/remote-execution.md`: `## 6. What is not verified here` (its behaviour table and its opening paragraph), `## 8. Choosing a runner` → **The step has not yet run on GitHub.**, and `## 11. Security` → **The branch's own files are checked before the job trusts them.** (its **The post-session steps on a job that passed.** and **The check on a real GitHub job is a post-release follow-up, not yet run.** bullets).

**Work:**

- [ ] **§8, the install step.** In **The step has not yet run on GitHub.**, keep the first two sentences: it is unmeasured. Replace *"Its first real run is the full-run leg of roadmap item 21 ([`development.md`](development.md) §6)."* with a sentence that does three things:
  - names the first real run as Gate 12's observation (xvi), the full-run leg of roadmap item 21, taken in **The sandbox series round (#170 step 4)**, both in [`development.md`](development.md) §5;
  - names its rows as [`sandbox-verification.md`](sandbox-verification.md) §10 FR2, beside §9 IS1–IS4;
  - keeps the roadmap-item citation.
- [ ] **§11, the job-surface check.** In **The check on a real GitHub job is a post-release follow-up, not yet run.**, keep the bold lead and the four numbered steps unchanged. After step 4, add one sentence saying where it is taken, still not yet run:
  - the honest arm is FR5, in observation (xvi);
  - the payload arms are JS1 and JS4, in the round's step 7;
  - the stalled-watchdog arms are JS3 and JS3N, in step 8, the default-branch leg;
  - their results go to [`sandbox-verification.md`](sandbox-verification.md) §10.
- [ ] **§11, the state bundle.** In **The post-session steps on a job that passed.**, after *"the check on a real job follows the first release that carries them, and will observe …"*, add one sentence:
  - the honest bundle is FR6, in (xvi);
  - the planted links and the untrusted `stateDir` are SB2 and SB3;
  - the artifact's content and the optional `upload-artifact` and background-process checks are SB4, all in the round's step 7;
  - all are *not yet measured*.
- [ ] **§6, the Gate 12 rows.** Add three rows to the behaviour table, in its four columns `| Behaviour | What rests on it | Source | If it is wrong |`, one per `sandbox1e4` §10 item, each with Source *"None: not yet measured. Gate 12's sandbox series round, step <n>, in [`development.md`](development.md), takes it; [`sandbox-verification.md`](sandbox-verification.md) §10 <id>."*:
  - **(a)** a real `run` job, under the base profile passed unchanged as `--settings`, cuts no copy, renders no per-run copy, writes nothing under the machine state directory, and passes `run_profile_check`. Step 6 and FR1.
  - **(b)** a branch whose profile fails that check (for example `sandbox.enabled: false` with no opt-out marker) launches nothing, and the job records `failed` with the `not launching` reason. Step 7 and RJ2.
  - **(c)** a local `remote-run.sh start <branch>`, then `review`, from a mirror of the Gate 12 repository. Each cuts a clone at `hr_worktree_dir`, pushes, dispatches, and removes the clone, the branch it DWIM-created, the registry record it wrote and a registry directory it made. A pre-existing record is restored byte for byte, and `ls <work_root>` shows no new copy. Step 9 and RJ3.

  Fill **What rests on it** and **If it is wrong** from the design text the behaviour rests on, cited by heading: job mode in §1 and §4, and the remote-run commands. Do not state an outcome that is not in the shipped text. In the section's opening paragraph, add one clause that these three rows are taken by that round, not yet run.

**Verification:**

- `git grep -n "not yet run\|not yet measured" docs/remote-execution.md` still lists **The step has not yet run on GitHub.** and **The check on a real GitHub job is a post-release follow-up, not yet run.**. Each of the four edited sites names the round or observation (xvi) and a §10 row id.
- Every row id the file now cites, from `git grep -o -E "(FR[0-9]+|JS[0-9]+N?|SB[0-9]+|RJ[0-9]+)" -- docs/remote-execution.md`, is ⊆ Task 1's id set as the story index's `## Context` lists it.
- The §6 table still has four cells in every row. The three new rows carry no measured result, no run id and no date of a run.
- No new line carries a line-number citation or an absolute machine path. The four numbered steps of the job-surface bullet are byte-identical to before.
