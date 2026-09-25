### Task 1 — State the repo-relative path rule and the pre-commit check in the adopter-facing intake README template

**Goal:** Make the README an adopter's `init` writes into `<state_dir>/improvement_observations/` say, in one short paragraph, that every path an intake entry names is repo-relative and that the run checks the file for this machine's own paths before it commits it — pointing at the two places in the plugin instructions that own those rules rather than restating them.

**Where this layer stops.** This task changes what a **future adopter** receives (`.claude/context/cli.md` → `## What this layer owns, and what it is not`: an edit under `cli/templates/` changes nothing in this repository). It defines neither rule. The rule is **Task 2's**, in `plugin/instructions/improvement_observations_instructions.md` → `## The entry format`, under the bold lead **`Every path in an entry is repo-relative.`**; the check is **Task 3's**, in the same file's `## Commit mechanics`, under the bold lead **`Machine-path check — before every wrapper call.`** Both headings already exist, so the pointers resolve at this commit; the leads land with Tasks 2 and 3. This repository's own init-written copy of the file (`harness-runs/improvement_observations/README.md`) is **Task 5's** — do not edit it here.

### Targets

- `cli/templates/state-dir/improvement_observations/README.md`

**Work:**

- [ ] Add one paragraph after the one that opens *"One block, illustrative rather than real"* and its fenced example, stating: every path an entry names — quoted command output included — is written relative to the checkout it is in, never with the machine's home directory or a checkout's root in front of it; and the run checks the written file for those locations before it commits it, rewriting any it finds. Cite the owners as `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## The entry format` and → `## Commit mechanics`, the citation form the paragraph above it already uses. Say **why** in one clause: the file is committed and merged into the default branch, where a path from one machine is both meaningless to every other reader and a disclosure of that machine's layout.
- [ ] Leave the fenced example block as it is: it names no path, so it already satisfies the rule. Add no command to the file (it hands an adopter nothing to run).

**Verification:**

- `grep -n 'repo-relative\|Commit mechanics' cli/templates/state-dir/improvement_observations/README.md` shows the new paragraph and both citations.
- The new text carries no absolute path: `grep -nE '/(Users|home)/' cli/templates/state-dir/improvement_observations/README.md` prints nothing. Read the paragraph once for an adopter literal (a branch, directory or command of this repository's) and a line coordinate, and find neither.
- `bash scripts/run-gates.sh` fails no gate beyond the baseline the story index `## Context` records (`1a plugin manifest`, `11 docs-retrieval relevance floor`).
