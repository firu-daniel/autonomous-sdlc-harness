### Task 23 — Add `## 9. The GitHub-hosted runner legs`, each row *not yet measured*, and point the existing rows at job mode

**Goal:** Give the Linux runner's results their own section with a **stable heading** in `docs/sandbox-verification.md`, because sandbox3c (#167) writes it up and sandbox4 (#144) cites it for its in-job routes. The heading is `## 9. The GitHub-hosted runner legs`. It carries no *(owed)* suffix, unlike §8's, so filling it never renames a heading another document cites. Gate 15 names it (Task 15). **Every row says *not yet measured*. No measured result is invented.** Each row states its expected result on the runner beside its macOS and container baselines, so the later record says *same* or *different* rather than re-arguing it. The existing rows the story index's `## Scope register` marks `change` are pointed at job mode.

**Depends on:**

- **Task 15**, which restates Gate 15 with job mode, the `| Leg | Job rows |` table, the runner workflow's instructions and the heading. This record cites Gate 15 rather than repeating it.
- **The legs and rows are Task 1's.** In job mode:
  - `wrappers`: P1c, CW5, P1b, CW6;
  - `planted-files`: L1;
  - `write-protection`: W6, W8;
  - `network`: N1–N5;
  - `credentials`: S1, S2, S4, S5;
  - `detached`: BG9, WF5;
  - `loopback`: LB1–LB5;
  - `job-layout`: CS6;
  - `runner-install`: IS1–IS4;
  - `runner-pid`: PN1–PN3;
  - `runner-privs`: NN1, NN2.
- **The expected results are Tasks 7–13's grades.** P1b over HTTPS is graded on `ls-remote` alone (Task 11). W8 reads the write-protection log alone (Task 12). N4 uses the workflow's metadata-service control (Task 10). L1 is taken on the checkout's own `HEAD`, reachable as Task 21's fixture shows (Task 13).

**Where this task stops.** It edits `docs/sandbox-verification.md` only. §8 is unchanged, and its CS1 (Linux) and GW2 verdict cells, graded `blocked: F9` by the maintainer, are not re-graded although PD23's shapes are now in the judge.

### Targets

- `docs/sandbox-verification.md`

**Work:**

- [ ] **The new section**, after §8's last row and preceded by a `---` rule as the other sections are. It opens with:
  - **what the section is:** the rows `scripts/sandbox-probe.sh`'s job mode takes on a GitHub-hosted runner, through `scripts/sandbox-probe-runner.yml` committed by hand to the Gate 12 repository (Gate 15); that sandbox3c writes it up and sandbox4 cites it; and that the full run on the real job is `chore_sandbox_gate12_full_run_leg`'s, not this section's;
  - **a `**Stamp.**` line**, to be filled by the person who takes the rows: the date; the workflow run's id; the `runner` stamp lines (`ImageOS`, `ImageVersion`, `uname -r`, `bwrap --version`); the probe commit and the CLI release; the Claude Code version; the probe's exit status from `exit.txt`; and the `job-sweep:` lines. Every row carries this stamp, because `ubuntu-latest` moves from Ubuntu 24.04 to 26.04 between 2026-10-19 and 2026-11-19 (`actions/runner-images#14748`);
  - **reading rules:**
    - a refusal is expected to read as §8's do;
    - the canary is reported by count only;
    - the metadata service's control by status line only;
    - a control that did not succeed makes its row `not run`, never a pass;
    - a call refused at the permission layer is `not run` (PD9).
