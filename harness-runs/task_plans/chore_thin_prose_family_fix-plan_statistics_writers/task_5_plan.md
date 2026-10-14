### Task 5 — Thin `statistics-plan-writer`'s `## Process` steps 1–3, `## Output` and `## Output contract`

**Goal:** Cut `## Process` steps 1–3, `## Output` and `## Output contract` of `plugin/agents/statistics-plan-writer.md` to direct rules stated once, keeping every command, regex, arm, weight, edge case and return line, so the success rate it computes does not change.

**Depends on:** Task 4, which thinned the same file above step 1 and kept the source-path-beside-every-count rule in the `## Process` lead paragraph. S35 below drops `## Output`'s second copy of that rule. The family check probe is at `harness-runs/scratch/fix_plan_statistics_family_check.mjs` (written by Task 1). If it is missing, return a blocker naming it; do not write a probe of your own.

**Where this task stops.** It changes only the text from step 1 of `## Process` to the end of the file. It does not touch:
- anything above step 1 (Task 4);
- the frontmatter or `## Resolved values` (frozen);
- `plugin/samples/sample_statistics.md`, which quotes the arm greps and the formula and stays as it is;
- `plugin/instructions/improvement_observations_instructions.md`, which ships the same disposition derivation;
- any other file under `plugin/`.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — usually only part of a line, leading spaces included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in this range** stays word for word:
- the sentence `Use the `Write` tool with an absolute path built from `<repo_root>`; do not use a Bash heredoc for the file body.` (shared with `plugin/agents/ui-tests-plan-writer.md`);
- every fenced block, byte for byte: the task-entry shape, both `awk` pipelines, the `git log` command, the formula, the return block and the `error:` block.

These are wires, and no replacement below touches their text:
- the regex `^\d+\.\s*\[[ x]\]\s*\*\*Task\b`;
- the `record disposition of ` substring, its case rule and the **first** following ` — ` delimiter;
- the four arm greps and their order;
- the severity rubric: Major `15`, Trivial `2`, Minor `5`, `[major]`, `[trivial]` and the keyword-signal rule;
- the fallback note `("no `_(points: …)_` tags in the story index — fell back to the legacy task-count denominator")`;
- the `## Notes` disposition sentence.

Every bold lead in this range stays, worded as it is. Every heading line stays.

### Targets

- `plugin/agents/statistics-plan-writer.md` → `## Process` steps 1–3, `## Output` and `## Output contract`.

**Work:**

- [ ] **Step 1 — story points.** Apply S10–S18.
  - The entry-shape lead, both count bullets and the `100`-points note lose their restatements (S10–S14). The per-task-points record moves to `## Output`'s breakdown bullet, which already lists it.
  - The dispositioned-units bullet keeps the rule, the command and the token derivation, and drops:
    - the denominator rationale (S15);
    - the sentence pointing at `improvement_observations_instructions.md`, which cited that file's heading in a short form (S16);
    - its record sentence, which `## Output` owns (S16).
  - The fallback keeps its trigger, its value and its `## Notes` flag, and drops the plan-review rationale (S17).
  - The missing-index paragraph goes (S18). `## Output contract` returns the same `error:` and writes no file.
- [ ] **Step 2 — issue cost.** Apply S19–S26.
  - The glob bullet keeps the drop-anything-containing-`_fix_plan` rule (S19).
  - Arm 1 keeps the required punctuation, its matching and non-matching examples and the no-sum rule (S20).
  - Arm 2 keeps *"only un-indented items count"* (S21), and arm 4 keeps *"no enumeration of any kind"* (S22).
  - The improvise rule now names arm 3 directly (S23).
  - The severity lead keeps the fixed rubric and the quoted-phrase rule (S24). The weight-recording line moves to `## Output` (S25, and S33 adds it there).
  - The `issue_cost_total` bullet keeps the first-write zeros (S26).
