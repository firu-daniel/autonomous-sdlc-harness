### Task 3 — Replace the committed home-rooted paths under `harness-runs/` and close on a green 6a in this worktree

**Goal:** Remove every committed occurrence of this machine's home directory from the tree, so that a per-branch worktree cut from this branch names no machine path and `bash scripts/run-gates.sh` reports `ok    6a no machine paths` in it — the prompt's first acceptance criterion and the point of the branch (*"Make it pass in a per-branch worktree without weakening what it guards"*). Nothing is excluded to get there: the gate still reads all of `harness-runs/`.

**Depends on:** Task 1, which makes gate 6a drop the worktree's own `./.git:<line>:` pointer line and nothing else. The closing acceptance run below is only meaningful once that filter has landed; the text edits themselves do not depend on it. Task 2's doc edit is not needed for this task, but lands before it so this task's closing run grades the finished branch.

**Why these files are edited, and how.** They are run records, and a record is normally left as written; these six are edited only because each names the home directory, which the gate's own rule forbids anywhere in the tree (*"nothing in the tree names a location on the machine that wrote it"*), and because they sit on `dev`, so every worktree inherits them and 6a stays red in every run until they change. The edit is the one commit `281c37f` already made in its last step (*"Replace the machine path in the run's improvement observations"*): swap the home-rooted prefix for a placeholder and change nothing else — no rewording, no reflowing, no correction of anything else the record says.

### Targets

The set is exactly what `git grep -lF "$HOME"` lists — at plan time these six (story index `## Scope register`, rows 9–14):

- `harness-runs/task_prompts/chore_gate_10_real_catalog_measurement_task_prompt.md` — the lines anchored *"all against"* (the blockquote near the top), *"The target repository — ALREADY BUILT, do not build another."*, *"Hand run of `docs/development.md` §5 **gate 10** against"*, *"restored to that commit immediately before the"*, the `npm ls` output line *"+-- autonomous-sdlc-harness@0.1.0 ->"*, and *"`docsRoot` at"*.
- `harness-runs/architecture_reviews/chore_gate_10_real_catalog_measurement/review_0.md` — *"All three tasks restate the corpus stamp as"*.
- `harness-runs/improvement_observations/feat_docs_catalog_retrieval.md` — *"whose hits are the worktree's untracked `.git` pointer file"*.
- `harness-runs/improvement_observations/feat_docs_retrieval_eval.md` — *"Its hits are the worktree's own untracked `.git` pointer file"*.
- `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md` — *"its only hit `./.git:1:gitdir:"*.
- `harness-runs/improvement_observations/fix_watcher_multi_question_resume_loop.md` — *"the hits are the worktree's untracked `.git` pointer file"*.

If `git grep -lF "$HOME"` lists a file not above when this task starts, it is in scope on the same terms and the return names it; if it lists one the landed tree no longer carries, say so.

**Work:**

- [ ] **`gitdir:` lines** (the four improvement-observations files): replace the path up to and including the main checkout's directory with `<main checkout>`, so each reads `gitdir: <main checkout>/.git/worktrees/…` — keeping whatever followed `/worktrees/` (a `…` or a worktree name) exactly as it was. This is the spelling `harness-runs/improvement_observations/fix_line_number_citations_never_block.md` already uses.
- [ ] **Other absolute paths** (the task prompt and `review_0.md`): replace the home-directory prefix with `<home>`, keeping the rest of each path — e.g. the gate-10 corpus becomes `<home>/Work/gate10-corpus`, and `review_0.md`'s *"… is exactly `$HOME` on the recording machine"* sentence reads with `<home>/…` as its first code span, so the sentence still makes its point.
- [ ] **The one relative path**, the `npm ls` output line in the task prompt: the path segments that spell the home directory (after the `./../../../` climb) become the single segment `<home>`, so the line reads `./../../../<home>/Work/expause/autonomous-sdlc-harness/cli`. Everything else on that line stays as captured.
- [ ] Do the replacements with the file-edit tool, reading each file first; never type the home directory's value into a command or a committed file, and never write it into this task's return — say `<home>`.

**Verification:**

- `git grep -nF "$HOME"` prints nothing.
- `git diff --stat` for this task lists only the Targets above, and `git diff --word-diff` shows every change is a home-rooted prefix becoming `<main checkout>` or `<home>` — no other word moves.
- **Acceptance 1.** With Tasks 1 and 2 landed and `harness-runs/scratch/` holding nothing but its `README.md`, run `bash scripts/run-gates.sh` in this worktree, without a pipe. It must print `  ok    6a no machine paths`. Record the full `== gate 6 — self-containment` block of its output in the return. Other gates report as they do on this machine (gate 1 depends on `claude` being on `PATH`, gate 11 on the model cache); only 6a is this branch's claim, and any other gate that changed status since Task 1's run is named in the return.
- The story index's `## Context` findings still hold after this task: the main checkout's 6a is still red because of the gitignored profile and logs — that is expected and is not this branch's to fix.
