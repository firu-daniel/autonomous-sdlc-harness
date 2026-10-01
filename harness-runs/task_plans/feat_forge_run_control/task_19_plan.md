### Task 19 — State the pull-request-review round in the `user_reviews/` template README

**Goal:** The README `init` writes into an adopter's `<state_dir>/user_reviews/` says who writes a review round. Today it names a hand-written review and the unattended drop, and it says the drop *"deliberately does **not** commit the review"*. After this branch a round also arrives from a pull-request review submitted with changes requested, and the GitHub route — `remote-run.sh review`, which the local command already used for a remote run — **does** commit the round as `chore: add user review for <branch>` before dispatching. The README must say both, so the directory's own description stays true.

**Depends on:** Task 13, which fixes the round file's shape:

- the review body verbatim, or `(The review carries no summary.)`;
- a `---` line and a provenance sentence naming the reviewer, the pull request, the review URL and the time;
- a `## Inline comments` section with one `### \`<path>\`, line <line>` heading per comment — `original line <n> (outdated)` when GitHub no longer maps it — followed by `Made on commit \`<sha>\`.`, the comment verbatim, and its `diff_hunk` in a fenced `diff` block.

Task 9's `review` commits it as `chore: add user review for <branch>`.

**Where this task stops.** It edits the adopter-facing template only. This repository's own `harness-runs/user_reviews/README.md` is `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`), and it follows the template on the next `init --force` rather than by a hand edit here. How the fix-plan writer reads the inline-comment block is Task 20's.

### Targets

- `cli/templates/state-dir/user_reviews/README.md` — its second and third paragraphs.

**Work:**

- [ ] **Second paragraph**: after *"or dropped through the unattended loop"*, add the third origin. A review submitted with changes requested on a pull request from the run's branch becomes the next round. It carries the review's text verbatim and, under `## Inline comments`, each comment with its file, line, commit and diff hunk, so a reader re-locates a comment the round's fixes may have moved.
- [ ] **Third paragraph**: the no-commit sentence names its scope — the **local** unattended drop. Add that a round for a run executing on GitHub, whether sent by the local command or by a pull-request review, is committed as `chore: add user review for <branch>` and pushed before its dispatch, because a job boundary before the fix flow's own commit would lose it (`docs/remote-execution.md` → `## 1.`, the `branch-user-review` row's reason).
- [ ] Keep the paragraph about the next free suffix unchanged. A pull-request round uses the same round rule, computed from the branch tip.

**Verification:**

- `git grep -n -i "pull request\|chore: add user review" -- cli/templates/state-dir/user_reviews/README.md` shows the two additions.
- The README's description of the round file names the same headings as the shape under **Depends on**, `## Inline comments` included: the template states what `control` writes, not a remembered shape.
