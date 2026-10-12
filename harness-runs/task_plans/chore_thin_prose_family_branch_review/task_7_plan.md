### Task 7 — Thin `review-plan-reviewer`'s intro, `## Invocation contract`, `## Read first` and `## Process`

**Goal:** Cut the first half of `plugin/agents/review-plan-reviewer.md` to direct rules stated once. That covers the role sentence, the two-families paragraph, two key-table cells that restate `## What to check`, the downstream paragraph, the fixture-precedence bullet, the conventions bullet's own sentences and the process steps. The index-agnostic rule, the fixture-precedence exception and every dispatch key stay.

**Where this task stops.** It owns these parts of `plugin/agents/review-plan-reviewer.md` only:
- the role paragraph opening `You are the **Review Plan Reviewer**.`;
- the paragraph opening `**One agent, two review families.**`;
- in `## Invocation contract`, the `review_path` and `findings_dir` rows and the paragraph opening `Downstream, the index you bless`;
- in `## Read first`, the samples bullet and the middle sentences of the conventions-document bullet;
- in `## Process`, steps 1 and 3.

It does not touch:
- the frontmatter;
- the paragraph opening `**You report findings. You do not edit the review file.**`;
- `## Resolved values`, which is wholly frozen;
- the lead sentence opening `You are dispatched from`, the two phase lines above the fenced blocks, or the two fenced five-key blocks;
- the `plan_path`, `findings_folder` and `iteration` rows;
- the paragraphs opening ``**You create `<findings_folder>` yourself`` and `**Your return is parsed, not read.**`;
- the lessons bullet, the docs-retrieval tool bullet or the unreadable-input paragraph;
- `## Process` steps 2 and 4;
- anything from `## What to check` on, which belongs to Tasks 8 and 9.

**Frozen text in or next to this range** stays word for word:
- the run `Your `tools:` allowlist carries no `Edit`, … The only file you write is your own findings file.`;
- the whole `## Resolved values` preamble and table;
- the key-table header and separator;
- `## Must Fix` / `## Should Fix` / `## Nice to Have`, which the `review_path` row loses but `## What to check`'s first bullet keeps;
- the `findings_folder` row's opening `Where your own findings go: `<findings_folder>/review_{iteration}.md`.`;
- the `iteration` row;
- both runs in the findings-folder paragraph and both runs in the return paragraph;
- the conventions-document bullet's opening run through `Read **all** of`, and its sentence `Treat their content as authoritative; do not re-derive it from memory.`;
- the docs-retrieval tool bullet;
- the unreadable-input paragraph.

### Targets

- `plugin/agents/review-plan-reviewer.md` → the parts named above.

**Work:**

- [ ] **Intro.**
  - Replace the role paragraph with: ``You are the **Review Plan Reviewer**. You meta-review a **split review** — a thin index plus one self-contained `finding_<N>.md` per finding — *before* the fix loop implements it, and catch the review's own mistakes: false positives, scope creep, missed checks, severity inflation, and format breaks that would strand the loop with no error message.``
  - Replace the paragraph opening `**One agent, two review families.**` with: ``**One agent, two review families.** You meta-review the code review `branch-reviewer` writes and the adversarial review `skeptic-reviewer` writes — one split format; `review_path` and `findings_dir` tell you which you hold. **Stay index-agnostic**: never assume a fixed path or a filename stem, never default to one family when an argument looks unfamiliar, and never name one family's author in a finding you raise against the other's.``
- [ ] **`## Invocation contract`.**
  - Replace the `review_path` row with: ``| `review_path` | The review **index** file. Conventionally `<state_dir>/code_reviews/<branch>_code_review.md` or `<state_dir>/skeptic_reviews/<branch>_skeptic_review.md`, with a round suffix `_2`, `_3`, … on a re-review — but you use the value the caller passed. |`` The index's section order is `## What to check`'s first bullet.
  - Replace the `findings_dir` row with: ``| `findings_dir` | The per-finding detail folder, named after the index's round suffix (`<branch>_code_review_2/` beside `<branch>_code_review_2.md`); every `### N. Title` pointer in the index resolves to a `finding_<N>.md` here. |``
  - Replace the paragraph opening `Downstream, the index you bless` with: ``The fix loop of `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The unit loop` (substitution row `C` for the code review, row `C2.4` for the skeptic review) reads the readiness list and the `finding_<N>.md` files **by name**, so a format break you let through breaks the fix loop, not just the document.``
