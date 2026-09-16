### Task 10 — Mark the roadmap item done and run the closing acceptance sweep

**Goal:** Close the roadmap item this branch delivers, and prove the branch as a whole meets the task prompt's acceptance list — no plugin site requires a coordinate, the byte-identical clauses are carried by exactly their carriers, the dead-pointer examples still block, and the manifests and the CLI still pass their gates.

**Depends on:** Tasks 1–9, which make every contract edit. This task edits only `ROADMAP.md`; every other check below reads what those tasks wrote. **The catch-all task ships last for that reason** — it records and verifies what the `cli` and `plugin` tasks built, and it has nothing to verify until they have landed.

**The clause texts the sweep checks for**, as Task 2 defined them — C1 and C2 are the two severity bullets, C3 the carve-out, C5 the site-anchor clause:

```text
- **Should Fix** — the code or claim is wrong or unclear but no consumer decision turns on it; and a line coordinate in a durable artifact — an instruction file, an agent definition, a catalog document, a standing tracked artifact under `<state_dir>`, a code comment — stale or not, or a citation in any artifact that locates its site by a line coordinate alone, repaired by replacing the coordinate with a symbol anchor.
```

```text
- **Nice to Have** — style, wording, ordering; and a stale line hint beside an anchor that resolves, in a point-in-time artifact (a plan, a review, a finding, a QA report).
```

```text
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry.
```

```text
the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)
```

### Targets

- `ROADMAP.md` — `## Index`, and `## Quality and testing` → the `Line-number citations never block` row.

**Work:**

- [ ] `## Quality and testing`: change the `Line-number citations never block` row's status cell from `In progress` to `Done`, leaving its description as it is.
- [ ] `## Index`: delete the `Line-number citations never block` row and renumber every row below it so the `Priority` column runs consecutively from 1 in its current order. Change no link and no other row.

**Verification:**

- `grep -n 'Line-number citations never block' ROADMAP.md` returns only the `## Quality and testing` row, and that row ends `| Done |`. Read `## Index` and confirm its `Priority` values run 1, 2, 3 … with no gap or repeat, and that the first row is now `Docs-catalog retrieval`. Nothing outside `ROADMAP.md` keys on those priorities: the numbered roadmap items cited in code and READMEs resolve against `docs/development.md` → `## 6. The roadmap this tree defers to`, a separate legend this task does not touch.
- **Acceptance 1.** `grep -rn '<file>:<line>\|file:line\|#L<line>' plugin` — every hit is one of the user-input sites the story index's `## Scope register` keeps: `plugin/agents/user-review-fix-plan-writer.md` → step 2's **File and line** bullet, and `plugin/samples/sample_user_review.md` → its header's list of reference types. Any other hit is a site that still requires a coordinate: reopen the task that owns that file.
- **Wire-string quoters.** `grep -rn 'file-and-line' plugin` — every hit is `user-review-fix-plan-writer.md` describing user input (its token table and its `## Resolved values` intro); `grep -rn 'source line' plugin` returns nothing.
- **Byte-identity.** With the Grep tool in fixed-string mode over `plugin/agents/`: the C1 and C2 texts above each return exactly `branch-reviewer.md`, `skeptic-reviewer.md` and `layer-reviewer.md`; the C3 text returns exactly those three plus `review-plan-reviewer.md` and `task-plan-reviewer.md`; the C5 text returns exactly `layer-reviewer.md`, `branch-reviewer.md`, `skeptic-reviewer.md`, `review-plan-reviewer.md`, `architecture-reviewer.md`, `business-parity-reviewer.md` and `user-review-fix-plan-writer.md`.
- **Acceptance 2 and 3.** Read the final text of each §2 reviewer against the story index's `## Context` route paragraph and confirm the quoted clause is present where it says, or the stated no-route reason still holds. Then grade the dead-pointer examples against the landed text: `` `src/data/search/searchServce.ts` (`fetchRecentSearches`) `` (absent path) and `` `src/data/search/searchService.ts` (`fetchRecentSearchs`) `` (absent symbol) are Must Fix in `branch-reviewer.md`, `skeptic-reviewer.md` and `layer-reviewer.md` under *"a pointer's target does not exist"* and C3; a routing row naming an absent agent file is Must Fix under `layer-reviewer.md`'s *"A routing-table row dispatches an agent whose file does not exist on disk."*; a readiness entry with no `finding_<K>.md` is Must Fix under `review-plan-reviewer.md`'s *"A pointer with no matching file is a Must Fix."*
- **Register closure.** Re-run the story index's derivation entries D1, D2 and D3 verbatim and re-walk P1–P3: every file reached is a `## Scope register` row, and every `change` row's file shows in `git diff --name-only dev...HEAD`.
- **Acceptance 4.** `claude plugin validate --strict plugin` and `claude plugin validate --strict .` each print `✔ Validation passed` — judged on the printed text, not the exit status.
- **Acceptance 5.** Task 1 changed a `cli/` file, so `npm run build` and `npm test` from the repository root both pass, each run without a pipe.
