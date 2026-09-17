### Task 1 — Re-point the `cli/` comments that send a reader to the README for a measurement

**Goal:** Four doc comments under `cli/` tell a reader that a measurement is recorded in the root `README.md`. This branch moves those measurements out of the README (Tasks 2 and 3), so point each comment at a document that already carries the measurement today. The comments must be true before and after the README is compacted.

**Where this task stops.** Comment text only. No code, no string literal and no assertion changes. The README, `docs/cli.md` and `docs/development.md` belong to Tasks 2, 3, 5 and 6, and this task edits none of them. Each new pointer names a section that **already** states the fact the comment relies on, so this task does not depend on any later task:

- `docs/development.md` → `## 6. The roadmap this tree defers to`, the paragraph opening **"A third debt belongs to no row at all"**, already says: *"on Claude Code 2.1.237, in a `claude -p` session both `/autonomous-sdlc-harness:harness-analyze` and the bare `/harness-analyze` answer `Unknown command`"*.
- `docs/cli.md` → `## 7. \`doctor\``, the bullet opening **"`jj-repository` is a warning in every state it can report"**, already says: *"measured on **jj 0.44.0**, a non-colocated repository keeps a real non-bare `.git` at the working-copy root with a `.jj/` beside it too"*.

### Targets

- `cli/src/commands/init.ts` — the doc comment above `ANALYZE_COMMAND_QUALIFIED`.
- `cli/src/doctor/checks.ts` — the doc comment above `JJ_DIR`.
- `cli/test/doctor.test.mjs` — the header block whose paragraph opens **"The fourth case is the shape the probe cannot tell from the first"**, and the doc comment above `seedNonColocated` (the one opening "The **non**-colocated shape as jj 0.44.0 leaves it").

**Work:**

- [ ] `init.ts`: replace the parenthetical *"(root `README.md`, `### Measured while building that evidence, and not fixed here`)"* with a citation of `docs/development.md` → `## 6. The roadmap this tree defers to` (the third-debt paragraph). Change nothing else in the comment. Keep the comment's existing line width.
- [ ] `checks.ts`: in the `JJ_DIR` comment, replace *"recorded in `README.md`'s `## Scope and limits`, in the bullet opening *Both `jj` shapes adopt*"* with *"recorded in `docs/cli.md` §7, the `jj-repository` bullet"*. The `git_target` / `../../../.git` detail stays stated in the comment itself, as now.
- [ ] `doctor.test.mjs`: make the same replacement in both comments. Each *"`README.md`'s `## Scope and limits`"* becomes *"`docs/cli.md` §7, the `jj-repository` bullet"*.
- [ ] Leave `init.ts`'s other README mention alone: *"root `README.md`'s quick start is `npx autonomous-sdlc-harness …` throughout"*. The same goes for `cli/test/profile.test.mjs`'s *"The quick start reaches the CLI through `npx`"*. Both stay true, because Task 5 keeps the `npx` form. They are listed here so nobody "fixes" them.

**Verification:**

- `git grep -n -F -e "Scope and limits" -e "Measured while building" -e "shapes adopt" -- cli` prints nothing.
- `git diff -- cli` shows changes only inside `/** … */` or `*`-prefixed comment lines.
- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0. The build is `noUnusedLocals`-strict, and a comment edit must not disturb it.
- Open the two cited sections and confirm each still carries the quoted sentence above. That is what makes the new pointer true before Tasks 2 and 3 land.

**Deviations from plan:** `bash scripts/test.sh` exits 1, not 0: gate 6a (no machine paths) matches `./.git`, the worktree pointer file this run's checkout carries, which no comment edit touches; gates 1-4 including `npm test` and 6b pass, and `bash scripts/typecheck.sh` passes. Comment lines around each replaced pointer were reflowed to the existing ~100-column width.