- [ ] **Step 3 — success rate.** Apply S27–S30. Each edge case keeps its bold lead, its condition and its result. *"No points"* keeps the zero-entries-only rule, stated through step 1's fallback.
- [ ] **`## Output` and `## Output contract`.** Apply S31–S37.
  - `## Output` keeps the path, `mkdir -p`, the frozen `Write` sentence, the sample's exact format, the real date and the disposition sentence (S31–S34).
  - The `## Counts breakdown` bullet gains each observation's weight with its quoted evidence (S33), moved from step 2.
  - The duplicate source-path line (S35) and the third statement of the formula after the return block (S36) go.
  - The no-paste rule keeps its first clause (S37).
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - Step 1: the section-scoped count of `[ ]` and `[x]` entries; the points sum; a story may exceed `100`; dispositioned units stay in the denominator and are identified by the one plain command, with `<default_branch>` resolved first; the token rule, the `**Task K**` contribution and the unpointed-match rule; the fallback and its note.
  - Step 2: the glob and the `_fix_plan` drop; the four arms in order, with precedence never a sum; the punctuation rule; un-indented items only; arm 3's recorded grep; the no-enumeration fallback `1`; per-file count, arm and grep recorded; no improvised count; the rubric with quoted evidence for Major and Trivial; `issue_cost_total`; the first-write zeros.
  - Step 3: the formula, `100%` at zero cost, the `0%` clamp and `n/a` only at zero task entries.
  - `## Output`: path, directory, `Write` not heredoc, the exact sample format, every breakdown field listed in the old text plus each observation's weight, `## Status` with the real date, and `## Notes` with the estimate note and the disposition sentence.
  - `## Output contract`: the seven-line block, the `error:` block, no file on error, no file body pasted back.

### Replacements

**S10** — `plugin/agents/statistics-plan-writer.md`: replace

```text
Read the story index at `<state_dir>/story_plans/<branch>_story_plan.md`. Locate its `## Phase 2 Readiness — Ordered Fix List` section. Each task entry has the shape:
```

with

```text
In the story index's `## Phase 2 Readiness — Ordered Fix List` section, each task entry has the shape:
```

**S11** — `plugin/agents/statistics-plan-writer.md`: replace (the Old block opens with one space)

```text
 — a top-level numbered list item whose checkbox is `[ ]` **or** `[x]` and which references `**Task K**`. **Count both `[ ]` and `[x]`** — a flipped checkbox is a completed-but-still-planned task and still counts toward scope.
```

with

```text
. **Count both `[ ]` and `[x]`**: a completed task still counts toward scope.
```

**S12** — `plugin/agents/statistics-plan-writer.md`: replace

```text
- **Raw count** — count those entries; that count is `story_plan_tasks` (retained as a raw number in the breakdown). Section-scoped so `**Task K**` checkbox lines elsewhere in the file (e.g. an example or changelog) cannot over-count:
```

with

```text
- **Raw count** — the number of those entries is `story_plan_tasks`, counted section-scoped so a `**Task K**` line elsewhere in the file cannot over-count:
```

**S13** — `plugin/agents/statistics-plan-writer.md`: replace

```text
- **Denominator (`story_points_total`)** — for each such entry, pull the integer out of its `_(points: <P>)_` tag and **sum** them. Section-scoped extraction, mirroring the count `awk` above:
```

with

```text
- **Denominator (`story_points_total`)** — the **sum** of each entry's `_(points: <P>)_` integer, extracted section-scoped the same way:
```

**S14** — `plugin/agents/statistics-plan-writer.md`: replace

```text
`story_points_total` is that sum (a story may legitimately exceed `100`). Record each task's per-task points (and their sum) in the breakdown so the denominator is re-derivable by hand.
```

with

```text
A story may exceed `100` points.
```

**S15** — `plugin/agents/statistics-plan-writer.md`: replace (the Old block opens with one space)

```text
 carries an `[x]` like any other and its points stay in `story_points_total` — the work was scoped, and dropping it would shrink the denominator and *raise* the rate.
