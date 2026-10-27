### 8. Nothing checks Gate 15's restated leg table against `SP_LEGS`

**File:** `cli/test/sandbox-probe-git-and-legs.test.mjs` — the case that runs `[PROBE, '--list']`; the restated table is `docs/development.md` → `**Gate 15 — the unattended sandbox probe (macOS).**`, the table under *"**The legs**, one per line of `--list`"*.

`scripts/lib/sandbox-probe/core.sh`'s header calls `SP_LEGS` *"the single declaration of leg -> rows -> expected -> recorded in"*, and says Gate 15 *"restates it from `sandbox-probe.sh --list`, so edit it here and re-derive there"*. The story index names drift between the two as a top risk, and Task 17 checked them against each other once. The two agree today, except that the doc wraps `<main>/.git` and `<clone>/.claude/settings.local.json` in backticks. But nothing re-checks them, so the next edit to a leg's rows or expected sentence in `core.sh` leaves Gate 15 telling a reader the wrong rows, with no failing test.

**Fix.** In `cli/test/sandbox-probe-git-and-legs.test.mjs`, add a case that:

- reads `docs/development.md` from `WORKSPACE_ROOT` with `readFileSync`. This reads one fixed file, so it owes no `treeGuards` entry;
- takes the table rows between the `| Leg | Rows | Expected | Recorded in |` header and the first blank line after it;
- for each row, strips backticks from the cells, turns the Rows cell's `, ` into `,`, and rebuilds `<leg>\t<rows>\t<expected>\t<recorded in>`;
- asserts with `assert.deepEqual` that the result equals the `--list` output split into lines (trailing empty line dropped), in order.

That test file is the one this fix edits, so it is the only test file the fix runs.
