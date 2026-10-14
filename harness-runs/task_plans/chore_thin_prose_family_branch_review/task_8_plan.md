### Task 8 — Thin `review-plan-reviewer`'s `## What to check`, `### False positives` and `### Missed checks`

**Goal:** Cut the structural, severity and coverage checks of `plugin/agents/review-plan-reviewer.md` to direct checks stated once, dropping the rationale clauses. Every grade, trigger and literal the checks match on stays. The checks must still agree with the shapes the two review writers state after Tasks 4 and 6.

**Depends on:**
- **Task 7**, the previous edit to this file; leave its text as it left it.
- **Task 4**, which left `plugin/agents/branch-reviewer.md` → `## Output contract` as the statement of the code-review index's sections and order.
- **Task 6**, which left `plugin/agents/skeptic-reviewer.md` → `## Findings format` and `## Output contract` as the skeptic's.

This task edits neither of the two writer files; it reads them to confirm agreement.

**Where this task stops.** It owns these lines of `plugin/agents/review-plan-reviewer.md` only:
- in `## What to check`, the line opening `The review is **split**:`, the bullet opening `- Each finding under those sections is a plain `### N. Title` heading`, and the bullet opening `- There is a `## Phase 2 Readiness — Ordered Fix List` section placed`;
- in `### False positives (Must Fix)`, the bullet opening `- **Should Fix or Nice to Have items dressed up as Must Fix.**`;
- in `### Missed checks (Must Fix when applicable to the diff)`, the paragraph opening `The general rule, and the one that survives`, the paragraph opening `The per-layer triggers are the adopter's to state`, and the paragraph opening `**An unfilled table disables this half only.**`.

It does not touch:
- any heading;
- the `**Index (`review_path`):**` and `**Per-finding files (`findings_dir/finding_<N>.md`):**` labels;
- the other index and per-finding bullets, or the correspondence bullets;
- the other false-positive bullets;
- the per-layer table;
- `The remaining triggers are stack-neutral and always apply:` and its three bullets;
- `**Guard carve-out.**`;
- anything from `### Unactionable gates (Must Fix)` on, which belongs to Task 9.

**Frozen text in or next to this range** stays word for word:
- the first index bullet's `## Must Fix` / `## Should Fix` / `## Nice to Have`;
- the readiness bullet's `or one that contains no `[ ]` entries is a Must Fix.`;
- the phrase `string — the orchestrator and the committer key off it.`, which `skeptic-reviewer` shares;
- the per-finding bullet's site-anchor run and `A consumer must be able to implement the fix from this one file`;
- the test-run bullet's runs `asks for a test run the rule forbids — the configured test command, a gate script, or a test file the` and `own new or edited test file is not a finding.`;
- the phrase `Finding *headings* do NOT carry `[ ]` / `[x]` markers`;
- the phrase `is a configuration gap to close, not a licence to skip`;
- the whole `**Guard carve-out.**` paragraph.

### Targets

- `plugin/agents/review-plan-reviewer.md` → the lines named above.

**Work:**

- [ ] **`## What to check` opening and pointer bullet.**
  - Replace the line opening `The review is **split**:` with `Check both halves of the split review.`
  - Replace the bullet opening `- Each finding under those sections is a plain `### N. Title` heading` with: ``- Each finding under those sections is a plain `### N. Title` heading followed by a **one-line pointer** to its detail file (e.g., `→ [finding_3.md](<branch>_code_review/finding_3.md)`). An index that inlines a full description or fix snippet is a Should Fix.``
- [ ] **The readiness bullet.** Replace the bullet opening `- There is a `## Phase 2 Readiness — Ordered Fix List` section placed` with:
  ``- A `## Phase 2 Readiness — Ordered Fix List` section sits **immediately after the Context paragraph (before Must Fix)**, ordering fixes by recommended ship sequence (small and safe first, then layered changes, then anything requiring a deploy). The heading text MUST match that exact string — the orchestrator and the committer key off it. A missing section, a mistitled section (e.g. `## Phase 2 readiness`, `## Phase 2 Readiness appendix`), one positioned after the findings sections, or one that contains no `[ ]` entries is a Must Fix. Entries use the form `N. [ ] **Finding K** — <short title>`; a trailing `_(layer: <one or more of <layer_names>>)_` tag is **correct, not a format break**. `[ ]` markers anywhere else (sub-step bullets inside per-finding files) are informational.``
