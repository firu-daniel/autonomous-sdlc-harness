### Task 7 — Record the closure in `docs/guard-verification.md` — §2.4 row `(m)`, the §2.4 (a) correction, the §2 re-drive, §3.1, §1.2, §1.3 and §1.5

**Goal:** Write this branch's record of the closure into the document that owns the guard set's measurements. The record covers:
- a new §2.4 inventory row `(m)`, marked **CLOSED** with its closing arm named, and its row set and fault injection;
- §2.4 (a)'s `cd` sentence corrected for a session in a run copy;
- the outcome of re-driving §2's standing matrices, with every moved row argued in its row;
- a §3.1 block for the decisions that changed;
- §1.3's fork counts before and after;
- §1.2's composite row left explicitly owed to a hand re-take, with the paired recipe that takes it;
- a §1.5 note of this branch's own.

Every figure comes from the three drivers' output, re-run here, and no figure is typed from memory.

**Depends on:**
- **Task 4**, which owns `harness-runs/scratch/sgt_mrows.mjs` (writing `sgt_mrows.tsv` and `sgt_shell.txt`) and `harness-runs/scratch/sgt_forks.mjs` (writing `sgt_forks.tsv`).
- **Task 5**, which owns `harness-runs/scratch/sgt_redrive_pieces.mjs` (writing `sgt_redrive_pieces.tsv`).
- **Task 6**, which owns `harness-runs/scratch/sgt_redrive_config.mjs` (writing `sgt_redrive_config.tsv`).
- **Task 3**, whose guard headers and `plugin/hooks/README.md` cite `docs/guard-verification.md` §2.4 row `(m)`. This task creates that row, so those citations resolve once it lands.

The formats, restated:
- **`sgt_mrows.tsv`:** `id fixture cwd guard command before after v1 v2 v3 v4`, plus a summary line. Its ids:
  - m1–m4, m10–m21, m23–m27 and m10w–m14w are holes;
  - m5–m9 are SILENT-both controls;
  - m22 and m28–m39 are keepers;
  - m40–m42 are costs;
  - m43 is an observation;
  - a8 and a9 are the run-copy symlink rows;
  - `v1` drops the `/..` vetoes, `v2` the class vetoes, `v3` the operand vetoes with the space-suffixed `cd` arms restored to ` *`, and `v4` all of them.
- **`sgt_forks.tsv`:** `tree guard payload jq git sed grep tr cat`.
- **The two re-drive TSVs:** `section row guard cwd|condition command recorded before after class`, where `class` is `hold`, `moved-by-branch` or `stale-before-branch`.

**What changed, restated so this file stands alone.**
- Task 2 made `hc_path_anchored_patterns` emit `!`-prefixed veto globs directly under each wildcard-bearing arm, and made `hc_matches_any_pattern` grant a piece only when it matches an arm and none of that arm's vetoes.
- The vetoes refuse what a `*` matched when it carries a literal `/../`, a trailing `/..`, or a character outside `[A-Za-z0-9._/-]`.
- The space-suffixed `cd <root|app_dir|state_dir> *` twins became `cd <dir> *[<>]*`, with vetoes admitting only one redirection word, which closes zsh's two-operand `cd`.
- Two subsumed sibling arms, `cd <work_root>/<project_name>-*/<appDir>` and `/<stateDir>`, keep a scoped `appDir` under a sibling allowed.
- `hc_runner_words` skips a `!`-led word.
- No guard's code changed.

**Binding on this task.** It follows the clarification answer recorded in the story index's `## Context`:
- write this branch's own record;
- do not cite or reproduce commit `622d4ca0` or the branch `chore_record_guards_from_clone`;
- leave the i19 row alone;
- put no wall-clock figure measured inside this run into the document.

### Targets

- `docs/guard-verification.md`.

**Work:**

