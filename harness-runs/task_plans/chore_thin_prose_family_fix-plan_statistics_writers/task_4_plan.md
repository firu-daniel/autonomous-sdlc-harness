### Task 4 — Thin `statistics-plan-writer`'s intro, `## Read first`, `## Invocation contract` and `## Process` lead

**Goal:** Cut the intro, `## Read first`, `## Invocation contract` and the lead paragraph of `## Process` in `plugin/agents/statistics-plan-writer.md` to direct rules stated once, keeping both prompts, the parsed return-line names, the non-halting `error:` rule and the overwrite rule.

**Depends on:** Task 1, which wrote the family check probe at `harness-runs/scratch/fix_plan_statistics_family_check.mjs`. This task edits a different file from Tasks 1–3. If the probe file is missing, return a blocker naming it; do not write a probe of your own.

**Where this task stops.** It changes only the intro paragraphs (between the frontmatter and `## Resolved values`), `## Read first`, `## Invocation contract` and the one paragraph between the `## Process` heading and step 1. It does not touch:
- the frontmatter or `## Resolved values` (frozen);
- `## Process` steps 1–3, `## Output` or `## Output contract` (Task 5);
- any other file under `plugin/`.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the sentence `Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.`;
- the whole paragraph opening `**A cited path you cannot read is a finding, not a fallback.**`;
- both fenced prompt blocks, byte for byte. The callers send them: `plugin/instructions/plan_orchestration_instructions_core.md`, `plugin/instructions/code_review_instructions.md`, `plugin/instructions/code_review_fixes_instructions.md` and `plugin/instructions/user_review_fixes_instructions_core.md`.

These bold leads stay, worded as they are: `**Statistics Plan Writer**`, `**First write (pre-user-review):**`, `**Update (post-user-review):**`, `**How the caller consumes your return.**`, `**The output file is overwritten, never appended.**` and `**A cited path you cannot read is a finding, not a fallback.**`. Every heading line stays.

### Targets

- `plugin/agents/statistics-plan-writer.md` → the intro, `## Read first`, `## Invocation contract` and the `## Process` lead paragraph.

**Work:**

- [ ] **The intro and `## Read first`.** Apply S1–S4.
  - The intro's preview of the whole process becomes one sentence naming the output and the format rule (S1).
  - The *"distinct from every fix-plan writer"* paragraph keeps its rule — one file, no readiness section, no per-finding files, a terse return — and drops its framing (S2).
  - The sample bullet keeps *"Match its section order and heading text exactly"* and the never-copy rule, and drops the list of what the sample holds (S3).
  - The input list keeps the three inputs and the exclusions, each tagged with the step that uses it (S4).
- [ ] **`## Invocation contract` and the `## Process` lead.** Apply S5–S9.
  - Both caller-provenance sentences go (S5, S6). The prompts themselves are unchanged, and the agent acts on neither sentence.
  - The caller-return paragraph keeps the five parsed names, *"Do not rename a return line"* and the non-halting `error:` rule (S7).
  - The overwrite paragraph keeps one file per branch, no round suffix and *"modulo `last_updated`"* (S8).
  - The `## Process` lead keeps *"deterministic and reproducible"* and the source-path-beside-every-count rule (S9). Task 5 drops `## Output`'s second copy of that rule.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - A report, not a fix list; the output path; the sample's exact format; no readiness section, no per-finding files, one file and a terse return.
  - The sample is read up front, its section order and headings are matched, and its numbers are never copied. The definition-wins sentence and the unreadable-path `error:` rule are unchanged.
  - No other file is read. The only inputs are the story index, the `<branch>_review*.md` files and the commit messages over `<default_branch>..HEAD`.
  - The first write: `user_review_issues = 0`, `100%` or `n/a`, status `pre-user-review`. The update: re-count from scratch, overwrite, status `post-user-review`.
  - The five parsed return lines, never renamed; `error:` is non-halting.
  - Overwritten, never appended; one file per branch; idempotent modulo `last_updated`.
  - Deterministic counting with the source path beside every count.

### Replacements

**S1** — `plugin/agents/statistics-plan-writer.md`: replace

```text
You produce a **report**, not a fix list. Given a branch, you read the per-task story points off the story index and sum them (`story_points_total` — the complexity-weighted scope the agent committed to), count the user-review issues and assign each a severity-weighted cost (`issue_cost_total` — the weighted defect load the user found after the workflow finished), compute a deliberately-basic but points-weighted success-rate estimate, and write/update `<state_dir>/branch_statistics/<branch>/statistics.md` in the exact format the sample fixes.
```

with

```text
You produce a **report**, not a fix list: from the story index's story points and the user reviews' severity-weighted issues you compute the branch's success rate, and write `<state_dir>/branch_statistics/<branch>/statistics.md` in the exact format the sample fixes.
```

**S2** — `plugin/agents/statistics-plan-writer.md`: replace

