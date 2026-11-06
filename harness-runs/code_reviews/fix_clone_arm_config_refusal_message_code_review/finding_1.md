### 1. The drift note's list of cells resting on a unit measurement still says "Three cells" and omits §1.1's two new clone cells

**File:** `docs/outer-loop-verification.md` (the **Not re-confirmed by a run:** paragraph near the top of the file) — "Three cells — the shim-reach sentence in §1.6"

This branch rewrote two §1.1 clone cells: the row "the main checkout's `harness.config.json` truncated to invalid JSON" and the row "a pre-1.5 `jq` first on `PATH`". Each now records a `cannot resolve` outcome that the 2026-11-06 round did not drive, and each is marked in place as "A **unit measurement, not a §0 row**", citing `cli/test/wrapper-clone-config-refusal.test.mjs`, case (a). The drift paragraph at the top of the document is where a reader looks for every cell that rests on a `node:test` case rather than a §0 recipe row. It still reads:

> Three cells — the shim-reach sentence in §1.6, the `hr_main_repo` row of §2.4 and §1.2's deleted-on-origin row — rest on a `node:test` case against an `init`-built fixture rather than a §0 recipe row, and are marked as such where they appear.

That statement is now false in two ways:

- The count is wrong. Five cells rest on a unit measurement, not three.
- The two new cells were not measured against an `init`-built fixture. The suite's own header says its fixture is "`cli/test/wrapper-clone-arm.test.mjs` → `fixture`'s, without its linked worktree". That fixture builds the main checkout by hand and copies the shipped templates into `scripts/`. `init` never runs.

A maintainer who uses this paragraph to decide which cells a §0 restamp must re-drive, or which cells rest on weaker evidence, would miss both clone cells. The branch's scope register walked only §1.1, §1.2 and §1.8, so it never reached this paragraph.

**Fix:** in that paragraph, replace this sentence:

```
Three cells — the shim-reach sentence in §1.6, the `hr_main_repo` row of §2.4 and §1.2's deleted-on-origin row — rest on a `node:test` case against an `init`-built fixture rather than a §0 recipe row, and are marked as such where they appear.
```

with:

```
Five cells rest on a `node:test` case rather than a §0 recipe row, and are marked as such where they appear: the shim-reach sentence in §1.6, the `hr_main_repo` row of §2.4 and §1.2's deleted-on-origin row, each against an `init`-built fixture; and §1.1's clone cells for the truncated-configuration and pre-1.5 `jq` rows, against the fixture `cli/test/wrapper-clone-config-refusal.test.mjs` → `fixture` assembles from the shipped templates without running `init`.
```

Change nothing else in the paragraph. This is a prose-only edit to a document under `docs/`, so it needs no test run.
