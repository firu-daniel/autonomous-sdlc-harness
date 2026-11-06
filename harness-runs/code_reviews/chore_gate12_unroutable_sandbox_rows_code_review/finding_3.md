### 3. The plain-grade case dropped its total line count instead of updating it

**File:** `cli/test/gate12-sandbox-round-grade.test.mjs` — the case "a plain grade over every row at its expected shape exits 0, FR1-FR7 printed not run", the deleted line `assert.equal(lines.length, 17, lines.map((l) => l.row).join(' '));`.

**Problem.** Before this branch, the case pinned the whole output of a plain `grade` at 17 lines: the 16 `--list` rows plus JS3's `source` line. This branch adds two `source` lines, SB2's and RJ2's, and turns SB3 and JS3N into `source`-only rows. It deleted the count instead of moving it to the new total.

The per-row `resultOf` helper does not replace the count. It collapses each row to its non-`source` lines, so a duplicated or stray `source` line goes unnoticed. Examples: a second RJ2 `source` line, or SB3 printing a `hand` `not run` line beside its `source` line. The case would still pass. The `--row`-scoped cases catch some of these, but only for the rows they select.

**Fix.** Put the count back at the new total, after the `assert.deepEqual(…, { JS1: 'pass', … })` assertion:

```js
  assert.equal(lines.length, 19, lines.map((l) => `${l.row}:${l.result}`).join(' '));
```

The 19 lines are:
- the 16 `--list` rows (FR1–FR7, JS1, JS4, SB2, SB4, RJ2, JS3, JS3N, SB3, RJ3), one line each;
- plus the `source` lines of SB2, RJ2 and JS3.

SB3 and JS3N print only their `source` line, so they are already counted among the 16. Finding 1 changes SB2's result, not its line count, so the total holds whichever of the two lands first.

This fix edits one test file, so that file is the only test the fix runs: `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs`, from the repository root, as one plain foreground command.
