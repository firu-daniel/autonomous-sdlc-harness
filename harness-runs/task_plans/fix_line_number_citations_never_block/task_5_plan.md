### Task 5 — Anchor `architecture-reviewer` and `business-parity-reviewer` findings and make `docs-reviewer`'s coordinate call explicit

**Goal:** Replace the `[<file>:<line>](<file>#L<line>)` finding contract in the architecture and parity reviewers with the site anchor, close the parity reviewer's one coordinate route (check (e) and its templates cite a `<reference_impl>` source *line*), and write the binary `docs-reviewer`'s call into its FAIL definition.

**Depends on:** Task 3, which rewrites `branch-reviewer.md`'s per-finding contract — the shape both reviewers here say their implemented-solution output is *"mirroring"*. C5 is Task 2's text, carried byte-identical by Tasks 2, 3, 4, 7 and this task.

C5:

```text
the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)
```

**The route analysis this task acts on.** `architecture-reviewer` has **no** route: *"Only architecture violations are Must Fix."*, it reads `<state_dir>/lessons.md` for *"layer-ownership entries"* only, and no meta-reviewer grades its finding files' format — so it gets the finding-contract edit and no grading clause. `business-parity-reviewer` has **one** route: check (e) (*"traces to a cited `<reference_impl>` source line"*) and its plan-review template (*"as `<reference_impl>/<file>:<line>`"*) let a plan citing a behaviour by symbol be failed for lacking a line; the closing clause is the new (e) below. `docs-reviewer` is binary: a missing coordinate is check 2's required state and check 1 grades an anchor by path and symbol, so nothing turns on a coordinate being right; a coordinate *present* in a catalog document stays a `FAIL` — a PASS commits the document with no writer round, so a non-failing correction would never be applied, and the docs flow's three-round cap bounds the cost — and today that call is only implied, because the FAIL definition does not name check 2.

### Targets

- `plugin/agents/architecture-reviewer.md` — `## Resolved values` intro; `### Implemented-solution mode FAIL` item (b).
- `plugin/agents/business-parity-reviewer.md` — opening paragraph; `## Resolved values` intro and token table; `## Process` step 3; check (e); `### Plan-review mode FAIL` template; `### Implemented-solution mode FAIL` item (b).
- `plugin/agents/docs-reviewer.md` — `## Output contract` → the `verdict:` FAIL bullet.

**Work:**

- [ ] `architecture-reviewer.md` item (b): replace *"the file-and-line reference in markdown link form (`[<file>:<line>](<file>#L<line>)`)"* with C5. In its `## Resolved values` intro remove `` `<line>` `` from the findings-template placeholder list, and `` `<file>` `` too if no other occurrence remains in the file.
- [ ] `business-parity-reviewer.md` item (b): replace the same markdown-link phrase with C5, and replace *"citing the `<reference_impl>` source line it deviates from (as `<reference_impl>/<file>:<line>`)"* with *"citing the `<reference_impl>` source anchor it deviates from (as `<reference_impl>/<file>` (`<symbol>`))"*.
- [ ] `business-parity-reviewer.md` plan-review template: replace *"Cite the `<reference_impl>` source line the plan deviates from, as `<reference_impl>/<file>:<line>`,"* with *"Cite the `<reference_impl>` source anchor the plan deviates from, as `<reference_impl>/<file>` (`<symbol>`),"*. In the `## Resolved values` intro replace `` `<line>` `` with `` `<symbol>` `` in the findings-template placeholder list.
- [ ] `business-parity-reviewer.md` remaining `source line` wording: in the opening paragraph, the `<parity_vocabulary>` / `<reference_impl>` token row (*"cite `<reference_impl>` source lines as your evidence"* → *"source anchors"*), and `## Process` step 3, replace *"source line"* with *"source anchor"*; replace check (e)'s two sentences with *"verify every numeric threshold, limit, or gating condition traces to a cited `<reference_impl>` source anchor, never invented. Every business-logic decision must cite a reference source anchor; never invent a constant."* — that sentence is the clause that closes this reviewer's route. Leave *"Do not stop at the grepped line"* and check (j)'s *"miscited"* as they are: neither names a coordinate.
- [ ] `docs-reviewer.md` `## Output contract`: replace the FAIL bullet's *"a factual error, a shallow/under-researched document, a material omission, or (update mode) a stale/missing change"* with *"a factual error, a shallow/under-researched document, a material omission, a line coordinate check 2 does not classify as a value, or (update mode) a stale/missing change"*. Do not edit check 1 or check 2.

**Verification:**

- Grep `architecture-reviewer.md` and `business-parity-reviewer.md` for `file-and-line`, `<file>:<line>`, `#L<line>`, `<line>` and `source line`: no hit. Grep `docs-reviewer.md` for `No exact line numbers` and find check 2 unchanged.
- With the Grep tool in fixed-string mode, search each of `architecture-reviewer.md` and `business-parity-reviewer.md` for C5 exactly as fenced above: one hit each.
- Read check (e) in the edited file and confirm a plan citing a threshold as `` `<reference_impl>/search/limits.ts` (`RECENT_SEARCH_LIMIT`) `` with no line range satisfies it, while a threshold with no cited source still fails it (*"never invented"*).
- Read the docs-reviewer FAIL bullet and confirm the verdict turns on a coordinate's presence and never on its currency: a correct `:47` and a stale `:47` in a catalog document both FAIL; a document citing `` `src/data/search/searchService.ts` (`fetchRecentSearchs`) `` fails on check 1's symbol half, unchanged.
- `claude plugin validate --strict plugin` prints `✔ Validation passed`.

**Deviations from plan:**

- `architecture-reviewer.md` `## Resolved values` intro keeps `<file>`: another occurrence remains (`apply <file> → <section>` in `## Unsolicited dispatch guidance`), so only `<line>` was removed, as the Work bullet conditions.
- Evidence downgrade: the `claude plugin validate --strict plugin` verification was not executed — the command was refused as requiring approval in this run. The claim rests on the diff touching prose bodies only (no frontmatter line changed in any of the three files), not on execution.
