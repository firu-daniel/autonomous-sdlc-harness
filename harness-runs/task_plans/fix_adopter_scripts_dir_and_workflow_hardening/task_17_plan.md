### Task 17 — Document gates 6f and 14d and record the audit figures in `docs/development.md`, and record the hook comment edits in `docs/guard-verification.md`

**Goal:** Two records of measured fact. First, `docs/development.md` → `## 5. Verifying a change` documents the two new legs and records the two audits as measured facts: what was measured, the command and the exact message (`.claude/context/conventions.md` → `## Documents of record`). The before figure is the 2026-10-09 baseline the story index reproduced. The after figure is the branch's own result. Second, `docs/guard-verification.md` → `### 3.8 Recorded as changing no decision` records Task 13's comment-only edits to three guards, as the rule that any guard change records itself there requires (`.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts`; `plugin/hooks/README.md`, closing paragraph).

**Depends on:** Tasks 13 and 14.

Task 13's hook edits are these, each inside a `#` comment line and nothing else:
- `plugin/hooks/git-commit-branch-guard.sh` and `plugin/hooks/autonomous-protected-branch-guard.sh`: "payload unparseable" becomes "payload unparsable" in the outcome table;
- `plugin/hooks/autonomous-script-allowlist-guard.sh`: "got mis-split into fragments" becomes "got split wrongly into fragments".

Task 14's legs:
- **`node scripts/check-rendered-workflows.mjs --zizmor`** is leg 14d. It runs `zizmor` from `PATH` or `uvx zizmor@1.30.1` and exits `4` when neither resolves. Its residual set is keyed on file, audit and job: `harness-run.yml` `artipacked` on `run` and `collect`, and `adhoc-packages` on `run`; `harness-resume.yml` `artipacked` on `poll`; `harness-trigger.yml` `artipacked` on `trigger`; `harness-control.yml` `artipacked` and `adhoc-packages` on `control`.
- **`bash scripts/check-typos.sh`** is leg 6f. It runs `typos` from `PATH` or `uvx --from typos@1.51.1 typos`, exits `4` when neither resolves, and carries its deliberate set keyed on path and word.

**Where this task stops.** These two files only; it edits no hook. The Gate 12 hand-run round on the hardened workflows is the operator's to record after it runs (story index → `Manual setup required:`), so this task writes no Gate 12 round.

### Targets

- `docs/development.md`
- `docs/guard-verification.md` — one appended row in `### 3.8 Recorded as changing no decision`

**Work:**

- [ ] **Gate 6's legs.** Beside `6c` – `6e`, add **6f**: its command in its own fenced block, what it fails on, its deliberate set with the reason for each entry, and that it is SKIPPED — never a pass — where neither `typos` nor `uvx` resolves. The command is:

  ```
  bash scripts/check-typos.sh
  ```

- [ ] **Gate 14.** In `**Gate 14 — the rendered workflows parse.**`, add **14d**: its command in its own fenced block, the residual set with each reason in one line, the exit-`4` SKIPPED rule shared with 14c, and how to install `zizmor` on `PATH` where wanted, each command in its own block. The leg's command is:

  ```
  node scripts/check-rendered-workflows.mjs --zizmor
  ```

- [ ] **Record the before and after figures**, measured rather than remembered.
  - **Before.** The story index's 2026-10-09 baseline: `uvx zizmor@1.30.1 --offline --no-config --format=plain .github` over a copy of the 0.6.5 templates printed `59 findings (34 suppressed, 6 unsafe fixes): 0 informational, 2 low, 6 medium, 17 high`, exit `14`. `uvx --from typos@1.51.1 typos --format brief cli/templates plugin schemas cli/src` printed 69 hits, exit `2`.
  - **After.** This branch's figures, taken by a probe under `harness-runs/scratch/` run through `bash scripts/scratch-run.sh <probe>`, with the date, the tool versions and the exact summary lines it printed. These are not wall-clock figures, so in-run measurement is admissible (`harness-runs/lessons.md` → `## Evidence and measurement`).
- [ ] **Update the gate count.** Where §5 states which gates `scripts/run-gates.sh` runs unattended and which are SKIPPED where a tool is missing, keep it in agreement with Task 14's `run-gates.sh` header.
- [ ] **`docs/guard-verification.md`: record the hook comment edits.** Append one row to the `### 3.8 Recorded as changing no decision` table, after its last row, in the style of the existing FAIL-CLOSED-header row ("comment and reason text at constant line count"):
  - **What was corrected:** the spellings `typos` flagged in three guards' header comments — "payload unparseable" → "payload unparsable" in the outcome tables of `git-commit-branch-guard.sh` and `autonomous-protected-branch-guard.sh`, and "got mis-split into fragments" → "got split wrongly into fragments" in `autonomous-script-allowlist-guard.sh`.
  - **The check that licensed it:** comment text only, at constant line count; `git diff -U0 -- plugin/hooks` against the branch base shows only `#` lines, so no arm and no cell of any matrix moves.
  - Touch nothing else in the file: no other row, no matrix, no section prose. The paragraph under the table ("None of these is a row of §3.1–§3.6…") still holds and stays as written.

**Verification:**

- **The after figures are real.** Every figure in the new text traces to a command shown beside it, and the after figures match the probe output this task's return quotes.
- **The guard record matches the diff.** `git diff -U0 main -- plugin/hooks` shows only lines starting with `#`, and every changed comment it shows is named in the new §3.8 row, and the row names nothing the diff does not show. `git diff main -- docs/guard-verification.md` shows only the one added table row.
- **Each leg's sets match the scripts.** `grep -n "6f\|14d" docs/development.md`, read against `scripts/run-gates.sh`: the leg names match byte for byte. The residual set and the deliberate set match the allow-lists in `scripts/check-rendered-workflows.mjs` and `scripts/check-typos.sh`.
