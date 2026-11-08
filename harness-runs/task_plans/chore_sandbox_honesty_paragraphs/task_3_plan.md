### Task 3 — Point the generated write-protection `_README` line at the trio guard and the record, pin the new `_README` text in `profile.test.mjs`, and cite CS2's verdict in `checks.ts`'s doc comment

**Goal:** The one generated `_README` line that describes what the sandbox protects says what stands for the run copy's trio on a bubblewrap host — a harness plugin guard hook against the file tools, cited through `docs/sandbox-record.md` residual 12, which names that guard, and with no `plugin/` file named in the string (`.claude/context/conventions.md` → `## The layers`: *"`cli/src` names `plugin/` files only inside doc comments and in `doctor`'s own report text"*) — and points at `docs/sandbox-record.md`; and a test pins the `_README` text this task and Task 2 write, so a later edit cannot silently bring back a claim the record does not support. It also closes the third copy of roadmap item 22's stale *"CS2, owed"*, in a `doctor` doc comment.

**Depends on:** Task 2, which rewrote the template's `_README` and fixed these line openings, spelled exactly:

- `THE SANDBOX IS STRICT:` — now also names what runs outside the sandbox (`apiKeyHelper` among them) and cites `docs/sandbox-record.md §1`;
- `THE PROBE ROUTE GRANTS AN INTERPRETER AT ONE REMOVE` — now cites `SR2`;
- `A HEADLESS \`-p\` SESSION WAS COMPARED WITH AN INTERACTIVE ONE ON ONE CALL:` — replaces the line that opened `WHETHER A HEADLESS`, and cites `HP1`;
- `WHAT THE SANDBOX STILL LEAVES OPEN IS NUMBERED IN THE HARNESS'S DOCUMENT OF RECORD:` — replaces the line that opened `TWO RESIDUALS`.

**Which check pins the `_README` text — the answer the task prompt asks for.** No `doctor` check reads its prose: `profile-sandbox` (`cli/src/doctor/checks.ts`) reads only whether a line starts with `SANDBOX_OPT_OUT_MARKER` (`cli/src/generators/sandboxProfile.ts`), which this branch does not change. The text is pinned by `cli/test/profile.test.mjs`: the case `every path that runs outside the sandbox is write-protected on both sides` pins the write-protection line clause by clause, and after this task a new case pins the template lines above. Both run against the compiled CLI through a fixture `init` wires.

### Targets

- `cli/src/generators/writeProtection.ts` → `applyWriteProtection`, the `appendReadme` string opening `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT`.
- `cli/test/profile.test.mjs` — one new `test(…)` case.
- `cli/src/doctor/checks.ts` — the doc comment above `SANDBOXED_WRAPPER_CONSEQUENCE` (its *"CS2, owed"*; story index register row 72, roadmap item 22).

**Work:**

- [ ] **`writeProtection.ts`, the write-protection line.** Change no clause the existing case pins — every substring `every path that runs outside the sandbox is write-protected on both sides` asserts stays byte-identical, and so does the ending *"…is refused by design."*. Insert, after the clause ending *"…that is not an empty regular file"* and before *"A run's own edit under a protected worktree path"*, one sentence: *"On a host sandboxed by bubblewrap a harness plugin guard hook refuses `Edit`, `Write` and `NotebookEdit` on those three paths instead of a rule here (docs/sandbox-record.md residual 12)."* The sentence names no `plugin/` file: this string is generator output rendered into every adopter's profile, neither a doc comment nor `doctor`'s report text, so the conventions rule *"`cli/src` names `plugin/` files only inside doc comments and in `doctor`'s own report text"* (`.claude/context/conventions.md` → `## The layers`) keeps the guard's file name out of it — residual 12 names the guard for the reader. The module's existing doc-comment mention of `plugin/hooks/git-trust-file-guard.sh` is untouched. And end the line with one sentence: *"What the sandbox contains, what it leaves outside and each residual are docs/sandbox-record.md §1 and §6."* This is a string change only: no path, no rule and no export of the module changes, and its header needs no amendment.
- [ ] **`profile.test.mjs`, a new case** titled `the _README says what the sandbox leaves outside and points at its document of record`, placed after `every path that runs outside the sandbox is write-protected on both sides` and built the way that case builds its profile (a fixture `init` wires, the file's own helpers). Assert, each with a message quoting the offending line:
  - exactly one line starts with `THE SANDBOX IS STRICT:`, and it includes `apiKeyHelper` and `docs/sandbox-record.md`;
  - the line starting `THE PROBE ROUTE GRANTS AN INTERPRETER AT ONE REMOVE` includes `SR2`;
  - exactly one line starts with ``A HEADLESS `-p` SESSION WAS COMPARED WITH AN INTERACTIVE ONE ON ONE CALL:`` and includes `HP1`, and no line starts with `WHETHER A HEADLESS`;
  - exactly one line starts with `WHAT THE SANDBOX STILL LEAVES OPEN IS NUMBERED IN THE HARNESS'S DOCUMENT OF RECORD:` and includes `docs/sandbox-record.md`, and no line starts with `TWO RESIDUALS`;
  - the line starting `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN` includes `residual 12` and `docs/sandbox-record.md`. Assert no plugin file name here: the guard's file name is not part of this line's contract.
- [ ] **The suite header.** The file's header lists the shapes it pins; add one clause naming this case's rule — the `_README` states no sandbox result the document of record does not, and points at it — in the header's own voice. Change nothing else in the header.
- [ ] **`checks.ts`, the doc comment above `SANDBOXED_WRAPPER_CONSEQUENCE`.** Replace *"`docs/sandbox-verification.md` CL4, and CS2, owed"* with *"`docs/sandbox-verification.md` CL4, and CS2, pass"* — `docs/sandbox-record.md` §7's roadmap-item-22 bullet grades CS2 **pass**, the same fix Task 1 makes in `commit-on-branch.sh`. Doc comment only: the `SANDBOXED_WRAPPER_CONSEQUENCE` string, every check and every export stay byte-identical, so no `doctor` output changes.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` passes, from the repository root, as one plain foreground command; read the counts and the exit status.
- Mutation check, reverted before the run above: temporarily restore the old `WHETHER A HEADLESS …` opening in the template and see the new case fail naming it; restore the template.
- `git diff -- cli/src/generators/writeProtection.ts` shows one changed string literal and nothing else.
- `git grep -n -F "CS2, owed" -- cli/src/doctor/checks.ts` finds nothing, and `git diff -- cli/src/doctor/checks.ts` changes only lines inside the `/** … */` comment above `SANDBOXED_WRAPPER_CONSEQUENCE`.
- Re-read the inserted guard sentence against `docs/sandbox-record.md` residual 12 and `plugin/hooks/README.md`'s `git-trust-file-guard.sh` row: it states what the guard refuses and no more, and it names no `plugin/` file — `git diff -- cli/src/generators/writeProtection.ts` adds no `.sh` file name and no `plugin/` path inside the changed string literal.
