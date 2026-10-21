### 3. "This branch" in the new TD1 and T2 rows names no branch, and the 2026-10-14 paragraph under T2 now reads as this branch's result

**File:** `docs/sandbox-verification.md` (`## 5. Failures and their follow-ups`). Three sites:
- row TD1, Observed cell — "by this branch's implementing agent"
- row T2, Check cell — "on this branch's final tree"
- the paragraph after the gates table — "Unsandboxed, on this branch's final tree, `scripts/run-gates.sh` reports every gate `ok` except two."

`docs/sandbox-verification.md` is a durable document of record that several branches have written to. "This branch" has no fixed meaning in it.

The paragraph after the gates table was written on 2026-10-14 by `chore_sandbox_manual_verification` (`git blame`: commit `b251b0cc`, "chore: sandbox manual verification (#110)"). Its "this branch" means that branch. This branch put T2 and T3 directly above it. T2 itself says "on this branch's final tree". Read in that order, the old paragraph now seems to say that `fix_run_gates_sandbox_tmpdir`'s final tree was run unsandboxed and recorded, and nobody on this branch recorded that.

TD1 and T2 have the same problem in the other direction: once this branch merges, "this branch" in them names nothing. A person taking the owed T2 needs to know which tree to run it on.

**Fix:** name the branches outright. Words only; no table structure changes.

1. TD1, Observed cell: replace `by this branch's implementing agent` with `` by `fix_run_gates_sandbox_tmpdir`'s implementing agent ``.
2. T2, Check cell: replace `on this branch's final tree` with `` on `fix_run_gates_sandbox_tmpdir`'s final tree ``.
3. The paragraph after the gates table: replace its opening `Unsandboxed, on this branch's final tree,` with `` Unsandboxed, on `chore_sandbox_manual_verification`'s final tree (2026-10-14, beside T1), ``. Leave the rest of the paragraph unchanged.

No test file covers this document, so the fix runs no test.
