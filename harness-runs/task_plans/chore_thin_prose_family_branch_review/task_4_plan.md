### Task 4 — Thin `branch-reviewer`'s `## Findings format` index bullet, `## Common findings to look for` and `## Output contract`

**Goal:** Cut the second half of `plugin/agents/branch-reviewer.md` to direct rules stated once. The index bullet points at `## Output contract` for the section order instead of restating it. The checklist's framing lines and the own sentence of the non-downgradable paragraph get shorter. `## Output contract` drops what it restates from `## Findings format` and from itself. Every checklist trigger, grade and return line stays.

**Depends on:** Task 3, the previous edit to this file; through it, Tasks 1 and 2. Leave their text as they left it. Task 1 already rewrote this file's `## Findings format` lead sentence, the implementability paragraph and `**Checkbox discipline.**`.

**Where this task stops.** It owns these lines of `plugin/agents/branch-reviewer.md` only:
- in `## Findings format`, the `- **Index**` bullet;
- in `## Common findings to look for (high-yield checks)`, the paragraph opening `The groups below are the *shape* the checks take.`, the line opening `**Conventions-document violations**`, the line opening ``Also treat every `<state_dir>/lessons.md` entry``, and the paragraph opening `**Your own checklist is not downgradable.**`;
- in `## Output contract`, the paragraph opening `When you finish, **write the split review to disk**`, item `2. **One per-finding file**`, the bullet opening `- Where a decision-owed item was filed as a question`, and the closing paragraph opening `Do not paste the review bodies back`.

It does not touch:
- the `- **Per-finding files**` bullet, the test-run pointer sentence or the sample-pointer sentence;
- any checklist bullet, the parity group's opening paragraph or the `**Architecture leaks**` paragraph;
- the grading ladder, `**Guard carve-out.**`, `**Prose volume — the receiving side.**` or `## Unsolicited dispatch guidance`;
- in `## Output contract`: the `**Files you write:**` label, item 1 with all its sub-bullets (Context, readiness section, Must/Should/Nice sections, call-out section with the two-leg test), the `**Summary you return to the caller:**` label, and its first three bullets.

**Frozen text in or next to this range** stays word for word:
- `## Must Fix` / `## Should Fix` / `## Nice to Have` (it survives in item 1 when the index bullet stops spelling it out);
- the parity group's phase-gate sentence pair, `**Skip this phase unless `phases.parity` is `true` in `harness.config.json`.**` and the sentence after it;
- the size-ladder bullet's `document states → Should Fix; over its second → Must Fix.`;
- in the non-downgradable paragraph, its bold lead, the sentence `The rubric bounds *prose* findings; it does not relax these.` (`skeptic-reviewer` carries it too) and the harness-doctrine sentence opening `The rubric is stated here because it is harness doctrine rather than a project convention`;
- the bold leads `**Grade every finding by consequence.**`, `**Must Fix**`, `**Should Fix**`, `**Nice to Have**`, `**Index**`, `**Per-finding files**` and `**The index**`;
- in item 1, the Context bullet's `paragraph — branch, date, what was reviewed, the run-artifact exclusion count from`, the whole readiness bullet, the Must/Should/Nice bullet, and the call-out bullet's two-leg test.

### Targets

- `plugin/agents/branch-reviewer.md` → the lines named above.

**Work:**

- [ ] **`## Findings format` index bullet.** Replace the `- **Index**` bullet with: ``- **Index** at the caller-supplied path, conventionally `<state_dir>/code_reviews/<branch>_code_review.md`. Keep that filename shape: the round-suffix logic depends on it (a re-review becomes `<branch>_code_review_2.md`, `_3.md`, …). `## Output contract` fixes its sections and their order; the index carries no full description and no fix snippet.``
- [ ] **Checklist framing.**
  - Replace the paragraph opening `The groups below are the *shape* the checks take.` with: ``The groups below are the *shape* the checks take. Where a group says *replace with your project's list*, its triggers are the ones the conventions documents `<layer_path_map>` names state; never flag something no rule source says.``
  - Replace the line opening `**Conventions-document violations**` with: `**Conventions-document violations** — *replace with your project's list*: each rule those documents state as mandatory is a finding when bypassed. Typically —`
  - Replace the line opening ``Also treat every `<state_dir>/lessons.md` entry`` with: ``Treat every `<state_dir>/lessons.md` entry as a named check too.``
