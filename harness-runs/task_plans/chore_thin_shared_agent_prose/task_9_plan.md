### Task 9 — Thin the rejected-findings rules on both sides, and the reviewers' "If there are Must Fix issues" line, identically in every copy

**Goal:** Shorten the writer-side rule for a reviewer finding the writer judges wrong (four writers in three families), its reviewer-side counterpart (four reviewers in three families), and the findings-file line three plan reviewers share — writing one result per block into every copy and keeping every wire literal the flow walker parses.

**Depends on:** Task 8, which edits the grading blocks of `review-plan-reviewer.md` and `task-plan-reviewer.md`; and, through it, Tasks 2–7, which edit other sections of these files. This task changes only the three blocks named here.

**Where this task stops.** These strings are parsed or quoted elsewhere and stay byte-for-byte: the heading `## Rejected findings`; the two entry shapes `- **<finding number or title>** (rejected round <i>) — <reason>` and `- **<finding number or title>** (rejected round <i>; rebutted round <j> — call stands) — <reason>` (`scripts/lib/flow-walker-gates.sh` and its template `cli/templates/scripts/lib/flow-walker-gates.sh` read `## Rejected findings` and match `call stands`, citing `task-plan-writer.md` → `## Revision mode`); `rebutted round <j> — call stands`; `<findings_folder>/review_{iteration}.md`; `mkdir -p <findings_folder>`; and the headings `## Revision mode` and `## Output contract`. The lead sentence `architecture-reviewer.md` and `business-parity-reviewer.md` put before the reviewer-side rule ("**In plan-review mode, read the index's `## Rejected findings` section as well as its `## Context`** — in … sub-cases, …") stays; only the rule after it changes. `test-fix-plan-writer.md`'s copy has no user-observation sentence — a test fix plan has no user observations — and keeps that difference.

Each replacement gives the **old** text and the **new** text in their own fenced blocks; match the old text exactly and replace it whole.

### Targets

- Writer side — `plugin/agents/task-plan-writer.md`, `plugin/agents/user-review-fix-plan-writer.md`, `plugin/agents/ui-tests-plan-writer.md`, `plugin/agents/test-fix-plan-writer.md`.
- Reviewer side — `plugin/agents/task-plan-reviewer.md`, `plugin/agents/ui-tests-plan-reviewer.md`, `plugin/agents/architecture-reviewer.md`, `plugin/agents/business-parity-reviewer.md`.
- The findings-file line — `plugin/agents/task-plan-reviewer.md`, `plugin/agents/ui-tests-plan-reviewer.md`, `plugin/agents/review-plan-reviewer.md`.

**Work:**

- [ ] **Writer side**, in `task-plan-writer.md`, `user-review-fix-plan-writer.md` and `ui-tests-plan-writer.md`. Old:

