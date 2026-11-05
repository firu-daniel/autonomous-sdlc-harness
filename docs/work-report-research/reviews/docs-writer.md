# Review: docs-writer
verdict: FAIL

## Must Fix

1. **W9 asks for "zero hits", which contradicts the reviewer's grading rule.** W9 says "Grep the written document for line-number shapes; require zero hits", and the risk section calls "W9 grep command + 0 hits" the strongest evidence. But `plugin/agents/docs-reviewer.md` → check 2 (`:71-77`) says the shape regexes "match far more **values** than coordinates … the target is **classify every hit**, never 'drive to zero' — a zero here is usually damage, not success". A writer that follows W9 will strip thresholds, limits and ordinals (all legitimate values) to reach zero, and the reviewer then FAILs the document for a material omission. Change: reword W9 to "Grep for line-number shapes; classify each hit as value or coordinate; remove coordinates only", with evidence `hits: <n>, coordinates removed: <m>`. Point the ref at the reviewer's value-vs-coordinate test (or move that test into `docs-writer.md`), and correct the risk-section bullet.

2. **The two index rules disagree, so the claim that the report "makes the report safe even where the review is not" is false.** The proposed rules are: first write `i` = next free `review_<n>`, and fix round `i = k+1` from `findings_file` `review_<k>.md` (report `:143-144`). Take a catalog refresh over a slug that already holds `review_0..1` and `write_0..1`. The first write goes to `write_2`. The caller then writes `review_0`, because the catalog starts at `i=0` (`docs_orchestration_instructions_autonomous.md:69`), which overwrites the old file. The fix round then computes `k+1 = 1` and **overwrites the committed `write_1.md`**. So the writer index pairs with the wrong review and still collides. The same sentence at `:146` also says the refresh "would overwrite `write_0.md` too", which contradicts the safety claim next to it. Change: make the catalog next-free fix (open question 2) a **prerequisite** of the proposal rather than a side note, or have the caller pass the writer its `iteration` explicitly (a one-field wire addition in both callers) instead of having the agent derive it. Then restate lead 10 as "not collision-safe until the caller is fixed".

3. **Some evidence lines would commit absolute paths (lead 12).** W1's evidence is the root, which is the output of `git rev-parse --show-toplevel`: an absolute home-directory path. W9's evidence is "the command", and the command contains the doc path, which the orchestrator passes as an absolute path (`docs_orchestration…:68`, "the absolute `output_path` (`$REPO_ROOT/<output_path>`)"). Both land in a committed `write_<i>.md`, which leaks the home directory and makes a re-run commit a diff. Change: drop the root evidence from W1 (or record `root resolved` only). Require W4, W5 and W9 evidence to be repo-relative, and make W9's evidence the hit counts, not the command line. The report should also say that lead 12 was checked.

## Should Fix

1. **The docs-phase INDEX write has no review that follows it, so the index rule is undefined there.** `docs_phase_instructions.md:45` dispatches the writer on the INDEX and then just says "commit it", with no `docs-reviewer` and no `findings_path`. "`i` is the index of the review that follows" therefore has no referent, and no staging list names a report. Change: say what happens on this dispatch (no report, or next-free with no paired review), and add it to the staging changes.

2. **The staging changes cover three sites, not two.** The report says "Both callers need one clause" (`:149`). The explicit path lists are actually catalog step 6 (`:73-75`), the catalog INDEX commit (`:84`), and the docs-phase per-target commit (`docs_phase…:44`), plus the INDEX commit (`:45`) under Should Fix 1. The sibling report gets this right ("three explicit stage lists", `docs-reviewer.md` research → Storage, row Committed?). Change: list every site.

3. **The report ignores its effect on `docs-reviewer`, which reads `docs-writer.md` in full as its grading contract.** The reviewer is told to "Read `docs-writer.md` before you grade … Every check below targets a rule that file actually states" (`plugin/agents/docs-reviewer.md:55`). Three consequences follow:
   - (a) The writer cuts (−1 027) also cut every reviewer dispatch, and the embedded template (+375) adds to it. That belongs in the ledger as a cross-agent row, because the docs-reviewer research leaves `docs-writer.md` at 3 483 "unchanged" and defers it to this report.
   - (b) The reviewer will now see the W-items as contract rules (W9 is the conflict in Must Fix 1).
   - (c) The cuts to the "Entry-point hints" section (`:77-80`) and to the template parentheticals (`:146`, `:155`) remove text that reviewer checks 6 and 3 grade against (`docs-reviewer.md:83`, `:78`). The reviewer's checks restate most of it, but the report should verify each cut against the reviewer's checks 1–13.
   Change: add the cross-agent row and a check-by-check survival table.

4. **Storage mechanisms diverge from `docs-reviewer` research.** That report embeds its report in `review_<i>.md` with header `follows: <review_<n>.md>`. This one writes a separate `write_<i>.md` with `fix_of: <review_<k>.md>`. Both can live in the same folder, but they use two field names for one concept and two pairing schemes. Change: align the field names, and state the pairing explicitly (`write_<i>` precedes `review_<i>`).

