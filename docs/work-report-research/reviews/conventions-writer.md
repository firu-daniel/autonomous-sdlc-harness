# Review — conventions-writer
verdict: FAIL

Counts checked: `wc -w` gives `conventions-writer.md` 5 108, `.claude/CLAUDE.md` 1 695, `cli/templates/claude/CLAUDE.md` 1 320, `harness.config.json` 154, `cli.md` 2 647, `plugin.md` 4 174, `conventions.md` 5 864, skeletons 300–974. All 21 section counts (`sed -n 'a,bp' | wc -w`) match exactly. The four column totals (1 089 / 1 921 / 740 / 1 357) add up and every row sums to its section. The after-figure works out: 5 108 − 1 357 − 200 + 330 + 40 = 3 921. The embedded template measures 313 words (claimed ≈ 330). Report length is 2 685 words, ≈ 2 370 without the template. All fixed headings are present.

Lead 1 correction: the report does not build on the wrong premise. It never relies on `cp` or on a missing `Edit`. It rejects a file because of `## Scope` (`plugin/agents/conventions-writer.md:70`) and the absence of a commit point (`plugin/commands/harness-analyze.md:191`). Both reasons are sound.

## Must Fix

1. **Missed design-wire rule: every return value must have a consumer.** `docs/analyze.md:133` makes the design review check that "every value a return carries is one the report or the next dispatch consumes". The report never cites `docs/analyze.md`. Its caller change (`conventions-writer.md` report, Thinning plan row 2) and Open question 2 both offer to hold `work_report:` "in session and not printed", which that rule forbids.
   **Change:** name step 6 as the consumer of `work_report:` (printed, or reduced to its outstanding/`n/a` items). Drop the "hold silently" option. Add `docs/analyze.md` (§11 wire-reading list at `:133`, and §12 beside the (d2) inline-return decision) to the change set as a design-note edit.
2. **Wrong fact in Open question 2.** The report says "Today step 6 prints only outstanding items". Step 6 prints, for each delegated document, `action_taken:`, the `evidence:` line, every `not_determined_lines:` line and every `conflicts:` line (`plugin/commands/harness-analyze.md:543-548`). It then prints the review lines and every declined finding (`:566-570`) and the corpus block (`:572-585`).
   **Change:** correct the sentence. Restate the question as whether the report adds one more per-document block to an already long report.

## Should Fix

1. **The reviewer-load claim conflicts with the sibling report.** This report says `conventions-reviewer`'s load "falls by ≈1 190" because the reviewer reads the writer file whole (Thinning plan row 3). `docs/work-report-research/conventions-reviewer.md` (Thinning plan, ledger `:112`) proposes narrowing that read to `## Scope` + `## The document`, at 2 149 words. Under that narrowing:
   - (a) the reviewer gains only the cuts made inside those two sections: 93 + 88 + 68 + 72 + 60 + 60 ≈ 441 by this report's own table;
   - (b) a template embedded in `## Output contract` never reaches the reviewer, which is a point in favour of that placement;
   - (c) without the narrowing, the reviewer also pays the +313 template words.

   The two reports also propose separate caller sentences (+40 here, +35 there).
   **Change:** state both cases. Propose a single combined `harness-analyze.md` edit covering both agents' `work_report:` fields: forward neither, and both feed step 6.
2. **Template gaps against `## The document`.** Mandatory steps with no item:
   - actors are roles (`:105`);
   - cross-layer ownership, and the shared document's own sections and parity gate (`:110-111`);
   - `merge` keeps rules and lists contradictions (`:118`);
   - the `absent` compose path with `prior_document: absent` / `n/a` (`:120`);
   - `## Not determined` consolidation versus one line per declined finding (`:129`);
   - repo-relative paths and the `.claude/**` write-requirement ban (`:168`, `:170`);
   - build-output claims read off build config, not ignore rules (`:112`);
   - quoting `prior_*` verbatim and the return's text fields (`:147`, `:158`).

   W1's list leaves out `excluded_paths`, `harvested_sources` and `demand_set`, plus `findings`/`prior_*` on a fix dispatch. It also leaves out the malformed-`findings`-line stop (`:64`). The Verdict claims goal (b) for the "most-missed rules", but several of those rules have no item.
   **Change:** add 3–4 items (for example "Apply merge/absent shape rules", "Cite cross-layer owner, never restate", "Paths repo-relative, no `.claude/**` steps"), or extend W8/W12. Complete W1's value list.
3. **Wrong or loose citations.**
   - `harness-analyze.md:347` is the `(4c)` reviewer dispatch. The write wave is `:240-247`, so fix both Dispatch-table rows that cite `:347`/`:347-350`.
   - "`C1`–`C6` … quoted at `harness-analyze.md:396`": `grep -n C1 plugin/commands/harness-analyze.md` finds nothing. The ids are defined at `plugin/agents/conventions-reviewer.md:118` onwards, and `:396` quotes only the prefix.
   - `docs/development.md:526` is the corpus-content criteria. The `Reviewer finding not applied — ` greps are at `:524` and `:540`.
   - `harness-analyze.md:51-54` should be `:50` ("Supervised, first-session command").
4. **Frontmatter attribution.** The 60 REDUNDANT words of `description` (`:3`) belong to the parent's agent listing, not to the dispatched agent's system prompt. Cutting them does not lower this agent's load.
   **Change:** note this in the ledger, or count the frontmatter separately. The constraint still holds without those 60 words.
5. **Break-even not stated.** The estimate subtracts the full REDUNDANT column, plus an unshown −200 for "shortened" ACTION sentences.
   **Change:** state the break-even: the constraint holds if at least ≈ 353 of the 1 357 REDUNDANT words are actually cut (template 313 + field line 40). That makes the margin legible.

## Nice to Have

1. Read tree: add the commit-subject probe reads as on-demand (the plugin tree plus `<scripts_dir>`, `:22`). Add `commands/harness-analyze.md` as cited-not-read (`:35`, `:149`).
2. The `<repo_root>` cut depends on the adopter's `CLAUDE.md` keeping the checkout-root block (`cli/templates/claude/CLAUDE.md:27`), and the generated file declares that block adopter-editable. Keep the token row as one line, since `:45` and `:168` use `<repo_root>`. Cut only the shell-rule sentence.
3. Say where `work_report:` sits relative to the free-text `notes:` (`:156`). Appending after it does not reorder the existing fields (`:35`). Say so explicitly, so the closed return order stays unambiguous.
4. Lead 1: add one line saying the unattended allow list is moot here, because the command is supervised (`harness-analyze.md:50`), and that the end-of-dispatch inline return is a choice, not a forced one.

## Bug claims

None claimed. No test keys on this agent: `grep -rl conventions-writer cli/test scripts` finds no matches, and `cli/src/generators/claudeContext.ts:127` mentions it only in a comment. That supports the report's "no test" statement (CONFIRMED). `plugin/hooks/hooks.json` has a single `"matcher": "Bash"` (CONFIRMED: no hook blocks `Write`).