- [ ] **Re-take the evidence, then write from it.** Run, in order:
  - `bash scripts/scratch-run.sh harness-runs/scratch/sgt_mrows.mjs`
  - `bash scripts/scratch-run.sh harness-runs/scratch/sgt_forks.mjs`
  - `bash scripts/scratch-run.sh harness-runs/scratch/sgt_redrive_pieces.mjs`
  - `bash scripts/scratch-run.sh harness-runs/scratch/sgt_redrive_config.mjs`

  Read the four TSVs and `sgt_shell.txt` in full. If a driver or its output is missing, return a blocker naming the path. Never reconstruct a figure. Then write **§2.4 row `(m)`**:
  - **The inventory row,** after `l`. The shape is *"the sibling-stem arms (`cd <work_root>/<project_name>-*` and the tail-free sibling `--prefix`) and the space-suffixed `cd` arms admitted a spelling the shell resolves outside the workspace — from the main checkout and, through the copy's own path, from a run copy"*. Kind `capability`, status **CLOSED**. The bound column names the closing arm, *the paired veto globs `hc_path_anchored_patterns` emits under each wildcard-bearing arm, honoured by `hc_matches_any_pattern`*, family by family. The argument cell cites `lib/harness-config-lib.sh`, **THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS** and **THE TWO REJECT LINES IN BOTH HELPERS ARE ONE UNIT**.
  - **The counts.** Update the **Outcome** paragraph's open and closed counts, and the sentence listing the rows added later.
  - **A new subsection `#### (m) …`, before `#### Which claim each fault injection supports`, carrying:**
    - the row table, `# | piece | cwd | guard | before | after`, every `sgt_mrows.tsv` row by id, with a cell naming the veto family that refuses each hole;
    - a per-guard reach table for the four allow-only guards: guard, which arms it reaches through `is_safe` / `is_safe_prefix`, and how the change reaches it, which is through `hc_matches_any_pattern` with no guard code change;
    - the zsh and `/bin/bash` outputs from `sgt_shell.txt` beside m25–m27, quoted with their commands and versions;
    - m40–m42 as costs, each one prompt and never a permit, with the argument;
    - m43 as a measured observation, with no claim to close it;
    - the fault-injection table, `variant | rows that move | direction | what it establishes`, from `v1`–`v4`. It states that each family was removed alone and names every control and keeper that held.
- [ ] **§2.4 (a), corrected for a run copy.**
  - Rewrite the inventory row `a`'s shape: the symlink is accepted by the two rewrite helpers *and* by the sibling `cd` arm, for a path under a sibling and, for a session in a run copy, under the copy itself.
  - Rewrite the sentence beginning *"The `cd` arms do not (a3) — and not because of the symlink"*. It holds from the main checkout. A session in a run copy reaches every path under the copy through the sibling glob, so `cd <repo>/<link> && ls` is `allow` there (a8, a9, from `sgt_mrows.tsv`). After this branch, that route no longer leaves the workspace by any spelling (row `(m)`). The symlink stays bounded exactly as a1 is, because writing the link is a write inside a checkout of the workspace.
  - Add rows a8 and a9 under a3.
  - The bound paragraph's claim stays: *"the symlink grants no execution that in-repo write access does not already grant"*.
- [ ] **The §2 re-drive outcome, and every moved row argued in its row.**
  - **One dated line per subsection.** Under each of §2.1, §2.2, §2.3, §2.4 (rows a–l), §2.5 and §2.6, add one dated line naming this branch and the paired trees, and stating, from the two re-drive TSVs, how many rows were driven, how many `hold`, which are `moved-by-branch` and which are `stale-before-branch`.
  - **Every `moved-by-branch` row** is argued in its own row: a veto refusing a `cd` or tail-free `--prefix` shape. A `moved-by-branch` row that is not such a shape is a finding. Report it, and do not argue it away.
  - **Every `stale-before-branch` row** is listed as a record that was already wrong before this branch. It is not corrected silently.
  - **§2.1's multi-line residual and §2.4 row `g`.** Restate the third bullet of §2.1's `#### Residuals recorded, not closed` (*"fed a whole two-line command directly, `hc_matches_any_pattern` **matches** a `cd <repo> *` arm across the newline"*) for the vetoed arms, from rows `r3a`–`r3d` of `sgt_redrive_pieces.tsv`. Name each row with its before and after reading, and note that the `cd <repo> *` arm is now `cd <repo> *[<>]*`, with its operand vetoes. If an `r3` row still reads `match` after the branch, say so plainly: the line read is still what confines that arm. Then restate inventory row `g`'s *"It is what confines the `cd` arms to one line"* from the same rows. Keep `g` **OPEN** as an obligation, because `hc_clean_piece`'s multi-line arm is still unreachable and a caller that splits differently still inherits it.
  - **§2.1's D/F table.** Its traversal rows, *"`cd <work_root>/<project_name>-<branch>/../../../etc && rm passwd`"* and *"`cd <work_root>/<project_name>-<branch>/../<project_name> && rm <tracked>`"*, gain the arm's `/../` veto as the first refusal, with the leg Task 5 measured. The paragraph *"The middle four are the rows a later "simplification" has to fail on"* re-states which rows still show both containment tests load-bearing: the real-worktree `cd` row and the absolute `rm <work_root>/<project_name>-<branch>/<tracked>` row.
