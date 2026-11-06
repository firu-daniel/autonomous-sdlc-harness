### Task 6 — Re-drive §2.3's fail-closed matrix, §2.4's rows a–l and §2.6's file-tool rows on paired trees

**Goal:** Re-drive every row of the remaining standing matrices in `docs/guard-verification.md` on both the base tree and the fixed tree, back to back in one session:
- §2.3, the fail-closed matrix with its single-guard gates;
- §2.4, the disclosed residuals' rows `a1`–`l16` with their sweeps;
- §2.6, the file-tool guard's rows.
The task prompt requires this: *"Re-drive §2's standing matrices against the fixed tree. Any recorded decision that moves is either a finding or is argued in its row."* Store every reading in full. No document is edited here.

**Depends on:** Task 3. The tree at `HEAD` then carries Task 2's library change, which is the only decision change on this branch: paired `!` veto globs under each wildcard-bearing path-anchored arm, honoured by `hc_matches_any_pattern`. Task 3 changed comments only. **Task 5** re-drives §2.1, §2.2 and §2.5. **Task 7** owns the document, reads this task's output by the path below, and re-runs this driver before writing. Keep the path and the format exactly as specified.

**What can and cannot move, so you know where to look first.**
- In §2.3, nothing a veto reaches sits on a fail-closed path: every closed condition exits before the arms are built. So the expected movement there is none, and that is the claim being measured.
- In §2.4, the rows carrying a `cd` piece or a tail-free `--prefix` piece are the reachable ones: a3, b2, b3, b7, i8 and l16.
- §2.6's guard, `plugin/hooks/git-trust-file-guard.sh`, does not source the library. Its rows are driven anyway, as the standing record of a matrix the branch did not touch.

### Targets

- `harness-runs/scratch/sgt_redrive_config.mjs` (new, gitignored) — the driver, writing `harness-runs/scratch/sgt_redrive_config.tsv`.

**Why `.mjs`, not `.sh`.** `scripts/scratch-run.sh` refuses a `.sh` file by design (its `SCRATCH_INTERPRETERS` table carries `py js mjs cjs rb dart php`, and a `.sh` probe exits 66). The driver is a Node ES module that spawns `/bin/bash <tree>/plugin/hooks/<guard>.sh` for each Bash guard with a fixed argument vector and the payload on the child's stdin, sets each condition's `PATH` through the child's environment, and spawns `git` and `tar` the same way — never through a shell string it assembles.

**Work:**

- [ ] **Paired trees and fixtures, built by the driver.**
  - **"before"** is `plugin/hooks` at the branch's merge base with `origin/dev`, and **"after"** is `plugin/hooks` at `HEAD`. Take each with `git archive --format=tar --output=<file>` then `tar -xf`, into the system temp directory.
  - Build the fixtures `## 0. Method` and §2.4's **Fixtures** paragraph describe: the primary, the scoped fixture, a symlink inside the primary pointing at an outside directory, and the `refs/heads/*` process cwd for row (c). Build them on a resolved path, never inside this checkout.
  - Keep a pristine copy of every configuration and restore it after any condition that rewrites it.
  - Run every Bash guard with `/bin/bash`.
- [ ] **§2.3, the whole matrix: every condition row × every probe column, the control sweep re-taken after every condition, and every single-guard configuration gate, on both trees.**
  - The `jq` older than 1.5 condition uses a stand-in on `PATH` that answers `--version` and exits 3 on the constructs §1.4 lists.
  - The `jq` absent condition uses a `PATH` that holds `bash` and `git` but no `jq`.
  - Record each cell with its arm suffix (`ᵘ`, `ᵖ`, `ᵈ`) wherever the guard's reason string distinguishes it, because the matrix's invariant reads the arm as well as the word.
- [ ] **§2.4, every row of (a), (b), (c) with its cwd sweep, (d) with its sweep over every prefix `hc_safe_prefixes` resolves, (e)–(g), (i), (j)–(k) with the s-rows, and (l), each against the fixture and the guard its subsection names.** The `before` and `after` trees here are this branch's pair, not the subsection's own historical columns. Read each subsection's `decision` / `after` / `shipped` column as its `recorded` value.
- [ ] **§2.6, rows T1–T17, each for `Edit`, `Write` and `NotebookEdit` where the row says so.** Drive them with payloads straight into `plugin/hooks/git-trust-file-guard.sh`, using the fixture §2.6's opening paragraph describes, on both trees.
- [ ] **One TSV, read by Task 7.** Write one line per cell to `harness-runs/scratch/sgt_redrive_config.tsv`, with the columns `section`, `row`, `guard`, `condition`, `command`, `recorded`, `before`, `after`, `class`. `class` takes the same three values Task 5 uses:
  - `hold` when all three agree;
  - `moved-by-branch` when `after` differs from `before`;
  - `stale-before-branch` when `before` differs from `recorded`.
  Write every field in full, never truncated. A trailing line counts each class per section.

**Verification:**

- The driver runs to completion through `bash scripts/scratch-run.sh harness-runs/scratch/sgt_redrive_config.mjs`, and a second run produces a byte-identical TSV.
- No §2.3 cell inside the closed-condition span reads `after` = `allow` where `recorded` is not `allow`, and the control sweep before and after the conditions is identical cell for cell. Report any break in your return as a finding.
- Every `moved-by-branch` line is a `cd` or tail-free `--prefix` shape whose `after` is `SILENT`, or is reported in your return by section and row.
- No §2.6 row reads `moved-by-branch`. If one does, report it as a finding, because that guard sources nothing this branch changed.
- After the run, the fixture configurations are byte-identical to their pristine copies, which the driver diffs and reports.
