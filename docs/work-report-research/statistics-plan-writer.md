# Work report research — statistics-plan-writer

## Verdict

**Recommend with changes.** This agent is the cheapest case in the set. It runs as a single deterministic pass with about nine real steps. Its output, `statistics.md`, is already an evidence record: every count carries its source path, arm and grep (`plugin/agents/statistics-plan-writer.md:149`, `plugin/samples/sample_statistics.md:55`). It also has the largest redundancy of any agent researched so far, because the agent body and its one up-front sample restate each other's formula, edge cases, arm rules and severity rubric.

Changes to adopt:
1. Do not use a separate `work_reports/…/report_<index>.md` file. Embed the checklist as a trailing `## Work report` section of `statistics.md`, written in the same single `Write`. That section then rides the autonomous fork's existing one-path commit.
2. Do not tick as you go. The checklist is composed in context and written once, because the `error:` contract forbids any file on failure.
3. Thin both files hard.

With those changes, the up-front load drops from 6 145 to about 4 840 words.

## Read tree

Paths are relative to the checkout root. Counts are from `wc -w`.

| File | Up-front / on demand | Words |
|---|---|---|
| `plugin/agents/statistics-plan-writer.md` | up-front (agent definition) | 2 941 |
| `plugin/samples/sample_statistics.md` | up-front (`statistics-plan-writer.md:29`, "Read first"; also the format to emit) | 1 509 |
| `.claude/CLAUDE.md` | up-front (auto-loaded into every agent) | 1 695 |
| story index `<state_dir>/story_plans/<branch>_story_plan.md` | up-front, run data rather than prose (`:34`) | n/a |
| `<state_dir>/user_reviews/<branch>_review*.md` | up-front on update only, run data (`:35`) | n/a |
| `git log <default_branch>..HEAD` messages | commit metadata, not a file (`:36`) | n/a |
| `plugin/instructions/unit_loop_core.md` → `### The dispositioned outcome` | on demand (cited at `:92`, never required) | 9 143 (file) |
| `plugin/instructions/improvement_observations_instructions.md` → `## Dispositioned units` | on demand. `:98` states the derivation is "restated here so you … read no second file" | 9 044 (file) |
| `plugin/samples/sample_story_plan.md` | on demand (cited by the sample, `sample_statistics.md:3`) | 1 270 |
| `plugin/samples/sample_user_review.md` | on demand (cited by the sample, `sample_statistics.md:3`) | 292 |
| caller instruction files (`:48`, `:56`) | never: cited only as provenance | n/a |

**Up-front total today: 6 145 words** (2 941 + 1 509 + 1 695). The agent explicitly bars reading the conventions documents, detail files and review files (`:33`), so its tree is unusually shallow.

**Read-list conflict (lead 13).** `.claude/CLAUDE.md` → `## Context files` sends "any implementation, review or planning" to `context/conventions.md` and branch-level work to `lessons.md`. This agent does none of those, and its definition's explicit bar at `:33` wins, so the larger set adds nothing up front. In an adopter's repository the auto-loaded file is the rendering of `cli/templates/claude/CLAUDE.md` (1 320 words), not this repository's 1 695. The constraint holds either way, because `CLAUDE.md` is the same on both sides of the ledger.

## Dispatch sites and phases

| Caller | Section | Prompt | Flow |
|---|---|---|---|
| `plan_orchestration_instructions_core.md:645-666` | `### D.1 Write the first branch-statistics file` | first-write | semi-autonomous and autonomous task flow (ledger phase `D`) |
| `plan_orchestration_instructions_autonomous.md:107-145` | Override D: commit via `commit-on-branch.sh` with the **single** path `statistics.md` (`:119-123`) | — | autonomous only |
| `code_review_instructions.md:32-50` step 6 | clean-review path, after `run-test-suite.sh task_supervised` passes | first-write | supervised `/branch-review` |
| `code_review_fixes_instructions.md:22-40` Phase 3 | after every review item is `[x]` and gates pass | first-write | supervised `/branch-implement-review` |
| `user_review_fixes_instructions_core.md:194-213` | `### D.1 Update the branch-statistics file` | update | semi-autonomous and autonomous user-review fix (ledger phase `R5` per brief) |
| `user_review_fixes_instructions_autonomous.md:104-126` | Override D: single-path commit, subject `chore: Update branch statistics for <branch>` | — | autonomous only |
| `user_review_fixes_instructions.md:26-42` Phase 3 | after the fix plan is all `[x]` and gates pass | update | supervised `/branch-implement-user-review` |