```

with (opening with one space)

```text
 carries an `[x]` like any other, and its points stay in `story_points_total`.
```

**S16** — `plugin/agents/statistics-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 Record `dispositioned_points`, the contributing tokens and their short SHAs in `## Counts breakdown` beside the per-task points. This derivation and its `<default_branch>` resolution are the ones `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## Dispositioned units` already ships — restated here so you issue no second parse and read no second file, and so the two figures cannot disagree.
```

**S17** — `plugin/agents/statistics-plan-writer.md`: replace (the Old block opens with one space)

```text
 (a hand-written or externally-authored story index — the points-extraction `awk` returns `0` while `story_plan_tasks > 0`), fall back to `story_points_total = story_plan_tasks`, the task-count denominator. This preserves a comparable number for an untagged index instead of forcing `n/a`; it is a fallback, not a licence — a plan this harness writes carries a `_(points: …)_` tag on every entry, and a missing tag is a Must Fix at plan review. When this fallback fires, flag it in `## Notes`
```

with (opening with one space)

```text
 — the points `awk` returns `0` while `story_plan_tasks > 0` — set `story_points_total = story_plan_tasks`, and flag it in `## Notes`
```

**S18** — `plugin/agents/statistics-plan-writer.md`: delete this paragraph (leading spaces included), together with the one blank line after it

```text
   If the story index file is missing, return `error:` with the missing path — do **not** invent a count and do **not** write a file.
```

**S19** — `plugin/agents/statistics-plan-writer.md`: replace (leading spaces included)

```text
   - This pattern matches `<branch>_review.md`, `<branch>_review_2.md`, `<branch>_review_1.md`, … (all per-round user-review files for the branch).
   - It MUST NOT match `<branch>_fix_plan*.md` or any `*_fix_plan*` file, and MUST NOT match fix-plan directories — the trailing `_review*.md` (note the literal `review` and the `.md` suffix) excludes them. Before counting, sanity-check the match list and drop anything containing `_fix_plan`.
```

with (leading spaces included)

```text
   - It matches every per-round user-review file of the branch (`<branch>_review.md`, `<branch>_review_2.md`, …) and must match no fix-plan file or directory: before counting, drop any match containing `_fix_plan`.
```

**S20** — `plugin/agents/statistics-plan-writer.md`: replace

```text
The trailing punctuation is **required**, not optional: `### 1. `, `## 2) ` and `#### 3: ` are enumerations and match; a heading that merely starts with a digit (`## 3 things that broke`, `## 2026-08 regression sweep`) is not one, does not match, and falls through to arm 2 — leaving it optional would score such a file as **one** observation. When this returns ≥1 it is the count, and arm 2 is **not** added to it: a heading-numbered observation commonly carries un-indented list items of its own, and summing would count those as observations.
```

with

```text
The trailing punctuation is **required**: `### 1. `, `## 2) ` and `#### 3: ` match; a heading that merely starts with a digit (`## 3 things that broke`, `## 2026-08 regression sweep`) does not, and falls through to arm 2. When this returns ≥1 it is the count, and arm 2 is **not** added to it, even where the observations carry un-indented list items of their own.
```

**S21** — `plugin/agents/statistics-plan-writer.md`: replace (the Old block opens with one space)

```text
 Both patterns are deliberately anchored at the start of the line with no leading `\s*`, so only *un-indented* (top-level) items count; indented sub-items inside an observation are not counted.
```

with (opening with one space)

```text
 Only *un-indented* (top-level) items count; indented sub-items are not counted.
