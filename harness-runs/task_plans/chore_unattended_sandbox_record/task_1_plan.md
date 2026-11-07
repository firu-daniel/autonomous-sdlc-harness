### Task 1 — Repoint the cli layer's residual citations in shipped script comments and a test header

**Goal:** Change the three cli-layer comments that cite a `docs/cli.md` §6 residual by number so they cite the same residual in `docs/sandbox-record.md`. After the move, the residual numbers are unchanged; only the file they live in changes. The edits touch comments only and change no behaviour.

**The contract this task consumes.** Task 5 creates the destination, which this task does not write. The destination is `docs/sandbox-record.md` → `## 6. The residuals`, with residuals 1–13 keeping their `docs/cli.md` numbers and residual 1 keeping its items 1–5. A comment uses the short form `docs/sandbox-record.md residual N` (or `docs/sandbox-record.md residual 1, item 5`), since a shell or JS comment has no room for the heading. This task lands before the file exists. That ordering is the layer rule, catch-all last, and the contract above is fixed in the story index's `## Context`.

**Where this layer stops.** The root `scripts/` copies of these two templates (`scripts/launch-sandboxed-gates.sh`, `scripts/lib/harness-run-lib.sh`) are `init`'s verbatim output. This task does not edit them: they follow at the post-merge self-adopt re-render (scope-register rows 2 and 4). It also does not touch any `docs/cli.md §6` citation that carries no residual number. Those still resolve through the pointer Task 5 leaves in `docs/cli.md`.

### Targets

- `cli/templates/scripts/launch-sandboxed-gates.sh`: the `NO ENVIRONMENT VARIABLE DECIDES TRUST IN THE TARGET.` comment block.
- `cli/templates/scripts/lib/harness-run-lib.sh`: the comment above `hr_remote_status_write` (*"Residual, not closed here:"*).
- `cli/test/run-copy-clone-arm.test.mjs`: the file's header comment.

**Work:**

- [ ] `launch-sandboxed-gates.sh`: replace *"the trust `docs/cli.md` §6 / residual 5 states for the wrappers"* with the same sentence citing `docs/sandbox-record.md` residual 5. Keep the comment's line wrapping within the block's existing width.
- [ ] `harness-run-lib.sh`: replace *"the gap `docs/cli.md` §6 residual 1, / item 5, first bullet, states for `save`"* with the same gap cited as `docs/sandbox-record.md` residual 1, item 5, first bullet.
- [ ] `run-copy-clone-arm.test.mjs`: replace *"the method `docs/cli.md` §6 residual 1, item 5 describes"* with `docs/sandbox-record.md` residual 1, item 5.

**Verification:**

- `git grep -nIE "[Rr]esiduals? [0-9]" -- cli`: every hit's line names `sandbox-record.md`, and none names `cli.md`.
- `git diff` of the three files shows comment lines only: no code line and no string literal changed.
- `npm test --workspace cli -- test/run-copy-clone-arm.test.mjs` passes. It is the one test file this task edits, and it checks that the comment edit left the suite parseable.
