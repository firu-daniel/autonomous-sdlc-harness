### Task 7 — Anchor the user-review fix-plan finding contract and the fix loop's self-containment wording

**Goal:** Make the user-review fix-plan writer store a site anchor in every `finding_<N>.md` — still accepting a user's `<file>:<line>` as input, and turning it into an anchor before a finding file stores it — and make the fix loop's own description of a self-contained finding say *anchor* where it says `file:line`.

**Depends on:** Task 3, which writes C5 into the code-review and skeptic finding contracts. This task carries C5 byte-identical into `user-review-fix-plan-writer.md`, as Tasks 2, 4 and 5 do into theirs. Task 9 rewrites the fix-plan sample fixtures this writer dereferences; this task does not edit them.

C5:

```text
the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)
```

**What stays, and why.** A user may still type `<file>:<line>` in a review, and `plugin/samples/sample_user_review.md` keeps listing *"file:line"* as a reference type. Step 2's **File and line** bullet stays as the input route; step 3's *"the cited file and line point at unrelated code"* and the token table's *"a file-and-line reference in an observation"* describe that input and stay. Only what the writer **stores** changes.

### Targets

- `plugin/agents/user-review-fix-plan-writer.md` — `## Resolved values` intro; `## Process` step 2 **File and line** bullet, step 4 per-finding contract, step 5 quality checks.
- `plugin/instructions/unit_loop_core.md` — `## Substitution table`, row `UR-A`, detail-file cell.
- `plugin/instructions/user_review_fixes_instructions_core.md` — the `**Context discipline is critical.**` bullet list's *"The fix plan is self-contained"* bullet.
- `plugin/instructions/user_review_fixes_instructions.md` — step 2 (*"**Do not read** the task prompt …"*).

**Work:**

- [ ] `user-review-fix-plan-writer.md` step 2 **File and line** bullet: after *"so the citation is not scoped to the application's own tree."* append *" Store what that line holds, never the coordinate alone: the finding's site anchor names the symbol, heading or quoted substring you found there."*
- [ ] Step 4 per-finding contract: replace *"the file-and-line reference (markdown-link form, e.g., `[<file>:<line>](<repo-relative path to file>#L<line>)`)"* with C5. Step 5: replace *"Every finding's detail file cites a file and line that you actually read."* with *"Every finding's detail file carries a site anchor you grep-verified in the current tree."* `## Resolved values` intro: replace *"`<file>` / `<line>` in the file-and-line reference forms"* with *"`<file>` / `<line>` in the user's file-and-line citation form"*.
- [ ] `unit_loop_core.md` row `UR-A`: replace *"self-contained: file:line, the full problem description and the concrete fix"* with *"self-contained: the site anchor, the full problem description and the concrete fix"*. Change no other cell of the row or the table.
- [ ] `user_review_fixes_instructions_core.md`: replace *"cites file:line and carries its own fix"* with *"anchors its site and carries its own fix"*; `user_review_fixes_instructions.md`: replace *"already cites file:line and carries its own fix"* with *"already anchors its site and carries its own fix"*.

**Verification:**

- Grep the three instruction targets for `file:line`: no hit. Grep `user-review-fix-plan-writer.md` for `<file>:<line>` and find exactly the step 2 **File and line** input bullet, and for `#L<line>` and find nothing.
- With the Grep tool in fixed-string mode, search `user-review-fix-plan-writer.md` for C5 exactly as fenced above: one hit.
- Self-containment still holds end to end: read the edited step 4 contract, row `UR-A` and both fix-flow sentences together, and confirm an implementer handed only `finding_<K>.md` is told it holds a site anchor precise enough to grep — a symbol plus a quoted substring, or a bare path only for a whole-file change.
- `unit_loop_core.md` stays a core: it gains no mode literal, slash-command name or absolute path (`plugin/instructions/mode_contract.md` rule 4).
- `claude plugin validate --strict plugin` prints `✔ Validation passed`.
