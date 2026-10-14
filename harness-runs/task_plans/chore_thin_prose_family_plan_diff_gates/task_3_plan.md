### Task 3 — Thin both definitions' `## Scope boundary`, `## Output contract` and `## Findings-folder / index-path convention`

**Goal:** Cut the scope-boundary prose, the output-contract prose and the findings-folder section of `plugin/agents/architecture-reviewer.md` and `plugin/agents/business-parity-reviewer.md` to direct rules stated once. The shared lines end identical in both files. The following stay exactly as they are:
- every return block, the flat findings template and the readiness-section bullet;
- the PASS no-write rule and `business-parity-reviewer`'s disabled-phase reason line;
- every conventional path.

**Depends on:** Task 2, which leaves `## Invocation contract`'s `index_path` row reading *"The caller supplies it; you never hardcode it."*. R24–R29 rely on that row when they replace the findings-folder section's two "do not hardcode" sentences with one lead, `You write to the paths the caller passes.`. Task 1 wrote `harness-runs/scratch/plan_diff_gates_family_check.mjs`, which this task runs.

**Where this task stops.** It owns, in both files:
- `## Scope boundary (avoid overlap with the sibling reviewers)` below its heading and lens sentence;
- `## Output contract` and its subsections;
- `## Findings-folder / index-path convention`.

It does not touch:
- the heading lines;
- each scope boundary's `Your lens is …` sentence;
- the fenced `verdict: PASS`, flat-template and `verdict: FAIL` blocks, line for line;
- the readiness-section bullet starting `- A `## Phase 2 Readiness — Ordered Fix List` section`;
- the `- A **`## Context`**` bullet and the `**(a) The index**` line;
- the closing paragraph `An optional `## Unsolicited dispatch guidance` section precedes whichever fixed return applies and changes nothing in it.`;
- `## Unsolicited dispatch guidance` and everything above `## Scope boundary`, which belongs to Tasks 1, 2, 4, 5 and 6.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `6307573a`, sometimes only part of a line. Replace exactly that substring; a deletion takes the space or blank line its R-entry names. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the whole readiness-section bullet, from `## Phase 2 Readiness — Ordered Fix List` section — **required, present, numbered**` to `that you did not author.`;
- the `## Must Fix` / `## Should Fix` / `## Nice to Have` bullet's runs through `e.g. `→`;
- in each `**(b) One self-contained `finding_<N>.md` per finding**` paragraph:
  - the site-anchor definition, from `the site anchor (the repo-relative path` to `and nothing depends on it)`;
  - the sentence `A consumer must be able to implement the fix from this one file alone.`;
  - the run `Sub-step `- [ ]` bullets inside a finding body are`;
- the closing paragraph `An optional `## Unsolicited dispatch guidance` section precedes whichever fixed return applies and changes nothing in it.`

Bold leads stay as they are:
- `**Styling and presentation conventions**`, `**Business-logic parity with `<reference_impl>`**` and `**Layer placement and dependency direction**`;
- `**Sub-case (a)**`, `**Sub-case (b)**` and `**Sub-case (c)**`;
- `**<title>**`, `**Fix:**`, `**(a) The index**` and `**(b) One self-contained `finding_<N>.md` per finding**`;
- the three or four `**Plan-review mode, insertion point …**` / `**Implemented-solution mode, insertion point 2 (branch diff):**` leads of the findings-folder list.

**Wire this task keeps:**
- `verdict: PASS` / `verdict: FAIL`, `findings_file: <full_path>` and `must_fix_count: <N>`;
- `Nothing else. Do not write any file when PASS.`;
- `Only **Must Fix** triggers another upstream iteration.` and `Keep the return to those 3 lines.`;
- `mkdir -p <findings_folder>` and `<findings_folder>/review_{iteration}.md`;
- each `# … review — iteration {iteration}` title;
- each `→ [finding_3.md](<branch>_…_review/finding_3.md)` pointer example;
- every conventional path in the findings-folder list;
- each `${CLAUDE_PLUGIN_ROOT}/agents/…` citation in the scope boundary.

### Targets

- `plugin/agents/architecture-reviewer.md` → `## Scope boundary`, `## Output contract` and `## Findings-folder / index-path convention`, as bounded above.
- `plugin/agents/business-parity-reviewer.md` → the same.

