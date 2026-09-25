### 2. The host before/after compares one before run with three after runs taken in a different load window, so the record cannot show whether the suite got faster

**File:** `docs/development.md` → `## 5. Verifying a change` → **Gate 4** → the **Run time, measured.** paragraph: the opening clause "Measured on 2026-09-25 on a 10-core macOS host", the fenced command blocks, the explanatory sentence above the table that Finding 1 introduces, the `| host, 10 cores |` table row, and the paragraph that begins "Read the host row as a range, not a point." Line hints: 242, 252, 256, 260.

**Problem.** The branch's whole deliverable is a faster gate suite. The record that is meant to show it cannot be compared:

- **Before** is one sample: `--runs 1` gives `npm test` 429 s and `run-gates.sh` 345 s. That pair contradicts itself, and the paragraph says so: `run-gates.sh` contains a whole `npm test` and still finished 84 s sooner.
- **After** is three samples (`--runs 3`: 238 / 365 / 285 s and 260 / 264 / 222 s), taken while `uptime` read 1-minute load averages of 31–60. The load during the before run is not recorded.
- For scale, the task prompt measured `npm test` at 214 s on this same machine on the same date. That is below every after figure and half the recorded before figure.

The paragraph asks readers to take the host row as a range. The before column has no range, though, and the two columns come from different load windows. A maintainer reading 429 → 238–365 would conclude the branch cut the suite by a third or more. Nothing in the data supports that reading, and nothing rules it out either. Task 7's own **Verification** requires a before and an after for both commands. It does not require them to be comparable, which is why this is graded Should Fix rather than Must Fix.

Re-measuring also changes where every figure was measured. Finding 1's explanatory sentence says the before column was measured at `a885d631d85b` and the after columns at `4c36164a9759`. Once this fix replaces every figure with ones measured at `fe17b4e2293f` and at `HEAD`, that sentence would be false, so this fix rewrites it too. It also fixes that sentence's singular "Its column", since there are two before columns.

**Fix.** Re-measure both sides in one session, with the same sample count, one right after the other, and record the load for each. Apply Finding 1 first, so the before ref is the one that survives the merge.

- [ ] Run `date +%F`, `node --version` and `git --version`, and keep the output.
- [ ] Run `uptime`. Then, from the repository root, run `bash scripts/measure-suite.sh --ref fe17b4e2293f --runs 3`. Keep every `measure-suite:` line and the `uptime` output.
- [ ] Right after that, run `uptime` again, then `bash scripts/measure-suite.sh --runs 3`. Keep the same outputs.
- [ ] If any `npm-test` line shows a non-zero exit, or a `run-gates` summary names a failure other than `11 docs-retrieval relevance floor`, stop and report it as a blocker. Name the run and the failing case, found the way Task 7's **Work** prescribes: `node --test --test-reporter=spec test/` from `cli/`, output to a file under the system temp directory, searched for `✖`. Do not re-run until green.
- [ ] In the opening clause "Measured on 2026-09-25 on a 10-core macOS host (Darwin arm64, `os.availableParallelism()` 10), Node v20.19.5, git 2.50.1, one host command each, from the repository root:", replace the date, the Node version and the git version with the values from the first step wherever they differ. Leave the rest of the clause unchanged.
- [ ] Replace the two fenced command blocks above the table with the two commands just run, each in its own fenced block: `bash scripts/measure-suite.sh --ref fe17b4e2293f --runs 3` and `bash scripts/measure-suite.sh --runs 3`.
- [ ] Replace the four cells of the `| host, 10 cores |` row with the new figures, three per cell, comma-separated, rounded to whole seconds, in the same format the after cells use now.
- [ ] Replace the whole explanatory sentence Finding 1 introduced above the table (it begins "`fe17b4e2293f` is the `dev` commit before the template-copied fixtures and the concurrent suites." and ends "…rounded to whole seconds:") with:

  > `fe17b4e2293f` is the `dev` commit before the template-copied fixtures and the concurrent suites. Both before columns were measured at it, and both after columns at the checkout's own `HEAD`, in the one session the opening clause dates, the after run right after the before run. Each figure is the script's own `measure-suite:` line rounded to whole seconds:

- [ ] Rewrite the paragraph's first two sentences ("Read the host row as a range, not a point. The host was shared while it was measured: …finished 84 s faster than its `npm test` alone.") to give the two `uptime` 1-minute load averages, before-side and after-side, as recorded. Keep "Read the host row as a range, not a point." Drop the 84 s clause unless the new before figures show the same inversion. Leave the rest of the paragraph as it is: exit statuses, the gate-11 sentence, and the 787 / 791 test-count evidence.
- [ ] Put no path from the measurement output into the document. Gate 6a greps for the home directory.

**Verification:**

- Every figure in the host row matches a `measure-suite:` line from the two runs above. Quote those lines in the implementer's return summary.
- `git grep -n "a885d631d85b\|4c36164a9759" -- docs` prints nothing.
- The date, Node version and git version in the opening clause match the output of the first step.
- `bash scripts/run-gates.sh` prints no failure other than gate 11.

**Deviations from plan:**

- A bare `git --version` was refused by the permission profile. The git version was read from the `measure-suite: git --version: git version 2.50.1 (Apple Git-155)` line that both measurement runs print, which executes the same command.
- The new before figures still show the inversion (fastest before `run-gates.sh` 314 s against fastest before `npm test` 376 s), so the clause was kept and restated with 62 s rather than dropped.