```

**S22** — `plugin/agents/statistics-plan-writer.md`: replace

```text
— reserved for a file with **no enumeration of any kind**, i.e. all three arms above returned `0` (prose only / a single freeform observation).
```

with

```text
— for a file with **no enumeration of any kind**: all three arms above returned `0`.
```

**S23** — `plugin/agents/statistics-plan-writer.md`: replace

```text
**Do not improvise a count** for a shape the four arms do not fit — arm 3 is that case, and an improvised count is what makes two runs' rates incomparable. Sum the per-file counts → `user_review_issues` (retained as a raw number in the breakdown).
```

with

```text
**Do not improvise a count**: a shape arms 1 and 2 do not fit is arm 3's. Sum the per-file counts → `user_review_issues`.
```

**S24** — `plugin/agents/statistics-plan-writer.md`: replace

```text
Each observation costs a severity weight in story-point units, not one whole task. Classify by this **fixed rubric** and make every non-default call **auditable**: beside any observation you classify Major or Trivial, quote the deciding phrase from the observation text so a reviewer can re-derive the classification by hand.
```

with

```text
Each observation costs a weight in story-point units. Classify it by this **fixed rubric**, and beside any observation you classify Major or Trivial, quote the deciding phrase from the observation text.
```

**S25** — `plugin/agents/statistics-plan-writer.md`: delete this line, leading spaces included, together with its line break

```text
     Document each observation's assigned weight — and the quoted evidence for every Major/Trivial — beside its file in the breakdown so a reviewer can re-derive the subtraction. (A richer per-issue severity input can be layered on later without changing the formula — the raw per-observation list and the per-file costs are retained.)
```

**S26** — `plugin/agents/statistics-plan-writer.md`: replace (the Old block opens with one space)

```text
 Record each file's observation count **and** its summed cost so both are re-derivable. (In the first-write invocation no `<branch>_review*.md` files exist yet, so `user_review_issues = 0` and `issue_cost_total = 0`.)
```

with (opening with one space)

```text
 On a first write no `<branch>_review*.md` file exists yet, so `user_review_issues = 0` and `issue_cost_total = 0`.