**Work:**

- [ ] **`## Scope boundary`.** Apply R1–R6.
  - Each sibling-lens bullet names its owner after a colon instead of a separate `That is …` sentence. `architecture-reviewer`'s parity bullet keeps both citations and the `phases.parity` gate.
  - The "If you happen to spot …" sentence becomes "… is at most a **Should Fix**." A Should Fix never triggers another iteration, so "must NOT block" is already its meaning.
  - The bold `**Only … are Must Fix.**` sentence stays unchanged.
- [ ] **Return intro, clean review and plan-review FAIL.** Apply R7–R15.
  - The intro drops its rationale.
  - `business-parity-reviewer`'s disabled-phase parenthetical becomes one sentence that keeps the reason line after the verdict line.
  - The consumer sentence drops "exactly like …".
  - Each sub-case bullet keeps only its consumer and "in revision mode". The flat template's first Must Fix line already names the offending files.
  - The `mkdir` sentence drops "(the caller does not pre-create it)". `## Invocation contract`'s frozen findings-folder paragraph states that.
- [ ] **Implemented-solution FAIL and return lines.** Apply R16–R23.
  - The consumer sentence keeps "per-item fix loop", "split index", "in the shape `branch-reviewer` emits" and "NOT a flat findings file". It drops the committer mechanics and the insertion-point parenthetical, which the subsection headings already state.
  - The sub-step sentence keeps "permitted" and "the committer ignores them".
  - The compatibility paragraph goes. It is rationale, and the hardcode rule lives in the `index_path` row and the findings-folder lead.
  - The `findings_file:` sentence drops its parenthetical.
- [ ] **`## Findings-folder / index-path convention`.** Apply R24–R29.
  - The lead becomes `You write to the paths the caller passes. Conventionally:`.
  - The insertion-point-3 bullet loses its "reviews a *plan*" sentence, which the heading `### Plan-review mode FAIL` already settles.
  - The closing "do not hardcode" paragraph goes. Every path and bullet lead stays.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - **Scope:**
    - each sibling lens, its owner and its citation;
    - parity is gated by `phases.parity` and is never this reviewer's;
    - the styling lens per layer, and `branch-reviewer`'s at end of branch;
    - a sibling-lens issue is at most a Should Fix;
    - the exact Must Fix set.
  - **Output:**
    - the shared return lines and the per-mode file;
    - PASS is exactly `verdict: PASS`, writes no file, and in `business-parity-reviewer` carries the disabled-phase reason line after the verdict;
    - plan-review FAIL goes to the upstream writer as a flat file, with each sub-case's consumer and revision mode, `mkdir -p` and then `Write` to `review_{iteration}.md`;
    - implemented FAIL goes to a per-item fix loop as a split index in `branch-reviewer`'s shape, never a flat file, written with `Write` at absolute paths after `mkdir -p`;
    - the index's sections, and a per-finding file self-contained;
    - sub-step bullets permitted and ignored by the committer;
    - `findings_file:` per mode, Must Fix as the only iteration trigger, and three return lines;
    - an optional guidance section above the return.
  - **Paths:** written where the caller says, and each conventional path by insertion point.

### Replacements

**R1** — `plugin/agents/architecture-reviewer.md`: replace

