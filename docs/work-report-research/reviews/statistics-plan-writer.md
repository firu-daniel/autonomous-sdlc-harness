# Review — statistics-plan-writer
verdict: FAIL

## Must Fix

1. **Lead 5 risk rests on a wrong fact.** Report `:166` says "branch-diff reviewers already see the committed `statistics.md`". They do not. Every diff reviewer excludes run artifacts carrying the branch name: `git diff <default_branch>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' …` (`plugin/agents/branch-reviewer.md:83`, `skeptic-reviewer.md:87-88`, `architecture-reviewer.md:109,132`, `business-parity-reviewer.md:100,121`). A git pathspec `*` matches `/`, so `<state_dir>/branch_statistics/<branch>/statistics.md` is excluded. Skeptic and parity reviewers count it only as "N run-artifact files excluded". **Change:** rewrite the row to say that reviewers exclude the file by pathspec, so an embedded `## Work report` adds no review noise. The low-cost conclusion still holds, and the exclusion makes it stronger.

## Should Fix

1. **Dropping the `<layer_names>` row breaks a corpus convention.** Thinning plan `:111` removes the row because the token is "never resolved". The body still uses it, at `plugin/agents/statistics-plan-writer.md:69` (`_(layer: <one of <layer_names>>)_`), and `.claude/context/plugin.md:46` requires every config-derived token an asset uses to be declared in `## Resolved values`. **Change:** keep the row, shortened to about 15 words, or also drop `<layer_names>` from the `:69` entry shape. Adjust the 115-word estimate.
2. **Lead 13 is not addressed.** `.claude/CLAUDE.md` is counted at 1 695 words but nowhere compared with the agent's read list. Its table sends "any implementation, review or planning" to `context/conventions.md` and branch-level work to `lessons.md`, while `statistics-plan-writer.md:33` forbids reading conventions documents. **Change:** add one line saying the definition's explicit bar wins, so no extra up-front load. Also note that an adopter's `CLAUDE.md` is the `cli/templates/claude/CLAUDE.md` rendering, not this repo's 1 695 words. The constraint holds either way, because CLAUDE.md is unchanged on both sides.
3. **The template is missing the dispositioned Notes rule.** `statistics-plan-writer.md:147` requires a Notes sentence whenever `dispositioned_points > 0` or an unpointed unit matched. That is a conditional, easily skipped rule, which goal (b) targets. S4 records the match set but says nothing about Notes, and S9 says only "the sample's sections". **Change:** extend S4 or S9 with "if any match, state `<N>` story points closed without a fix in `## Notes`". Also have S9 name `status:` `pre-user-review`/`post-user-review` (`:146`), which no item covers.
4. **Process "after" (910) is itemised but not drafted.** The other section estimates are small and credible. The 910 should show its subtraction from the measured blocks: 66–90 = 230, 92–98 = 261, 100 = 109, 104–107 = 64, 109–116 = 330, 118–121 = 169, 122–124 = 94, 128–130 = 15. With roughly 1 440 words of margin the constraint is not at risk. **Change:** state the per-block keep/cut so the number is re-derivable, or label it "estimate, not drafted".
5. **Cutting `:112` loses a rule, not just rationale.** Thinning plan `:114` cuts "the `:111`/`:112` punctuation rationale". `:112` is the arm-2 anchoring rule ("only *un-indented* (top-level) items count; indented sub-items … are not counted"). That is grading-relevant reference, not punctuation rationale. **Change:** cut only `:111`'s "leaving it optional would score…" clause, and keep `:112`'s anchoring sentence.

## Nice to Have

