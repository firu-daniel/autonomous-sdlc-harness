### 2. Restore the shared `## Resolved values` placeholder sentence in the writer

**Severity:** Must Fix

**Site:** `plugin/agents/task-plan-writer.md` → `## Resolved values`, the intro paragraph's third sentence *"Path and template placeholders resolve where they appear."*

**Problem.** Every agent definition's `## Resolved values` intro carries the same third-sentence lead, followed by that agent's own list:

> Ordinary **path and template placeholders** are deliberately not listed — the body's own text resolves each where it appears: …

Counts at HEAD:
- `grep -c -F "Ordinary **path and template placeholders** are deliberately not listed — the body's own text resolves each where it appears:" plugin/agents/*.md` finds the exact lead in 13 definitions, `task-plan-reviewer.md` among them.
- `grep -L "the body's own text resolves each where it appears" plugin/agents/*.md` lists only `task-plan-writer.md`.

The writer replaced the shared lead with a sentence of its own, so the copy is forked. That breaks `.claude/context/plugin.md` → `## Writing agent prose` (*"A block several agents carry is one wording, copied byte-for-byte into every copy; where copies differ only in a word, keep the difference and nothing else"*). It also leaves the pair inconsistent, because the reviewer half of this family kept the shared form.

The per-agent list after the colon is the permitted difference. It must name the placeholders this writer's body actually uses now. Task 1 deleted the only body mention of `<prompt_path>`, so the restored list leaves out the baseline's *"and the `<prompt_path>` the first resolves in place"* clause.

**Fix.**

- [ ] In `plugin/agents/task-plan-writer.md` → `## Resolved values`, replace the sentence *"Path and template placeholders resolve where they appear."* with:

  ```markdown
  Ordinary **path and template placeholders** are deliberately not listed — the body's own text resolves each where it appears: the two prompt forms of `## Invocation contract` and the `<findings_file>` the second of them carries, `<branch>` / `<N>` / `<K>` in the artifact paths, `<full_path>` in the return block, and `<title>` / `<short title>` / `<file>` / `<symbol>` / `<feature>` in the plan templates and the deferral marker.
  ```

  Leave the first two sentences of that paragraph unchanged, because they are frozen.

**Verification.**
- `grep -c -F "Ordinary **path and template placeholders** are deliberately not listed — the body's own text resolves each where it appears:" plugin/agents/task-plan-writer.md` is non-zero.
- `grep -c -F '<prompt_path>' plugin/agents/task-plan-writer.md` is `0`, so the list names no placeholder the body no longer uses.
- `wc -w plugin/agents/task-plan-writer.md` stays below the baseline count of 6335.
