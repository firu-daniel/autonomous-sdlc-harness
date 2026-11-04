### Task 17 — Test that the gate's restated row table matches `--list`

**Goal:** Keep `docs/development.md`'s restatement of the round driver's row table in step with the script's single declaration, as the probe's leg table is held to Gate 15. A row added to `G12_ROWS`, or a route changed there, fails this test until the gate is re-derived.

**Depends on:**
- Task 16, which writes under the round's step 8 a Markdown table `| Row | Round step | Taken by | Note |`, one body row per `--list` line in `--list`'s order.
- Task 1, whose `bash scripts/gate12-sandbox-round.sh --list` prints `<row>\t<round step>\t<route>\t<arms>\t<note>`. The route is `full-run` | `plant` | `reads-SB2` | `default-branch` | `hand`; SB4 alone is `reads-SB2`.
- **The route → *Taken by* mapping, the contract both tasks share:** `full-run` → `grade --full-run`, `plant` → `plant`, `reads-SB2` → `grade (SB2's run)`, `default-branch` → `default-branch`, `hand` → `hand`. A route outside these five fails the test.

### Targets

- `cli/test/gate12-sandbox-round-docs.test.mjs` (new).

**Work:**

- [ ] Header. The rule: the gate's restated table carries every `--list` row, in order, with its round step and its route, and no other row. State that it reads two fixed files — the script's `--list` output and `docs/development.md` — and no tree, so it owes no `treeGuards` entry.
- [ ] Run `--list` through `runBash` from `cli/test/helpers/fixture.mjs`, with a fixed argument vector. Locate the table by its header line under **The sandbox series round (#170 step 4) — not yet run.**, and parse its body rows until the first non-table line.
- [ ] Assert:
  - the row IDs are equal and in the same order;
  - each round step is equal;
  - each *Taken by* is the route mapped as above, SB4's included (`grade (SB2's run)`);
  - each `hand` row's note cell contains the `--list` note verbatim.
- [ ] Assert that the round section names each of `plant --repo`, `grade --repo`, `grade --repo` with `--full-run`, `default-branch --repo` and `teardown --repo` inside a fenced block.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-docs.test.mjs` passes. It is this task's own new test file.
