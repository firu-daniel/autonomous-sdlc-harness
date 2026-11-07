### 1. `docs/sandbox-verification.md` row CL5 (Linux) still attributes a quote to `docs/cli.md` §6 that only `docs/sandbox-record.md` now carries

**File:** `docs/sandbox-verification.md`, `## 8. The Linux legs (owed)`, row `CL5 (Linux)`, procedure cell: "`docs/cli.md` §6 calls the runtime's refusal of a sandboxed write to the clone's `.git/config` *\"unmeasured\"* on Linux (*\"while Linux is unmeasured\"*)"

**Problem.** The procedure cell of row CL5 (Linux) quotes `docs/cli.md` §6 as saying *"while Linux is unmeasured"*. Before this branch that phrase was in `docs/cli.md` §6, in residual 1, item 3 of the **Residuals, stated rather than hidden:** list. Task 5 moved that list into `docs/sandbox-record.md` → `## 6. The residuals`. The phrase is now only in `docs/sandbox-record.md`, residual 1, item 3.

- `grep -c "while Linux is unmeasured" docs/cli.md` returns `0` on this branch.
- `git show origin/dev:docs/cli.md | grep -c "while Linux is unmeasured"` returns `1`.
- `grep -c "while Linux is unmeasured" docs/sandbox-record.md` returns `1`.

**Why this is reachable.** Someone re-taking CL5 (Linux) reads the procedure cell and goes to `docs/cli.md` §6 for the statement the row tests. The quoted text is not there. The section now holds only the one-paragraph pointer under `**Residuals, stated rather than hidden:**`.

The story plan's own rule covers this cell. Its decision **The evidence record is not rewritten.** says: *"A citation pointer inside its prose or its expected or procedure cells is repointed and changes nothing else."* This is a procedure cell, not an observed quote.

**Why the earlier sweeps missed it.** The cell cites no residual number, so the scope register's entry A pattern `[Rr]esiduals? [0-9]` does not match it. Entry B's anchor string does not match it either. Entry C covered unnumbered citations only in `docs/watcher.md`, `docs/sandbox-placeholder-upstream-report.md` and `docs/development.md`. The code review's citation sweep re-ran entries A and B only.

**Fix.** In that procedure cell, change only the citation and leave the two quotes as they are. Replace:

```
`docs/cli.md` §6 calls the runtime's refusal
```

with:

```
`docs/sandbox-record.md` → `## 6. The residuals`, residual 1, item 3, calls the runtime's refusal
```

Do not change the row's expected, baseline, observed or verdict cells. This fix runs no test: no test reads `docs/sandbox-verification.md`.
