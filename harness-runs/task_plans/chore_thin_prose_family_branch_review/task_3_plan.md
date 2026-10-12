### Task 3 — Thin `branch-reviewer`'s `## Process`: Pass 1, Pass 0 and Pass 2

**Goal:** Cut `## Process` in `plugin/agents/branch-reviewer.md` to direct steps stated once. That means dropping the rationale sentences and the restatements of rules this file or its `## Resolved values` already states. Every step, command, edge case and Must Fix trigger the reviewer acts on stays.

**Depends on:** Task 2, the previous edit to this file; through it, Task 1. Leave their text as they left it.

**Where this task stops.** It owns `## Process` in `plugin/agents/branch-reviewer.md` — `### Pass 1 — Independent review (always)`, `### Pass 0 — the deterministic sweep` and `### Pass 2 — Reconcile with per-unit findings (two-pass mode only)` — and changes only the lines the Work bullets name. It does not touch:
- the three headings;
- the fenced `git diff` commands of step 1 and Pass 0;
- the sentence `Report that count in your index's Context paragraph as: "N run-artifact files excluded from the reviewed diff."`;
- step 5, the paragraph opening `5. **Cross-check business logic against `<reference_impl>`**`, which the research keeps whole as the parity standard;
- step 6 and step 7;
- the Pass 0 opening line `Two halves, both run before any judgment reading, and both over the **added lines only**.`;
- the escape-class table, its header cell `Regex — *replace with your project's*` included;
- the Pass 2 lead line opening `Run this only if `per_task_findings_root` was supplied.`.

The headings must not change: `plugin/agents/layer-reviewer.md` cites `branch-reviewer`'s Pass 2, and this file's own text cites `### Pass 0` and `## Common findings to look for`.

**Frozen text in this range** stays word for word:
- the exclusion-count sentence above;
- in step 5, the bold lead `**Cross-check business logic against `<reference_impl>`**` and the run from `**open the cited file and confirm the citation is real and says what is claimed**` through `or a justification buried in a doc`.

The bold lead `**Read the task prompt**` also stays: `skeptic-reviewer` carries it.

### Targets

- `plugin/agents/branch-reviewer.md` → `## Process` (the lines named below).

**Work:**

- [ ] **Pass 1 opening and steps 1–3.**
  - Replace `Do this **without looking at any per-unit review file**. Your judgment must be uncontaminated by what the layer reviewers already flagged.` with `Do this **without looking at any per-unit review file**.`
  - Replace step 1's paragraph opening `   Group the changed files into **feature-area segments**` (keep its three-space indent) with: `   Group the changed files into **feature-area segments** — one feature's page with its unit-local state and components, or one layer's slice with its tests — and review segment by segment.`
  - Replace step 2 with: ``2. **Read the task prompt** at `<state_dir>/task_prompts/<branch>_task_prompt.md` and the **story index** at `<state_dir>/story_plans/<branch>_story_plan.md` — its `## Context` and its `## Phase 2 Readiness — Ordered Fix List` — for what the diff is *trying* to accomplish. Open a per-unit body at `<state_dir>/task_plans/<branch>/task_<N>_plan.md` only where that unit's intent is unclear.``
  - Replace step 3 with: ``3. **Run the mechanical sweep (Pass 0)** — `### Pass 0 — the deterministic sweep` — before any judgment reading.``
- [ ] **Step 4.** Replace it with: ``4. **Review segment by segment from the diff, not from full files.** Read each segment's hunks with generous context (`git diff -U15 <default_branch>...HEAD -- <segment files>`); escalate to a targeted `Read` (offset/limit around the hunk) only where a hunk cannot be judged alone. Never read whole changed files: new files arrive whole in the diff, and pre-existing large files are read only at the relevant ranges. Review first-hand — never delegate reading to sub-agents. **Write down the segment's finding drafts (title, site anchor, severity, one-line description) before moving to the next segment.**``
- [ ] **Pass 0, half (a) and its prose.**
  - Replace the paragraph opening `**(a) The grep sweep.**` with: ``**(a) The grep sweep.** Each hit is a finding *candidate to verify in context*, **never an automatic finding**: the file that owns the styling tokens legitimately holds styling literals, test-attribute locator values are exempt from the localized-copy rule, and a test fixture may inline a constant. Verify every hit against the owning layer's conventions document before it becomes a finding.``
  - Replace the paragraph opening ``Scope it to **every** layer path, not to `<app_dir>` `` with: ``Scope it to **every** layer path, never to `<app_dir>`: a layer dropped from the pathspec sweeps as clean. Where a layer's path is the repository root (`.`), keep step 1's `':(top,exclude)<state_dir>/…'` exclusions on the command.`` That paths resolve against `<repo_root>` is the `<repo_root>` / `<app_dir>` row's rule.
  - Replace the paragraph opening `The sweep list below is a **stub, and it is expected to be edited**` with: ``The sweep list below is a **stub, to be edited**: the escape *classes* transfer between stacks, the regexes do not. Fill each `Regex` cell with the pattern that catches its class in `<impl_stack>`, matching the mandated symbol the owning layer's `layers[].conventions` document names (`<convention_symbols>`), never a remembered spelling. One row per escape class; add a row when `<state_dir>/lessons.md` records a new one.``
  - Replace the paragraph opening `**An empty sweep list disables this half only.**` with: ``**An empty sweep list disables this half only.** Half (b) and the whole of `## Common findings to look for` still run; an empty list is a configuration gap to close, not a licence to skip Pass 0.``
