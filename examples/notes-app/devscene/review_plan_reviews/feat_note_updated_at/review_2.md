# Review plan meta-review — iteration 2

The iteration-1 Must Fix is resolved: `finding_2.md` now carries the exclusion pathspec on its
verification command with the matching 8 files / 211 insertions / 8 deletions (re-run here and
confirmed), and the `chore:` count above `25be2c2` now reads three. Every other factual claim in
`finding_2.md` was re-checked and holds — `25be2c2` is `HEAD~8` and the sixth code commit back,
`git remote -v` is empty and no upstream is configured, the reworded subject is 65 characters, and
the phases `Bg`, `Bm`, `C2*`, `D`, `E` are still open in the flow-progress ledger. The structural
checks all pass: heading text, section order, readiness placement and entry form, `_(layer: …)_`
tags against the configured layer names, and the 2 ↔ 2 ↔ 2 correspondence between readiness
entries, index pointers and `finding_<N>.md` files under a folder name matching the index stem.
The presentation and stylesheet clean-pass rationale in the Context was re-verified line by line
against `src/presentation/noteListView.ts`, `styles.css` and all seven UI-test-plan files, and is
accurate. Both harness commands were re-run: `PASS: typecheck`, and `PASS: test` with 42 cases.

Two Must Fix items remain, and they share one root: the review accepted a claim about `deleteNote`
and `update` from the plan corpus in one place, and stated the true fact in another, without
noticing the two disagree.

## Must Fix

1. **Finding 1 states it is "not an unmet commitment", and the story index sentence it quotes says the opposite** — refers to review finding #1. Offending file: `sdlc-harness/code_reviews/feat_note_updated_at_code_review/finding_1.md`.

   The finding opens: "This is **not** an unmet commitment. The plan that governs the suite decided
   the opposite deliberately, and the implementer followed it", and later "Nothing was missed." It
   supports that with `task_5_plan.md`'s fourth `Work:` bullet, quoted accurately. But the finding
   then reaches for the story index and quotes **half a sentence** from it — "the story index
   (`## Context`, `Top risks`) names it: 'the stamp leaking into the actions that share `update`
   with `editNote`'" — while the other half of that same sentence is the commitment the branch did
   not meet:

   > The second risk is the stamp leaking into the actions that share `update` with `editNote`,
   > which would make archiving or pinning look like an edit; Task 2 places the stamp inside
   > `editNote`'s callback for exactly that reason and **Task 5 asserts all three non-stamping
   > actions leave the value alone.**

   "All three" is fixed by the clause before it — the actions the story index believes share
   `update`: `setArchived`, `setPinned` and `deleteNote`. The shipped suite asserts two of them.
   `task_5_plan.md` is where the third was dropped, and it dropped it by substitution rather than by
   contradiction: its checklist bullet reads "The three actions that do **not** stamp: … `setArchived`,
   `setPinned` and (for the keyless half) a never-edited note", counting the never-edited-rewrite case
   as the third and then ruling `deleteNote` out. So the story index's commitment and the task plan's
   decision genuinely disagree, and a whole-branch review is the level at which that disagreement is
   visible. The finding read the sentence that carries it and quoted around it.

   This matters beyond wording. The finding's grade and its whole framing — "filed as Should Fix on
   that ground alone", "a test-coverage judgement the Task 5 plan made deliberately and this review
   asks to revisit", repeated in the index's Context — rest on the premise that no plan asked for the
   case. One did.

   **Fix:** in `finding_1.md`, rewrite the framing paragraph so it states what the corpus says:
   the story index's `Top risks` commits Task 5 to all three non-stamping actions, `task_5_plan.md`
   narrowed that to two plus the keyless-rewrite case, and the suite followed the task plan. Quote
   the story-index sentence to its end rather than to the semicolon. Then re-decide the grade on the
   corrected premise and say which it is: Should Fix remains defensible (the shipped behaviour is
   correct, and `deleteNote` does not route through `update` today), but it must be defended as
   "the task plan overrode the story index and the review is restoring the story index's ask", not
   as "nothing was missed". If the grade changes, move the pointer between the index's `## Should Fix`
   and `## Must Fix` sections and keep the readiness entry's `**Finding 1**` number unchanged. Also
   correct the same claim where the index's Context repeats it ("Two findings, neither of them a
   defect in shipped behaviour: one test-coverage judgement the Task 5 plan made deliberately …",
   "Neither is an unmet commitment; the implementers built what their plans said") in
   `sdlc-harness/code_reviews/feat_note_updated_at_code_review.md`.

