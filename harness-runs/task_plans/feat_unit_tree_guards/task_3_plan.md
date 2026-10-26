### Task 3 — Teach the adopter conventions templates the tree-guard run and the self-registration rule

**Goal:** A conventions document an adopter fills from these templates states that a unit runs its own test files **and** the tree guards its change reaches, and carries the rule that keeps the guard list current: *a new test that reads a tree of source files as text adds itself to `treeGuards` in the same change* (task prompt, Proposal item 4).

**Where this layer stops.** These are `cli/templates/` files — what a future adopter receives; they change nothing in this checkout (`.claude/context/cli.md` → *"Settle which audience a file serves"*). The rule's operative statement for the run is **Task 4's** (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 7); these templates tell the adopter's document what to state, not how the loop matches. This repository's own `.claude/context/conventions.md` is a conventions document and is **not** edited by any task; its restatement is raised in the plan writer's `## Corpus staleness` return.

### Targets

- `cli/templates/claude/context/conventions.md` — the testing-bar bullet under **What belongs here**.
- `cli/templates/claude/context/layer.md` — the *What "done" means here* bullet under **What belongs here**.

**Work:**

- [ ] `conventions.md`: in the testing-bar bullet, replace *"so a unit that wrote a test runs only that file, through this command"* with wording saying a unit runs the test files it wrote **and** every tree guard (`harness.config.json` → `treeGuards`) whose `covers` glob its change reaches, each through this command. Keep the rest of that bullet byte-identical.
- [ ] `conventions.md`: in the same bullet, or as the next bullet under **What belongs here**, ask the document to state the self-registration rule: a test that reads a **tree** of this repository's files as text — rather than one module, or one fixed file — adds itself to `treeGuards` in the same change, with `test` spelled as the argument this single-file command takes and `covers` the repo-relative glob of the files it reads. A test reading one fixed file is not a tree guard: the unit editing that file already names it.
- [ ] `layer.md`: make the matching one-phrase edit to *"so a unit that wrote a test runs only that file, through this command"*, so the two templates do not disagree. The self-registration rule stays in the cross-layer template alone — it is a cross-layer rule, and stating it twice gives it two owners.

**Verification:**

- Both files still carry `**What belongs here**` and end with `<!-- harness:unfilled -->` — the two-part skeleton test `init` and `doctor` share keys on them (`cli/src/generators/claudeContext.ts` → `SKELETON_GUIDANCE_MARKER`).
- `git grep -n "runs only that file" -- cli/templates` returns nothing.
- `git grep -n "treeGuards" -- cli/templates/claude/context` names `conventions.md`, and the self-registration rule appears in that file only.