- [ ] **Severity and coverage.**
  - In the false-positives bullet opening `- **Should Fix or Nice to Have items dressed up as Must Fix.**`, delete only the closing clause `: it spends the fix loop on items that did not earn it`, so the bullet ends `Severity inflation is a finding **against the review**.`.
  - Replace the paragraph opening `The general rule, and the one that survives` with: ``**The general rule: the diff touched a layer, and no check drawn from that layer's rules appears in the review.** For each `layers[]` entry whose `path` (from `<layer_path_map>`) the diff touched, the review must show at least one finding, or an explicit clean-pass rationale, drawn from that entry's `conventions` document.``
  - Replace the paragraph opening `The per-layer triggers are the adopter's to state` with: ``The per-layer triggers are the adopter's — *replace this table with your project's*, one row per `layers[]` entry, each filled from that entry's `conventions` document with the scans it mandates (typically the wire-surface and parity scan for the layer that owns serialization, the required-test check for the layer that owns behaviour, the styling / sizing / localized-copy scan for the layer that owns presentation):``
  - Replace the paragraph opening `**An unfilled table disables this half only.**` with: `**An unfilled table disables this half only**: the general rule above and every check below still apply. An empty table is a configuration gap to close, not a licence to skip the section.`
- [ ] **Agreement with the writers.** Read `plugin/agents/branch-reviewer.md` → `## Findings format` and `## Output contract`, and `plugin/agents/skeptic-reviewer.md` → `## Findings format`, as Tasks 4 and 6 left them. Confirm that every shape your checks name still matches what both writers state:
  - the index section order;
  - the readiness heading, its position and its entry form with the optional layer tag;
  - the `### N. Title` plus one-line-pointer form;
  - no inlined descriptions or snippets;
  - the per-finding file's contents (heading, site anchor, description, concrete fix);
  - the round suffix shared by index and folder.

  Any disagreement goes in your return, naming both statements, and the stricter one is kept. Do not edit the writer files.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home:
  - **Pointer bullet:** both halves are checked; the pointer form and its example; an inlined description or snippet is a Should Fix.
  - **Readiness bullet:** its position and its ship-order sort; the exact heading and why it matters; the four Must Fix conditions with the two mistitle examples; the entry form; the layer tag is correct; other `[ ]` markers are informational.
  - **Severity:** the three Must Fix classes; severity inflation is a finding against the review.
  - **Coverage:** the general per-layer rule with its clean-pass alternative; the adopter table and its three typical scans; an unfilled table disables only that half and is a gap, not a licence.

  Restore anything missing in its shortest form.

**Verification:**

- The wire and anchors survive. Run `git grep -n -F -e '<literal>' -- plugin/agents/review-plan-reviewer.md` once per literal below; each run prints at least one line:
  - `## What to check`
  - `### False positives (Must Fix)`
  - `### Missed checks (Must Fix when applicable to the diff)`
  - `## Phase 2 Readiness — Ordered Fix List`
  - `` `## Phase 2 readiness` ``
  - `` `## Phase 2 Readiness appendix` ``
  - `N. [ ] **Finding K** — <short title>`
  - `_(layer: <one or more of <layer_names>>)_`
  - `→ [finding_3.md](<branch>_code_review/finding_3.md)`
  - `` `<branch>_code_review_2.md` ↔ `<branch>_code_review_2/` ``
  - `**Deviations from plan:**`
  - `## The test-run rule`
  - `*replace this table with your project's*`
- The frozen texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `or one that contains no `[ ]` entries is a Must Fix.`, `A consumer must be able to implement the fix from this one file`, `own new or edited test file is not a finding.`, `a gate script, or a test file the`, `is a configuration gap to close, not a licence to skip`, `**Guard carve-out.**`.
- If `harness-runs/scratch/branch_review_family_check.mjs` is present (Task 1 writes it), read its output for this file. Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/review-plan-reviewer.md` as one plain foreground command; it prints no `FROZEN`, `LEAD` or `LITERAL` line, and its last line is `PASS`. If the file is absent, the two checks above stand alone.
- `git diff --name-only` lists no change to `plugin/agents/branch-reviewer.md` or `plugin/agents/skeptic-reviewer.md` made by this task, and `git diff -- plugin/agents/review-plan-reviewer.md` shows hunks only on the lines this task owns.
- `wc -w plugin/agents/review-plan-reviewer.md`, run before the first edit and again after the last, is lower the second time.
