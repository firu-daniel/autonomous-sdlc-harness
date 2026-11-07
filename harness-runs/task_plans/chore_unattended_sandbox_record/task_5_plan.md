### Task 5 — Move residuals 1–13 into §6, append the new residuals, and turn `docs/cli.md` §6's list into a pointer

**Goal:** Make `docs/sandbox-record.md` → `## 6. The residuals` the one residual list.

- **Move** `docs/cli.md` §6's numbered list (under `**Residuals, stated rather than hidden:**`, items 1–13 with every sub-item) into it, keeping every number. Where a measurement closed or narrowed a residual, state what is left and cite the row.
- **Append** the residuals the series leaves open that the list does not yet state, as 14 onward.
- **In `docs/cli.md`**, leave a pointer where the list was, and repoint `docs/cli.md`'s own citations of residuals by number.

**Depends on:** Task 4.

- **What this task owns in `docs/sandbox-record.md`:** `## 6. The residuals`, whose placeholder sentence it replaces. It also appends bullets to `## 7. Follow-ups this record names`, in the form Task 3 set: roadmap item 21 for a measurement still owed, the literal `roadmap item <pending>` for any other mismatch.
- **What this task leaves alone there:** no other section of that file, and no heading.
- **What earlier tasks already set:** Task 1 and Task 2 already cite this list in the form `docs/sandbox-record.md residual N`, and `residual 1, item 5`. So the numbers 1–13 and residual 1's items 1–5 must survive the move unchanged.
- **What later tasks do:** Task 6 and Task 7 repoint the citations in other documents.

### Targets

- `docs/sandbox-record.md`: §6, and appended §7 bullets.
- `docs/cli.md`: §6 only, meaning `### The sandbox block and the permission mode` and the list beneath it.

**Work:**

- [ ] **Move the list.** Cut residuals 1–13 from `docs/cli.md` and place them under `## 6. The residuals`, text unchanged except for cross-references. Rewrite each reference that only made sense inside `docs/cli.md` as an explicit link to `docs/cli.md` with its paragraph or heading anchor, never a line number. Those references are:
  - *"above"* or *"below"*: *the measured fetch pins* above, *the wrappers' clone check (above)*, *"the profile's own entry (see below)"*.
  - *"(§7)"*, which means `docs/cli.md` §7.
  - Every sibling-relative link, which stays valid because both files sit in `docs/`.

  References between residuals (*"residual 6's exposure"*, *"(residual 12)"*, *"*Leftovers* above"*) stay as written. Every fenced block (`ls -l <path>`, `rm -- <path>`, the `cp -R` recipe) moves whole, one command per line.
- [ ] **State what measurement narrowed.** Under the moved residuals 2 and 1 (item 3), and any other residual whose text names a row now taken, add one sentence each stating what the measurement closed or narrowed and what is left, citing the row id and its verdict. Residual 2 is glob `denyWrite` on Linux (AP2, GW1, GW2). Residual 1 item 3 is a clone's `.git/config` on Linux: read §8 and §9 for a Linux CL5 or CL6 reading. Where no Linux row was taken, write *not yet measured on Linux* and add a §7 bullet citing roadmap item 21. Never state a narrowing no row shows.
- [ ] **Append residuals 14 onward**, each one short paragraph:
  - **14.** A hand edit to the generated profile removes the protection it touches. `doctor` is what notices (`docs/cli.md` §7). The watcher's launch check catches only what `autonomous-watcher.sh` → `run_profile_check` checks.
  - **15.** A task that legitimately needs to edit a write-protected file is refused at once under `dontAsk`.
  - **16.** The sandbox covers Bash and its children, not the file tools, which the profile's `Edit` rules cover.
  - **17.** Hooks, local MCP servers and the status line run outside the sandbox (§1).
  - **18.** The detached gate run's own residuals, **linked rather than restated**: `cli/templates/scripts/run-test-suite.sh` → `RESIDUALS OF THE DETACHED SHAPE`.

  Where an item 14–18 is already wholly stated by a moved residual (for example, part of residual 11 for item 14), state only what the moved one does not cover and cite it, rather than duplicating it.
- [ ] **`docs/cli.md`.** Keep the bold line `**Residuals, stated rather than hidden:**` and replace the list under it with one paragraph. The paragraph says the numbered residuals, with the measured model and the per-leg results, now live in [`sandbox-record.md`](sandbox-record.md) → `## 6. The residuals`, under the same numbers. It also says §6 keeps what belongs to the CLI: the profile's settings, the excluded scripts' checks and the write protection.

  Then repoint each of `docs/cli.md`'s own citations of a residual by number to `sandbox-record.md`, keeping the number. These are scope-register rows 8–14:
  - **Four scripts run outside the sandbox…**: the two *"(residual 13)"*.
  - **The excluded rule's `:*`…**: *"(residual 7 below)"*.
  - **Everything that runs outside the sandbox is write-protected…**: *"residual 12"*.
  - **Each run adds its own copy's paths…**: *"residual 2"*.
  - The sibling-clone bullet: *"residual 12's"*.
  - The paragraph opening *"It lives at"*: *"residual 12's sweep"* and *"residual 11"*.
  - **Credentials are denied on both sides.**: *"(residual 13)"*.
- [ ] **§7 bullets.** Add a bullet naming the runtime messages that still cite `docs/cli.md §6` for content that is now residual 12's. These are the watcher's clamp log lines quoted in `docs/watcher.md` (scope-register rows 39–40), found with `git grep -nF "cli.md §6)" -- cli/templates/scripts`. State why they are left unchanged on this branch, with these three reasons and no other:
  - They cite `docs/cli.md §6` by section only and carry no residual number, so the prompt's scope predicate (*"every citation of a residual by number"*) does not reach them. Tasks 2 and 7 change runtime strings only because those strings cite a residual by number.
  - They sit in a cli-layer template, `cli/templates/scripts/autonomous-watcher.sh`, whose self-adopted copy `scripts/autonomous-watcher.sh` follows only at the post-merge re-render.
  - They still resolve, through the pointer paragraph this task leaves at `docs/cli.md` → `**Residuals, stated rather than hidden:**`.

  Mark that bullet `roadmap item <pending>`. Add a bullet for every other mismatch found while moving the list.

**Verification:**

- `git diff -- docs/cli.md`: every removed list sentence appears in `docs/sandbox-record.md` §6. The only differences are the cross-reference rewrites and the added *what is left* sentences.
- The number of fenced blocks removed from `docs/cli.md` equals the number added to §6.
- Within §6, the unindented numbered items run from 1 through the last appended number, in order, with no gap. Read them with `grep -nE "^[0-9]+\. " docs/sandbox-record.md`, limited to the lines between the `## 6.` and `## 7.` headings.
- `git grep -nIE "[Rr]esiduals? [0-9]" -- docs/cli.md`: every hit's line names `sandbox-record.md`. `git grep -nIF "Residuals, stated rather than hidden" -- docs/cli.md` returns the one pointer line.
- Every row id added in §6 exists in `docs/sandbox-verification.md`, and the verdict stated is that row's verdict or weaker.