- [ ] **§3.1, a new block after the N120–N123 block.**
  - **The opening.** It opens like that block, naming the mechanism. Its rows take the numbers free above every row already recorded: `grep -o -E '\bN[0-9]+\b' docs/guard-verification.md` gives the current set, and the block starts one above its maximum.
  - **The rows.** One row per hole that `sgt_mrows.tsv` shows `allow` → `SILENT`, columns `# | Shape | before | after | What narrowed it`.
  - **The usual three paragraphs:**
    - **"Which two trees these columns are"**: this branch's base and tip, taken by `git archive`, with the date, `/bin/bash` and `jq` versions;
    - **the keeper controls held**;
    - **"What §1 owes this change"**: the fork counts before → after from `sgt_forks.tsv`, for all six guards on the five payloads. If any count moved, name the cell as a finding and update §1.3's table to match; if none did, add one dated line under §1.3 saying it was re-driven for this branch on these payloads and is unchanged.
  - **No §3.3 row.** If any re-drive or `(m)` row reads SILENT → `allow`, it is a finding, not a widening this task records.
- [ ] **§1.2 and §1.5.**
  - **§1.2,** directly under its table, gets one line: *the composite row for this branch's library change — before and after — is owed, taken by hand outside any headless session on an otherwise idle machine; no figure for it is recorded here and none taken inside a run may be.* Under it, add the paired recipe that takes it as a fenced `sh` block, one command per line:
    - the merge-base probe;
    - the two `git archive --format=tar --output=<file>` and `tar -xf` pairs into a scratch directory;
    - the timing loop as `## 0. Method` specifies it: 20 iterations per cell, the six guards × the 1 / 2 / 4 / 8-piece payloads, `/bin/bash`, the before tree and the after tree back to back in one run.
    Use `<placeholders>` for paths and give no machine path.
  - **§1.5** gets a dated note in the form of its neighbours, headed by the date this lands. It says:
    - this branch found the sibling-stem arms granting `cd` / tail-free `--prefix` directories outside the workspace, from the main checkout and from a run copy (rows m1–m27), plus the zsh second-operand route;
    - that the hole is **CLOSED**, its closing arm being *the paired veto globs under each wildcard-bearing arm in `hc_path_anchored_patterns`, honoured by `hc_matches_any_pattern`*;
    - that §2.4 row `(m)` and the new §3.1 block carry the evidence;
    - that §1.3 was re-driven and §1.2 is owed by hand.
    It describes nothing as open that this branch closed.

**Verification:**

- Every figure, count and decision this task writes appears verbatim in one of the four TSVs or `sgt_shell.txt` as re-run in the first bullet.
- No wall-clock figure appears in any line this task adds. `git diff -U0 HEAD -- docs/guard-verification.md` shows no ` ms` reading in an added line other than the owed sentence.
- The story index's derivation entry A, re-run verbatim from the checkout root, prints only lines that are rows of the story index's `## Scope register` or lines this branch added. The register rows this task owns are rows 7, 8, 9, 13 (§2.4 inventory row `g`), 14, 15, 24 (§2.4 inventory row `a`), 26, 27 and 28 (§2.1's multi-line residual), and each reads as its disposition says.
- `grep -n '§2.4 row' plugin/hooks/*.sh plugin/hooks/README.md plugin/hooks/lib/harness-config-lib.sh` lists the citations Tasks 2 and 3 wrote, and `docs/guard-verification.md` now carries an inventory row `m` and a `#### (m)` subsection for each of them to resolve to.
- No line added anywhere names `622d4ca0` or `chore_record_guards_from_clone`, and the i19 row is byte-identical to the merge base's.
