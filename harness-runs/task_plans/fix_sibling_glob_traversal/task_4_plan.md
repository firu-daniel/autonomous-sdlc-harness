### Task 4 — Drive the `(m)` row set, its fault injections and the fork counts on paired trees

**Goal:** Produce the full measurement behind `docs/guard-verification.md` §2.4's new row `(m)`, §3.1's new block and the §1.3 fork counts. That is every `(m)` row decided by the base tree and by the fixed tree, back to back in one session, each veto family removed alone, and the fork counts on both trees. Store every reading in full. No document is edited here.

**Depends on:**
- **Task 1**, which fixed the row ids `m1`–`m4`, `m10`–`m21`, `m23`–`m38` and their commands in its decision suite. This task's list below carries them verbatim and adds the documentation-only rows.
- **Task 2**, whose library emits each veto as a line beginning with `!` directly under its arm, with these signatures:
  - every `/..` veto contains `/..`, and no other line does;
  - every class veto contains `[!A-Za-z0-9._/-]`;
  - the three operand vetoes follow, and only follow, an arm ending ` *[<>]*`, which was ` *` before the fix.
- **Task 3**, which changed only comments, so the tree this task measures is final for decisions.

**Where this task stops.** It writes scratch drivers and their output, which are gitignored and never committed. **Task 7** owns `docs/guard-verification.md`, reads this task's output files by the paths below, and re-runs these drivers before writing. Keep each driver's path and output format exactly as specified, because they are Task 7's interface.

### Targets

- `harness-runs/scratch/sgt_mrows.mjs` (new, gitignored) — the `(m)` row driver, writing `harness-runs/scratch/sgt_mrows.tsv` and `harness-runs/scratch/sgt_shell.txt`.
- `harness-runs/scratch/sgt_forks.mjs` (new, gitignored) — the fork-count driver, writing `harness-runs/scratch/sgt_forks.tsv`.

**Why `.mjs`, not `.sh`.** `scripts/scratch-run.sh` refuses a `.sh` file by design (its `SCRATCH_INTERPRETERS` table carries `py js mjs cjs rb dart php`, and a `.sh` probe exits 66), and `plugin/agents/layer-implementer.md` → **The probe route, in every mode.** says the same. Each driver is therefore a Node ES module that does its shell work by spawning processes with a fixed argument vector — `/bin/bash <tree>/plugin/hooks/<guard>.sh` with the payload written to the child's stdin, and `git`, `tar`, `zsh -f -c …` and `/bin/bash -c …` the same way — never through a shell string it assembles.

**Work:**

- [ ] **Paired trees and fixtures, built by each driver for itself** under the system temp directory, on a resolved path, never inside this checkout.
  - **"before"** is `plugin/hooks` at the branch's merge base with `origin/dev`.
  - **"after"** is `plugin/hooks` at `HEAD`.
  - Take each tree with `git archive --format=tar --output=<file>` followed by `tar -xf`, never through a pipe, since a guard reaches its library through its own `lib/`.
  - Fixtures follow `docs/guard-verification.md` → `## 0. Method`:
    - **P**, the primary;
    - **S**, the scoped fixture, in its own work root;
    - **D**, P with `projectName` `dotshop` and `appDir` `"."`;
    - **`<W>`**, a `git worktree add -b feat_x` sibling of P at `<work_root>/acme-shop-feat_x`;
    - **`<copy>`**, a `git clone --shared` of P at `<work_root>/acme-shop-run_x`;
    - **`<outside>`**, `<root>/outside`, a plain directory;
    - **`<link>`**, an untracked symlink to `<outside>`, placed inside `<copy>` and inside `<W>`.
  - Run every guard by spawning `/bin/bash <tree>/plugin/hooks/<guard>.sh` with a fixed argument vector, the payload on the child's stdin as `## 0. Method` gives it.
