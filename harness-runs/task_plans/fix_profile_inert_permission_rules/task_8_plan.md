### Task 8 — Record the guard narrowing's decision rows in `docs/guard-verification.md`

**Goal:** `docs/guard-verification.md` → `### What a later change owes this section` says *"A change to any guard's decisions adds its rows here"*. Task 5 changes `autonomous-script-allowlist-guard.sh`'s decisions: a wrapper under **another** sibling run copy, judged from the main checkout, goes from `allow` to SILENT. This task adds those rows to `### 3.1 Narrowed — allow → SILENT`, driven as a before/after pair, in the same form as N114–N119.

**Depends on:** Task 5. That task removes `under_allowed_scripts`' sibling half, so the guard allows a script only under `<top>/<scripts_dir>/`, where `<top>` is the checkout it judges. It also drops *" or of one of its sibling worktrees"* from the `permissionDecisionReason`. The `before` column is this branch's base tree, and the `after` column is the tree after Task 5.

**Why this is not in Task 5's commit.** The section asks for the rows *"in the same commit"*. The guard is `plugin` layer and this file is `general` layer, and each task stays within one layer, so the rows land in this task's commit on the same branch and merge with the guard (story index `## Context`).

### Targets

- `docs/guard-verification.md`: `### 3.1 Narrowed — allow → SILENT`.

**Work:**

- [ ] Drive the two trees back to back. Each is `git archive` of `plugin/hooks` into a scratch directory under `harness-runs/scratch/`: the base for `before`, the current tree for `after`. Use §0's fixture recipe plus one real sibling linked worktree created with `git worktree add` on an ordinary branch, as §2.1 does. Write the driver as a `.sh` file under `harness-runs/scratch/` and run it with `bash scripts/scratch-run.sh harness-runs/scratch/<file>.sh`. Record `/bin/bash` and the `jq` version used.
- [ ] Add rows from `N120` on, in the `| # | Shape | before | after | What narrowed it |` table form N114–N119 use. Use `payload.cwd` at `<repo>`, with `bash <work_root>/<project_name>-<branch>/<S>/typecheck.sh`, its quoted spelling, the same behind a leading `cd <repo>`, and a compound of `bash <repo>/<S>/typecheck.sh && bash <work_root>/<project_name>-<branch>/<S>/typecheck.sh`. Each is `allow` → **SILENT**, *"`under_allowed_scripts` keeps only the judged checkout's scripts directory"*.
- [ ] Add the paragraphs that follow N114–N119's pattern: **Which two trees these columns are.**, then the keeper controls that hold `allow` in both columns (`bash <repo>/<S>/typecheck.sh` bare and quoted, the `cd <repo>` relative form, and the sibling's own wrapper with `payload.cwd` at the sibling), each driven and not asserted. Then **What §1 owes this change:** the shim call counts before and after on `bash <repo>/<S>/typecheck.sh`, and a statement that the wall-clock §1.2 figure is owed to a hand re-take outside any headless session. Do not take or record a wall-clock figure here.

**Verification:**

- Every new row's `before` and `after` cells come from this task's driver output, not from Task 5's file. A row whose two columns agree is a keeper control, not a row.
- Leave the dated rows that say *sibling worktree* (N53, N86, N118 and the earlier keeper-control paragraphs) unchanged. They are the record of their date.
- Run `grep -nE '^\| N12[0-9]' docs/guard-verification.md`. It lists exactly the rows this task added, with no gap in the numbering after N119.
