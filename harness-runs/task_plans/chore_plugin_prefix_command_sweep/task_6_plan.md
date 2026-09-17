### Task 6 — Qualify every command spelling under `plugin/commands/`, `**Usage:**` lines included

**Goal:** Every slash spelling of a plugin command inside `plugin/commands/` becomes `/autonomous-sdlc-harness:<name>`. That includes each command's own `**Usage:**` line and example, the cross-references between commands, the STOP and next-step messages a command prints to a person, and the directory's `README.txt`.

**Where this task stops.** File names and frontmatter do not change. The prefix comes from the plugin manifest (`plugin/.claude-plugin/plugin.json` → `name`), not from the file, and the frontmatter has no `name:` key. Path citations such as `${CLAUDE_PLUGIN_ROOT}/commands/branch-start-plan.md` name files, not spellings, and stay as they are. So does the `branch-*` family noun written without a slash. Instructions, agents and samples are Tasks 7 and 8. The spelling rule and the reason model-read referents take the qualified form too are in the story index `## Context`, under *"Model-read sites are decided by that same rule"*.

### Targets

- `plugin/commands/README.txt`
- `plugin/commands/branch-answer.md`, `branch-implement-plan-semi-autonomous.md`, `branch-implement-plan.md`, `branch-implement-user-review-semi-autonomous.md`, `branch-implement-user-review.md`, `branch-pause.md`, `branch-prompt.md`, `branch-qa-test.md`, `branch-resume.md`, `branch-start-docs-autonomous.md`, `branch-start-plan-autonomous.md`, `branch-start-plan-semi-autonomous.md`, `branch-start-plan.md`, `branch-start-user-review-fix-autonomous.md`, `branch-status.md`, `branch-user-review.md`, `harness-analyze.md` (all under `plugin/commands/`)

**Work:**

- [ ] **`**Usage:**` lines and their examples.** Change `branch-answer.md`, `branch-pause.md`, `branch-prompt.md`, `branch-resume.md`, `branch-status.md`, `branch-user-review.md` and `harness-analyze.md`: for example *"type `/autonomous-sdlc-harness:branch-prompt` and then keep typing your task description on the same line"*, and `` `/autonomous-sdlc-harness:harness-analyze <target> --existing` ``. Keep every instruction about typing the argument on the same line exactly as written. Whether the picker survives an argument is the open measurement Task 11 records, and this task does not change the guidance.
- [ ] **Messages printed to a person.** Change the STOP line *"Run /branch-start-user-review-fix-plan first."* in `branch-implement-user-review-semi-autonomous.md`, and the resume, answer and next-round pointers in `branch-pause.md`, `branch-resume.md`, `branch-status.md` and `branch-prompt.md`. Also change `harness-analyze.md`'s `Next actions` remedies (`/harness-analyze <target>`) and its other in-body mentions. Qualify each in place and leave the rest of the sentence unchanged.
- [ ] **Cross-references between commands.** In `branch-implement-plan*.md`, `branch-implement-user-review*.md`, `branch-start-plan*.md`, `branch-start-docs-autonomous.md`, `branch-start-user-review-fix-autonomous.md`, `branch-qa-test.md` and `branch-user-review.md`, qualify every *"variant of `/branch-…`"*, *"via `/branch-…`"* and *"invoke `/branch-…` yourself"* spelling.
- [ ] **The two `## Context:` headings** in `branch-implement-user-review.md` and `branch-qa-test.md` carry a slash spelling. A cited heading is a wire. Before editing either, run `grep -rn 'drafted on the current branch (via' plugin cli docs README.md` and `grep -rn 'opt-in, supervised counterpart to the automatic QA phase' plugin cli docs README.md`. Qualify the spelling only if the only hit is the heading itself. Otherwise update every citer in that same grep's result, and if any citer lies outside this task's targets, return a blocker naming it.
- [ ] **`README.txt`**: qualify *"item 15 added `/harness-analyze`"*. Leave the `branch-*` family noun as it is.

**Verification:**

- `grep -rnE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)' plugin/commands` prints nothing.
- `git diff --name-status -- plugin/commands` lists only `M` lines, with no rename, add or delete. `git diff --name-only -G '^(description|argument-hint):' -- plugin/commands` prints nothing, which shows the frontmatter is unchanged.
- `claude plugin validate --strict plugin` exits 0. Run it through `bash scripts/test.sh`, whose gate 1 runs it.
