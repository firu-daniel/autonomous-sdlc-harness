### Task 3 — Record PD20–PD23 as fixed by this branch in `docs/sandbox-verification.md` §5, with confirmation owed to the next container run

**Goal:** Rewrite the **Follow-up** cell of §5 rows PD20, PD21, PD22 and PD23 (the table under **The probe's own defects (2026-10-27 to 2026-11-02).**) so each reads as fixed by `fix_sandbox_probe_linux_recipe_gaps`. Each cell says what changed and where, and says the next Gate 15 container run confirms it. **No measured result is invented:** no row gains an observation, a date of a run, or a verdict that is not already recorded in the row it cites.

**Depends on:** Task 1 and Task 2, whose landed changes these cells describe.
- **Task 1** adds `cli/test/fixtures/sandbox-probe/linux-busy-inter-device.jsonl` and a third `cases` entry, `'inter-device move failed … Device or resource busy'`, in `cli/test/sandbox-probe-judge.test.mjs` → the test `'PD23: Permission denied and Device or resource busy are sandbox refusals, on Linux only'`. It leaves `scripts/lib/sandbox-probe/judge.sh` unchanged.
- **Task 2** edits `docs/development.md` → Gate 15's *A Linux run, in a local container*. The host block reads the VM's sysctl and gives `colima ssh -- sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` as a named departure. The root block reads `useradd -m -s /bin/bash probe`. A block creates the `~/.ssh/config` placeholder. A run block opens with `git push --dry-run origin HEAD:refs/heads/sbx-cred-check` and reads `${PIPESTATUS[0]}` after a `tee`. A **Copy the evidence out before leaving the container.** step `docker cp`s the evidence directory, `~/.claude/projects` and the run logs. The absent-path check's clone lines point to the credential line.

Name those anchors as written here. If a landed name differs, use the landed one and say so in your return.

**Where this task stops.** It edits the Follow-up cells of the four rows and nothing else:
- the Defect and Rows cells stay as they are;
- the paragraph that opens the table stays as it is;
- §0's departures, §8's rows (S1, S2, CS1, GW2 (Linux) among them) and §9's rows are measured records, left as they are (scope register rows 21–57).

### Targets

- `docs/sandbox-verification.md` → §5, the PD20, PD21, PD22 and PD23 rows' Follow-up cells (scope register rows 32–35).

**Work:**

- [ ] **PD20.** Replace "Owed, no branch: …" with a cell that carries:
  - Fixed by `fix_sandbox_probe_linux_recipe_gaps`.
  - Gate 15's *A Linux run, in a local container* (`docs/development.md`) now reads the VM's `kernel.apparmor_restrict_unprivileged_userns`, gives the `colima ssh -- sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` line, and has the record name it as a departure, with the value read.
  - The restricted case, a `bwrap` AppArmor profile installed, stays the GitHub-hosted runner's (#194, IS1–IS4 in §9, not yet measured).
  - Not yet confirmed by a run: the next container run confirms it.
- [ ] **PD21.** Replace "Owed, no branch: …" with a cell that carries:
  - Fixed by `fix_sandbox_probe_linux_recipe_gaps`.
  - The recipe creates a placeholder `~/.ssh/config` as `probe` before the run. It holds one comment line, no key and no host entry, and mirrors the runner workflow's `ssh-config` step, which the cell already cites.
  - Not yet confirmed by a run: §8 rows S1 (Linux) and S2 (Linux) keep the `not run` they record until the next container run.
- [ ] **PD22.** Replace "Owed, no branch: …" with a cell that opens with "Fixed by `fix_sandbox_probe_linux_recipe_gaps`" and then names each of the four fixes:
  1. The evidence directory, `~/.claude/projects` and the run logs are copied out with `docker cp` before the container exits. Only `projects` is copied, never the OAuth credential beside it.
  2. The exit status is read as `${PIPESTATUS[0]}` after the `tee`.
  3. The user is created with `useradd -m -s /bin/bash probe`.
  4. The credential is cached by `git push --dry-run origin HEAD:refs/heads/sbx-cred-check` before the first probe clone.

  Then say that the absent-path check, which reuses the clone lines, runs the credential line before its `run --leg headless-parity`, and that *The suite on Linux, by hand* and *The suite under jq 1.6, by hand* needed none of the four. Keep the existing sentence about the runner workflow's `sandbox-probe-evidence` artifact. End with: not yet confirmed by a run.
- [ ] **PD23.** Replace "The three shapes are in the judge's Linux table since `feat_sandbox_probe_job_mode`, taken from the strings quoted in this row; not yet confirmed by a run." with a cell that opens with "Fixed by `fix_sandbox_probe_linux_recipe_gaps`", then keeps the clause "The three shapes are in the judge's Linux table since `feat_sandbox_probe_job_mode`, taken from the strings quoted in this row", then adds this branch's check against the evidence, shape by shape:
  - **`Permission denied` is kept.** F9's fix removed only the run copy's trio placeholders (AP2). AP5 on `fc5aab79` (2026-10-31) still reads `<main>/.mcp.json` and the six other non-trio paths as `/null` placeholders inside the sandbox, and CS1's and GW2's `dd` met exactly those.
  - **`Device or resource busy` is kept.** A rename onto a present path mounted read-only over itself, as `<clone>/.git/config`, is not touched by F9's fix. §8 rows RG2 (Linux) and RG3 (Linux) record `pass` on it, with `Device or resource busy`.
  - **The `inter-device move failed: … unable to remove target: Device or resource busy` line is kept.** The same string matches it.

  Then add:
  - No shape was added or dropped, and `scripts/lib/sandbox-probe/judge.sh` is unchanged.
  - Each shape has a fixture in `cli/test/sandbox-probe-judge.test.mjs` with a no-platform twin holding the macOS grade. This branch added the inter-device one, `linux-busy-inter-device.jsonl`.
  - Not yet confirmed by a run.
- [ ] **Style.** Keep each cell in the table's existing voice, plain prose with code spans and the `§`/row cross-references the neighbouring rows use. Leave out line numbers and `**Verdict**`-style bold. Keep each cell on one table line.

**Verification:**

- `git grep -n 'Owed, no branch' -- docs/sandbox-verification.md` reaches none of PD20–PD23's rows.
- `git grep -n 'fix_sandbox_probe_linux_recipe_gaps' -- docs/sandbox-verification.md` reaches the four Follow-up cells only, and each of those cells opens with "Fixed by `fix_sandbox_probe_linux_recipe_gaps`". Each of them carries `not yet confirmed by a run`.
- `git diff -- docs/sandbox-verification.md` touches exactly the four PD rows' lines. No other line changes, and in particular no §0, §8 or §9 row and no Observed or Verdict cell anywhere.
- No **new** result appears in the added text: it states no verdict, observation or date that is not already recorded in the row it cites. Each verdict the added text quotes (`pass`, `fail` or `not run`) names its source row, and only these are cited: §8 RG2 (Linux) and RG3 (Linux) (`pass`, with `Device or resource busy`), §8 S1 (Linux) and S2 (Linux) (`not run`). The AP5 observation and its date 2026-10-31 name §5 AP5 on `fc5aab79`. Check each quoted verdict, observation and date against the row it names, by reading that row on the branch head; each must match what the row records. No date later than 2026-11-02 appears.
- Every path, symbol and anchor named in the four cells resolves on the branch head. Check with `git grep` or by reading: the `docs/development.md` lines from Task 2, Task 1's fixture file and its case, and `SP__LINUX_SANDBOX_STRINGS` in `scripts/lib/sandbox-probe/judge.sh`.
- Re-run the story index's scope-register derivation entries 1 and 2 verbatim. Every hit in `docs/sandbox-verification.md` falls inside a site the register names, and only rows 32–35 show a diff.
