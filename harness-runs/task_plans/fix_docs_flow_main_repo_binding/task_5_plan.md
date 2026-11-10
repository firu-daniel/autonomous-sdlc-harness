### Task 5 — Point the committer's `push` argument, the prompt-injection screen's row and the flow document's push at the main checkout's copy

**Goal:** Close three remaining sites. The committer's `push` argument names the push as a bare `<scripts_dir>/push-branch.sh`. The prompt-injection screen's `<MAIN_REPO>` row lacks the literal-spelling sentence even though the screen issues its own commit and push under `<MAIN_REPO>`. The flow document's `## Output guarantee` says the run pushes "through `push-branch.sh` in `<scripts_dir>`".

**Where this task stops.** The screen inherits `<MAIN_REPO>` from its citing engine command and never resolves it, so its row gains **only** the sentence: no resolution clause, and no other change in meaning. The committer's step 6 already spells the push literally and stays unchanged. The `push` argument now points at step 6. The flow document declares no `<repo_root>` token, so its sentence names the main checkout's copy in words and points at its own `## The wiring table` row.

### Targets

- `plugin/agents/committer.md`
- `plugin/instructions/prompt_injection_screen.md`
- `plugin/docs/AUTONOMOUS_FLOW.md`

**Work:**

- [ ] **`committer.md` → `## Invocation contract`, the `push` bullet.** Replace "pushes the branch via `<scripts_dir>/push-branch.sh` after a commit lands" with wording that points at the push step: the branch is pushed by step 6 after a commit lands. Use no more words than the line has now (`.claude/context/plugin.md` → `## Writing agent prose`, "An agent's growth is paid for by behaviour"). Keep the rest of the bullet.
- [ ] **`prompt_injection_screen.md` → `## Resolved values`, the `<MAIN_REPO>` row.** After this branch, each citing engine command resolves `<MAIN_REPO>` in a `## Resolved values` row, not at its kill-switch step. So change "The main checkout the citing engine command resolved at its global-kill-switch step." to say the citing engine command resolved it per its own `## Resolved values` row. Keep "This file never resolves it again.", then append the sentence `Spell it as a literal absolute path in the command, never through a substitution or a variable.` Copy that sentence byte for byte from `plugin/agents/committer.md`'s `<MAIN_REPO>` row.
- [ ] **`AUTONOMOUS_FLOW.md` → `## Output guarantee`, **What the flow does push.**** Replace "through `push-branch.sh` in `<scripts_dir>`" with "through the main checkout's copy of `push-branch.sh`". Then point at the spelling in this document's `## The wiring table` row "Git wrappers — the outer-loop scripts an agent may invoke". Do not add `<repo_root>`, which this document does not declare. Leave its `## Resolved values` table and the paragraph under it ("This document uses it for …") unchanged: the sentence names no `<MAIN_REPO>` token.

**Verification:**

- `git grep -nE "(^|[^/])<scripts_dir>/push-branch\.sh" -- plugin/agents/committer.md` must print no hits.
- `git grep -c -F "Spell it as a literal absolute path in the command, never through a substitution or a variable." -- plugin/instructions/prompt_injection_screen.md` must print a hit, on the `<MAIN_REPO>` row.
- `git grep -c -F "printenv HARNESS_MAIN_REPO" -- plugin/instructions/prompt_injection_screen.md` must print no hits: the screen still resolves nothing.
- `git grep -n -F "push-branch.sh" -- plugin/docs/AUTONOMOUS_FLOW.md` must print only lines that name the main checkout's copy, or the wiring-table inventory.
- The committer definition's word count does not rise: `git diff --stat -- plugin/agents/committer.md` shows a one-line change, and the new line is no longer than the old.
- `git diff --name-only` lists only this task's three targets.
