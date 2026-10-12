### Task 6 — Thin `skeptic-reviewer` from `## Read first` through `## Output contract`

**Goal:** Cut the second half of `plugin/agents/skeptic-reviewer.md` to direct rules stated once. That covers the read list, the process steps, the checks' lead sentence, the confidence bar, the non-downgradable paragraph's own sentence and `## Output contract`. All five adversarial checks, their Must Fix triggers, both legs of check 4 and every return line stay.

**Depends on:** Task 5, the previous edit to this file; through it, Task 1. Leave their text as they left it. Task 1 already rewrote this file's `## Findings format` lead sentence, implementability paragraph and `**Checkbox discipline.**`.

**Where this task stops.** It owns these lines of `plugin/agents/skeptic-reviewer.md` only.
- **`## Read first`:**
  - the first bullet's lead line, opening `- The **already-committed end-of-branch reviews**`;
  - its sub-bullet opening `  - Anything already flagged there is OUT OF SCOPE`;
  - the conventions-document bullet's closing sentence, opening `You need them mainly to state a finding`;
  - the `<state_dir>/lessons.md` bullet;
  - the paragraph opening `**Not the documentation corpus.**`;
  - the closing clause of the `**A cited path you cannot read is a finding, not a fallback.**` paragraph.
- **`## Process`:**
  - step 1's continuation paragraph, opening `   Group the changed files into feature-area segments`;
  - steps 2, 3 and 4.
- **`## Adversarial checks (your high-yield scope)`:** the lead paragraph, opening ``Checks 1, 3 and 4 restate checks `branch-reviewer` ``.
- **`## Confidence bar (limit false-positive churn)`:**
  - the paragraph opening `Your fixes are auto-applied downstream`;
  - the paragraph opening `**Your own checklist is not downgradable.**`.
