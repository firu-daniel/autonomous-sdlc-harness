### Task 2 — Thin `user-review-fix-plan-writer`'s `## Process`, `## Output contract` and `## Revision mode`

**Goal:** Cut `## Process` steps 1–6, `## Output contract` and `## Revision mode` of `plugin/agents/user-review-fix-plan-writer.md` to direct rules stated once, keeping every observation form, classification, plan shape, review-comment wire and return line.

**Depends on:** Task 1, which thinned the same file above `## Process` and wrote the family check probe at `harness-runs/scratch/fix_plan_statistics_family_check.mjs`. Two of Task 1's edits lean on this task:
- Task 1's U10 replaced the three citation bullets of `## Read on demand` with a pointer at `## Process` step 2, and moved one detail here: U12 adds *"the marker may already be `[x]`"* to step 2's task-number form.
- Task 1's U6 deleted the *"In every revision prompt …"* paragraph; U26 below carries its *"the findings or feedback the prompt names"* half into `## Revision mode`.

If the probe file is missing, return a blocker naming it; do not write a probe of your own.

**Where this task stops.** It changes only the text from the `## Process` heading to the end of the file. It does not touch:
- anything above `## Process` (Task 1);
- the step numbers 1–6, which `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → Override 5 cites as *"→ step 6"*;
- any other file under `plugin/`.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line, leading spaces included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- in the `## Phase 2 Readiness — Ordered Fix List` bullet of step 4, the run from `_(layer: <one or more of <layer_names>>)_`. The `_(layer: …)_` tag is the layer` to `what the other layers changed.`, and the run from `State up-front in the section's lead paragraph` to `you did not author.`, which continues into the next bullet's opening `` - `## Must Fix` / `## Should Fix` / `## Nice to Have` ``;
- in the `**Per-finding files**` paragraph, the run from `— one per `### N. Title` in the index, self-contained:` to `Sub-step `- [ ]` bullets inside a finding body are`;
- the step 5 bullet opening `No finding's fix asks for a test run that`;
- `Do not paste the fix plan content back to the orchestrator — it will not read it.`;
- the whole paragraph opening `**A reviewer finding you judge wrong is resolved or recorded — never only answered in your return.**`;
- the fenced return block under `## Output contract`.

Every bold lead in this range stays, worded as it is — the six step leads, the seven reference-type leads of step 2, the five class leads of step 3, `**The index**`, `**Per-finding files**` and `**A reviewer finding you judge wrong is resolved or recorded — never only answered in your return.**`. Every heading line stays.

### Targets

- `plugin/agents/user-review-fix-plan-writer.md` → `## Process`, `## Output contract` and `## Revision mode`.

**Work:**

- [ ] **Steps 1–3.** Apply U11–U15.
  - Step 1 keeps the pull-request round shape whole and drops only its lead's rationale (U11).
  - Step 2's task-number form gains *"the marker may already be `[x]`"* (U12). Every other step 2 form, the pull-request review comment form included, is unchanged: it is the grading standard and carries the `#discussion_r` id rule.
  - Step 3 drops the parity-off restatement (U14), because the Must Fix class already gates its parity trigger on `phases.parity`. It also loses rationale in its lead and in **Needs clarification** (U13, U15).
