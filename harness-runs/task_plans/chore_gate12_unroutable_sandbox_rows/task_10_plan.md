### Task 10 — Hold the restated table's `source` rows to `--list` in `gate12-sandbox-round-docs.test.mjs`

**Goal:** The docs-restatement test accepts the new route and holds each `source` row's note to `--list`, as it already holds each `hand` row's. A row closed upstream cannot then drift from the reason the driver prints for it.

**Depends on:**

- **Task 3**, which adds route `source` (SB3, JS3N) to `scripts/lib/gate12-sandbox-round/core.sh`.
- **Task 9**, which restates that route in `docs/development.md` → **The rows the driver takes, and how.** as *Taken by* `source`, with each `source` row's note carrying `--list`'s note verbatim.

### Targets

- `cli/test/gate12-sandbox-round-docs.test.mjs`

**Work:**

- [ ] `TAKEN_BY`: add `source: 'source'`. Leave the other four mappings unchanged.
- [ ] The note subtest: hold every row whose route is `hand` **or** `source` to `--list`'s note verbatim, and retitle the subtest to match.
- [ ] Header: the stated rule names `source` beside `hand` as a route whose note is held, because its note is the source the row is read from.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-docs.test.mjs` passes, run from the checkout root as one foreground command.
- Temporarily change one word of SB3's restated note in `docs/development.md`. The note subtest fails naming SB3. Revert it, and record the observed failure in your return.
