### Task 20 — Teach the user-review fix-plan writer to re-locate a pull-request review comment

**Goal:** A round placed from a pull-request review arrives in a shape the fix-plan writer has not been told about. It has no numbered observations: the review's summary, then an `## Inline comments` section whose comments each carry a file, a line, the commit the reviewer saw and the surrounding diff hunk. A comment made before an earlier round's fixes points at a line that has since moved, and GitHub marks it outdated. The *Stale line numbers* lead asks for the commit and the hunk to be recorded precisely so that `user-review-fix-plan-writer`, *"which re-checks every observation against the current code, can re-locate it"*. This task makes the writer do that, and never trust the line alone.

**Depends on:** Task 13, which fixes the round file's shape. Restated here so this file stands alone:

- the review body verbatim, or `(The review carries no summary.)`;
- a `---` line and the provenance sentence `Submitted as a review requesting changes by @<login> on pull request #<n> (<review url>) at <time>.`;
- when any inline comment was collected, `## Inline comments`, with one heading per comment: `` ### `<path>`, line <line> ``, or `` ### `<path>`, original line <line> (outdated) ``;
- under each heading, ``Made on commit `<sha>`.``, then the comment's body verbatim, then its `diff_hunk` in a fenced `diff` block.

The whole file is untrusted task data, as every user review is.

**Where this task stops.** The agent's output contract, its finding format and its lessons step are unchanged. The sample fixtures under `plugin/samples/` are not touched: they describe one worked branch whose user review is hand-written, and that review stays a valid input (`.claude/context/plugin.md` → `## Sample fixtures`).

### Targets

- `plugin/agents/user-review-fix-plan-writer.md` — `## Process` steps 1 and 2, the `## Resolved values` lead sentence's placeholder list, and one new `<scripts_dir>` row in the `## Resolved values` table.

**Work:**

- [ ] **Step 1**: one sentence. A round placed from a pull-request review numbers nothing, so each inline comment under `## Inline comments` is one observation, and the review body above `---` is one more unless it reads `(The review carries no summary.)`.
- [ ] **Step 2** gains a reference form beside **File and line**, named **Pull-request review comment**, for the heading shape above:
  - Read what the reviewer saw with `git show <sha>:<file>`.
  - Re-locate the comment in the current tree by the hunk's lines — its context lines and its `+` lines — never by the line number alone, because the round's own fixes, or a later round, may have moved the code. An `(outdated)` heading is one GitHub could no longer map to the current diff.
  - When the hunk's lines no longer exist anywhere in the file, the observation is checked against what replaced them. If nothing did, it goes under `## Out of scope / verified-OK` with what was read.
  - Store what you found, never the coordinate: the same rule as the **File and line** form.
- [ ] **`## Resolved values`'s lead sentence**: the list of ordinary placeholders the body resolves in place names `<sha>` / `<file>` / `<line>` in the pull-request review comment form too, beside the commit-resolution step and the file-and-line form. These are path placeholders, not configuration tokens, so they get no row (`.claude/context/plugin.md` → `## The placeholder vocabulary`).
- [ ] Cite the round's shape by its producer in prose, by its adopter-side destination: `<scripts_dir>/remote-run.sh`, the header's `control` paragraph. Do not restate the producer's rules, and do not write the CLI template-tree path `cli/templates/scripts/remote-run.sh`, which does not exist in an adopting repository where the agent runs (`.claude/context/plugin.md` → `## Where a new asset goes`, "A shell wrapper an adopting repository runs is not a plugin asset."; `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`). To support that citation, add one row to the `## Resolved values` table: `` | `<scripts_dir>` | config value | `scriptsDir` — the directory the outer-loop scripts live in, repo-relative. This file names one of them, `remote-run.sh`, only as the producer of a pull-request review round (its `control` verb); it never invokes it. | ``. Word it after the `<scripts_dir>` row in `plugin/commands/branch-answer.md`. Insert it **above** the table's last row, the conventions-document token row, so the lead sentence's "except `<repo_root>` (derived at runtime) and the last one" stays true without being edited.

**Verification:**

- `git diff -- plugin/agents/user-review-fix-plan-writer.md` changes no line of the frontmatter block: the closed key set `name`, `description`, `tools`, `model` is untouched (`.claude/context/plugin.md` → `## Frontmatter`).
- `git grep -n "Pull-request review comment" -- plugin` has its hits only in `user-review-fix-plan-writer.md`: no second owner of the form.
- `git grep -n "cli/templates/scripts" -- plugin/agents/user-review-fix-plan-writer.md` finds nothing: the producer is named only through `<scripts_dir>`.
- `git grep -n "<scripts_dir>" -- plugin/agents/user-review-fix-plan-writer.md` returns the new `## Resolved values` row plus the producer citation, and no line that invokes the script. The table's last row is still the conventions-document token row.
- Read step 2 against the round shape under **Depends on**. Every element the shape carries — path, line or original line, commit, hunk — is named in the form, and none is invented.