- [ ] **Step 4.** Apply U16–U19. The heredoc rule, the index filename rule and the `## Source observations` bullet lose their rationale. The Must/Should/Nice bullet drops its *"same rule as `branch-reviewer`'s output"* citation, which is rationale (U18).
- [ ] **Step 5.** Apply U20–U22. The checks open by pointing back at step 4. The four checks that only restate a step 4 rule go: the layer tag, the out-of-scope reasoning, the source-observation numbering and the folder suffix. The exactly-once check, the grep-verified site anchor, the review-comment id rule and the test-run bullet stay.
- [ ] **Step 6, `## Output contract` and `## Revision mode`.** Apply U23–U26.
  - Step 6 states the initial-write-only rule first, then the ledger path, the one-line format, the `taught by` merge and the skip rule. It drops the escape narrative and the *"most expensive feedback"* exhortation (U23).
  - The return keeps its block and both rules around it, minus the orchestrator narration (U24, U25).
  - `## Revision mode` is one rule for all three revision prompts (U26).
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - Step 1: read every observation before verifying any; the pull-request round shape with its four provenance states, the inline-comment rule and the bookkeeping marker.
  - Step 2: all seven reference types and how each resolves, including the latest-suffix rule, the prior-round default, the reopened-finding cross-check, `<repo_root>`-relative paths, never a bare coordinate, and the review-comment id.
  - Step 3: current tree, not the historical diff; the five classes; invalid observations documented under `## Out of scope / verified-OK`; `## Questions` in the return, not the file, and stop without writing.
  - Step 4: `Write` with absolute paths, never a heredoc; exact headings; the sample references; the index filename and its round suffix; every index section in order with its rules; the per-finding file contents and the folder suffix.
  - Step 5: exactly-once, the grep-verified anchor, every `comments=` id accounted for, no test run.
  - Step 6: initial write only; the literal ledger path in this checkout; one line per generalizable lesson, merged into `taught by` when present; skip specifics; nothing appended is normal.
  - The return block, `(pending — questions for user)` with nothing written, no plan content pasted back, and `## Revision mode`'s authority, scope and no re-verification rule, with the rejected-findings rule unchanged.

### Replacements

**U11** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
Internalize every numbered observation before starting verification — context from one item often clarifies another.
```

with

```text
Read every observation before verifying any.
```

**U12** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
readiness entry (`N. [ ] **Task K** — <short title>`) under
```

with

```text
readiness entry (`N. [ ] **Task K** — <short title>`; the marker may already be `[x]`) under
```

**U13** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
— not the historical diff. What matters is whether the issue still exists in the working tree today. Classify each observation:
```

with

```text
— not the historical diff: does the issue still exist in the working tree? Classify each observation:
```

**U14** — `plugin/agents/user-review-fix-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 With the parity phase off there is no reference implementation to deviate from, so the parity trigger is inert; the other two stand unchanged.
```

**U15** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
List in a `## Questions` section at the top of your response message (NOT in the file) and stop without writing — the orchestrator will surface these to the user.
```

with

```text
List it in a `## Questions` section above your `## Output contract` block (NOT in the file) and stop without writing.
```

**U16** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
`<repo_root>`; do not use Bash heredoc (`cat <<EOF > …`).
```

with

```text
`<repo_root>`, never a Bash heredoc.
```

