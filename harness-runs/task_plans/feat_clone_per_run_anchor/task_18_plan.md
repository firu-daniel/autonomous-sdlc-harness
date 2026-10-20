### Task 18 — Say "run copy" in the five developer documents, and add the anchor to `ARCHITECTURE.md`'s launch contract

**Goal:** Move the five developer documents the task prompt names to the words **run copy** wherever they mean the run's own copy. The five are `ARCHITECTURE.md`, `ROADMAP.md`, `docs/config.md`, `docs/retrieval.md` and `docs/remote-execution.md`. Then record, in `ARCHITECTURE.md`'s launch-path table, that the engine's invocation now carries one environment variable. The watcher's header says that table carries the coupling surface of the launch.

**Depends on:** Task 3, which adds `export HARNESS_MAIN_REPO="$MAIN_REPO"` inside `spawn_engine`'s engine subshell (`cli/templates/scripts/autonomous-watcher.sh`), plus the environment line `HARNESS_MAIN_REPO=<MAIN_REPO>` in the header's *"The flag string, in full"* block. `remote-run.sh`'s `control_mention_session` carries no anchor, by design.

**The wording rule, restated from the story index's `## Context`.** Prose that means the run's own copy says **run copy**, with articles fitted to the sentence:

- *"the run's worktree"*, *"a fresh worktree"*, *"once per worktree"*, *"a worktree that reaches planning"*;
- *"Worktrees on different branches"*, *"its checkouts and worktrees"*, *"a second worktree appears"*, *"the sibling-worktree glob"*;
- *"the local working copy is a **mirror**"*, *"creates the working copy"*, *"an isolated working copy"*;
- *"a working copy the caller has already prepared"*, *"prepare a working copy"*.

Keep:

- every name — `setup-worktree.sh`, `cleanup-merged-worktrees.sh`, `create-worktree.sh`, the token `<worktree_glob>` and its row, `projectName`'s *"worktree directory names"*;
- every heading, above all the heading `docs/remote-execution.md` cites, `### Where the family runs git in a run's copy, and under what pins`, kept byte for byte;
- every quoted string from another file, such as `ARCHITECTURE.md`'s quotation *"Spawn the headless engine in an ALREADY-PREPARED working copy"*, a header block quoted verbatim;
- "working copy" meaning any checkout;
- **status markers** (`**[shipped]**`, `**[designed]**`) exactly where they stand.

### Targets

- `ARCHITECTURE.md` — the run-copy prose in `## 5. Where the engine is reached — the launch path` and `## 6. Where the engine is reached — assets and configuration`, and the `spawn_engine` row's binding cell.
- `ARCHITECTURE.md` → `## 7. The seam: what an adapter would have to carry` — the numbered operation **1. Launch a session.** (*"in a working copy the caller has already prepared … — the run's worktree and the state directory outside it"*) and the mermaid label *"prepare a working copy, launch, classify the exit"* in the `W["autonomous-watcher.sh — …"]` node.
- `ROADMAP.md` — *"the worktree, the branch-review diff and the branch refresh"*.
- `docs/config.md` — `## 1. The three resolution classes` and the `commands.depInstall`, `qa` and `parity.toolchainCommands` rows' run-copy phrases.
- `docs/retrieval.md` — the per-worktree index, warm-up and database prose.
- `docs/remote-execution.md` — the mirror-working-copy prose, the `M["Mirror working copy"]` diagram label, the job-mode sentence, *"the run's mirror working copy"* and *"the unverified worktree globs"*.

**Work:**