```markdown
**A reviewer finding you judge wrong is resolved or recorded — never only answered in your return.** Append it to a `## Rejected findings` section at the END of the index, one line each: `- **<finding number or title>** (rejected round <i>) — <reason>`. When a later round re-raises that finding, update that same entry to `- **<finding number or title>** (rejected round <i>; rebutted round <j> — call stands) — <reason>` instead of adding a second line. A user's own observation is authoritative and is never recorded here. **`call stands` is unavailable for a Must Fix:** record the rejection and its reason, and stop there — never the closing marker. A Must Fix you do not resolve stays open into the next round.
```

  New:

```markdown
**A reviewer finding you judge wrong is resolved or recorded — never only answered in your return.** Record it as one line of a `## Rejected findings` section at the END of the index: `- **<finding number or title>** (rejected round <i>) — <reason>`. When a later round re-raises it, update that same line to `- **<finding number or title>** (rejected round <i>; rebutted round <j> — call stands) — <reason>`. A user's own observation is authoritative: never record it here. **`call stands` is unavailable for a Must Fix:** record the rejection and its reason only; a Must Fix you do not resolve stays open into the next round.
```

- [ ] **Writer side**, in `test-fix-plan-writer.md`. Old:

```markdown
**A reviewer finding you judge wrong is resolved or recorded — never only answered in your return.** Append it to a `## Rejected findings` section at the END of the index, one line each: `- **<finding number or title>** (rejected round <i>) — <reason>`. When a later round re-raises it, update that same entry to `- **<finding number or title>** (rejected round <i>; rebutted round <j> — call stands) — <reason>` instead of adding a second line. **`call stands` is unavailable for a Must Fix:** record the rejection and its reason, and stop there. A Must Fix you do not resolve stays open into the next round.
```

  New (the three-writer text without its user-observation sentence):

```markdown
**A reviewer finding you judge wrong is resolved or recorded — never only answered in your return.** Record it as one line of a `## Rejected findings` section at the END of the index: `- **<finding number or title>** (rejected round <i>) — <reason>`. When a later round re-raises it, update that same line to `- **<finding number or title>** (rejected round <i>; rebutted round <j> — call stands) — <reason>`. **`call stands` is unavailable for a Must Fix:** record the rejection and its reason only; a Must Fix you do not resolve stays open into the next round.
```

- [ ] **Reviewer side**, in its four files. In `task-plan-reviewer.md` and `ui-tests-plan-reviewer.md` the rule is a bullet beginning `- **A recorded rejection`; in the other two it follows the lead sentence on the same line. Old (from the bold sentence to the end of the rule):

```markdown
**A recorded rejection is an addressed finding only once you have tested it.** A finding listed in the index's `## Rejected findings` section with a reason does not enter your Must Fix set on the strength of being listed. That trailing section is permitted, never a format break. An entry that records no rebuttal you **must test**: read the recorded reason against the artifact and the tree, accept it where it holds, and **re-raise the finding once** — as a rebuttal engaging that reason — where it does not. An entry that already records one (`rebutted round <j> — call stands`) is closed — do not raise it again. A finding **you grade Must Fix** never closes this way: `call stands` is unavailable to the writer there, so test the recorded reason every round and re-raise while it does not hold, regardless of any closing marker on the entry. A finding neither resolved in the artifact nor recorded there is unaddressed: raise it.
```

  New:

```markdown
**A recorded rejection is an addressed finding only once you have tested it.** The index's trailing `## Rejected findings` section is permitted, never a format break, and a finding listed there with a reason does not enter your Must Fix set merely for being listed. Test each entry that records no rebuttal: read its reason against the artifact and the tree, accept it where it holds, and otherwise **re-raise the finding once**, as a rebuttal engaging that reason. An entry that records one (`rebutted round <j> — call stands`) is closed — do not raise it again — except a finding **you grade Must Fix**, for which `call stands` is unavailable to the writer: test its reason every round and re-raise while it does not hold, whatever marker the entry carries. A finding neither resolved in the artifact nor recorded there is unaddressed: raise it.
```

- [ ] **The findings-file line**, in its three files. Old:

```markdown
**If there are Must Fix issues**, save findings to `<findings_folder>/review_{iteration}.md` (run `mkdir -p <findings_folder>` before the Write — the caller does not pre-create the folder) in this format:
```

  New:

```markdown
**If there are Must Fix issues**, run `mkdir -p <findings_folder>`, then save findings to `<findings_folder>/review_{iteration}.md` in this format:
```

- [ ] Before saving each file, confirm each block kept every rule — record-not-answer, the END-of-index section, both entry shapes, update-in-place on re-raise, the user-observation exclusion (three writers), the Must Fix bar on `call stands`, and the open-into-next-round rule on the writer side; permitted section, not-Must-Fix-for-being-listed, test-then-accept-or-re-raise-once, closed-on-`call stands`, the Must Fix exception and raise-the-unaddressed on the reviewer side; `mkdir` before the write — and dropped only "instead of adding a second line" (update in place says it), "and stop there — never the closing marker" (unavailable says it) and "the caller does not pre-create the folder" (rationale for the `mkdir`).

**Verification:**

- The copies match: `git grep -l -F -e 'Record it as one line of a' -- plugin/agents` lists the four writers; `git grep -l -F -e 'is authoritative: never record it here.' -- plugin/agents` lists the three writers other than `test-fix-plan-writer.md`, whose copy reads as the three-writer text minus that one sentence; `git grep -l -F -e 'merely for being listed' -- plugin/agents` lists the four reviewers; `git grep -l -F -e 'then save findings to' -- plugin/agents` lists the three findings-line files.
- The old text is gone: `git grep -l -F -e 'instead of adding a second line' -e 'on the strength of being listed' -e 'the caller does not pre-create the folder) in this format' -- plugin/agents` lists nothing.
- The parsed wires survive: `git grep -l -F -e '## Rejected findings' -- plugin/agents` lists the same files as `git grep -l -F -e '## Rejected findings' b7ebf1f0 -- plugin/agents`; `git grep -c -F -e 'rebutted round <j> — call stands' -- plugin/agents` reports one line in each of the eight files; `git grep -n -F -e '## Revision mode' -- plugin/agents/task-plan-writer.md` prints that heading.
- Each edited file is shorter: record `wc -w` for each before your first edit; after the edit each figure is lower.