2. **Missed check: the branch ships a new comment in `src/domain/notesService.ts` that is false about the function ten lines below it, and the review states the true fact without noticing** — "Missed check". Offending file: `sdlc-harness/code_reviews/feat_note_updated_at_code_review.md` (a new `finding_3.md` and its readiness entry are what is missing).

   Task 2 added, at `src/domain/notesService.ts:91-92`:

   ```ts
   // Stamped here rather than in `update`: `setArchived`, `setPinned` and `deleteNote` share that
   // helper, and neither archiving nor pinning a note is an edit of it.
   ```

   `deleteNote` (`src/domain/notesService.ts:112-119`) does not call `update`: it reads through
   `readAll()`, `findIndex`es, `splice`s and `writeAll`s. The sentence is also self-inconsistent —
   it names three functions as sharing the helper and then justifies only two of them. The review's
   own Context asserts the correct fact ("`deleteNote` does not route through `update` at all"), and
   `finding_1.md` builds its entire argument on it ("does not route through `update` at all — it
   reads raw records, splices the matched index and writes the array back"). So the reviewer had the
   true statement and the false one in front of it in the same pass and filed neither observation
   about the code.

   The comment is not cosmetic in this branch's own terms. `.claude/context/conventions.md`
   (`## Not determined`) records two existing header comments that contradict their code as open
   questions precisely because a stale comment is what the next implementer copies, and the branch's
   second stated risk is the refactor that would route `deleteNote` through `update` — the comment
   tells that implementer the refactor has already happened. It is also the same false claim the
   story index makes, which is how it got into the source.

   **Fix:** add `sdlc-harness/code_reviews/feat_note_updated_at_code_review/finding_3.md`, its
   `### 3.` pointer in the index, and a readiness entry `**Finding 3**` tagged `_(layer: domain)_`.
   Grade it **Nice to Have** — nothing executable is wrong — and order it in the readiness list
   before Finding 2, which is gated on phase `D`. The fix is a one-line correction, e.g. naming only
   the functions that do share the helper and stating separately that `deleteNote` reaches storage
   directly. Do not restate the same point inside `finding_1.md`; cross-reference it if useful.

## Should Fix

1. **The Context blames the wrong operator for the zero-collapse hazard it says the code avoids** — the index, `sdlc-harness/code_reviews/feat_note_updated_at_code_review.md`, Context paragraph 2: "`toNote` resolves absence with `record.updatedAt === undefined ? …`, not `??`, so a genuine `updatedAt` of `0` maps to `new Date(0)` rather than collapsing into never-edited." `??` does not collapse `0` — it falls back only on `null` and `undefined`, so `record.updatedAt ?? UPDATED_AT_WHEN_ABSENT` would carry a stored `0` through unchanged (it would fail for a different reason, yielding a number where a `Date` is required). The operator that would collapse `0` into never-edited is truthiness — `record.updatedAt ? new Date(record.updatedAt) : null`, or a `||` fallback. The conclusion is right and the code is right; the stated reason is not, and this is the sentence the Context offers as evidence that the compatibility surface was checked adversarially rather than skimmed. **Fix:** in the index only, restate the hazard as a truthiness/`||` check rather than `??`.

## Nice to Have

1. **Finding 1's insertion point is described two ways and one of them is not where the snippet goes** — `finding_1.md` says both "at the end of the Task 5 group" (in `**Where:**` and again in `**The fix.**`) and "immediately before the `// The long-ago stamp again:` comment". The rejected-edit case introduced by that comment is the last case in the group, so the precise anchor is *not* the end of the group. The precise anchor is unambiguous and the fix is implementable as written, so nothing is at risk. **Fix:** in `finding_1.md`, drop "at the end of the Task 5 group" or change it to "as the last of the non-stamping-action cases", so the two descriptions agree.