- [ ] **Pass 0 half (b), and Pass 2.**
  - In the paragraph opening `**(b) The new-exported-symbol caller check`, delete only the clause ` — the same set the symbols were enumerated over` (with its leading space and dash), so the sentence ends `for a call site **outside its defining file**.`. The next sentence already requires the search to cover every layer path.
  - Replace Pass 2 step 1 with: ``1. **Enumerate per-unit findings.** In each `task_<N>/` subfolder, the highest-numbered `review_*.md` is that unit's latest `layer-reviewer` verdict; ignore earlier iterations.``
  - Replace step 2 with: ``2. **Extract carry-over candidates:** every **Should Fix** and **Nice to Have** item in each latest `review_*.md` (Must Fix items were resolved before commit).``
  - Under step 3, replace the three outcome bullets, keeping their three-space indent:
    - ``   - **Already covered:** Pass 1 flagged the same root issue (the same site anchor, or the same systemic problem elsewhere). Skip.``
    - ``   - **Stale:** the issue no longer applies in the current diff (a later unit refactored the code away, or the component was deleted). Skip.``
    - ``   - **Real and missed:** the issue still exists and Pass 1 missed it. Add it as a new finding — a new `finding_<N>.md` detail file, a new `### N. Title` pointer in the right index section, and a new `## Phase 2 Readiness — Ordered Fix List` entry — and **drop any per-unit attribution**: every item is branch-level now.``
  - Replace step 4 with: `4. **Do not promote category.** A Should Fix carried over from a per-unit review stays a Should Fix, never a Must Fix.`
- [ ] **Rule inventory before saving.** Read the old and new `## Process` side by side and confirm each of these still has a home:
  - **Pass 1:** no per-unit file in Pass 1; the run-artifact count line; segmenting and reviewing per segment; reading the prompt and the story index (Context and readiness list), and the per-unit body only where unclear; Pass 0 before judgment reading; hunks with `-U15`, targeted `Read` only where needed, no whole changed files, first-hand, drafts per segment; step 5 unchanged; steps 6 and 7 unchanged.
  - **Pass 0:** both halves on added lines only; hits are candidates and the three exemptions; every layer path never `<app_dir>`, and the root-layer exclusions; the stub rule and lessons-driven rows; an empty list disables only half (a); half (b) always runs, with its Must Fix trigger and the every-layer-path condition.
  - **Pass 2:** only with `per_task_findings_root`, the conventional root, use the passed value; latest `review_*.md` per unit; Should Fix and Nice to Have only; the three outcomes and the three artifacts a carried item creates; per-unit attribution dropped; no promotion.

  Restore anything missing in its shortest form.

**Verification:**

- The wire and anchors survive. Run `git grep -n -F -e '<literal>' -- plugin/agents/branch-reviewer.md` once per literal below; each run prints at least one line:
  - `### Pass 1 — Independent review (always)`
  - `### Pass 0 — the deterministic sweep`
  - `### Pass 2 — Reconcile with per-unit findings (two-pass mode only)`
  - `git diff -U15 <default_branch>...HEAD -- <segment files>`
  - `--unified=0 -- <every layers[].path scope of <layer_path_map>>`
  - `^\+<the export declaration form>`
  - `<state_dir>/task_plan_point_reviews/<branch>_task_plan/`
  - `<state_dir>/task_prompts/<branch>_task_prompt.md`
  - `<state_dir>/story_plans/<branch>_story_plan.md`
  - `<state_dir>/task_plans/<branch>/task_<N>_plan.md`
  - `run-artifact files excluded from the reviewed diff.`
  - `**Zero callers = an un-wired / dead feature → Must Fix**`
  - `Regex — *replace with your project`
- The frozen texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `files excluded from the reviewed diff.`, `**Cross-check business logic against `, `a fabricated or miscited reference (for example`, `**Read the task prompt**`, `is a configuration gap to close, not a licence to skip`, `a search narrowed to one directory grades a wired feature dead.`.
- If `harness-runs/scratch/branch_review_family_check.mjs` is present (Task 1 writes it), read its output for this file. Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/branch-reviewer.md` as one plain foreground command; it prints no `FROZEN`, `LEAD` or `LITERAL` line, and its last line is `PASS`. If the file is absent, the two checks above stand alone.
- `git diff -- plugin/agents/branch-reviewer.md` shows hunks only inside `## Process`, and none in step 5, step 6, step 7, the fenced commands or the escape-class table.
- `wc -w plugin/agents/branch-reviewer.md`, run before the first edit and again after the last, is lower the second time.
