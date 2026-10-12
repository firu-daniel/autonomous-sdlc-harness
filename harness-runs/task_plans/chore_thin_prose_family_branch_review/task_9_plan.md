### Task 9 — Thin `review-plan-reviewer`'s `### Unactionable gates` and parity spot-check

**Goal:** Cut the explanatory clauses from `### Unactionable gates (Must Fix)` and `### Reference-implementation parity spot-check (Must Fix)` in `plugin/agents/review-plan-reviewer.md`. The test, its three boundaries, the fix to require, the calibration example and the re-open rule all stay.

**Depends on:** Task 8, the previous edit to this file; through it, Task 7. Leave their text as they left it.

**Where this task stops.** It owns these lines of `plugin/agents/review-plan-reviewer.md` only:
- in `### Unactionable gates (Must Fix)`: the paragraph opening `Every finding in this index is actioned by **one** fix loop`, the paragraph opening `**Three boundaries keep it from over-firing.**` and the paragraph opening `**The fix to require:**`;
- in `### Reference-implementation parity spot-check (Must Fix)`: the paragraph opening `For each Must Fix item in the review that claims a `<parity_vocabulary>` mismatch`.

It does not touch:
- the paragraph opening `**The test**` or the calibration paragraph;
- the parity section's phase-gate sentence pair, opening `**Skip this section unless `phases.parity` is `true` in `harness.config.json`.**`, which stays word for word in all three family files;
- `## Unsolicited dispatch guidance`;
- `## Output contract`, which is frozen or wire throughout: the PASS and FAIL lines, the findings template with its `**Fix:**` line, and `Nothing else.` and `those 3 lines`, which the frozen opening paragraph quotes.

**Frozen text in or next to this range** stays word for word:
- `**The test**`'s runs `is the order of the `## Phase <letter>` headings in the` and its `grep -n '^## Phase [A-Z]' <that file>` command;
- in the boundaries paragraph, the run `An ordering precondition **inside** the dispatching phase (*"only after Finding 1's fix has landed"*) is`;
- in `## Output contract`, the paragraph opening `On **both** outcomes below, an optional` and the line opening `**If there are Must Fix issues**`;
- the bold leads `**If everything is clean**` and `**If there are Must Fix issues**`.

### Targets

- `plugin/agents/review-plan-reviewer.md` → the four paragraphs named above.

**Work:**

- [ ] **The actioning paragraph.** Replace the paragraph opening `Every finding in this index is actioned by **one** fix loop` with: ``Every finding in this index is actioned by **one** fix loop in **one** phase — a code-review index by substitution row `C` in `## Phase C`, a skeptic-review index by row `C2.4` in `## Phase C2`. A finding whose own text conditions its action on a state that phase cannot be in is unactionable **by construction** and is a Must Fix against the review.``
- [ ] **The boundaries paragraph.** Replace the paragraph opening `**Three boundaries keep it from over-firing.**` with:
  ``**Three boundaries keep it from over-firing.** A precondition naming a phase already closed when the fix loop runs — any phase **above** the dispatching one in that order — is satisfiable and is not this class. A precondition naming no phase at all (*"confirm the working tree is clean first"*) is ordinary work, not a gate. An ordering precondition **inside** the dispatching phase (*"only after Finding 1's fix has landed"*) is satisfiable by that same loop and is not this class either: the test's first arm is about the dispatching phase being **closed**, not about the run having *arrived* in it.``
  - The dropped sentence explained why a closure gate is unreachable, which the test already decides. Its `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The unit loop` citation survives in `## Invocation contract`.
- [ ] **The fix to require, and the parity re-open rule.**
  - Replace the paragraph opening `**The fix to require:**` with: ``**The fix to require:** the review's author drops the gate, re-scopes the finding to what is actionable in the dispatching phase, or drops the finding. **Lowering severity is not one of them**: a `## Nice to Have` carrying such a gate stops the loop exactly as a `## Must Fix` does. The Must Fix you write for this class quotes the gate verbatim and names the two phases whose order makes it unreachable.``
  - Replace the paragraph opening ``For each Must Fix item in the review that claims a `<parity_vocabulary>` mismatch`` with: ``For each Must Fix item in the review that claims a `<parity_vocabulary>` mismatch, **re-open the cited `<reference_impl>` source at its anchor and confirm it still says what the reviewer claims** — the wire name the serialization idiom declares (`<convention_symbols>`), the threshold constant, the field's presence. A hallucinated citation sends the fix loop to change correct code.``
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home:
  - **Unactionable gates:**
    - one fix loop in one phase per index, by row (`C` / `C2.4`) and phase (`## Phase C` / `## Phase C2`);
    - a gate on a state the dispatching phase cannot be in is unactionable by construction, and a Must Fix against the review;
    - the three boundaries, with both examples and the closed-versus-arrived clause;
    - the three acceptable fixes;
    - lowering severity is not a fix, and a `## Nice to Have` gate stops the loop too;
    - the Must Fix quotes the gate and names the two phases.
  - **Parity spot-check:**
    - re-open the cited source for every parity Must Fix and confirm the claim;
    - the three things checked: wire name, threshold, field presence.

  Restore anything missing in its shortest form.

**Verification:**

- The wire and anchors survive. Run `git grep -n -F -e '<literal>' -- plugin/agents/review-plan-reviewer.md` once per literal below; each run prints at least one line:
  - `### Unactionable gates (Must Fix)`
  - `### Reference-implementation parity spot-check (Must Fix)`
  - `plan_orchestration_instructions_core.md`
  - `## Phase boundaries`
  - `## The unit loop`
  - `**Lowering severity is not one of them**`
  - `verdict: PASS`
  - `verdict: FAIL`
  - `findings_file: <full_path>`
  - `must_fix_count: <N>`
  - `# Review plan meta-review — iteration {iteration}`
  - `**Fix:**`
  - `Nothing else.`
  - `those 3 lines`
- The frozen texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `is the order of the`, `An ordering precondition **inside** the dispatching phase`, `On **both** outcomes below, an optional`, `**If everything is clean**`, `**If there are Must Fix issues**`.
- If `harness-runs/scratch/branch_review_family_check.mjs` is present (Task 1 writes it), read its output for this file. Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/review-plan-reviewer.md` as one plain foreground command; it prints no `FROZEN`, `LEAD` or `LITERAL` line, and its last line is `PASS`. If the file is absent, the two checks above stand alone.
- `git diff -- plugin/agents/review-plan-reviewer.md` shows hunks only in the four paragraphs this task owns, and none in `## Output contract`.
- `wc -w plugin/agents/review-plan-reviewer.md`, run before the first edit and again after the last, is lower the second time.
