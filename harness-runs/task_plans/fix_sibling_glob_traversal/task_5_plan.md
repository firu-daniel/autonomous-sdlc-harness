### Task 5 — Re-drive §2.1, §2.2 and §2.5's piece-matching matrices on paired trees

**Goal:** Re-drive every row of `docs/guard-verification.md`'s three piece-matching standing matrices on both the base tree and the fixed tree, back to back in one session. Those are §2.1 helper call-order composition, §2.2 expansion-bypass rows and §2.5 directory de-quoting. The point is that any recorded decision this branch moves is found, and recorded with its argument, rather than discovered later. The task prompt requires this: *"Re-drive §2's standing matrices against the fixed tree. Any recorded decision that moves is either a finding or is argued in its row."* Store every reading in full. No document is edited here.

**Depends on:** Task 3. The tree at `HEAD` then carries Task 2's library change, which is the only decision change on this branch: paired `!` veto globs under each wildcard-bearing path-anchored arm, honoured by `hc_matches_any_pattern`. Task 3 changed comments only. **Task 6** re-drives the other §2 matrices. **Task 7** owns the document, reads this task's output by the path below, and re-runs this driver before writing. Keep the path and the format exactly as specified.

**Which rows this branch can move, so you know where to look first.** Only rows whose command carries a `cd` piece, or a tail-free `<runner> --prefix <dir>` piece, can be reached by a veto:
- the `cd` arms in §2.1's family **A**;
- §2.1's **D/F.** table, whose traversal rows will gain a refusal before either containment test is reached;
- §2.2's K13.
Every row is still re-driven, because a row you expect not to move is exactly the claim the document says must be measured.

### Targets

- `harness-runs/scratch/sgt_redrive_pieces.mjs` (new, gitignored) — the driver, writing `harness-runs/scratch/sgt_redrive_pieces.tsv`.

**Why `.mjs`, not `.sh`.** `scripts/scratch-run.sh` refuses a `.sh` file by design (its `SCRATCH_INTERPRETERS` table carries `py js mjs cjs rb dart php`, and a `.sh` probe exits 66). The driver is a Node ES module that spawns `/bin/bash <tree>/plugin/hooks/<guard>.sh` for each guard with a fixed argument vector and the payload on the child's stdin, and spawns `git` and `tar` the same way — never through a shell string it assembles.

**Work:**

- [ ] **Paired trees and fixtures, built by the driver.**
  - **"before"** is `plugin/hooks` at the branch's merge base with `origin/dev`, and **"after"** is `plugin/hooks` at `HEAD`. Take each with `git archive --format=tar --output=<file>` then `tar -xf`, into the system temp directory.
  - Build the fixtures `docs/guard-verification.md` → `## 0. Method` and §2.1's **Fixtures** paragraph describe: the primary, the scoped fixture, and a real sibling worktree added with `git worktree add` on an ordinary branch. Build them on a resolved path, never inside this checkout.
  - Run every guard with `/bin/bash`.
- [ ] **§2.1, every row each table and family states.**
  - The call-order rows are states rather than decisions. Drive the payload each row names, then record the guard decision.
  - Drive both trees for the families:
    - **A** (one helper at a time);
    - **B** (the states table);
    - **C** (every pair in both orderings, and the four-shape compound forward, reversed, poisoned at each position, under mixed separators and wrapped in parens);
    - **D/F**;
    - **E/G**;
    - the trailing-redirect rows;
    - the residual rows. The third residual, *"fed a whole two-line command directly, `hc_matches_any_pattern` **matches** a `cd <repo> *` arm across the newline"*, is not a guard decision, so drive it as the document did. On each tree, run `/bin/bash` with a fixed argument vector that sources that tree's `plugin/hooks/lib/harness-config-lib.sh` and calls `hc_matches_any_pattern "$piece" "$(hc_path_anchored_patterns <repo>)"`. Pass the piece as an argument and never splice it into the script text. Record the exit status as `match` (0) or `no-match`. Drive one row per wildcard-bearing family, each with a literal newline followed by `rm -rf <outside>`:
      - `r3a`: `cd <repo> 2>/dev/null` + newline, so the after tree's `cd <repo> *[<>]*` arm matches and only its vetoes decide;
      - `r3b`: `cd <repo> x` + newline, the before tree's original spelling;
      - `r3c`: `cd <work_root>/<project_name>-x` + newline;
      - `r3d`: on the scoped fixture, `npm --prefix <work_root>/<project_name>-x` + newline + `rm -rf <outside>/<app_rel>`, so the newline sits inside the wildcard and the arm's trailing `/<app_rel>` matches after it.
      These rows take `guard` = `hc_matches_any_pattern` and `recorded` = `match`. Task 7 restates §2.1's residual bullet and §2.4 inventory row `g` from them.
  - Where a family is stated as a rule rather than a list (A, C), enumerate it from the rule and record the count you enumerated.
  - For **D/F**, also drive the two single-test variants the table's columns describe: `hc_in_workspace` alone, and the `$top` test alone, each a one-line change to a scratch copy of the after tree. Record, for each D/F row, which leg refuses it on the after tree.
- [ ] **§2.2, every hole row (A1–A6, B1–B4, C1–C8, D1–D2, E1–E4, F1–F3), anchor control (U1–U2) and keeper row (K1–K13), with its composition rule.** Rows carrying a `-C` take the leading `git -C <repo> status &&` the anchor note requires, and E1, E2 and K13 take none. K7 is driven in full as the composition paragraph says.
- [ ] **§2.5, rows Q1–Q15 (with Q6b), plus the subcommand sweep its section describes (every `git ` entry `hc_safe_prefixes` resolves, plus the six deliberately unsafe subcommands), driven three ways** (unquoted, double-quoted, single-quoted), on both trees.
- [ ] **One TSV, read by Task 7.** Write one line per row to `harness-runs/scratch/sgt_redrive_pieces.tsv`, with the columns `section`, `row`, `guard`, `cwd`, `command`, `recorded`, `before`, `after`, `class`. `recorded` is the decision the document prints for that row. `class` is:
  - `hold` when all three agree;
  - `moved-by-branch` when `after` differs from `before`;
  - `stale-before-branch` when `before` differs from `recorded`, which is a record that was already wrong before this branch and is reported, not attributed to it.
  Write every field in full, never truncated. A trailing line counts each class per section.

**Verification:**

- The driver runs to completion through `bash scripts/scratch-run.sh harness-runs/scratch/sgt_redrive_pieces.mjs`, and a second run produces a byte-identical TSV.
- Every `moved-by-branch` line is a `cd` or tail-free `--prefix` shape, and its `after` is `SILENT`. The direct-matcher rows `r3a`–`r3d` are the one exception: there, `moved-by-branch` means `match` → `no-match`. An `r3` row reading `no-match` → `match` is a finding against Task 2. Report any other `moved-by-branch` line in your return by section and row, because it is either a finding or a decision Task 7 must argue in its row.
- No keeper row of §2.2 (K1–K13) and no positive control of §2.5 (Q11–Q15) reads `moved-by-branch`. If one does, report it as a finding against Task 2.
- After the run, the fixture configurations are byte-identical to their pristine copies, which the driver diffs and reports.
