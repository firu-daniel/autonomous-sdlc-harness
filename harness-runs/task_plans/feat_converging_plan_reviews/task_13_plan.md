### Task 13 — Make `task-plan-writer`'s revision work by target file and leave a revision note

**Goal:** Teach `plugin/agents/task-plan-writer.md` the round's revision prompt — every findings file of the round plus a revision note path — and point its `## Revision mode` at the shared writer's procedure: group by target file, read every finding against the unchanged text first, resolve incompatible findings by precedence, write the revision note last.

**Depends on:** Task 11, whose `## Loop` step 1 sends `Revise the task plan per findings at <findings_files>.` then `Revision note: <state_dir>/plan_revisions/<branch>/task_plan_revision_<iteration>.md` then `Story index: …` and `Per-task files: …`, `<findings_files>` being every findings file of the closed round in gate order joined by `, `. Task 10, whose `plugin/instructions/plan_review_rounds.md` → `## The writer's revision` and `## A rejection recorded under precedence` state the procedure, the note's format and the precedence record.

**Where this task stops.** The procedure lives in the shared module; this definition cites it and adds only the words its new behaviour needs (`.claude/context/plugin.md` → `## Writing agent prose`, *"An agent's growth is paid for by behaviour"*). The fix-plan writer is **Task 14**.

### Targets

- `plugin/agents/task-plan-writer.md`

**Work:**

- [ ] `## Invocation contract` → **Revision:** replace the prompt block with the three-line form above (plus the two existing path lines), and the sentence after it: read the findings files the prompt names and the files they target, then follow `## Revision mode`.
- [ ] `## Revision mode`: *"Treat the findings file as authoritative"* becomes *"the round's findings files"*; add one paragraph citing `${CLAUDE_PLUGIN_ROOT}/instructions/plan_review_rounds.md` → `## The writer's revision` for grouping by target file, reading every finding on a file against its unchanged text before the first edit, the Should Fix rule and the revision note (written last, at the prompt's `Revision note:` path), and → `## A rejection recorded under precedence` for an incompatible pair. Keep the target-set exception (re-execute the register's derivation entries) and the `## Rejected findings` paragraph, adding to the latter that a precedence loss is recorded in that module's form.
- [ ] State that an `## Incidental findings (not gating)` entry is never acted on in a revision; it is a lead for the end-of-branch reviewers, not a finding to apply.

**Verification:**

- `grep -n "per findings at <findings_file>\.\|the findings file as authoritative" plugin/agents/task-plan-writer.md` finds nothing; `grep -n "Revision note:" plugin/agents/task-plan-writer.md` finds the prompt line.
- `grep -n "plan_review_rounds.md" plugin/agents/task-plan-writer.md` cites only headings that exist in that module.
- The frontmatter's `tools:` line is unchanged (`Read, Write, Edit, Bash, Glob, Grep, mcp__devscene-docs__search_docs`): the note is written with the `Write` it already has.