- [ ] **The `(m)` rows, each decided on both trees through the guard named.** The `cwd` is P's root `<repo>` unless the row names another.
  - **Task 1's rows, verbatim:** m1–m4, m10–m21, m23–m27 (holes) and m28–m38 (keepers).
  - **The run-copy holes again, from a linked worktree:** m10w–m14w are m10–m14 with `cwd` and `-C` at `<W>` in place of `<copy>`.
  - **Controls that are SILENT on both trees** (the task prompt's own rows):
    - **m5, script-allowlist:** m1's `cd` then `bash packages/storefront/scripts/typecheck.sh`;
    - **m6, rewrite:** m1's `cd` then `rm x.txt`;
    - **m7, compounds:** `cd <work_root>/acme-shop-x/../../outside && npm ci`, with no anchor;
    - **m8, compounds:** m2 with ` ci` appended;
    - **m9, compounds:** `git -C <repo> status && cd <repo>/sdlc-harness/../../outside && ls`, and `… && cd <repo>/packages/storefront/../../../outside && ls`.
  - **Keeper m22:** `git -C <repo> status && cd <work_root>/acme-shop-x/. && ls`, a `.` component alone.
  - **Keeper m39, on S:** `git -C <srepo> status && cd <swork>/acme-shop-x/packages/@acme/storefront && ls`.
  - **Costs:**
    - **m40:** `git -C <repo> status && cd <W> 2>/dev/null && ls`;
    - **m41:** `git -C <repo> status && cd <repo> >/dev/null 2>&1 && ls`;
    - **m42:** `git -C <repo> status && cd <repo> 2> /dev/null && ls`.
  - **Observation m43, rewrite:** `git -C <repo> status && cd <W> && git rm tracked.txt`.
  - **Residual rows for §2.4 (a):**
    - **a8,** at `cwd` `<copy>`: `git -C <copy> status && cd <copy>/<link> && ls`;
    - **a9:** a8 at `<W>`.
  Write one TSV line per row and tree pair to `harness-runs/scratch/sgt_mrows.tsv`, with the columns `id`, `fixture`, `cwd`, `guard`, `command`, `before`, `after`, `v1`, `v2`, `v3`, `v4`. A decision is `allow`, `SILENT`, `deny` or `ask`. Every field is written in full and never truncated. A trailing summary line counts the rows that move in each column.
- [ ] **Four fault injections, each one change to a scratch copy of the after tree, every row re-driven under each.** Inject each by filtering `hc_path_anchored_patterns`'s output inside the copied library, for example a redefinition appended to the copy that calls the original and edits its lines. Never edit the original.
  - **`v1`:** drop every `!` line containing `/..`.
  - **`v2`:** drop every `!` line containing `[!A-Za-z0-9._/-]`.
  - **`v3`:** drop the `!` lines under each ` *[<>]*` arm, and rewrite that arm's ` *[<>]*` to ` *`.
  - **`v4`:** drop every `!` line and apply `v3`'s rewrite, which is the fix removed.
  Each family is removed **alone**, as `harness-runs/lessons.md` asks before an effect is attributed to one rule family. A control row (m5–m9) or a keeper that moves under any variant is a finding: report it.
- [ ] **What the shell does with a granted `cd`.** Write to `harness-runs/scratch/sgt_shell.txt` the exact command and its full output for each of these:
  - `zsh -f -c 'cd <repo>; cd <repo> <outside>; pwd'`, and the same under `/bin/bash`;
  - `zsh -f -c 'cd <repo>; cd <repo> ..; pwd'`, and the same under `/bin/bash`;
  - `/bin/bash -c 'cd <work_root>/acme-shop-x/../../outside; pwd'`, and the same under `zsh -f`, which records how each shell treats a traversal through an absent sibling.
  Record the `zsh` and `/bin/bash` versions too. These are facts about the executing shell, not guard decisions. Task 7 records them beside m25–m27.
- [ ] **Fork counts.** Use `## 0. Method`'s `PATH` shim (`jq`, `git`, `sed`, `grep`, `tr`, `cat`), with the payload fed by redirection. Count one decision per cell on both trees, for all six Bash guards, on five payloads:
  - `git status && ls`;
  - `ls`;
  - `cd <repo> && git status`;
  - `git -C <repo> status && cd <W> && ls`;
  - m1's command.
  Write one TSV line per tree, guard and payload to `harness-runs/scratch/sgt_forks.tsv`, with the columns `tree`, `guard`, `payload`, `jq`, `git`, `sed`, `grep`, `tr`, `cat`. Take no wall-clock reading anywhere: §1.2's figure is owed by hand outside any session.

**Verification:**

- Each driver runs to completion through `bash scripts/scratch-run.sh harness-runs/scratch/sgt_mrows.mjs` and `bash scripts/scratch-run.sh harness-runs/scratch/sgt_forks.mjs`, and a second run produces byte-identical TSV files.
- In `sgt_mrows.tsv`:
  - every hole id reads `allow` → `SILENT`, except any row your `before` column shows already SILENT, which you report by id;
  - every keeper reads `allow` → `allow`;
  - every control reads `SILENT` → `SILENT`;
  - `v4` equals `before` on every row.
  A row breaking any of these is reported in your return with its line, never smoothed.
- After the run, the fixture configurations are byte-identical to their pristine copies, which each driver diffs and reports.

**Deviations from plan:**
- Each fixture commits three files, not `## 0. Method`'s one: `tracked.txt`, `packages/storefront/scripts/typecheck.sh` and `.claude/qa-accounts.env`, as Task 1's suite does, so `<copy>` (a clone) and `<W>` carry the script m5/m12 name and the file m3/m13 read. The configuration is `examples/harness.config.json` verbatim for P; S and D are it with `appDir` (S) or `projectName` and `appDir` (D) replaced. D lives at `<work_root>/dotshop`; S at `<root>/swork/acme-shop`.
- Row ids: m9's two commands are `m9a` and `m9b`. m28 and m33 each carry two lines, told apart by the `guard` column: `allow-safe-compounds.sh` with Task 1's command, and `git-rewrite-branch-guard.sh` with `&& rm tracked.txt` appended, as Task 1's suite drives them.
- `sgt_mrows.tsv` and `sgt_forks.tsv` open with a header line of their column names. The summary line has id `#moved`; its `after` cell counts rows whose `after` differs from `before`, and each `vN` cell counts rows whose `vN` differs from `after`.
- The fixture roots are fixed names under the resolved system temp directory, `sgt-mrows` and `sgt-forks`, which each driver removes in process before building and after finishing, instead of a random `mkdtemp` suffix. The `cwd` and `command` columns carry absolute paths, so this is what makes a second run byte-identical.
- The child environment drops `HARNESS_MAIN_REPO`, the `GIT_*` location variables, `PWD` and `OLDPWD`. Fixture git commands run with `core.hooksPath` set to an empty directory and `commit.gpgsign=false`.
- Byte-identity across two runs was checked with a throwaway sha256 probe under `harness-runs/scratch/` (`sgt_hash.mjs`), run through `scripts/scratch-run.sh`. All three outputs read identical on the second run.