- **`## Output contract`:**
  - the paragraph opening `There are two outcomes.`;
  - the line opening `If, after the adversarial checks`;
  - the line opening `Write the split review to disk — the index plus one`;
  - the closing line opening ``(`mkdir -p` the findings folder yourself``.

It does not touch:
- the committed-review path sub-bullets;
- the docs-retrieval tool bullet;
- step 1's line and its fenced commands, or the exclusion-count sentence;
- the five checks and the closing `If a check does not apply` paragraph;
- the grading ladder, `**Guard carve-out.**` and `**Prose volume — the receiving side.**`;
- the `verdict: PASS` paragraph opening ``**`verdict: PASS` with no net-new findings is a correct outcome here``;
- any `## Findings format` line other than Task 1's;
- `## Unsolicited dispatch guidance`;
- the two `###` outcome headings and their fenced return blocks.

**Frozen text in or next to this range** stays word for word:
- the conventions-document bullet's opening run, through `Read **all** of`, and its sentence `Treat their content as authoritative; do not re-derive it from memory.`;
- the docs-retrieval tool bullet;
- in the unreadable-input paragraph, the run from its bold lead through `and write no`, and the run `Never substitute another document for a cited one, and never`;
- the exclusion-count sentence;
- in step 1's continuation, the run from `review each segment **from its diff hunks with generous context**` through `do NOT read whole changed`, and the sentence `Draft each segment's finding candidates before moving to the next.`;
- check 3's runs ``// TODO: @claude add a follow up task for this:`` and `in a doc comment rather than declared at the entry`, and check 4's Leg 2 grep run;
- the grading ladder;
- the non-downgradable paragraph's bold lead, its sentence `The rubric bounds *prose* findings; it does not relax these.` and its harness-doctrine sentence;
- `**Guard carve-out.**` and `**Prose volume — the receiving side.**` paragraphs.

The phase-gate sentence pair opening check 2 (`**Skip this check's first leg unless `phases.parity` is `true` in `harness.config.json`.**` and the sentence after it) also stays word for word.

### Targets

- `plugin/agents/skeptic-reviewer.md` → the lines named above.

**Work:**

- [ ] **`## Read first`.**
  - Replace the first bullet's lead line with `- The **already-committed end-of-branch reviews** for this branch — read these FIRST:`.
  - Replace its last sub-bullet, keeping the two-space indent, with `  - Anything already flagged there is OUT OF SCOPE unless you escalate its severity with new evidence, and say so.`.
  - In the conventions-document bullet, replace only the closing sentence `You need them mainly to state a finding in the project's own vocabulary — flagging a plain conventions violation is the other reviewers' job, not yours.` with `Use them to state a finding in the project's own vocabulary; flagging a plain conventions violation is the other reviewers' job.`.
  - Replace the lessons bullet with ``- `<state_dir>/lessons.md` — the recurring-escape ledger. Its entries are the earlier reviewers' routine checks: OUT OF SCOPE for you unless you escalate with new evidence.``.
  - Replace the paragraph opening `**Not the documentation corpus.**` with: ``**Not the documentation corpus.** Never consult a documentation digest of the code, not even navigation-only: your evidence is the code and the cited source, first-hand. The one exception is the docs-retrieval search tool above — use a result's `path#heading` **only as a locator** for where to start reading the code, and never read a snippet as a claim about it.``
  - In the unreadable-input paragraph, delete only the closing clause ` — a substitute is precisely the trusted intermediary this file exists to distrust`, so its last sentence ends `and never proceed from a remembered one.`.
- [ ] **`## Process` and the checks' lead.**
  - Replace step 1's continuation paragraph, keeping its three-space indent, with: ``   Group the changed files into feature-area segments and review each segment **from its diff hunks with generous context** (`git diff -U15 <default_branch>...HEAD -- <segment files>`), escalating to a targeted `Read` (offset/limit around a hunk) only where a hunk cannot be judged alone — do NOT read whole changed files; pre-existing large files are read only at the relevant ranges. Review first-hand; never delegate. Draft each segment's finding candidates before moving to the next. This hunk rule covers the changed project files only: check 1 reads *callers* wherever they live, and check 2, when the parity phase is on, reads the corresponding `<reference_impl>` method end to end.``
  - Replace step 2 with: ``2. **Read the task prompt** (`<state_dir>/task_prompts/<branch>_task_prompt.md`) and the **story index** (`<state_dir>/story_plans/<branch>_story_plan.md`) — the *claimed* spec, to verify rather than trust. Open a per-unit body at `<state_dir>/task_plans/<branch>/task_<N>_plan.md` only where that unit's claimed intent is unclear.``
  - Replace step 3 with: ``3. **Read the already-committed reviews** (`## Read first`) and list the issues they raised; skip those.``
  - Replace step 4 with: `4. **Run the adversarial checks below.** Prove every defect you assert from the code: the exact site anchor and the exact reason it is reachable or wrong.`
  - Replace the `## Adversarial checks` lead paragraph with: ``Checks 1, 3 and 4 are `branch-reviewer`'s checks too: run them yourself from first-hand evidence, never assuming its pass covered them.``
- [ ] **Confidence bar and the non-downgradable paragraph.**
  - Replace the paragraph opening `Your fixes are auto-applied downstream` with: `**Only emit a finding you have proven from the code** — your fixes are auto-applied downstream, so a false positive can introduce a regression. Prefer fewer, higher-confidence **Must Fix** / **Should Fix** items over a long speculative list; do not pad with **Nice to Have**. If you are not sure a behaviour is wrong, verify it to certainty or leave it out.`
  - Replace the whole paragraph opening `**Your own checklist is not downgradable.**` with the text below. Only its second sentence changes; it names the section instead of re-listing each check's trigger.
    ``**Your own checklist is not downgradable.** Every Must Fix trigger in `## Adversarial checks` keeps that grade. The rubric bounds *prose* findings; it does not relax these. The rubric is stated here because it is harness doctrine rather than a project convention; where the adopter's own rules document restates it (the file `layers[].conventions` names), nothing above depends on that restatement.``
- [ ] **`## Output contract`.**
  - Replace the opening paragraph with: ``There are two outcomes. Pick exactly one. On either, an optional `## Unsolicited dispatch guidance` section and a `## Questions` section owed under `## Findings format` sit **above** the fenced block; neither changes the block or causes a file to be written.``
  - Under `### 1. No net-new findings (PASS)`, replace the line opening `If, after the adversarial checks` with: `If you have no net-new finding, **do not write any file**. Return exactly:`
  - Under `### 2. Findings (FAIL)`, replace the line opening `Write the split review to disk — the index plus one` with: ``` `mkdir -p` the findings folder (the caller does not pre-create it), then write the index and one `finding_<N>.md` per finding with `Write` at absolute paths. Do not paste the bodies back. Then return exactly three lines: ```
  - Delete the closing line opening ``(`mkdir -p` the findings folder yourself`` and the blank line before it. Its PASS half is outcome 1's `do not write any file`.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home:
  - **Read first:** committed reviews read first, with their four paths and the parity and architecture conditions; already-flagged items out of scope unless escalated with new evidence, stated as such; conventions documents used for vocabulary, not conventions findings; lessons entries out of scope unless escalated; no documentation digest; the search tool as locator only, a snippet never a claim; the unreadable-input blocker in place of the verdict line, no files, no substitute, no remembered document.
  - **Process:** whole-branch diff and the exclusion count; hunks, `-U15`, targeted `Read`, no whole changed files, ranges only, first-hand, drafts per segment; checks 1 and 2 read beyond hunks; prompt and story index as claims, per-unit body only where unclear; issues already raised are skipped; every asserted defect proven with anchor and reason.
  - **Checks:** checks 1, 3 and 4 run first-hand.
  - **Confidence:** only proven findings; auto-applied, so no false positives; fewer, higher-confidence items; no Nice to Have padding; verify or leave out; every adversarial Must Fix trigger keeps its grade.
  - **Output contract:** exactly one outcome; both optional sections sit above the block and change nothing; PASS writes no file; FAIL creates the folder, writes the index and finding files with absolute paths, pastes nothing back, and returns the three lines.

  Restore anything missing in its shortest form.

**Verification:**

- The wire and anchors survive. Run `git grep -n -F -e '<literal>' -- plugin/agents/skeptic-reviewer.md` once per literal below; each run prints at least one line:
  - `<state_dir>/business_parity_branch_reviews/<branch>_parity_review.md`
  - `<state_dir>/architecture_branch_reviews/<branch>_arch_review.md`
  - `<state_dir>/architecture_reviews/<branch>/`
  - `<state_dir>/task_prompts/<branch>_task_prompt.md`
  - `<state_dir>/story_plans/<branch>_story_plan.md`
  - `<state_dir>/task_plans/<branch>/task_<N>_plan.md`
  - `git diff -U15 <default_branch>...HEAD -- <segment files>`
  - `### 1. No net-new findings (PASS)`
  - `### 2. Findings (FAIL)`
  - `verdict: PASS`
  - `verdict: FAIL`
  - `index_path: <index_path>`
  - `must_fix_count: <integer>`
  - `mkdir -p`
  - `## Questions`
  - `blocker:`
- The frozen texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `Treat their content as authoritative; do not re-derive it from memory.`, `Never substitute another document for a cited one, and never`, `review each segment **from its diff hunks with generous context**`, `finding candidates before moving to the next.`, `add a follow up task for this:`, `in a doc comment rather than declared at the entry`, `**Your own checklist is not downgradable.**`, `The rubric bounds *prose* findings; it does not relax these.`, `The rubric is stated here because it is harness doctrine rather than a project convention`, `**Guard carve-out.**`, `**Prose volume — the receiving side.**`.
- If `harness-runs/scratch/branch_review_family_check.mjs` is present (Task 1 writes it), read its output for this file. Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/skeptic-reviewer.md` as one plain foreground command; it prints no `FROZEN`, `LEAD`, `LITERAL` or `SHARED-BLOCK` line, and its last line is `PASS`. If the file is absent, the two checks above stand alone.
- `git diff -- plugin/agents/skeptic-reviewer.md` shows hunks only on the lines this task owns, and none inside the five checks, the ladder or the fenced return blocks.
- `wc -w plugin/agents/skeptic-reviewer.md`, run before the first edit and again after the last, is lower the second time.
