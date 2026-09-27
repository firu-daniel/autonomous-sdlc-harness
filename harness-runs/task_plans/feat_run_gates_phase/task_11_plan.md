### Task 11 — Add the `G.` and `RG.` entries to the flow-progress ledger and its resume rules

**Goal:** Give the Run gates phase a durable phase-level entry in both engines' ledgers, so a paused or parked run resumes into it deterministically. Keep that entry in the safety floor, which no run mode and no `phases.*` flag can switch off, and say what a ledger written before this entry existed does.

**Depends on:** Task 9. It adds `## Phase G — Run gates` to the family-1 core, between Phase E and Phase D. Its within-phase resume point is derived by `### G.0 Resolve the round` from the committed test fix plan indices, so the ledger needs one entry per engine and no `*g` / `*f` split. The two forks that flip these entries are Task 12 (task engine, `G`) and Task 14 (user-review engine, `RG`); this file names the entries and the flip contract and nothing about when each fork flips.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md`.

**Work:**

- [ ] **`### 1.3 Templates`.**
  - In the task-engine template, insert `- [ ] G.      Run gates passed (the test-suite wrapper printed pass)` between the `E.` line and the `D.` line.
  - In the user-review-engine template, insert `- [ ] RG. Run gates passed (the test-suite wrapper printed pass)` between `R4.` and `R5.`.
  - Keep each template's column alignment.
- [ ] **The marker paragraphs.** In the paragraph beginning *"`[-]` is admissible on **exactly** the entries a run mode **or a `phases.*` flag** can switch off"*, add `G` and `RG` to the safety-floor enumeration: the gate run is a step no directive addresses and no flag gates. The membership list *"Which switch reaches which entry"* is unchanged.
- [ ] **`### 1.5 Who flips`.** The orchestrator's range *"`A–D`"* now reads as including `G`, and the fixes fork's *"`R3–R5`"* as including `RG`. State both explicitly rather than relying on the letter range.
- [ ] **`### 1.7 Resume-from-ledger`.** Add one rule for a ledger created before the Run gates phase shipped, which carries no `G.` / `RG.` line. A resume whose first `[ ]` entry is `D.` / `R5.` on such a ledger runs Phase G before Phase D. With no entry to flip, it records no flip, and `### 1.8`'s predicate is unaffected because it reads only the entries present. Within Phase G the resume point is the phase's own derivation (`plan_orchestration_instructions_core.md` → `## Phase G — Run gates` → `### G.0 Resolve the round`), which this file does not restate.

**Verification:**

- In each template, the new line sits between the two named neighbours. Check with `grep -n "^- \[ \] \(E\|G\|D\)\.\|^- \[ \] R[G45]\." plugin/instructions/autonomous_pause_and_ledger.md`.
- `grep -n "\[-\]" plugin/instructions/autonomous_pause_and_ledger.md` shows no line making `G` or `RG` `[-]`-eligible.
- `### 1.7 Resume-from-ledger (every fork, on every (re-)entry)` keeps its heading text byte-identical: `plugin/docs/AUTONOMOUS_FLOW.md` cites it by that heading.

**Deviations from plan:** `### 1.4 Creation` named the user-review round's fresh entries as `R1–R5` in three places (the round description, the re-seed bullet and the create/re-seed `## Run mode` paragraph); each now names `RG` beside `R1–R5`, for the same reason the plan makes `### 1.5`'s ranges explicit rather than trusting the letter range.