**U17** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
— keep this exact filename; the round-suffix logic depends on it (a re-run becomes `<branch>_fix_plan_2.md`, `_3.md`, …). The index holds, in this order:
```

with

```text
— this exact filename, which a re-run round-suffixes (`<branch>_fix_plan_2.md`, `_3.md`, …). It holds, in this order:
```

**U18** — `plugin/agents/user-review-fix-plan-writer.md`: replace (the Old block opens with one space)

```text
 Do NOT inline the full problem description or fix snippet here — those live in the per-finding files. Checkboxes live only in the Phase 2 Readiness list (same rule as `branch-reviewer`'s output — `${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`).
```

with (opening with one space)

```text
 The problem description and fix live only in the per-finding file, and checkboxes only in the Phase 2 Readiness list.
```

**U19** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
— verbatim copy of the original user observations, numbered to match, so the fix plan is self-contained.
```

with

```text
— a verbatim copy of the user's observations, numbered to match.
```

**U20** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
5. **Quality checks before saving:**
```

with

```text
5. **Quality checks before saving:** re-check the draft against step 4, then confirm:
```

**U21** — `plugin/agents/user-review-fix-plan-writer.md`: delete this line, leading spaces included, together with its line break

```text
   - Every Phase 2 Readiness entry carries a `_(layer: …)_` tag with one or more of `<layer_names>`, matching the fix-target file paths in the finding's detail file against the `layers[].path` scopes of `<layer_path_map>`.
```

**U22** — `plugin/agents/user-review-fix-plan-writer.md`: delete these lines, leading spaces included, together with their line breaks

```text
   - Every invalid observation appears under `## Out of scope / verified-OK` in the index with the verification reasoning (what you read, why the observation does not apply).
   - `## Source observations` lives in the index and its numbering matches the user-review file's numbering exactly.
   - The per-finding folder name carries the same round suffix as the index file.
```

**U23** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
6. **Append net-new lessons to the ledger.** The ledger is `<repo_root>/<state_dir>/lessons.md` — resolve `<repo_root>` per this file's own token table above, then grep, read and append at that literal path with the Grep / Read / Edit tools. Appending in another checkout of this repository instead writes the new lesson onto that checkout's branch, where it never reaches the branch under review and dirties that tree — the escape this step guards against. A user-caught observation is the workflow's most expensive feedback — distill it so the pipeline stops repeating it. For each **valid** observation, ask: does it generalize beyond this branch (a rule a future plan or review should enforce)? If yes and the ledger does not already carry it (grep `<repo_root>/<state_dir>/lessons.md` first), append ONE line to the matching category section: `- **<rule>** _(taught by: <branch>)_`. If the rule already exists, add this branch to its `taught by` list instead. Skip observation-specific details (exact file names, one-off copy tweaks). Typically 0–3 lines per review round — appending nothing is a normal outcome. This step runs in **initial-write mode only**, never in revision mode.
```

with

```text
6. **Append net-new lessons to the ledger.** This step runs in **initial-write mode only**, never in revision mode. The ledger is `<repo_root>/<state_dir>/lessons.md`, with `<repo_root>` resolved per `## Resolved values`: grep, read and append at that literal path with the Grep / Read / Edit tools, never in another checkout. For each **valid** observation that generalizes beyond this branch — a rule a future plan or review should enforce — append ONE line to the matching category section: `- **<rule>** _(taught by: <branch>)_`. If the ledger already carries the rule (grep it first), add this branch to its `taught by` list instead. Skip observation-specific details (exact file names, one-off copy tweaks). Typically 0–3 lines per review round — appending nothing is a normal outcome.
```

**U24** — `plugin/agents/user-review-fix-plan-writer.md`: replace (the Old block opens with one space)

```text
 Do NOT write the index or any per-finding file in that case — the orchestrator will redispatch you with the user's answers.
```

with (opening with one space)

```text
 Do NOT write the index or any per-finding file in that case.
```

**U25** — `plugin/agents/user-review-fix-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 The orchestrator will present the contract summary to the user and dispatch the per-fix loop (one per-finding file per fix) once approved.
```

**U26** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
When given findings or user feedback, treat it as authoritative. Re-read the existing fix plan, apply only the requested changes, and re-save. Preserve everything not flagged. Do NOT re-verify observations that were not reopened — the revision instructions override prior verification. The two gate revisions (business-parity, architecture) target the same index and per-finding files as the user-feedback one, so the same rule applies to all three: open only what the findings file names, fix its items, leave the rest.
```

with

```text
Treat the findings or user feedback as authoritative, under all three revision prompts. Re-read the existing fix plan and the findings or feedback the prompt names, open only the files they target, apply only the requested changes, and re-save. Preserve everything not flagged, and do NOT re-verify observations that were not reopened.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/fix_plan_statistics_family_check.mjs plugin/agents/user-review-fix-plan-writer.md` as one plain foreground command. It prints a `WORDS user-review-fix-plan-writer.md` line with a negative `delta`, its last line is `PASS`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -E '^[1-6]\. \*\*' -- plugin/agents/user-review-fix-plan-writer.md` prints the `## Process` step leads numbered 1 to 6 in order, with no number missing, and step 6 is still `6. **Append net-new lessons to the ledger.**`.
- `git grep -n -F -e 'agents/branch-reviewer.md' -e 'Internalize' -e 'most expensive feedback' -- plugin/agents/user-review-fix-plan-writer.md` prints nothing.
- Step 5's bullet list has no blank line inside it: in `git diff -- plugin/agents/user-review-fix-plan-writer.md`, the lines after `5. **Quality checks before saving:**` run without a gap down to the test-run bullet.
- `git diff -- plugin/agents/user-review-fix-plan-writer.md` shows this task's hunks only below the `## Process` heading.