```text
stated in `<parity_vocabulary>` terms. That is `business-parity-reviewer`'s job (`${CLAUDE_PLUGIN_ROOT}/agents/business-parity-reviewer.md`) and, at end-of-branch, `branch-reviewer`'s (`${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`). It applies only when `phases.parity` is `true`; either way it is not yours.
```

with

```text
stated in `<parity_vocabulary>` terms: `business-parity-reviewer`'s job (`${CLAUDE_PLUGIN_ROOT}/agents/business-parity-reviewer.md`) and, at end-of-branch, `branch-reviewer`'s (`${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`), and only when `phases.parity` is `true`. Never yours.
```

**R2** — `plugin/agents/business-parity-reviewer.md`: replace

```text
which direction imports may cross a boundary. That is `architecture-reviewer`'s job
```

with

```text
which direction imports may cross a boundary: `architecture-reviewer`'s job
```

**R3** — `plugin/agents/architecture-reviewer.md`: replace

```text
test-attribute locators. That is `layer-reviewer`'s job
```

with

```text
test-attribute locators: `layer-reviewer`'s job
```

**R4** — `plugin/agents/business-parity-reviewer.md`: replace

```text
test-attribute locators. That is `layer-reviewer`'s job
```

with

```text
test-attribute locators: `layer-reviewer`'s job
```

**R5** — `plugin/agents/architecture-reviewer.md`: replace

```text
If you happen to spot a parity or styling issue, you MAY note it as a **Should Fix** but must NOT block on it.
```

with

```text
A parity or styling issue you spot is at most a **Should Fix**.
```

**R6** — `plugin/agents/business-parity-reviewer.md`: replace

```text
If you happen to spot an architecture or styling issue, you MAY note it as a **Should Fix** but must NOT block on it.
```

with

```text
An architecture or styling issue you spot is at most a **Should Fix**.
```

**R7** — `plugin/agents/architecture-reviewer.md`: replace

```text
Both modes share the clean-review return line and the FAIL return lines, but they differ in **what file they write**, because their downstream consumers differ.
```

with

```text
Both modes share the return lines; they differ in **what file they write**.
```

**R8** — `plugin/agents/business-parity-reviewer.md`: replace

```text
Both modes share the clean-review return line and the FAIL return lines, but they differ in **what file they write**, because their downstream consumers differ.
```

with

```text
Both modes share the return lines; they differ in **what file they write**.
```

**R9** — `plugin/agents/business-parity-reviewer.md`: replace

```text
Nothing else. Do not write any file when PASS. (The one addition permitted is the disabled-phase reason line described at the top of this file, which follows the byte-exact verdict line and still writes nothing.)
```

with

```text
Nothing else. Do not write any file when PASS. The one addition, after the verdict line, is the disabled-phase reason line the top of this file describes.
```

**R10** — `plugin/agents/architecture-reviewer.md`: replace

```text
The consumer is the upstream writer, re-dispatched with a **flat findings file**, exactly like `task-plan-reviewer`:
```

with

```text
The upstream writer is re-dispatched with a **flat findings file**:
```

**R11** — `plugin/agents/business-parity-reviewer.md`: replace

```text
The consumer is the upstream writer, re-dispatched with a **flat findings file**, exactly like `architecture-reviewer` in plan-review mode:
```

with

```text
The upstream writer is re-dispatched with a **flat findings file**:
```

**R12** — `plugin/agents/architecture-reviewer.md`: replace these three lines

```text
- **Sub-case (a)** → the consumer is `task-plan-writer`. Offending files named in the findings are the plan index (`<branch>_story_plan.md`) or a detail file (`task_<N>_plan.md`).
- **Sub-case (b)** → the consumer is `user-review-fix-plan-writer` in revision mode. Offending files named in the findings are the fix-plan index (`<branch>_fix_plan.md`) or a per-finding file (`finding_<N>.md`).
- **Sub-case (c)** → the consumer is `test-fix-plan-writer` in revision mode. Offending files named in the findings are the test fix plan index or a per-finding file (`finding_<N>.md`).
```

with

```text
- **Sub-case (a)** → `task-plan-writer`.
- **Sub-case (b)** → `user-review-fix-plan-writer`, in revision mode.
- **Sub-case (c)** → `test-fix-plan-writer`, in revision mode.
```

**R13** — `plugin/agents/business-parity-reviewer.md`: replace these two lines

```text
- **Sub-case (a)** → the consumer is `task-plan-writer`. Offending files named in the findings are the plan index (`<branch>_story_plan.md`) or a detail file (`task_<N>_plan.md`).
- **Sub-case (b)** → the consumer is `user-review-fix-plan-writer` in revision mode. Offending files named in the findings are the fix-plan index (`<branch>_fix_plan.md`) or a per-finding file (`finding_<N>.md`).
```

with

```text
- **Sub-case (a)** → `task-plan-writer`.
- **Sub-case (b)** → `user-review-fix-plan-writer`, in revision mode.
```

**R14** — `plugin/agents/architecture-reviewer.md`: replace

```text
Run `mkdir -p <findings_folder>` (the caller does not pre-create it), then `Write` a flat findings file to `<findings_folder>/review_{iteration}.md` in this format:
```

with

```text
Run `mkdir -p <findings_folder>`, then `Write` `<findings_folder>/review_{iteration}.md` in this format:
```

**R15** — `plugin/agents/business-parity-reviewer.md`: replace

```text
Run `mkdir -p <findings_folder>` (the caller does not pre-create it), then `Write` a flat findings file to `<findings_folder>/review_{iteration}.md` in this format:
```

with

```text
Run `mkdir -p <findings_folder>`, then `Write` `<findings_folder>/review_{iteration}.md` in this format:
```

**R16** — `plugin/agents/architecture-reviewer.md`: replace

```text
The consumer is a **per-item fix loop** driven by the orchestrator and the `committer`'s `mode: review_item` checkbox flip, so the output MUST be a **split index** mirroring the split shape `branch-reviewer` emits — NOT a flat findings file. (This split-index output serves insertion point 2 only; insertion points 3 and 4 are plan-review mode and write the flat file above.) Write
```

with

```text
The consumer is a **per-item fix loop**, so write a **split index** in the shape `branch-reviewer` emits — NOT a flat findings file. Write
```

**R17** — `plugin/agents/business-parity-reviewer.md`: replace

```text
The consumer is a **per-item fix loop** driven by the orchestrator and the `committer`'s `mode: review_item` checkbox flip, so the output MUST be a **split index** mirroring the split shape `branch-reviewer` emits — NOT a flat findings file. (This split-index output serves insertion point 2 only; insertion point 3 is plan-review mode and writes the flat file above.) Write
```

with

```text
The consumer is a **per-item fix loop**, so write a **split index** in the shape `branch-reviewer` emits — NOT a flat findings file. Write
```

**R18** — `plugin/agents/architecture-reviewer.md`: replace

```text
Sub-step `- [ ]` bullets inside a finding body are permitted — informational, and the committer ignores them; only the index's Phase 2 Readiness checkboxes are the iteration source.
```

with

```text
Sub-step `- [ ]` bullets inside a finding body are permitted; the committer ignores them.
```

**R19** — `plugin/agents/business-parity-reviewer.md`: replace

```text
Sub-step `- [ ]` bullets inside a finding body are permitted — informational, and the committer ignores them; only the index's Phase 2 Readiness checkboxes are the iteration source.
```

with

```text
Sub-step `- [ ]` bullets inside a finding body are permitted; the committer ignores them.
```

**R20** — `plugin/agents/architecture-reviewer.md`: delete this whole paragraph, together with the blank line above it.

```text
Because the index uses the byte-identical `## Phase 2 Readiness — Ordered Fix List` heading and the same `### N. Title` plus `finding_<N>.md` split that `branch-reviewer` emits for the code review under `<state_dir>/code_reviews/`, the `committer`'s `mode: review_item` flip and the per-item fix loop treat the architecture index exactly like the code-review index — no modification needed. You do not hardcode the index path or the per-finding folder: you write to whatever `index_path` and `findings_folder` the caller passes.
```

**R21** — `plugin/agents/business-parity-reviewer.md`: delete this whole paragraph, together with the blank line above it.

```text
Because the index uses the byte-identical `## Phase 2 Readiness — Ordered Fix List` heading and the same `### N. Title` plus `finding_<N>.md` split that `branch-reviewer` emits for the code review under `<state_dir>/code_reviews/`, the `committer`'s `mode: review_item` flip and the per-item fix loop treat the parity index exactly like the code-review index — no modification needed. You do not hardcode the index path or the per-finding folder: you write to whatever `index_path` and `findings_folder` the caller passes.
```

**R22** — `plugin/agents/architecture-reviewer.md`: replace

```text
`findings_file:` is the flat `review_{iteration}.md` in plan-review mode, and the **index** path in implemented-solution mode (the fix loop's readiness source).
```

with

```text
`findings_file:` is the flat `review_{iteration}.md` in plan-review mode and the **index** path in implemented-solution mode.
```

**R23** — `plugin/agents/business-parity-reviewer.md`: replace

```text
`findings_file:` is the flat `review_{iteration}.md` in plan-review mode, and the **index** path in implemented-solution mode (the fix loop's readiness source).
```

with

```text
`findings_file:` is the flat `review_{iteration}.md` in plan-review mode and the **index** path in implemented-solution mode.
```

**R24** — `plugin/agents/architecture-reviewer.md`: replace

```text
The caller passes the paths and you write to whatever you are given. The conventional paths are documented here so the wiring stays consistent, and they follow the `<state_dir>` directory names the tree is generated with:
```

with

```text
You write to the paths the caller passes. Conventionally:
```

**R25** — `plugin/agents/business-parity-reviewer.md`: replace

```text
The caller passes the paths and you write to whatever you are given. The conventional paths are documented here so the wiring stays consistent; they follow the `<state_dir>` directory names the tree is generated with, and they are deliberately **distinct from** `architecture-reviewer`'s folders so the two reviewers never collide:
```

with

```text
You write to the paths the caller passes. Conventionally:
```

**R26** — `plugin/agents/architecture-reviewer.md`: delete this sentence (at the end of the insertion-point-3 bullet), together with the one space before it. The rest of the bullet stays.

```text
This point reviews a *plan*, so it uses the flat plan-review shape — not a split index.
```

**R27** — `plugin/agents/business-parity-reviewer.md`: delete this sentence (at the end of the insertion-point-3 bullet), together with the one space before it. The rest of the bullet stays.

```text
This point reviews a *plan*, so it uses the flat plan-review shape — not a split index.
```

**R28** — `plugin/agents/architecture-reviewer.md`: delete this whole paragraph (the file's last), together with the blank line above it.

```text
You do not hardcode any of these — you write to the `index_path` and `findings_folder` the caller supplies.
```

**R29** — `plugin/agents/business-parity-reviewer.md`: delete this whole paragraph (the file's last), together with the blank line above it.

```text
You do not hardcode any of these — you write to the `index_path` and `findings_folder` the caller supplies.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/plan_diff_gates_family_check.mjs plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` as one plain foreground command.
  - Its last line is `PASS`. It prints no `FROZEN`, `LEAD`, `PAIR-LEAD`, `LITERAL`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER` line.
  - It prints no `SHARED-PENDING` line at all: Tasks 1 and 2 wrote the other shared lines, and this task writes the rest.
- The wire survives. Run `git grep -c -F -e '<literal>' -- plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` once per literal below; each run prints a count of at least 1 for both files:
  - `Nothing else. Do not write any file when PASS.`
  - `Only **Must Fix** triggers another upstream iteration.`
  - `Keep the return to those 3 lines.`
  - `must_fix_count: <N>`
  - `mkdir -p <findings_folder>`
  - `<findings_folder>/review_{iteration}.md`
  - `## Phase 2 Readiness — Ordered Fix List`
  - `**Only `
  - `in revision mode`
- The conventional paths survive. `git grep -n -F -e '<path>'` finds each path in its own file:
  - in `plugin/agents/architecture-reviewer.md`: `<state_dir>/architecture_reviews/<branch>/review_{iteration}.md`, `<state_dir>/architecture_branch_reviews/<branch>_arch_review.md`, `<state_dir>/architecture_user_review_reviews/<branch>/review_{iteration}.md`, `<state_dir>/test_fix_plan_reviews/<branch>_<gate_key>_round_<gate_round>/`;
  - in `plugin/agents/business-parity-reviewer.md`: `<state_dir>/business_parity_reviews/<branch>/review_{iteration}.md`, `<state_dir>/business_parity_branch_reviews/<branch>_parity_review.md`, `<state_dir>/business_parity_user_review_reviews/<branch>/review_{iteration}.md`, and `disabled-phase reason line`.
- The cross-family texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `6307573a` (`git grep -l -F -e '<string>' 6307573a -- plugin/agents`). Compare the two lists with the `6307573a:` prefix removed; they must match.
  - Do this for each string: `**This list is the single source of truth for the per-item fix loop**`, `Binding on you as the author: you write every entry at`, `A consumer must be able to implement the fix from this one file alone.`, `section precedes whichever fixed return applies and changes nothing in it.`.
- `git diff -- plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` shows hunks only below each `## Scope boundary` heading, and no line inside a fenced block changes.
- `wc -w plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md`, run before the first edit and again after the last, is lower for each file the second time.
