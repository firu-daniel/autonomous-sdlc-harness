### 2. The user-review fix-plan fork still enumerates its ledger entries as `R1–R5` / `R3–R5`, without `RG`

**Severity:** Should Fix

**Site anchors**

- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → the paragraph opening *"**Autonomous fork only.** The mechanism is canonical in"*: the sentence *"The fixes fork (`user_review_fixes_instructions_autonomous.md`) owns the **Fixing** half (R3–R5)."*
- The same file → the **re-seed** bullet: *"… in the same write as the fresh all-`[ ]` `R1–R5`, so the new round inherits …"*

**Problem**

This branch added the `RG.` entry to the user-review ledger, between `R4.` and `R5.` (`plugin/instructions/autonomous_pause_and_ledger.md` → the user-review engine template). The canonical document now names it explicitly wherever it enumerates the cycle:

- *"Each user-review round is a fresh `R1–R5` + `RG` fix cycle"*;
- the re-seed produces *"fresh all-`[ ]` `R1–R5` and `RG`"*;
- *"the fixes fork flips `R3–R5`, `RG` included"*.

The explicit "and `RG`" shows the document's own convention: the range `R1–R5` does **not** cover `RG`. The fix-plan fork is the file whose Setup actually performs the create or re-seed, and it was not updated. It still says the re-seed writes a fresh all-`[ ]` `R1–R5`, and that the fixes fork owns `R3–R5`.

Today the re-seed "overwrites from the template", so a template-driven write still resets `RG`. But the fork's own sentence is the one an orchestrator executing this fork reads at the re-seed point, and it now contradicts the canonical document it defers to. Suppose a round-2 re-seed resets only the lines the fork names. Round 1's `RG [x]` then survives, and the fixes fork's resume skips Phase G for round 2. The round's fixes would never be gated, and §1.8's completion check would not notice, because `RG` is already `[x]`.

**Fix**

- [ ] In the **Autonomous fork only.** paragraph, replace *"owns the **Fixing** half (R3–R5)."* with *"owns the **Fixing** half (R3–R5, `RG` included)."*
- [ ] In the **re-seed** bullet, replace *"in the same write as the fresh all-`[ ]` `R1–R5`,"* with *"in the same write as the fresh all-`[ ]` `R1–R5` and `RG`,"*.
- [ ] Run `grep -n "R1–R5\|R3–R5" plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` and apply the same `RG` addition to any other hit that enumerates the fix cycle's entries.
