### Task 18 — Bring every gate count and hand-run list in line with fifteen gates

**Goal:** Now that Gate 15 exists (Task 17), bring every sentence that counts the gates, names the hand-run gates, or states how many the supply-chain audit leaves unchanged, in line. The scope is the `## Scope register` in the story index, derived by the recorded commands there; this task changes exactly its `change`-disposition sites.

**Depends on:** Task 17, which adds Gate 15 to `docs/development.md` §5. The counts cannot be made true before the gate they count exists.

**Why the catch-all task ships last.** It reconciles the counts across `docs/` and `scripts/run-gates.sh` after Task 17 has added the gate those counts must include — so every earlier task is landed before it runs, which is the ordering rule rather than a preference.

### Targets — the `change` rows of the story index's `## Scope register`

- `docs/development.md` → `## 5. Verifying a change`: "Fourteen gates." → "Fifteen gates." (register row 1).
- `docs/development.md` → `## 5`: the "**Eight of the fourteen run unattended**" sentence and "the remaining six, gates 5, 7, 8, 9, 10 and 12" — still eight automatable, now the remaining **seven**, gates 5, 7, 8, 9, 10, 12 and 15 (register row 2).
- `docs/development.md` → `## 8. The nightly supply-chain audit`: "changes none of `scripts/run-gates.sh`'s fourteen" → "fifteen" (register row 3).
- `scripts/run-gates.sh` header: "defines fourteen gates … reports the six it cannot" → "fifteen … seven" (register row 5).
- `scripts/run-gates.sh` → the `== gates this script cannot run` block: add the gate 15 line (register row 8).
- `scripts/run-gates.sh` → `hand_run="gates 5, 7, 8, 9, 10 and 12 remain hand-run"` → `"gates 5, 7, 8, 9, 10, 12 and 15 remain hand-run"` (register row 9).

**Work:**

- [ ] Re-run the story index's `## Scope register` derivation commands 1–3 verbatim from the checkout root, and confirm the `change` rows are exactly the sites above and no new site has appeared. Record the command output in the task's own notes.
- [ ] Edit each `change` site. `scripts/run-gates.sh` reports Gate 15 among the gates it cannot run (it launches `claude` with `--allowedTools`, which the script never does); it adds no gate to its own run and its exit status is unchanged. **The script's behaviour does not change** — only its header prose and its two printed sentences (the `cannot run` block and the `hand_run` line) move from fourteen/six to fifteen/seven.
- [ ] Leave every `no-change` row untouched: the `docs/guard-verification.md` counts (they count a guard's conditions, not §5's gates), the single-named-gate sites in `cli/src/commands/init.ts`, `cli/test/init.test.mjs`, `docs/analyze.md` and `docs/cli.md`, the automatable-count sentence in `scripts/run-gates.sh`'s header (register row 7 — it counts automatable gates, which gate 15 does not join), and the conventions-document site (register row 14), which is raised in the story index's `## Corpus staleness` section rather than edited.
- [ ] The `scripts/run-gates.sh` header edit keeps the gate-number list (`1, 2, 3, 4, 6, 11, 13 and 14`) unchanged — Gate 15 is not one the script runs — and only the totals move.

**Verification:**

- Re-run derivation commands 1–3: every hit in `docs/` and `scripts/run-gates.sh` reads fifteen (or seven / the extended hand-run list), and no hit still reads fourteen or the old six except inside a quoted historical measurement that names its own date.
- `scripts/run-gates.sh`'s gate-number list is unchanged; only its totals and its printed hand-run sentence moved.
- No `no-change` site was edited; the conventions-document count is left for the story index's `## Corpus staleness` `stale-rule` entry.
- The gate-count change touches no code path in `run-gates.sh`; its selection of gates to run is byte-identical.

### Implementation notes

**Derivation re-run before the edits** (entries 1–3, verbatim, from the checkout root). Hits, by `file:line`:

- Entry 1: `docs/development.md:163` ("Fourteen gates."), `docs/development.md:165` ("Eight of the fourteen run unattended"), `docs/guard-verification.md:876` ("all fourteen conditions and the three single-guard gates"), `scripts/run-gates.sh:4` ("defines fourteen gates").
- Entry 2: `cli/src/commands/init.ts:309`, `cli/test/init.test.mjs:7981`, `docs/analyze.md:219`, `docs/cli.md:107` (each "the hand-run gate" / "a hand-run gate"), `docs/development.md:165` ("gates 5, 7, 8, 9, 10 and 12"), `docs/development.md:2481` ("`scripts/run-gates.sh`'s fourteen"), `scripts/run-gates.sh:11` ("hand-run gates where they are not"), `scripts/run-gates.sh:306` ("== gates this script cannot run"), `scripts/run-gates.sh:338` (`hand_run=`).
- Entry 3: `scripts/run-gates.sh:15` ("the other six automatable").

Every hit maps to a register row (1–13); no new site appeared. The `change` rows are exactly rows 1, 2, 3, 5, 8 and 9.

**Derivation re-run after the edits.** The same sites, with `docs/development.md:163` reading "Fifteen gates.", `:165` "Eight of the fifteen … the remaining seven, gates 5, 7, 8, 9, 10, 12 and 15", `:2481` "`scripts/run-gates.sh`'s fifteen", `scripts/run-gates.sh:4` "defines fifteen gates", and `scripts/run-gates.sh:339` "gates 5, 7, 8, 9, 10, 12 and 15 remain hand-run" (moved one line by the added gate-15 echo). No hit reads fourteen or the old six except the `no-change` rows 4 and 7. `git diff -U0` shows only those six lines changed plus one added `echo` in the `cannot run` block; the gate-number list `1, 2, 3, 4, 6, 11, 13 and 14` is untouched.

- **Deviations from plan:** `bash -n scripts/run-gates.sh`, a syntax check on the edited script, was refused by the tool layer in this session. The claim that the script still parses rests on reading the diff: the only code-bearing change is one added `echo` of a double-quoted literal with no expansion, and one edit inside an existing double-quoted literal. The Run gates phase's `commands.test` run executes the script and verifies it. `<test_cmd>` was not run, per the test-run rule; deferred to the Run gates phase.