```

**S27** — `plugin/agents/statistics-plan-writer.md`: replace

```text
Then apply the edge-case rules (same as the sample):
```

with

```text
Then apply the edge-case rules:
```

**S28** — `plugin/agents/statistics-plan-writer.md`: replace

```text
When `issue_cost_total == 0` (no user review yet, or a fully clean review) the rate is `100%`.
```

with

```text
When `issue_cost_total == 0`.
```

**S29** — `plugin/agents/statistics-plan-writer.md`: replace

```text
If `issue_cost_total > story_points_total` the raw value goes negative → record **`0%`**, never a negative number. The result never exceeds `100%`.
```

with

```text
When `issue_cost_total > story_points_total`, record **`0%`**, never a negative number.
```

**S30** — `plugin/agents/statistics-plan-writer.md`: replace

```text
When `story_points_total == 0`, record `n/a` (cannot divide by zero) instead of a number. Note this is only reachable when the story index has **zero** task entries — when it has tasks but no `_(points: …)_` tags, the Step-1 back-compat fallback sets `story_points_total = story_plan_tasks > 0`, so the rate is a real number with the fallback noted, not `n/a`.
```

with

```text
When `story_points_total == 0`, record `n/a` instead of a number. Only a story index with **zero** task entries reaches it: step 1's fallback gives an untagged one a real denominator.
```

**S31** — `plugin/agents/statistics-plan-writer.md`: replace

```text
Write `<state_dir>/branch_statistics/<branch>/statistics.md` (create the `<branch>/` subdirectory first if absent — `mkdir -p <state_dir>/branch_statistics/<branch>` is fine; this is your own output directory, not a reviewer findings dir).
```

with

```text
Write `<state_dir>/branch_statistics/<branch>/statistics.md`, creating its directory first with `mkdir -p <state_dir>/branch_statistics/<branch>` when absent.
```

**S32** — `plugin/agents/statistics-plan-writer.md`: replace

```text
Emit the **exact** format the sample at `${CLAUDE_PLUGIN_ROOT}/samples/sample_statistics.md` fixes, with your computed numbers:
```

with

```text
Emit the sample's format exactly, with your computed numbers:
```

**S33** — `plugin/agents/statistics-plan-writer.md`: replace

```text
- `## Summary` — lead with the headline `success_rate`, then `story_points_total` and `issue_cost_total` (the two figures the formula divides), and retain `story_plan_tasks` and `user_review_issues` as raw counts. Include the formula block and the edge-case rules (as in the sample).
- `## Counts breakdown` — under the **story-index source**: the story-index path, the per-task points and their sum (`story_points_total`), the retained `story_plan_tasks` raw count (plus a note if the back-compat task-count fallback fired), and `dispositioned_points` with the unit token and short SHA of every dispositioned unit — `0` and no tokens when step 1's command matched none. Under the **user-review source**: the per-user-review-file observation count **and** summed cost, their totals (`user_review_issues` and `issue_cost_total`), **the enumeration arm and the grep that produced each file's count** (numbered headings → top-level list items → explicit marker → the no-enumeration fallback `1`), and the severity-weight bucket rule (Major `15` / Minor `5` default / Trivial `2`).
```

with

```text
- `## Summary` — the headline `success_rate`, then `story_points_total`, `issue_cost_total`, `story_plan_tasks` and `user_review_issues`, the formula block and the edge-case rules.
- `## Counts breakdown` — under the **story-index source**: the story-index path, each task's points and their sum, `story_plan_tasks` (noting the fallback if it fired), and `dispositioned_points` with the unit token and short SHA of every dispositioned unit — `0` and no tokens when step 1's command matched none. Under the **user-review source**: each file's observation count **and** summed cost, **the enumeration arm and the grep that produced each file's count**, each observation's weight with the quoted evidence for every Major/Trivial, the totals `user_review_issues` and `issue_cost_total`, and the severity-weight bucket rule (Major `15` / Minor `5` default / Trivial `2`).
```

**S34** — `plugin/agents/statistics-plan-writer.md`: replace

```text
the deliberately-basic-but-points-weighted-estimate note (the per-source counts and per-issue costs are retained so the metric can be refined later).
```

with

```text
the sample's estimate note.
```

**S35** — `plugin/agents/statistics-plan-writer.md`: delete this paragraph, together with the one blank line after it

```text
Record the source path beside every count so the numbers are re-derivable by hand.
```

**S36** — `plugin/agents/statistics-plan-writer.md`: delete this paragraph, together with the one blank line after it

```text
`success_rate` is `round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1)` — `100%` when `issue_cost_total == 0`, clamped to `0%` when `issue_cost_total > story_points_total`, and `n/a` only when `story_points_total == 0` (zero task entries). `story_plan_tasks` / `user_review_issues` are retained raw counts for continuity.
```

**S37** — `plugin/agents/statistics-plan-writer.md`: replace

```text
Do not paste the file body back to the orchestrator — it reads only this contract block.
```

with

```text
Do not paste the file body back.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/fix_plan_statistics_family_check.mjs plugin/agents/statistics-plan-writer.md` as one plain foreground command. It prints a `WORDS statistics-plan-writer.md` line with a negative `delta`, its last line is `PASS`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
- The success rate is unchanged by construction. Every fenced command and the formula are byte-identical, which the probe's `FENCE` check confirms, and the four arm greps are byte-identical to the ones `plugin/samples/sample_statistics.md` quotes: `git grep -n -F -e "grep -cE '^#{2,4} +[0-9]+[.):]'" -e "grep -cE '^[0-9]+\.|^[-*][[:space:]]'" -- plugin/agents/statistics-plan-writer.md plugin/samples/sample_statistics.md` prints both patterns in both files.
- `git grep -n -F -e 'restated here' -e 'Must Fix at plan review' -e 'leaving it optional' -e 'layered on later' -e 'reads only this contract block' -- plugin/agents/statistics-plan-writer.md` prints nothing.
- `git grep -n -F 'success_rate = round(clamp(' -- plugin/agents/statistics-plan-writer.md` prints only the step 3 formula line.
- No list in steps 1–3 or `## Output` gains or loses a blank line inside it, and `git diff -- plugin/agents/statistics-plan-writer.md` shows this task's hunks only from step 1 of `## Process` down.