5. **The template is missing mandatory steps.**
   - (a) The catalog `existing_doc` merge/supersede step ("keep what is still true, correct what drifted, fold in named merge targets", `docs-writer.md:97`) has no item, and reviewer DR11 grades it. W2 only reads the file.
   - (b) "Every path written into a document is repo-relative" (`:88`) has no item. Reviewer check 1 grades it (`docs-reviewer.md:69`).
   - (c) The INDEX dispatches (catalog `doc_slug: index`, `:84`, and docs-phase step 3) skip W4–W6 and W10. They need explicit `n/a` handling.
   Change: add W-items for (a) and (b), and an INDEX branch rule for (c).

6. **W11 paraphrases a wire literal.** It restates the return fields `doc_path:` · `unverified:` · `parity_gaps:` · `notes:` from `## Output contract` (`:186`). Change: "Return the `## Output contract` block for your mode", with no field list.

7. **The "after" counts are estimates.** They are section-by-section, with no draft written or counted (`:99-115`). The margin (−1 027) is large enough that the constraint survives a 30 % miss, but the report should label the figures as estimates and show the subtraction for the two largest rows (`## Resolved values` 674→310, `## Research methodology` 733→380).

8. **The read tree is missing the inputs of the INDEX dispatch.** The INDEX `entry` blob tells the writer to read the checklist, every doc under `features/` and `concepts/`, `parity_gaps.md` and `needs_review.md` (`docs_orchestration…:84`). Change: add a row (up-front, variable, large).

9. **Re-runs add new committed files (idempotency).** `plan_orchestration_instructions_autonomous.md:218` relies on a Phase D re-run being idempotent ("unchanged doc re-write yields wrapper exit 3"). A next-free `write_<n>.md` adds a new committed file on every re-run. The next-free `review_<n>` already does the same, so this is not new, but the report should state it.

10. **Prose arithmetic error.** The REDUNDANT column sums to 956, not 916 (54+69+314+40+74+64+113+14+32+50+45+87). The footnote "~44 in headings" is really about 4: the section rows sum to 3 479 of 3 483. Change: correct the total row.

## Nice to Have

1. Most of the lead 5 risk is explained by something the report does not cite. Every diff reviewer excludes `docs_catalog/reviews/*` explicitly (`branch-reviewer.md:83`, `skeptic-reviewer.md:87`, `review-plan-reviewer.md:83`, `architecture-reviewer.md:109`, `business-parity-reviewer.md:100`). Cite these instead of "Phase D runs last".
2. The settings quote is wrong. The file has `Write(/{{repoRoot}}/**)` (`settings.autonomous.json:50`), not `Write(//{{repoRoot}}/**)`.
3. `branch-start-docs-autonomous.md:35` is the orchestrator-role line. The step that drives the loop is `:55`.
4. If W9 ever carries the reviewer's `[Ll]ines?` regex, `scripts/check-typos.sh:77` exempts only `docs-reviewer.md`, so `docs-writer.md` would need its own exemption.
5. The header line `mode: <catalog|update> · action: <new|update>` reuses dispatch keys and the `·` separator of the survey `targets:` wire line (`docs_phase…:36`). No parser reads `write_<i>.md` today, so this is low risk. If open question 4 is adopted, the reviewer will read the file with these keys in it. Prefer a heading-only header or different key names.
6. The `<repo_root>` row would become a pointer to CLAUDE.md → checkout root (`cli/templates/claude/CLAUDE.md:27`). Adopters may edit that file freely ("yours from there on"), so a pointer to it can dangle. Mention this as a risk.

## Bug claims

- **Catalog `start i=0` overwrites `review_0.md` on a refresh: CONFIRMED, conditional.**
  - `docs_orchestration_instructions_autonomous.md:69` sets `findings_path = …/reviews/<slug>/review_<i>.md (start i=0)` unconditionally, and `:84` does the same for `reviews/index/`.
  - The folder is keyed only on slug, not on branch, and it is committed (`:75`). Any earlier run on the same `<state_dir>` therefore leaves `review_0.md` in place: a previous catalog, or a docs phase, which uses the same folder (`docs_phase…:40`).
  - The overwrite does not happen on a first catalog. `docs_phase_instructions.md:41` says the catalog "legitimately starts at `i=0` … because it is the *first* pass over a slug", and calls writing to an occupied index a "silent loss". Nothing prevents a second catalog, and the `existing:` refresh token (`:52`) exists precisely for refreshing documents.
  - Crash re-runs within one entry overwrite only uncommitted files, which is harmless.
- **Lead 1 premise: not affected.** The report does not reason from "only `cp` is unavailable". The agent has `Write` and `Edit` (`docs-writer.md:4`), so the corrected lead changes nothing here.
