### Task 11 — Mark roadmap items 22, 23 and 25 shipped, close their `docs/sandbox-record.md` §7 bullets, and correct row 20's install-step status

**Goal:** `docs/development.md` → `## 6. The roadmap this tree defers to` records that roadmap items 22, 23 and 25 — the three sentence groups sandbox3c deferred — are fixed, the way earlier shipped items are recorded; and the `docs/sandbox-record.md` → `## 7. Follow-ups this record names` bullets that raised them say they are closed, so the record does not keep proposing a fix that has landed.

**Depends on:** Tasks 1, 3, 5 and 6, whose results this task records and does not re-check by rewriting them:

- **Item 22** — Task 6 replaced `docs/cli.md` §6's *"row CS2, owed"* (in **Four scripts run outside the sandbox, each in one spelling.**), the RG1–RG3 *owed* clause (in **Everything that runs outside the sandbox is write-protected on both sides**) and *"row CS6, owed"* (in **A remote job passes the base profile, checked, and its checkout's `.git` stays write-denied.**) with each row's verdict; Task 1 replaced *"row CS2, owed"* with *"row CS2, pass"* in `cli/templates/scripts/commit-on-branch.sh` → `# WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX.`, and Task 5 carried it into `scripts/commit-on-branch.sh`; Task 3 replaced *"CS2, owed"* with *"CS2, pass"* in `cli/src/doctor/checks.ts`'s doc comment above `SANDBOXED_WRAPPER_CONSEQUENCE`.
- **Item 23** — Task 6 replaced *"(derived from the code until AP9 is taken)"* with AP9's verdict and both *"to be recorded in `docs/sandbox-verification.md` §5 by this round's Finding 6"* with the *Session 2*, AP7 citation.
- **Item 25** — Task 6 reworded *"On a bubblewrap host (Linux, WSL2) the gate launcher is the fourth"* so the exclusion reads as written on every host.

**If Task 5 recorded a refusal** (its `scripts/commit-on-branch.sh` copy left to the post-merge re-render), item 22's row still ships — its named site is the template — and the row's text says the self-adopted copy follows at the re-render, as rows 32 and 33 say for theirs.

**This is a catch-all task** (`path` `"."`): its implementer reads every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record`: a deferral cites a numbered roadmap item and the number owes a row; a shipped row stays, so a citation written before it landed still resolves.

### Targets

- `docs/development.md` → `## 6. The roadmap this tree defers to`: rows 22, 23 and 25, the paragraph opening **Items 3, 4, 13 and 14 have shipped**, and row 20's sentence *"the install step **has not yet run on GitHub**, and its first real run is item 21's full-run leg"*.
- `docs/sandbox-record.md` → `## 7. Follow-ups this record names`: the bullets ending *"Roadmap item 22."*, *"Roadmap item 23."* and *"Roadmap item 25."*

**Work:**

- [ ] **Rows 22, 23 and 25.** Prefix each *Delivers* cell with **Shipped.**, as rows 5–16, 19 and 20 are, and keep the rest of each cell as the record of what was owed; append to each one short clause naming what now stands — for 22, each site cites the verdict; for 23, the two results are cited as recorded; for 25, the sentence reads the exclusion as written on every host. Change no other row; item 21 stays owed.
- [ ] **The shipped paragraph.** In **Items 3, 4, 13 and 14 have shipped** — *as have items 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 19 and 20, whose rows say so in their own text* — add 22, 23 and 25 to that list in numeric order. Change nothing else in the paragraph.
- [ ] **Row 20's install-step limit** (story index register row 73). Row 20 stays **Shipped.**; replace only its sentence *"One limit this row states rather than leave to be discovered: the install step **has not yet run on GitHub**, and its first real run is item 21's full-run leg"* with what the record now has: the install step has run on a GitHub-hosted runner — `runner-install` IS1–IS4 **pass** (`docs/sandbox-record.md` §4) and FR2 **pass**, round 15 (`docs/sandbox-verification.md` §10). This is the same correction Task 10 makes to `ROADMAP.md`'s *"(not yet run on GitHub)"*, so the two documents agree. Change nothing else in the row.
- [ ] **The record's three §7 bullets.** Append to each a sentence opening *Since then*, as the record's own convention for a later change (its `## 6. The residuals` lead), stating that the sites now cite the verdicts (22), cite the recorded results (23), or read the exclusion as written on every host (25), and that the roadmap item is shipped. Leave every other §7 bullet, and every other section of the record, unchanged.

**Verification:**

- `git grep -n -E "^\| (22|23|25) \| \*\*Shipped\.\*\*" -- docs/development.md` finds all three rows.
- The shipped paragraph's list names 22, 23 and 25, and every number it names has a row marked **Shipped.**: read the list against `git grep -n -E "^\| [0-9]+ \| \*\*Shipped\.\*\*" -- docs/development.md`.
- Each item's own sites read as its row now says: `git grep -n -E "CS2, owed|CS6, owed|until AP9 is taken|this round's Finding 6" -- docs/cli.md cli/templates/scripts/commit-on-branch.sh scripts/commit-on-branch.sh cli/src/doctor/checks.ts` finds nothing (if Task 5 recorded a refusal, its one `scripts/commit-on-branch.sh` hit is the expected exception, and row 22's text says so), and `git grep -n -F "On a bubblewrap host (Linux, WSL2) the gate launcher is the fourth" -- docs/cli.md` finds nothing.
- `git grep -n -F "has not yet run on GitHub" -- docs/development.md ROADMAP.md` finds nothing.
- Re-run the story index's derivation entry E and confirm every hit is a register row. A hit may remain only at a `no-change` row, or at a `change` row whose new text still quotes the old sentence as the record of what was owed — `docs/development.md` rows 23 and 25 and the `docs/sandbox-record.md` §7 bullets (register rows 62, 63 and 66); a hit at any other `change` row is an unfixed site.
- `git diff -- docs/sandbox-record.md` shows only three added sentences, each in `## 7.`.