- [ ] **The table**, `| # | Check | Expected on the runner | macOS baseline | Container baseline | Observed | Verdict |`. Observed reads **not yet measured.** and Verdict `not yet measured` in every row. Baselines quote each row's latest recorded verdict with its run and date, or *none*. First the new ids, in leg order:
  - **IS1–IS4.** Expected, as Task 7 grades them:
    - IS1: the sysctl recorded;
    - IS2: `bubblewrap` and `socat` installed, neither being in the Ubuntu 24.04 or 26.04 image's software list (`actions/runner-images`, images `20261026.354.1` and `20261026.180.1`, checked 2026-11-01);
    - IS3: `/etc/apparmor.d/bwrap` written exactly when the sysctl reads `1`;
    - IS4: `bwrap` starting as the runner user, and `sandbox-prerequisites` passing.

    Baselines: none on macOS. The container's are §0's AppArmor departure and PD20: the sysctl read `1`, `bwrap` failed `setting up uid map: Permission denied`, and the VM's sysctl was then set to `0`, which the runner must not do.
  - **PN1–PN3 and NN1, NN2.** Expected, as Task 8 grades them, the sandbox-runtime README's *"its own PID namespace and a fresh `/proc`"* (checked 2026-10-24) quoted as the expectation and not as a result. NN1's control is GitHub's documented passwordless `sudo` (*GitHub-hosted runners reference*, checked 2026-11-01). Baselines: none.
- [ ] **Then the runner rows of existing ids**, each `#` cell reading `<id> (runner)`, in job-table order:
  - P1c, CW5, P1b and CW6, with P1b's HTTPS reading; L1, reachable on the checkout's own `HEAD`; W6 and W8, W8 on one log;
  - N1–N5, N4's Expected stating the metadata-service rule: any HTTP status line is an answer, a response to the sandboxed call is a `fail` when the control answered, and the macOS comparison applies when it did not;
  - S1, S2, S4 and S5, S1 and S2 with the workflow's placeholder `~/.ssh/config` (PD21);
  - BG9 and WF5, BG9 in BG2's shape: a job's gate run detaches that way (F6), so this matters to every job;
  - LB1–LB5, in both the `127.0.0.1` and `localhost` forms, with and without `127.0.0.1` listed: the runner half of F8's decision in #170;
  - CS6, the job layout's own row.

  Each Check cell reads `<id> on a GitHub-hosted runner, in job mode, as its row (§<n>)`, plus any departure. The macOS baseline is the row's latest macOS result. The container baseline is its §8 or §5 Linux result, for example `BG9: fail, F10 (2026-10-29)` and `LB1–LB4: the host listener unreachable (2026-10-29)`, or *none*.
- [ ] **The existing rows, in place.**
  - **CS6 (§2):** Observed becomes **not yet measured**, naming the `job-layout` leg that takes it, locally (Gate 15's local recipe) and on the runner (`CS6 (runner)`, §9). Verdict stays *not run — owed*.
  - **Follow-up cells:**
    - F10: `BG9 (runner)` in §9 takes it on a GitHub-hosted runner, not yet measured;
    - PD20: the restricted case is IS1–IS4 in §9, not yet measured, and the container recipe's line stays owed;
    - PD21: the runner workflow creates the placeholder, and the container recipe's stays owed;
    - PD22: the runner workflow uploads the kept evidence as an artifact, and the container recipe's four items stay owed;
    - PD23: *the three shapes are in the judge's Linux table since `feat_sandbox_probe_job_mode`, taken from the strings quoted in this row; not yet confirmed by a run*.
  - **The opening `**Since then.**` paragraph** gains one sentence: §9 holds the rows the probe's job mode takes on a GitHub-hosted runner, all owed.

**Verification:**

- `grep -n '^## 9. The GitHub-hosted runner legs$' docs/sandbox-verification.md` finds the heading once, and `grep -n '## 9. The GitHub-hosted runner legs' docs/development.md` finds Gate 15's citation of it.
- Every row in §9 carries **not yet measured** in Observed and Verdict: `grep -nE '^\| (IS|PN|NN)[0-9]' docs/sandbox-verification.md` shows each new id once, each with `not yet measured`. The ids read back against Task 1's leg table, not against a count.
- `grep -nE '^\| [A-Z]+[0-9]+[a-z]? \(runner\) \|' docs/sandbox-verification.md` lists exactly the existing-id job rows of `bash scripts/sandbox-probe.sh --list --job`, read back line by line.
- `git diff docs/sandbox-verification.md` shows hunks only in the Since-then paragraph, row CS6, the Follow-up cells of F10 and PD20–PD23, and the new §9.
</content>
</invoke>
