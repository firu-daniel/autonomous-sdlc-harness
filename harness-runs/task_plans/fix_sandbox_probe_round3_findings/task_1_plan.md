### Task 1 — Restate the changed legs' expectations in the leg table and Gate 15, and make CS8 (b) a probe half there

**Goal:** Update the probe's one declaration of what each leg expects (`scripts/lib/sandbox-probe/core.sh` → the `sp_leg_declare` calls) for the six legs this branch changes. Make the same edit to its restatement in `docs/development.md` → Gate 15, and move CS8 (b) out of Gate 15's list of hand rows.

**Why the two files are one task.** `cli/test/sandbox-probe-git-and-legs.test.mjs` → *"Gate 15's restated leg table matches --list, row for row"* compares the `Expected` cell of each Gate 15 table row with the third field `--list` prints. Change one without the other and the suite fails. This task changes no grading: Tasks 2–6 change the legs, and they read the expectations stated here.

### Targets

- `scripts/lib/sandbox-probe/core.sh` — six `sp_leg_declare` description strings.
- `docs/development.md` → `## 5. Verifying a change` → the Gate 15 leg table (the same six rows), and the paragraph beginning `**The rows this probe does not take, named so the list is complete.**`.

**Work:**

- [ ] `core.sh`: replace the third argument of `sp_leg_declare` for these six legs, byte for byte. Leave the rows, the "Recorded in" argument and every other leg as they are.
  - `wrappers`: `the main checkout's wrappers run outside the sandbox and land on the clone, while the clone's own copies, the compound and both assignment prefixes stay sandboxed or are neutralised, each prefixed call allowed through --allowedTools; a measured call refused at the permission layer is not run, and every result names the layer that answered`
  - `planted-config`: `each wrapper refuses a scratch repository or a clone whose .git/config carries a planted key before any git call, and no marker is created; a wrapper call refused at the permission layer is not run`
  - `write-protection`: `every write to the clone's protected paths, to <main>/.git and to the per-run profile, the per-run profile's Edit included, is refused while its control is written, a dd refused at the permission layer is not run, and neither this leg's debug log nor W7's carries an unmatched-rule line`
  - `git`: `ordinary git in the clone succeeds under the real per-run profile, git fetch origin is refused by the network allowlist as the clone layout intends, each CL5 write is refused or written as recorded, and a call refused at the permission layer is not run`
  - `network`: `hosts off the allowlist are refused, a loopback listener the probe owns returns no body to the session, a link-local host's curl error line is graded against the same call issued unsandboxed from the probe's own shell and is not run where the two cannot be told apart, and a call carrying allowed_domains does not reach its host`
  - `invalid-profile`: `the control's call is refused, on the invalid profile the marker is recorded as written or refused, and the watcher's own run_profile_check refuses a scratch per-run copy whose sandbox.failIfUnavailable is a string while it accepts the unmodified one`
- [ ] `docs/development.md` Gate 15 table: set the `Expected` cell of the same six rows (`` `wrappers` ``, `` `planted-config` ``, `` `write-protection` ``, `` `git` ``, `` `network` ``, `` `invalid-profile` ``) to exactly the strings above. The test strips every backtick from a cell and trims it before comparing (`.replaceAll('`', '').trim()`). So the doc may wrap a code token in backticks, as the existing `write-protection` row does with `<main>/.git`. Every other character must match.
- [ ] `docs/development.md` → the `**The rows this probe does not take, named so the list is complete.**` paragraph:
  - Change *"Three clone-layout rows stay **hand rows**"* to *"Two clone-layout rows stay **hand rows**"*.
  - Drop the `**CS8 (b)**` clause from the list, leaving CS5 and CS6 joined by *"and"*.
  - Replace the closing sentence *"The `invalid-profile` leg takes CS8 (a) only."* with one sentence. It says that the `invalid-profile` leg takes both halves: (a) through a session, and (b) by calling the watcher's own `run_profile_check` on a scratch per-run copy, in a child shell that sources `autonomous-watcher.sh status`, so no run is launched and the live watcher is untouched.
  - Every other sentence of the paragraph stays byte-identical.

**Verification:**

- Source-text check, no script run: for each of the six new strings, `grep -F` of the full string against `scripts/lib/sandbox-probe/core.sh` matches exactly one line, and that line is the third `sp_leg_declare` argument of its own leg. The same string equals the `Expected` cell of the matching Gate 15 table row in `docs/development.md` once that cell's backticks are removed and it is trimmed. The row-for-row comparison of `--list` against Gate 15 is made by `cli/test/sandbox-probe-git-and-legs.test.mjs` in the Run gates phase; this unit does not run it.
- None of the six new strings carries a `|`, a tab or a double quote. A `grep -c` of each string's first ten words returns one hit in `core.sh` and one in `docs/development.md`.
- `git diff -- docs/development.md` touches only the six table rows and the one paragraph named above.
- The type check (`bash scripts/typecheck.sh`) parses `core.sh`.
- **Deviations from plan:** The first-ten-words `grep -c` gives 1 in `core.sh` for all six strings. In `docs/development.md` it gives 1 for five of them and 0 for `write-protection`. That row keeps the plan-sanctioned backticks around `<main>/.git`, which falls inside its first ten words, so a raw-text count cannot match. The cell-equality check stands in for it: `bash scripts/scratch-run.sh harness-runs/scratch/task1_leg_table_check.py <repo_root>` compared each `sp_leg_declare` third argument with its Gate 15 `Expected` cell after `.replace("`", "").strip()`, and printed `ALL OK` for all six. It also confirmed that each string occurs exactly once in `core.sh` and carries no `|`, tab or double quote.
