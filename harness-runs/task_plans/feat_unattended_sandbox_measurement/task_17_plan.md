### Task 17 — Document Gate 15 in `docs/development.md` §5

**Goal:** Add the hand-run gate, numbered after `scripts/run-gates.sh`'s existing gates, to `docs/development.md` → `## 5. Verifying a change`. It lists every probe leg with its expected result and its row, the command that runs the probe, and where each result is recorded. It names sandbox3b's Linux and GitHub legs as owned by sandbox3b, and the clone-layout rows this probe does not take as hand rows, so the list is complete.

**Depends on:** Task 1, which fixes the leg table the gate restates, and Tasks 5–12, which fix each leg's expected result. The gate's table is built from `bash scripts/sandbox-probe.sh --list`, so the two agree.

**Why fifteenth.** The existing gates run 1–14. The probe gate is hand-run, so it joins gates 5, 7, 8, 9, 10 and 12 as one a person runs. Task 18 brings the counts in line; this task adds the gate itself.

### Targets

- `docs/development.md` — the new **Gate 15** block under `## 5. Verifying a change`.

**Work:**

- [ ] **The Gate 15 block**, in the form of the existing gate blocks (a bold `**Gate 15 — the unattended sandbox probe (macOS).**` opener, prose, then fenced commands). It states:
  - what the gate measures and that it is hand-run because a person starts the probe (auto mode refuses a `claude -p` carrying `--allowedTools`), from a session or from a terminal, with the commands in the fenced block below. The prose carries no inline invocation; it names which line of that block is for a terminal and which for a session;
  - that CS1's probe set includes the installed plugin root, and CS1's evidence records whether the per-run profile lists it or only the runtime's write roots refused it (Task 10). This sentence sits in the prose below the leg table, not in the table, so the table still matches `--list` line for line;
  - that it changes nothing outside its temp area, the probe clone and the probe branch, and refuses to start unless the main checkout is on its default branch, the watcher is idle, and the live profile is the one `doctor` grades;
  - that every result is recorded by the person into the named row in `docs/sandbox-verification.md`, and that this branch records none.
- [ ] **The leg table**, one row per probe leg: the leg name, the `docs/sandbox-verification.md` rows it measures, its expected result in one phrase, and where the result is recorded. Build it from `--list` output so it matches the probe. L1's expected phrase is `not run — unreachable on the clone layout` (Task 9).
- [ ] **The command**, in a fenced block, one command per line (`harness-runs/lessons.md`, the adopter-command lesson):

  ```
  bash scripts/sandbox-probe.sh --list
  bash scripts/sandbox-probe.sh run
  ! bash scripts/sandbox-probe.sh run
  bash scripts/sandbox-probe.sh print-parity-script
  ```

  The prose around the block names the `bash scripts/sandbox-probe.sh run` line as the terminal form and the `! bash scripts/sandbox-probe.sh run` line as the form typed into a session.
- [ ] **The rows outside this probe, named so the list is complete without claiming them**, in one short paragraph:
  - sandbox3b's legs — the Linux legs (local container and GitHub-hosted runner) and the Linux-only legs — as `feat_sandbox_probe_linux_legs`'s;
  - the clone-layout rows that stay **hand rows**: **CS5** (needs a legacy worktree run, one whose registry record carries no `copy_kind`, resumed by the watcher), **CS6** (needs a job-mode clone outside the sibling glob, adopted with `init --force`, on the base profile) and **CS8 (b)** (needs the base profile edited and a watcher tick). Each is measured by hand as its row in `docs/sandbox-verification.md` describes. The story index → `## Context` → *Interpretations this plan takes* gives the reason for each.
- [ ] **The `docs/` document rule** (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, *A prose document under `docs/`*): this is a gate inside an existing document, so it inherits that document's who-reads-it statement; no new document is created.

**Verification:**

- The Gate 15 leg table lists every leg `bash scripts/sandbox-probe.sh --list` prints, with the same rows; compare the two line for line.
- Every command an adopter runs sits in a fenced block, one per line, never inlined: no `sandbox-probe.sh` invocation appears in Gate 15's prose, and the fenced block carries both `bash scripts/sandbox-probe.sh run` and `! bash scripts/sandbox-probe.sh run` as separate lines.
- Gate 15's prose names the plugin root as a CS1 target, outside the leg table.
- Gate 15 names sandbox3b as the owner of the Linux and GitHub legs, and names CS5, CS6 and CS8 (b) as hand rows.
- The count sentences are Task 18's; this task adds the block and leaves the counts to it.