- [ ] **`ARCHITECTURE.md` → `## 5.`'s table, the `spawn_engine` row.** In **What it binds**, add the environment the session is launched with: `HARNESS_MAIN_REPO`, the main checkout's path, which the plugin's readers take through a bare `printenv HARNESS_MAIN_REPO`. The cell's *"the run's worktree"* becomes *"the run copy"*. In **What a second runtime must supply**, add that it must pass that variable into the session's environment so a sandboxed shell call inherits it. The table's columns carry its status markers, not its cells, so the addition takes no marker of its own. Then apply the wording rule to the rest of `## 5.` and `## 6.` — *"the `<work_root>/<projectName>-` worktree prefix"* becomes *"run-copy prefix"* — and leave the quoted header text alone. Then apply it in `## 7.`: in **1. Launch a session.**, *"in a working copy the caller has already prepared"* becomes *"in a run copy the caller has already prepared"* and *"the run's worktree and the state directory outside it"* becomes *"the run copy and the state directory outside it"*; add, after the readable roots, *"and the main checkout's path in its environment as `HARNESS_MAIN_REPO`"*, so the operation matches the `spawn_engine` row it is *forced by*. The diagram label becomes *"prepare a run copy, launch, classify the exit"*. Every status marker in `## 7.`, the item's leading `**[designed]**` included, stays where it stands. If `## 5.`'s covering-property paragraph names a derivation command, re-run it after the edit and confirm every site it reaches is still a row.
- [ ] **`ROADMAP.md` and `docs/config.md`.** Apply the rule to the phrases under `### Targets`. In `docs/config.md` the `<worktree_glob>` row's token name and `projectName`'s row keep their names.
- [ ] **`docs/retrieval.md`.** Apply the rule to the index, warm-up and database prose. **Why `setup-worktree.sh` does not warm the index.** is a bold lead-in carrying a script name, and stays.
- [ ] **`docs/remote-execution.md`.** Apply the rule, the mermaid label included (`M["Mirror run copy"]`), with the cited heading kept byte for byte.
- [ ] **Read each changed sentence back** against the rule, and list in the deviation notes every hit you kept and why.

**Verification:**

- `grep -n -i -E "worktree|working cop(y|ies)" ARCHITECTURE.md ROADMAP.md docs/config.md docs/retrieval.md docs/remote-execution.md`: every remaining hit is a name, a cited heading, a quotation, or "working copy" meaning any checkout, and each is listed in the deviation notes.
- `grep -n 'HARNESS_MAIN_REPO' ARCHITECTURE.md` shows the `spawn_engine` row and `## 7.`'s **1. Launch a session.** item.
- `grep -rn "Where the family runs git in a run's copy, and under what pins" docs/remote-execution.md docs/watcher.md` still matches in both files.
- `grep -c '\*\*\[shipped\]\*\*\|\*\*\[designed\]\*\*' ARCHITECTURE.md` gives the same output before and after the edit.

**Deviations from plan:**

- **Kept hits** of `grep -n -i -E "worktree|working cop(y|ies)" ARCHITECTURE.md ROADMAP.md docs/config.md docs/retrieval.md docs/remote-execution.md`, run after the edit, each and why:
  - `ARCHITECTURE.md` `## 3.` *"Spawn the headless engine in an ALREADY-PREPARED working copy"* — a quotation of the watcher's header block.
  - `ARCHITECTURE.md` `## 6.` `cleanup-merged-worktrees.sh` — a script name.
  - `docs/retrieval.md` **Why `setup-worktree.sh` does not warm the index.** (bold lead-in), its two later citations of that lead-in, and the `setup-worktree.sh` mention in the cold-build paragraph — a script name.
  - `docs/retrieval.md` `## What this buys you`, *"a per-checkout cache that its worktree owns"* — the working tree of any checkout, the main one included, not the run's copy.
  - `docs/config.md` the `<worktree_glob>` row and `projectName`'s *"worktree directory names"* — names, kept per the plan.
  - `docs/config.md` `qa.credentialsPath`'s *"across every working copy of the repository"* — any checkout, the main one included.
  - `docs/remote-execution.md` the job-setup step's and the interactive-test decision's `setup-worktree.sh` — a script name; the cited heading `### Where the family runs git in a run's copy, and under what pins` — kept byte for byte.
- `docs/remote-execution.md`'s *"the run's mirror working copy"* became *"the mirror run copy"*, not *"the run's mirror run copy"*, to avoid the doubled "run".
- `## 5.`'s covering-property command, re-run after the edit, reaches `cli/src/generators/profileEntries.ts` and `cli/src/generators/writeProtection.ts` (one `--settings` mention each, in a doc comment and a protection reason) that no row or disposition sentence names, and `cli/src/generators/permissionProfile.ts` now carries one `--settings` mention where the disposition sentence says two. This divergence predates this task (this task's edit changes none of the sites the command reaches) and is left for a follow-up rather than widened into this unit.
- `bash scripts/typecheck.sh` ran from the checkout root: `PASS: typecheck`. This unit wrote no test file.