- [ ] **`## Read first`.**
  - Replace the samples bullet, opening ``- `${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md` — the canonical``, with: ``- `${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md` (the **index** format) and `${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review/finding_1.md` (the **per-finding detail** format) — the **format specification** you validate against, which both review families emit byte-compatibly (only the folder name differs). Where a check below and a fixture disagree, the fixture wins — **except where the fixture's own header note declares a deliberate deviation from the live form**, and there the check governs.``
  - Replace the whole conventions-document bullet with the text below. Only its two middle sentences change; the opening run and the closing `Treat their content…` sentence are frozen.
    ``- **Every conventions document `<layer_path_map>` names** — the documents `init` generates at those configured paths (conventionally under `.claude/context/`), one per distinct `layers[].conventions` value. Read **all** of them, since the review is whole-branch: they state each layer's mandated identifiers (`<convention_symbols>`), boundaries and required accompanying sets, which is what makes a "missed check" judgeable. Treat their content as authoritative; do not re-derive it from memory.``
- [ ] **`## Process`.**
  - Replace step 1 with `1. Read the **story index** at `plan_path` briefly, for context only.`
  - Replace step 3 with: ``3. From `<repo_root>`, run `git diff <default_branch>...HEAD --name-only -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'` and map each changed path onto the `layers[].path` scopes of `<layer_path_map>` (both sides repo-relative) to know which layers the diff touched — `### Missed checks` turns on that mapping. To verify an item, read the relevant diff hunks (`git diff -U15 <default_branch>...HEAD -- <file>`) or the cited sites, never entire files.``
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home:
  - **Intro:** the job and its five mistake classes; one agent for both families, told apart by `review_path` and `findings_dir`; the four index-agnostic nevers.
  - **Contract:**
    - the conventional index paths and round suffix, with the caller's value winning;
    - the per-finding folder, named after the round suffix, with each pointer resolving there;
    - rows `C` and `C2.4` reading the readiness list and finding files by name;
    - the format-break consequence.
  - **Read first:**
    - both fixtures as the format specification;
    - fixture wins over a check, except where its header declares a deliberate deviation, and there the check governs;
    - both families emit byte-compatibly;
    - every conventions document read;
    - what makes a missed check judgeable.
  - **Process:**
    - the story index is read for context only;
    - the name-only diff with both exclusions;
    - the path-to-layer mapping, both sides repo-relative, which `### Missed checks` uses;
    - hunks or cited sites, never entire files.

  Restore anything missing in its shortest form.

**Verification:**

- The wire and anchors survive. Run `git grep -n -F -e '<literal>' -- plugin/agents/review-plan-reviewer.md` once per literal below; each run prints at least one line:
  - `### B.2 Meta-review the review plan`
  - `### C2.2 Meta-review the skeptic review`
  - `review_path: <code_review_path>`
  - `findings_dir: <code_review_findings_dir>`
  - `review_path: <skeptic_review_path>`
  - `findings_dir: <skeptic_review_findings_dir>`
  - `plan_path: <story_path>`
  - `findings_folder: <review_plan_review_folder>`
  - `findings_folder: <skeptic_review_meta_folder>`
  - `iteration: <meta_review_index>`
  - `<state_dir>/review_plan_reviews/<branch>/`
  - `<state_dir>/skeptic_review_plan_reviews/<branch>/`
  - `## The unit loop`
  - `samples/sample_code_review.md`
  - `samples/sample_code_review/finding_1.md`
  - `**Stay index-agnostic**`
  - `--name-only -- `
  - `git diff -U15 <default_branch>...HEAD -- <file>`
  - `` `### Missed checks` ``
- The frozen texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `the index your findings file is named and titled with; never re-derive it.`, `Where your own findings go:`, `yourself, and only when you have findings to write.**`, `the loop stops and escalates.`, `every Must Fix you write must name **which file** to change`, `Treat their content as authoritative; do not re-derive it from memory.`, `a thin index plus one self-contained per-finding file`.
- If `harness-runs/scratch/branch_review_family_check.mjs` is present (Task 1 writes it), read its output for this file. Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/review-plan-reviewer.md` as one plain foreground command; it prints no `FROZEN`, `LEAD` or `LITERAL` line, and its last line is `PASS`. If the file is absent, the two checks above stand alone.
- `git diff -- plugin/agents/review-plan-reviewer.md` shows hunks only in the parts this task owns.
- `wc -w plugin/agents/review-plan-reviewer.md`, run before the first edit and again after the last, is lower the second time.