- [ ] **The non-downgradable paragraph.** Replace the whole paragraph opening `**Your own checklist is not downgradable.**` with the text below. Only its second sentence changes; the last two sentences are the frozen ones, unchanged.
  ``**Your own checklist is not downgradable.** Every item in this section, and every `<state_dir>/lessons.md` entry, keeps the grade this file gives it — an item with no explicit grade is a Must Fix trigger, and an item graded in bands (the size ladder above) keeps its band — and Pass 2's do-not-promote-category rule still governs carried-over items. The rubric bounds *prose* findings; it does not relax these. The rubric is stated here because it is harness doctrine rather than a project convention; where the adopter's own rules document restates it (the file `layers[].conventions` names), nothing above depends on that restatement.``
- [ ] **`## Output contract`.**
  - Replace the opening paragraph with: ``When you finish, **write the split review to disk** with `Write` at absolute paths — never paste it back to the caller — then return a short summary.``
  - Replace item 2 with: ``2. **One per-finding file** for **each** `### N. Title` in the index, at the path and with the contents `## Findings format` fixes. In two-pass mode, carried-over items become new per-finding files **and** new readiness entries, with any per-unit attribution dropped.`` `## Findings format` states the path, the round-suffixed folder and the self-contained contents, and Task 1's `**Checkbox discipline.**` paragraph allows sub-step bullets.
  - Replace the bullet opening `- Where a decision-owed item was filed as a question` with: ``- A `## Questions` section owed under `## Findings format` precedes this prose summary the same way and changes neither the summary nor the files you wrote.``
  - Delete the closing paragraph opening `Do not paste the review bodies back` and the blank line before it. The opening paragraph now carries the no-paste rule, and the dispatch of `review-plan-reviewer` is the caller's.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home:
  - **Findings format:** the index filename shape and its round-suffix reason; no description or snippet in the index.
  - **Checklist:** never flag something no rule source says; each mandatory conventions rule is a finding when bypassed; every lessons entry is a named check; every checklist item keeps its grade (no explicit grade = Must Fix, banded items keep their band); Pass 2's no-promotion rule.
  - **Output contract:** write with `Write` at absolute paths and never paste back; one per-finding file per `### N. Title`; two-pass carry-overs become files **and** readiness entries without per-unit attribution; the reconciliation line, its two-pass condition and its not-written-into-any-file clause (untouched); `## Unsolicited dispatch guidance` and `## Questions` precede the summary and change nothing in it.

  Restore anything missing in its shortest form.

**Verification:**

- The wire and anchors survive. Run `git grep -n -F -e '<literal>' -- plugin/agents/branch-reviewer.md` once per literal below; each run prints at least one line:
  - `<state_dir>/code_reviews/<branch>_code_review.md`
  - `<branch>_code_review_2.md`
  - `<state_dir>/code_reviews/<branch>_code_review/finding_<N>.md`
  - `## Phase 2 Readiness — Ordered Fix List`
  - `N. [ ] **Finding K** — <short title> _(layer: <one or more of <layer_names>>)_`
  - `→ [finding_3.md](<branch>_code_review/finding_3.md)`
  - `Pass 2 carried over N items, skipped M (already covered) and K (stale).`
  - `not written into any saved file`
  - `## Questions`
  - `samples/sample_code_review.md`
  - `samples/sample_code_review/finding_1.md`
  - `## The test-run rule`
- The frozen texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `the phase off there is no reference implementation to compare against, so`, `document states → Should Fix; over its second → Must Fix.`, `**Your own checklist is not downgradable.**`, `The rubric bounds *prose* findings; it does not relax these.`, `The rubric is stated here because it is harness doctrine rather than a project convention`, `**Guard carve-out.**`, `paragraph — branch, date, what was reviewed, the run-artifact exclusion count from`, `**This list is the single source of truth for the per-item fix loop**`, `whose repo-wide scope would promote a documentation example or a test fixture to a precedent`.
- If `harness-runs/scratch/branch_review_family_check.mjs` is present (Task 1 writes it), read its output for this file. Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/branch-reviewer.md` as one plain foreground command; it prints no `FROZEN`, `LEAD`, `LITERAL` or `SHARED-BLOCK` line, and its last line is `PASS`. If the file is absent, the two checks above stand alone.
- `git diff -- plugin/agents/branch-reviewer.md` shows hunks only on the lines this task owns.
- `wc -w plugin/agents/branch-reviewer.md`, run before the first edit and again after the last, is lower the second time.