Per branch: **one first-write**, plus **one update per user-review round**. `docs_orchestration_instructions_autonomous.md:131` explicitly excludes this agent from the docs flow.

## Prose classification

Section totals are measured with `sed -n 'a,bp' | wc -w`. The class split within a section is a per-line attribution from the per-line counts and is an estimate. Headings are folded into their section's REDUNDANT or REFERENCE share.

### `plugin/agents/statistics-plan-writer.md` (2 941)

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 69 | 0 | 0 | 69 | 0 | `description` is the agent-registry string. `tools:` is checked below. |
| Intro (7–10) | 124 | 40 | 25 | 0 | 59 | `:8` previews the Process. `:10` ("no readiness section, terse block") is kept as reference. |
| `## Resolved values` (12–21) | 360 | 0 | 115 | 0 | 245 | The preamble at `:14` (125) explains which tokens are *not* listed. The `<repo_root>` row (`:19`, 90) restates `CLAUDE.md` → checkout-root rule. The `<layer_names>` row (`:20`, 48) is a token the agent never resolves. |
| `## Read first` (25–36) | 186 | 45 | 95 | 0 | 46 | Kept as actions: read the sample, and return `error:` if any cited path is unreadable. The do-not-read list is kept as reference. |
| `## Invocation contract` (38–60) | 299 | 0 | 90 | 60 | 149 | WIRE: both prompt strings, which the callers send verbatim, and the five parsed return-line names (`:58`). REDUNDANT: caller provenance (`:48` 99 words, `:56`). |
| `## Process` prelude (62–64) | 39 | 0 | 20 | 0 | 19 | |
| Step 1, story points (66–102) | 625 | 150 | 200 | 120 | 155 | WIRE: the regex, both `awk` pipelines, the `git log` line and the literal `record disposition of ` with its ` — ` token delimiter, which is shared with `improvement_observations_instructions.md`. REDUNDANT: "restated here so…" (`:98`) and the "fallback, not a licence … Must Fix at plan review" rationale (`:100`). |
| Step 2, issue cost (104–124) | 657 | 160 | 230 | 90 | 177 | WIRE: the arm greps (quoted again in `sample_statistics.md:48,55`), the weights `15/5/2`, `[major]`/`[trivial]`. REFERENCE: the severity rubric, which is the grading standard and must stay inline (lead 7). REDUNDANT: the punctuation rationale (`:111`) and the "richer severity later" aside (`:122`). |
| Step 3, rate (126–135) | 139 | 20 | 0 | 40 | 79 | The formula is WIRE (also at `sample:22` and in the contract `:165`). The edge cases duplicate `sample:27-32`. |
| `## Output` (137–149) | 326 | 40 | 30 | 40 | 216 | The bullets at `:143-147` re-describe the sample's sections. Kept: `mkdir -p`, the `Write` tool over a heredoc, the real date, and the Notes sentence literal at `:147`. |
| `## Output contract` (151–175) | 116 | 10 | 0 | 62 | 44 | The 7-line block and the `error:` line are WIRE. `:165` restates the formula a third time. |
| **Total** | **2 941** | **465** | **805** | **481** | **1 189** | |

### `plugin/samples/sample_statistics.md` (1 509)

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Title (1) | 4 | 0 | 0 | 4 | 0 | |
| Preface blockquote (3–9) | 290 | 0 | 85 | 0 | 205 | `:7` (91) re-resolves placeholders the agent's table already resolves. `:3`'s fixture provenance only matters to a human checker. |
| `## Summary` (11–32) | 289 | 0 | 0 | 289 | 0 | The output's own content (formula, edge cases). Kept verbatim. |
| `## Counts breakdown` (34–57) | 503 | 0 | 0 | 503 | 0 | The worked shape. Kept. |
| "Why all five … Minor" (58) | 155 | 0 | 40 | 0 | 115 | One load-bearing rule appears **only here**: weight from the review text, never from the fix plan. Keep it as one sentence. |
| `## Status` (60–63) | 48 | 0 | 0 | 48 | 0 | |
| `## Notes` (65–67) | 217 | 0 | 0 | 185 | 32 | The last sentence (sample-only date advice) is cut. |

