### Task 3 — Anchor `branch-reviewer` and `skeptic-reviewer` findings and carry the rewritten severity clauses

**Goal:** Make the two end-of-branch reviewers whose per-finding files feed the fix loop write a site anchor instead of a `[<file>:<line>](<file>#L<line>)` link, and carry the same Should Fix / Nice to Have / carve-out clauses as `layer-reviewer.md`, byte for byte.

**Depends on:** Task 2, which writes C1, C2, C3 and C5 into `plugin/agents/layer-reviewer.md`. This task restates all four below exactly as Task 2 fenced them; a byte of difference between the two files is a defect of this task. Task 2 owns `layer-reviewer.md`; this task owns only the two files under `### Targets`. Task 4 (`review-plan-reviewer.md`) grades the per-finding files these two agents write, and Task 8 rewrites the sample those files are byte-compatible with — neither file is edited here.

C1:

```text
- **Should Fix** — the code or claim is wrong or unclear but no consumer decision turns on it; and a line coordinate in a durable artifact — an instruction file, an agent definition, a catalog document, a standing tracked artifact under `<state_dir>`, a code comment — stale or not, or a citation in any artifact that locates its site by a line coordinate alone, repaired by replacing the coordinate with a symbol anchor.
```

C2:

```text
- **Nice to Have** — style, wording, ordering; and a stale line hint beside an anchor that resolves, in a point-in-time artifact (a plan, a review, a finding, a QA report).
```

C3:

```text
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry.
```

C5:

```text
the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)
```

### Targets

- `plugin/agents/branch-reviewer.md` — `## Resolved values` intro; `## Process` → the segment-draft sentence; `### Pass 2`; `## Findings format`; the parity group; `**Grade every finding by consequence.**`; `**Guard carve-out.**`; `## Output contract` item 2.
- `plugin/agents/skeptic-reviewer.md` — `## Resolved values` intro; `## Process` step 4; adversarial check 3; `**Grade every finding by consequence.**`; `**Guard carve-out.**`; `## Findings format`.

**Work:**

- [ ] Both files: replace the Should Fix bullet with C1, the Nice to Have bullet with C2 and the `**Guard carve-out.**` paragraph with C3. Leave each file's `**Your own checklist is not downgradable.**` and `**Prose volume — the receiving side.**` paragraphs as they are.
- [ ] Both files' per-finding contract: replace *"the file-and-line reference in markdown link form (`[<file>:<line>](<file>#L<line>)`)"* with C5. In `branch-reviewer.md` also replace the bare *"the file-and-line reference"* in the `Each finding item carries …` sentence and in `## Output contract` item 2 with *"the site anchor"*. In both `## Resolved values` intros, remove `` `<line>` `` from the findings-template placeholder list, and `` `<file>` `` too if no other occurrence remains in that file.
- [ ] `branch-reviewer.md`: in the segment-draft sentence replace *"(title, file and line, severity, one-line description)"* with *"(title, site anchor, severity, one-line description)"*; in `### Pass 2` step 3 replace *"(the same file and line, or the same systemic problem at a different location)"* with *"(the same site anchor, or the same systemic problem at a different location)"* and *"(a later unit refactored the file, the line moved, the component was deleted)"* with *"(a later unit refactored the code away, or the component was deleted)"* — a moved line no longer makes a finding stale; in the parity group replace *"cite the `<reference_impl>` source line as your evidence"* with *"cite the `<reference_impl>` source anchor as your evidence"*.
- [ ] `skeptic-reviewer.md`: in `## Process` step 4 replace *"cite the exact file and line and the exact reason"* with *"cite the exact site anchor and the exact reason"*; in check 3 replace *"a miscited line (the cited source does not support the claimed behaviour)"* with *"a miscited source (the cited source does not support the claimed behaviour)"*.

**Verification:**

- Grep both files for `file-and-line`, `<file>:<line>`, `#L<line>`, `file and line`, `line moved`, `miscited line`, `source line`, `consumed within its own round` and `anything read after the round that produced it`: no hit.
- With the Grep tool in fixed-string mode, search `plugin/agents/` for each of C1, C2 and C3 as fenced above: the files returned are exactly `branch-reviewer.md`, `skeptic-reviewer.md` and `layer-reviewer.md`. Search `plugin/agents/` for C5: every file returned is one of `layer-reviewer.md`, `branch-reviewer.md`, `skeptic-reviewer.md` and the files Tasks 4, 5 and 7 own, and both targets here are among them.
- Re-derive the quoters of the renamed phrase before closing: grep `plugin/` for `file-and-line reference`. Every remaining hit is in a file Task 4, 5 or 7 owns, or is `user-review-fix-plan-writer.md`'s user-input wording — none is in this task's targets.
- Dead pointers still block: against the new `branch-reviewer.md` text, a finding anchored `` `src/data/search/searchService.ts` (`fetchRecentSearchs`) `` — a symbol that does not resolve in that file — is Must Fix under *"a pointer's target does not exist"* and C3; the same anchor spelled correctly with a stale `line 47` hint beside it is Nice to Have at most under C2.
- `claude plugin validate --strict plugin` prints `✔ Validation passed` (judged on the printed text).

**Deviations from plan:** Verification bullet `claude plugin validate --strict plugin` was not executed: the command was refused by the permission layer in this session. The edit touches only body prose of two agent definitions (no frontmatter), so that bullet rests on reading, not execution. The `<file>` placeholder was kept in both `## Resolved values` intros because `<file>` still occurs in each file (`## Unsolicited dispatch guidance`, `apply <file> → <section>`).