```text
You are distinct from every fix-plan / review writer: nothing keys off your output. You produce **no** `## Phase 2 Readiness` section, no per-finding files, and the committer never flips a checkbox for your work. You write one file and return a terse count block.
```

with

```text
Nothing keys off your output: you write one file, with **no** `## Phase 2 Readiness` section and no per-finding files, and return a terse count block.
```

**S3** — `plugin/agents/statistics-plan-writer.md`: replace

```text
— the exact `statistics.md` template you must emit (headings, the three raw counts, the formula, the edge-case rules, `## Status`, `## Notes`). Match its section order and heading text exactly. The sample's numbers are illustrative; never copy them — compute your own.
```

with

```text
— the exact `statistics.md` template you emit. Match its section order and heading text exactly; its numbers are illustrative and never copied.
```

**S4** — `plugin/agents/statistics-plan-writer.md`: replace

```text
You do NOT read the conventions documents, per-task detail files, per-finding files, code-review files, UI-test plan files, or QA files. The only inputs you read are:
- the story index `<state_dir>/story_plans/<branch>_story_plan.md` (for the task count),
- the `<state_dir>/user_reviews/<branch>_review*.md` user-review files (for the issue count), and
- the branch's own **commit messages** over `<default_branch>..HEAD` (for step 1's dispositioned-unit clause) — commit metadata, not a file on disk; it opens no detail file and no findings body.
```

with

```text
Read no conventions document, per-task, per-finding, code-review, UI-test or QA file. Your only inputs are:
- the story index `<state_dir>/story_plans/<branch>_story_plan.md` (step 1),
- the `<state_dir>/user_reviews/<branch>_review*.md` user-review files (step 2), and
- the branch's own **commit messages** over `<default_branch>..HEAD` (step 1's dispositioned-unit clause).
```

**S5** — `plugin/agents/statistics-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 Two callers send this prompt, both with this wording: the task flow's `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### D.1 Write the first branch-statistics file (pre-user-review)`, and the clean-review path in `${CLAUDE_PLUGIN_ROOT}/instructions/code_review_instructions.md` → step 6 (dispatched only when the review index's `## Phase 2 Readiness — Ordered Fix List` has no `[ ]` entries; when it has any, the write happens instead after they all land, from `${CLAUDE_PLUGIN_ROOT}/instructions/code_review_fixes_instructions.md` once the last entry is `[x]`, with the same prompt).
```

**S6** — `plugin/agents/statistics-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 Sent from `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_core.md` → `### D.1 Update the branch-statistics file (post-user-review)`, once every fix-plan item of the round is `[x]`.
```

**S7** — `plugin/agents/statistics-plan-writer.md`: replace

```text
It parses five of your return lines by name — `statistics_file:`, `story_plan_tasks:`, `user_review_issues:`, `success_rate:`, `status:` — and reports `success_rate` and `statistics_file` in its own summary without opening the file you wrote. **Do not rename a return line**: two callers parse them, and a renamed line breaks both silently. An `error:` return is **non-halting** — the caller reports the error, drops its statistics bullet and continues; it is not a flow blocker.
```

with

```text
It parses five return lines by name — `statistics_file:`, `story_plan_tasks:`, `user_review_issues:`, `success_rate:`, `status:` — without opening the file you wrote. **Do not rename a return line.** An `error:` return is **non-halting**: the caller reports it and continues.
```

**S8** — `plugin/agents/statistics-plan-writer.md`: replace

```text
If `<state_dir>/branch_statistics/<branch>/statistics.md` already exists (the first invocation wrote it), the second invocation supersedes it — there is one `statistics.md` per branch, not a round-suffixed series. The file is idempotent: the same input set always produces the same file (modulo `last_updated`).
```

with

```text
There is one `statistics.md` per branch, never a round-suffixed series, and the same inputs always produce the same file (modulo `last_updated`).
```

**S9** — `plugin/agents/statistics-plan-writer.md`: replace

```text
The counting must be **deterministic and reproducible** — a reviewer has to be able to re-derive every number by hand from the same files, so you record the source path for each count in the output file.
```

with

```text
The counting is **deterministic and reproducible**: record the source path beside every count, so each number can be re-derived by hand.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/fix_plan_statistics_family_check.mjs plugin/agents/statistics-plan-writer.md` as one plain foreground command. It prints a `WORDS statistics-plan-writer.md` line with a negative `delta`, its last line is `PASS`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e 'Two callers send this prompt' -e 'Sent from' -e 'two callers parse them' -e 'the first invocation wrote it' -- plugin/agents/statistics-plan-writer.md` prints nothing.
- Each prompt string is still sent by its callers as the definition states it: `git grep -n -F -e 'Write branch statistics. Branch: <branch>.' -e 'Update branch statistics. Branch: <branch>.' -- plugin` prints the definition's two prompt lines and the callers' lines, and each caller line reads the same as the definition's line for its prompt.
- `git diff -- plugin/agents/statistics-plan-writer.md` shows hunks only above step 1 of `## Process`, and none inside `## Resolved values`.
