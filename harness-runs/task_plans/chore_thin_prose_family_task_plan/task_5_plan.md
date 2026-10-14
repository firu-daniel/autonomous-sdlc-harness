### Task 5 — Thin `task-plan-reviewer.md` from the intro through `## Process`, moving `sample_task_plan.md` to on demand

**Goal:** Shorten the reviewer's opening sections — `## Resolved values`, `## Invocation contract`, `## Read first` and `## Process` — to direct instructions stated once, and stop reading `sample_task_plan.md` up front, without changing what the reviewer reads, checks or returns.

**Depends on:** Task 4, the last writer task. The reviewer grades plans against `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md`; read the writer as Tasks 1–4 left it before editing, so the reviewer's read list and process still match what the writer now produces.

**Source:** `docs/work-report-research/task-plan-reviewer.md` → `## Prose classification` (rows Intro through `## Process`) and `## Thinning plan`, as input only; the standard is `.claude/context/plugin.md` → `## Writing agent prose`.

**Where this task stops.** It edits only the lines from the intro paragraph (`You are the **Task Plan Reviewer**.`) up to, not including, the `## What to check` heading. The frontmatter is untouched. `## What to check` is Tasks 6 and 7's; `## Unsolicited dispatch guidance` and `## Output contract` are frozen and no task edits them.

### Targets

- `plugin/agents/task-plan-reviewer.md` — intro, `## Resolved values`, `## Invocation contract`, `## Read first`, `## Process`.

**Frozen in this range — keep byte-for-byte** (each also appears in agents outside this family):
- The paragraph beginning *"**You report findings. You do not edit the plan.**"*, whole.
- The whole `## Resolved values` intro paragraph (all three sentences) and every table row except `<layer_path_map>` and `<impl_stack>`. In `<layer_path_map>`, its first sentence (*"Every `layers[]` entry's `path` together with its `conventions` — … the document that supplies that layer's rules."*) and its last (*"The **catch-all** layer is the entry whose `path` is `"."`."*); in `<impl_stack>`, its first two sentences, through *"Read them off the same documents; never assume a stack."*
- The five-key dispatch block; the key table's header row and its `findings_folder` and `iteration` rows; *"The PASS branch of `## Output contract` must not touch disk."*; the whole paragraph beginning *"**Your return is parsed, not read.**"*.
- In `## Read first`: the conventions bullet's first sentence and *"Treat their content as authoritative; do not re-derive it from memory."*; the whole `mcp__harness-docs__search_docs` bullet line; the whole `**Guard carve-out.**` paragraph, its family-only last sentence included.

**Wire text to keep byte-for-byte:** the five keys `story_path`, `task_files_dir`, `prompt_path`, `findings_folder`, `iteration`; `blocker:`; `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md`; `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md` → `## Loop` → `### 4. Spawn task-plan-reviewer`; the three `${CLAUDE_PLUGIN_ROOT}/samples/…` paths; the four section headings.

**Work:**

- [ ] **Intro and `## Resolved values`.** Keep the intro's role statement and its citation of the writer's definition. Cut the `<layer_path_map>` row's middle sentence (*"You review a plan that spans every layer, so the **entire** map is in scope for you."* — `## Read first` states it) and the `<impl_stack>` row's last sentence (*"You need them to judge a plan …"*).
- [ ] **`## Invocation contract`.** Shorten the `story_path`, `task_files_dir` and `prompt_path` rows to what the reviewer does: the thin story index; the folder holding one `task_<N>_plan.md` per entry — read **every** one; the task prompt the completeness checks run against. In the paragraph beginning *"**You create `<findings_folder>` yourself"*, keep "create it yourself, only when you have findings to write" and the frozen sentence; cut the quoted caller text.
- [ ] **`## Read first`, conventions, samples and lessons.** Conventions bullet: keep the frozen sentences, "read **all** of them — the plan under review spans every layer", and the list of what to take from them compressed to one clause. Remove `sample_task_plan.md` from the up-front list and add one line stating it is read on demand only, for how the split applies to other artifact families — keep its path in that line. Story-plan and per-task bullets: keep "read all three", the one clause for each task file, that the samples set the **quality bar, not just the format**, and that they are references, not review targets. Lessons bullet: keep "a plan that re-plans a ledger mistake is a Must Fix; quote the entry".
- [ ] **The blocker paragraph.** Keep: an unreadable sample, conventions document or plan file under review means a `blocker:` line naming the path and the refusal **in place of** the verdict line, and no findings file; never substitute another document or review against a remembered format. Tighten wording only.
- [ ] **`## Process`.** Steps 1–2: keep "read the task prompt", "read the story index in full, then **every** per-task file — you guard coherence across the whole set", and "check a claim against a plan target under the `layers[].path` scopes, resolved against `<repo_root>` (the catch-all `.` included), at the cited ranges plus surrounding context, never whole large files". Gate blockquote: keep "skip steps 3–4 and the parity check group unless `phases.parity` is `true`; every other step and check is unaffected"; cut the rest. Steps 3–4: keep "open every cited `<reference_impl>` source, confirm the anchor resolves and supports the claim, and read the cited method or state object **in full**, because an omitted behaviour has no citation pointing at it" and "verify every call name, wire field name, threshold and predicate against it". Keep step 5.

**Verification:**

- `wc -w plugin/agents/task-plan-reviewer.md` prints less than it did before this task's edit.
- `git diff -- plugin/agents/task-plan-reviewer.md` (this task's uncommitted edit) shows no change to the frontmatter or below `## What to check`, and no removed line among the frozen rows, key-block lines and paragraphs listed above.
- Each frozen sentence above is found by `grep -c -F -e '<sentence>' plugin/agents/task-plan-reviewer.md` (a non-zero count), and `grep -c -F -e 'samples/sample_task_plan.md' plugin/agents/task-plan-reviewer.md` is non-zero.
- Compare the new `## Read first` with the writer's (as Tasks 1–4 left it): both read the same samples up front and both name `sample_task_plan.md` on demand only.

**Deviations from plan:** The `git diff` verification's "no removed line among the frozen rows … and paragraphs" cannot hold literally for the `<layer_path_map>` row, the `<impl_stack>` row, the `**You create `<findings_folder>` yourself` paragraph and the conventions bullet: each is one physical line the Work bullets order trimmed, so the diff shows it removed and re-added. Their frozen sentences were verified instead by `grep -c -F` (each count 1); every wholly frozen line (key block, `findings_folder` / `iteration` rows, `**You report findings…**`, `**Your return is parsed, not read.**`, the `mcp__harness-docs__search_docs` bullet, `**Guard carve-out.**`) shows no `-` line in the diff.