## Draft work report template

Mode handling: **one template**. On a first-write, S5–S7 are ticked `n/a — first write`. The template is embedded in the agent definition, not copied from a file, so no `cp` is needed. It is appended as the last section of `statistics.md` in the single `Write` (see Storage). Evidence after `→` is mandatory, because that is where goal (a) lives. There is no separate mode line: `## Status`'s `status:` already records the mode, and a second copy could drift from it.

```markdown
## Work report

An item that does not apply is ticked `n/a — <reason>`. Paste the evidence after `→`.

- [ ] S1. **Read the format sample** — Read `sample_statistics.md`; on any unreadable input return `error:` and write nothing. → `read`
- [ ] S2. **Count Task entries** — Run the section-scoped count `awk` on the story index; `[ ]` and `[x]` both count. → `story_plan_tasks = <N>`
- [ ] S3. **Sum story points** — Run the points `awk`; if it returns 0 while tasks > 0, use the task count and note the fallback. → `<sum>` / `fallback`
- [ ] S4. **Find dispositioned units** — One plain `git log` over `<default_branch>..HEAD`; match `record disposition of `; this index's Tasks carry points; any match gets the Notes sentence. → `<tokens + SHAs>` / `none`
- [ ] S5. **Glob user reviews** — Glob `<branch>_review*.md`; drop every `_fix_plan` path. → `<files>`
- [ ] S6. **Count observations per file** — First non-zero arm wins, never summed; record arm and grep. (ref: statistics-plan-writer.md → ## Counting rules) → `<file: N, arm>`
- [ ] S7. **Weight each observation** — Minor 5 by default; Major 15 or Trivial 2 only per the rubric, quoting the deciding phrase from the review text. → `<quotes>` / `all Minor`
- [ ] S8. **Compute the rate** — Apply the formula, then the edge cases: no cost 100%, clamp at 0%, zero points n/a. → `<pct>`
- [ ] S9. **Write the report** — `mkdir -p` the branch dir; `Write` tool, absolute path, the sample's sections; `status:` pre/post-user-review, real date. → `<repo-relative path>`
```

That is 268 words (`wc -w`). The return of the contract block is not an item, because the file is already written by then; the contract stays in `## Output contract`. S1's evidence is deliberately not the absolute root path. A worktree path committed into a report would leak a local path into the PR, and it would differ across worktrees, which breaks `:60`'s idempotence clause.

## Thinning plan

**`plugin/agents/statistics-plan-writer.md`** (2 941 → about 1 690, plus the 268-word template, about 1 960 in total)

| Section | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| Frontmatter | — | — | all | 69 |
| Intro | the `:8` preview of the process | `:10` to one sentence | "nothing keys off your output; no readiness section" | 45 |
| Resolved values | the `:14` preamble | `<repo_root>` row → "per `CLAUDE.md` checkout-root rule"; `<default_branch>` row to its resolve-before-issuing clause; `<layer_names>` row to about 15 words. The row stays because `:69` uses the token and `.claude/context/plugin.md:46` requires every token an asset uses to be declared | the `<state_dir>` row | 130 |
| Read first | — | the do-not-read list to one line | the sample path; "a cited path you cannot read is a finding" | 95 |
| Invocation contract | the caller provenance at `:48` and `:56` | the overwrite paragraph `:60` to one sentence, keeping "idempotent modulo `last_updated`" | both prompt blocks; "do not rename a return line"; `error:` is non-halting | 150 |
| Process (steps 1–3) | the `:98` "restated here" sentence; the `:100` plan-review rationale; the `:111` clause "leaving it optional would score such a file as one observation"; the `:122` aside; the step 3 edge-case list (now "edge cases as in the sample's `## Summary`") | the step prose becomes the template's items; what remains is renamed `## Counting rules` (reference) | every command, regex and grep; `record disposition of ` and the ` — ` delimiter; the four-arm precedence; `:112`'s anchoring rule (only un-indented items count); **the full severity rubric (`:118-121`)**; the formula | ~1 000 (estimate, not drafted; derivation below) |
| Output | the `:143-147` section re-description | to "emit the sample's sections in order, then `## Work report`" | `mkdir -p`; `Write` not heredoc; real date; the `:147` Notes sentence literal | 110 |
| Output contract | the `:165` formula restatement | — | the 7-line block, the `error:` block, "no file body" | 75 |
| **New: embedded template** | | | | +268 |