1. The template's `Mode: <first-write | update>` line duplicates `## Status`'s `status:` and can drift from it. Derive it from the status, or drop it.
2. Lead 1 is correctly applied: the report gives the `error:` no-file contract as its reason for a single write (`:9`, `:161`), not a missing `cp`/`Edit`. Leave as is, but say explicitly that `sed -i` or `Edit` would make in-place ticking possible, and that it is still rejected because of `:31`/`:173`.
3. Lead 12 holds: the S1/S9 evidence is repo-relative, S4 uses short SHAs, and the report notes that `last_updated` already makes re-commits idempotent only within the same day. Mention that last point at `:155` for precision.
4. Wire-line confusion: none found. The caller parses only the agent's reply (`statistics-plan-writer.md:58`, `plan_orchestration_instructions_autonomous.md:113`, `user_review_fixes_instructions_core.md:212`), never file lines. `- [ ]` checkboxes inside `statistics.md` are matched by no script: the only checkbox parsers are ledger-specific (`cli/templates/scripts/remote-run.sh:6193-6210`). They do contradict the sample's "no checkbox a committer flips" spirit (`sample_statistics.md:5`), so the sample note at report `:124` should also say these boxes are not readiness entries.

## Readers of `statistics.md` (task-specific check)

| Reader | Effect of an embedded `## Work report` |
|---|---|
| Callers (`plan_orchestration_instructions_core.md:647`, `user_review_fixes_instructions_core.md:212`, supervised Phase 3s) | None. They parse the return block, not the file. |
| Autonomous Override D (`plan_orchestration_instructions_autonomous.md:119-123`, `user_review_fixes_instructions_autonomous.md:116-120`) | None. They stage the same single path. |
| `plugin/commands/branch-status.md:46` | LLM summary of rate and counts. Tolerates the section. Its "assumptions/blocks" scan (`:45`) covers plan and review artifacts only. |
| Scripts (`cli/templates/scripts/*`, `plugin/hooks/*`), the CLI (`cli/src/generators/stateDir.ts:94`), tests (`cli/test/init.test.mjs:142`) | Directory name only. No content parse. `remote-run.sh:6434` reads the story index, not statistics. |
| `improvement_observations_instructions.md` | Reads `git log`, not the file. Unaffected. |
| Diff reviewers | Excluded by pathspec (Must Fix 1). |
| `plugin/docs/AUTONOMOUS_FLOW.md:203` (sample is format of record) | Needs the sample to announce the section, as the report proposes. |

## Bug claims

The report names no pre-existing bug. Open question 4 says "weight from the review text, never the fix plan" exists only in the sample. **CONFIRMED** as a gap, not a bug: `sample_statistics.md:58` states it, while `statistics-plan-writer.md:118` implies it ("quote the deciding phrase from the observation text") without stating it.

## Verification log

- `wc -w`: agent 2 941, sample 1 509, CLAUDE.md 1 695, unit_loop_core 9 143, improvement_observations 9 044, sample_story_plan 1 270, sample_user_review 292. All match. The section counts for agent lines 1–175 match exactly. The sample preface is 293, against 290 claimed (1 %).
- Arithmetic: section afters sum to 1 569 (claimed ~1 570). Up-front total 1 839 + 1 170 + 1 695 = 4 704 (claimed ~4 705). Deltas −1 371, −339, −1 440. All correct. The template measures 268 words (claimed ~270). Titles are ≤ 8 words and descriptions are 6–21 words.
- Citations checked: `:29`, `:31`, `:33`, `:48`, `:56`, `:58`, `:60`, `:98`, `:100`, `:111`, `:118-121`, `:122`, `:139`, `:147`, `:165`, `:173`, `sample:7` (91 words), `sample:58`, `plan_orchestration_instructions_autonomous.md:109,119-123,129`, `user_review_fixes_instructions_autonomous.md:116-120`, `autonomous-script-allowlist-guard.sh:453-454`, `AUTONOMOUS_FLOW.md:203`, `hooks.json` (only the `Bash` matcher), `settings.autonomous.json` (`Write(/{{repoRoot}}/**)`, `mkdir -p`). All correct except `:112` (Should Fix 5) and the reviewer-visibility claim (Must Fix 1).
- Report length: 2 799 words excluding the template, within range. All fixed headings are present.
