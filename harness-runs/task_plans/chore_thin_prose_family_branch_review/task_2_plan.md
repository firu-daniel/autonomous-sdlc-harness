### Task 2 — Thin `branch-reviewer`'s intro, `## Invocation contract` and `## Read first`

**Goal:** Cut the opening of `plugin/agents/branch-reviewer.md` — the role sentence, the two orientation paragraphs, the mode bullets and key-table cells, the empty-root and return paragraphs, and the lessons bullet — to direct rules stated once, with no change in what the agent does.

**Depends on:** Task 1, which already rewrote this file's intro sentence about delegated fixes and the `**Re-dispatch on a failed meta-review.**` paragraph. Leave both exactly as Task 1 left them.

**Where this task stops.** It owns these parts of `plugin/agents/branch-reviewer.md` only:
- the role paragraph opening `You are the **Branch Reviewer**.`;
- the paragraph opening ``You are distinct from `layer-reviewer` ``;
- the paragraph opening ``` `skeptic-reviewer` (`${CLAUDE_PLUGIN_ROOT}/agents/skeptic-reviewer.md`) runs *after* you ```;
- in `## Invocation contract`, the `- **Single-pass mode**` bullet, the third cell of the `per_task_findings_root` and `Output` rows, the paragraph opening ``**The `per_task_findings_root` may legitimately be empty.**``, and the paragraph opening `**Your return is read, not parsed for a verdict**`;
- in `## Read first`, the `<state_dir>/lessons.md` bullet.

It does not touch:
- the frontmatter;
- the paragraph opening `**You report findings. You do not implement fixes.**`;
- `## Resolved values`, which is wholly frozen;
- the lead sentence above the dispatch block, the fenced dispatch block, the `Branch`, `Story plan` and `Task prompt` rows, or Task 1's re-dispatch paragraph;
- any other `## Read first` bullet;
- anything from `## Process` on, which belongs to Tasks 3 and 4.

**Frozen text in or next to this range** stays word for word:
- the sentence opening `You run in one of **two modes**, and there is **no mode flag**: the caller selects the mode by`;
- the key-table header `| Key | What it is, and what you do with it |` and its separator;
- the three bullets above the lessons bullet — the conventions-document bullet, the `<docs_root>` bullet and the docs-retrieval tool bullet;
- the lessons bullet's opening, ``- `<state_dir>/lessons.md` — the recurring-escape``;
- the whole paragraph opening `**A cited path you cannot read is a finding, not a fallback.**`.

### Targets

- `plugin/agents/branch-reviewer.md` → the parts named above.

**Work:**

- [ ] **Intro.**
  - Replace the role paragraph with: ``You are the **Branch Reviewer**. You review the whole diff between the current branch and `<default_branch>` against the rules the configured layers' conventions documents state and, when `phases.parity` is `true`, against `<reference_impl>`.``
  - Delete the paragraph opening ``You are distinct from `layer-reviewer` `` and the blank line after it. The cross-unit checks it lists are `### Pass 1` step 6's.
  - Replace the paragraph opening ``` `skeptic-reviewer` (`${CLAUDE_PLUGIN_ROOT}/agents/skeptic-reviewer.md`) runs *after* you ``` with: ``Run every one of your own checks to the letter. `skeptic-reviewer` runs after you and repeats the caller check, the citation check and the two-leg divergence test from an adversarial posture; it is a backstop against a trusting pass, not a reason to defer a hard call.``
- [ ] **Mode bullet and key cells.**
  - Replace the `- **Single-pass mode**` bullet with: ``- **Single-pass mode** — no `per_task_findings_root`: do Pass 1 only. The supervised flow dispatches it (`${CLAUDE_PLUGIN_ROOT}/instructions/code_review_instructions.md` → `## Flow` step 2) with the branch name, the task-prompt and story-index paths, and any user-supplied scope hint.``
  - Replace the `per_task_findings_root` row with: ``| `per_task_findings_root` | The root of the per-unit review folders. Its presence alone switches on two-pass mode. |``
  - Replace the `Output` row with: ``| `Output` | Where the index and the per-finding files go — the caller's paths, never hardcoded ones. |``
- [ ] **Empty root and return paragraphs.**
  - Replace the paragraph opening ``**The `per_task_findings_root` may legitimately be empty.**`` with: ``**The `per_task_findings_root` may legitimately be empty** when per-unit review was off. Pass 2 is then a no-op — not an error, and never a reason to look for the files elsewhere.``
  - Delete the paragraph opening `**Your return is read, not parsed for a verdict**` and the blank line after it. It restates the two return lines `## Output contract` already states.
- [ ] **Lessons bullet.** Replace the `<state_dir>/lessons.md` bullet in `## Read first` with: ``- `<state_dir>/lessons.md` — the recurring-escape ledger: every entry is a named check.``
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home:
  - **Roles:** the agent's role and scope (whole diff against `<default_branch>`, conventions, parity when on); the run-every-check-to-the-letter rule and the skeptic-as-backstop clause.
  - **Modes:** no mode flag; single-pass = Pass 1 only, with the supervised citation and its inputs (branch name, task-prompt and story-index paths, scope hint); two-pass = Pass 1 then Pass 2; `per_task_findings_root` alone switches two-pass mode on.
  - **Contract:** the caller supplies the output paths, never hardcoded ones; an empty root makes Pass 2 a no-op, not an error and not a search elsewhere; the lessons ledger's entries are named checks.

  Restore anything missing in its shortest form.

**Verification:**

- The wire and anchors survive. Run `git grep -n -F -e '<literal>' -- plugin/agents/branch-reviewer.md` once per literal below; each run prints at least one line:
  - `code_review_instructions.md`
  - `## Flow`
  - `### B.1 Generate the review plan`
  - `per_task_findings_root: <per_task_findings_root>`
  - `Branch: <branch>`
  - `Story plan: <story_path>`
  - `Task prompt: <task_prompt_path>`
  - `then report back with the index path.`
  - `**Two-pass mode**`
  - `two-pass mode`
- The frozen texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `You run in one of **two modes**, and there is **no mode flag**`, `the documents `init` generates at those configured paths`, `**A cited path you cannot read is a finding, not a fallback.**`, `Never substitute another document for a cited one, and never`.
- If `harness-runs/scratch/branch_review_family_check.mjs` is present (Task 1 writes it), read its output for this file. Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/branch-reviewer.md` as one plain foreground command; it prints no `FROZEN`, `LEAD` or `LITERAL` line, and its last line is `PASS`. If the file is absent, the two checks above stand alone.
- `git diff -- plugin/agents/branch-reviewer.md` shows hunks only in the parts this task owns.
- `wc -w plugin/agents/branch-reviewer.md`, run before the first edit and again after the last, is lower the second time.