The Process estimate, block by block (measured today → kept): 66–90 230 → 190 (the action prose becomes S2/S3); 92–98 261 → 160 (cut the `:98` "restated here" sentence and the denominator rationale); 100 109 → 45; 104–107 64 → 50; 109–116 330 → 280 (cut the `:111` clause, trim `:116`); 118–121 169 → 169; 122–124 94 → 60 (cut the `:122` aside); step 3, 126–135 139 → 45 (formula plus a pointer to the sample's edge cases). That totals about 1 000 words.

**`plugin/samples/sample_statistics.md`** (1 509 → about 1 180)

- **Remove:** the `:7` placeholder re-resolution (91), most of `:3`'s fixture provenance, `:9`, and the final Notes sentence.
- **Shorten:** `:58` to one sentence: "Weight from the review text as written; never from what a fix plan concluded."
- **Keep verbatim:** `## Summary`, `## Counts breakdown`, `## Status`, and `## Notes` minus its last sentence.
- **Add:** two lines, about 25 words: "A real report ends with the `## Work report` checklist from the agent definition. Its boxes are evidence, not readiness entries; nothing flips them." This keeps `sample_statistics.md:5`'s "no checkbox a committer flips" true. The sample does not carry a filled checklist.
- **After:** about 1 180 words.

**Shared base file:** none is proposed. Nothing this agent loads is shared with another agent except `CLAUDE.md`, and the brief excludes changing that.

## Word-count ledger

| File | Before | After | Delta |
|---|---|---|---|
| **Up-front** | | | |
| `plugin/agents/statistics-plan-writer.md` (body) | 2 941 | ~1 690 | −1 251 |
| work report template (embedded in the agent) | 0 | 268 | +268 |
| `plugin/samples/sample_statistics.md` | 1 509 | ~1 180 | −329 |
| `.claude/CLAUDE.md` | 1 695 | 1 695 | 0 |
| **Up-front total** | **6 145** | **~4 833** | **−1 312 (−21 %)** |
| **On demand** | | | |
| `unit_loop_core.md` / `improvement_observations_instructions.md` | 18 187 | 18 187 | 0 (cited, not required) |
| `sample_story_plan.md` / `sample_user_review.md` | 1 562 | 1 562 | 0 |

**Constraint holds: yes**, with roughly 1 300 words of margin even after the template is included. Nearly all the saving is cross-file duplication (formula ×3, edge cases ×2, section list ×2), not real reference.

## Storage and lifecycle

| Question | Finding |
|---|---|
| Phases and flows | First-write at `D` (semi-autonomous and autonomous), or at supervised `/branch-review` step 6 or `/branch-implement-review` Phase 3. Update at user-review `D.1` (`R5`) or supervised `/branch-implement-user-review` Phase 3. |
| Dispatches per branch | 1 + one per user-review round. |
| Proposed `work_reports/<branch>/<phase>/…/report_<i>.md` | **Rejected for this agent.** (a) Phase key: the agent sees only the prompt verb (`Write` or `Update`), not `D` or `R<n>`, and the supervised flows have no ledger. A verb-derived key (`first-write`/`update`) would work. (b) Index: the agent could `ls` for the next free index (it has `Bash`/`Glob`), and that would be collision-safe. (c) **Commit breaks:** both autonomous Override Ds stage exactly one explicit path (`plan_orchestration_instructions_autonomous.md:119-123`, `user_review_fixes_instructions_autonomous.md:116-120`), so a second file would be left untracked and violate the clean-tree invariant. Both overrides, the guard's documented allow row (`autonomous-script-allowlist-guard.sh:452-454`), `cli/src/generators/stateDir.ts:94` and `cli/test/init.test.mjs:142` would all need to change. |
| Chosen: `## Work report` section inside `statistics.md` | It is committed by the existing Override D commit with no caller change. In semi-autonomous and supervised flows it shares `statistics.md`'s deliberate uncommitted fate (`plan_orchestration_instructions_autonomous.md:109`). No index is needed: `statistics.md` is one file per branch and overwritten, and git history keeps earlier reports in autonomous runs only. |
| Tools | `Read, Write, Edit, Bash, Glob, Grep` (`:4`) is sufficient. No `cp` is needed because the template is embedded. |
| Hooks | `hooks.json` registers only `Bash` matchers, so `Write` is unaffected. `mkdir -p` is already in use today (`:139`). |
| Error path | `error:` writes no file (`:31`, `:102`, `:173`), so there is no report. The error line is the evidence, and Override D already skips the commit. |
| Idempotence | The checklist must carry no timestamps, tool-call counts or absolute paths. Otherwise a resumed identical re-run stops producing wrapper exit 3 (`plan_orchestration_instructions_autonomous.md:129`). Note that `last_updated:` already limits that no-op to a re-run on the same day. Evidence stays repo-relative, and S4 uses short SHAs (lead 12). |

## Risks and costs

| Risk | Assessment |
|---|---|
| Tool-call cost | Zero extra calls with the embedded single-write design. True tick-as-you-go would add about 9 `Edit`s per dispatch and require writing a partial file before the `error:` checks are exhausted, which contradicts "write no file". In-place ticking is possible: the agent has `Edit`, and `Write`/`Edit`/`sed`/`mkdir -p` are allowed unattended (`cli/templates/claude/settings.autonomous.json:36-51`; only `cp` is not). It is rejected by choice, because of the `:31`/`:173` no-file-on-error contract and the extra calls, not because of tooling. |
| Goal (a), evidence | Tick timing is unverifiable: everything is written at once, so the agent can tick at the end, and that has to be said honestly. The value lies in the `→` evidence lines. S4 (dispositioned match set), S5 (the `_fix_plan` exclusion) and S7 (the Major/Trivial quotes) record decisions the breakdown captures only partially today. |
| Goal (b), skipped rules | These are the plausible misses: counting `_fix_plan` files, summing arms, copying the sample's numbers, a heredoc instead of `Write`, and a placeholder date. Each maps to one item. |
| Ref-starvation (lead 7) | The severity rubric is the grading standard. It stays inline in the up-front agent body, not behind a `ref:`. S6's only ref is into the same file. |
| Format of record | The sample says "match its section order and heading text exactly" (`:29`), and `plugin/docs/AUTONOMOUS_FLOW.md:203` names the sample as format of record. Appending `## Work report` is a format change, so the sample must announce it. `branch-status.md:46` reads `statistics.md` by LLM summary and would tolerate the extra section. No script or test parses the file: `cli/test` references only the directory name, and `evals/README.md:70` mentions statistics in prose only. |
| Reviewers grading the report (lead 5) | None. Every diff reviewer excludes run artifacts carrying the branch name with `':(top,exclude)<state_dir>/*<branch>*'` (`plugin/agents/branch-reviewer.md:83`; also `skeptic-reviewer.md`, `architecture-reviewer.md`, `business-parity-reviewer.md`). A pathspec `*` crosses `/`, so `branch_statistics/<branch>/statistics.md` is excluded and an embedded `## Work report` adds no review noise. |
| Overwrite loses history | In non-autonomous flows the first-write report is overwritten by the update unless the human committed it. This is acceptable for a one-shot report. |
| Leads 2, 8, 9, 11 | No verdict, so there is no PASS case (2 n/a). The commit point exists in autonomous runs, and the other flows leave the file uncommitted by design (8). `branch_statistics/` is no findings folder, and no reviewer scans it (9 n/a). Lead 11 is the chosen design. No consumer misreads the section: callers parse the reply, not the file, and the only checkbox parsers are ledger-specific (`cli/templates/scripts/remote-run.sh:6193-6210`). |

## Open questions

1. Should every single-artifact writer embed its report in its own artifact rather than a separate file? This agent suggests that is the cleanest pattern wherever the caller commits one explicit path.
2. If the synthesis keeps a separate `work_reports/` tree, it needs a phase key the agent can see. The prompt-verb key works here (`first-write`/`update`), but it does not distinguish R rounds unless the caller passes the round.
3. Is the cross-file dedupe between the agent definitions and `plugin/samples/*` (about 550 words here) a separate, larger win than the work report itself? It could be done whether or not the work report lands.
4. Should "weight from the review text, never the fix plan" move into the agent's rubric as a rule? Today `sample_statistics.md:58` states it, and `statistics-plan-writer.md:118` only implies it. The review confirmed this as a gap, not a bug.

## Review response

Every finding in `reviews/statistics-plan-writer.md` was accepted and applied, so none is rebutted. That covers Must Fix 1, Should Fix 1–5 and Nice to Have 1–4.
