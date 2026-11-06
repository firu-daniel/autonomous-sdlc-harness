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

**Deviations from plan:**

- **Result, for Task 7.** Two runs of `bash scripts/scratch-run.sh harness-runs/scratch/sgt_redrive_pieces.mjs`, before = `7f7bb33d2f4ec6c56cad963dbe598e4f9990eb3f` (merge base with `origin/dev`), after = `c2fd6729829ec65792038c09ce3dc07247b42baa` (`HEAD`). The `#counts` line reads `2.1: rows=264 hold=256 moved-by-branch=8; 2.2: rows=42 hold=42; 2.5: rows=115 hold=115`. No row is `stale-before-branch`, and no field reads `ERROR(`. The eight moved rows are:
  - `r3a`–`r3d`, `match` → `no-match`.
  - `DF3:hc_in_workspace-alone` and `DF4:hc_in_workspace-alone`, `allow` → `SILENT`.
  - `DF3:refusing-leg` and `DF4:refusing-leg`, `$top test` → `veto on the cd arm`.
  - The shipped `DF3` and `DF4` rows hold `SILENT` on both trees. Only the leg that refuses them moved, from the `$top` test to the sibling `cd` arm's veto.
  - No keeper row (K1–K13), no positive control (Q11–Q15) and no sweep row moved.
- **Byte identity, checked through a probe.** A compound `cp`/`cmp` command, and then a bare `shasum`, were refused by the tool layer. Identity was established with a second scratch file, `harness-runs/scratch/sgt_redrive_hash.mjs`, run after each driver run. Both runs printed sha256 `86842774bb490d77f0b402c1ea375393a2c7ba20b3d7d383673e223a3202675d`, and the second printed `IDENTICAL to previous`, with 424 lines.
- **`rm -r-f` in `r3a`–`r3d`, not `rm -rf`.** This follows §0's benign stand-in rule. The matcher result cannot differ, because `-` is inside every class the arms and vetoes test.
- **Fixture additions beyond §0.**
  - A tracked `sdlc-harness/.keep` in the primary, so `cd <state_dir>` (A15) names a directory that resolves as an anchor.
  - A tracked `packages/@acme/storefront/.keep` in the scoped fixture, for the same reason, for K13.
  - A bare repository added as remote `origin`, which is what `<remote>` stands for.
  - These fixture details are not stated in the document.
- **The variants were applied to both trees.** The two D/F single-test variants and the trailing-redirect "strip removed" column were each applied to a scratch copy of both trees, not only to the after tree, so `class` is computed on them too. The variants are: `*) return 1 ;;` → `*) continue ;;` after the `$top` case, `hc_in_workspace` test → `if false`, and the redirect `sed` line → `:`. Variant recorded values map the table's `permits` → `allow` and `refuses` → `SILENT`.
- **A derived refusing-leg row for each D/F row.** Its `recorded` is the leg the document's columns imply. The leg is derived on each tree from four readings: the shipped decision; the `cd` piece judged by `hc_matches_any_pattern` with and without the `!` lines; and the two variants.
- **Interpretations.**
  - `<b>` is `feat_old` and `<pkg>` is `left-pad`.
  - The configured subcommand is `ci`, and the multi-word one (K2) is `run build --workspace packages/storefront`.
  - E1/E2's `<dir>` is `/x`.
  - K12's "behind an ordinary `-C` rewrite" is `git -C <app_dir> status && rm <repo>/<tracked>`.
  - The E/G rows take the rewrite composition, except EG7, which takes the leading anchor, and EG8/EG9, which are their own compound.
  - §2.5's "three ways" applies to the sweep. Q1–Q15 are driven as the document spells each row.
  - The C family is enumerated as 36 pair compositions plus 30 four-shape compounds per guard, as written on the TSV's `#enumerated` line.
- **Environment.** `/bin/bash` was 3.2.57(1)-release, matching §0, but `jq` was 1.8.2, not §0's 1.7.1.
- **TSV encoding.** A backslash is written `\\`, a newline `\n` and a tab `\t`. Nothing is truncated.
