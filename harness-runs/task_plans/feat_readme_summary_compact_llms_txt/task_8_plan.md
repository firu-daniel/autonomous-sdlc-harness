### Task 8 — Write `llms.txt` at the repository root from the finished README

**Goal:** Add `llms.txt` at the repository root in the llmstxt.org format: an LLM-readable summary of the project, drawn from the finished `README.md`. It covers what the harness is, its two halves, the quick start and the reference documents under the README's `## Where to read more`. Every link resolves on `main`.

**Depends on:** Tasks 5 and 6, which produced the finished README this summary is drawn from. Its three opening lines are the source for the blockquote, its checklist for the quick-start section, and its `## Where to read more` for the reference list.

**Where this task stops.** This task writes `llms.txt` only. The check that fails when one of its links stops resolving is **Task 9's**. It enforces exactly the link contract below, so this file must follow it to the letter, and Task 9 restates the same contract. `llms.txt` is **not** added to `cli/package.json` → `files`: that field is relative to `cli/`, the package is published from `cli/`, and a root file cannot be listed there. The file describes the repository, not the npm package. `ROADMAP.md` is Task 10's.

**The link contract (shared with Task 9, byte for byte):**

1. Line 1 is exactly `# autonomous-sdlc-harness`.
2. A blockquote line starting `> ` appears before the first `## ` heading.
3. Every Markdown link target, `](…)`, is one of:
   - `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/<path>`, where `<path>` is a tracked **file**; or
   - `https://github.com/firu-daniel/autonomous-sdlc-harness/tree/main/<path>`, where `<path>` is a tracked **directory**.
4. No link carries a `#fragment` or a `?query`, and no link points anywhere else.
5. No `<path>` equals, or sits under, an entry of `scripts/publish-main.sh` → `removed_paths`: `harness.config.json`, `.claude`, `.gitattributes`, `githooks`, `harness-runs`, `scripts`, `.github/workflows/publish-main.yml`.

The owner slug `firu-daniel/autonomous-sdlc-harness` is the one `plugin/.claude-plugin/plugin.json` → `repository` and `cli/package.json` → `repository.url` both carry.

### Targets

- `llms.txt` (new, repository root).

**Work:**

- [ ] Header: `# autonomous-sdlc-harness`, then a one-to-three-sentence `> ` blockquote condensed from the README's three opening lines. Then an optional short plain paragraph naming the two halves and the interactive-only `/harness-analyze` limit.
- [ ] `## The two halves`: `- [plugin/](…/tree/main/plugin): …` and `- [cli/](…/tree/main/cli): …`, one line each, plus `plugin/README.md` and `cli/README.md` as `blob/main` links with a one-line description each.
- [ ] `## Quick start`: one link, `README.md` as `blob/main`, then the five checklist steps as plain list lines. Steps are not links, because a fragment is not allowed. Keep the `npx autonomous-sdlc-harness …` spelling, and keep the note that `/harness-analyze` is typed into an interactive Claude Code session.
- [ ] `## Where to read more`: one `- [<name>](<blob/main url>): <one-line description>` per entry of the README's `## Where to read more`, in the same order, with `LICENSE` and `NOTICE` as separate entries. Take each description from the README's own line, cut to one sentence.
- [ ] `## Optional`: `ROADMAP.md` and `examples/notes-app/README.md`, if Task 6 left either out of `## Where to read more`. Otherwise omit this section. Never list a path under `.claude`, `harness-runs`, `scripts` or `githooks`.

**Verification:**

- Check the contract by hand now; Task 9 automates it. For each link target, strip the prefix and run `git ls-files --error-unmatch <path>` (for a `blob` link) or `git ls-files <path>/` (for a `tree` link, which must print at least one line). Confirm no path starts with a removed-path entry.
- `grep -n -F "#" llms.txt` hits only heading lines, never inside a URL. `grep -n -F "?" llms.txt` prints no URL.
- Every entry of the README's `## Where to read more` has a line in `llms.txt`: read the two lists side by side.
- `npm pack --dry-run --workspace cli` lists no `llms.txt`, which confirms the repository-only determination.
- `bash scripts/run-gates.sh`, gate 6a (the `$HOME` grep) stays `ok` with the new file present.

**Deviations from plan:**

- `## Optional` omitted: Task 6's `## Where to read more` already lists both `ROADMAP.md` and `examples/notes-app/README.md`, which is the omission condition the Work list states.
- Evidence downgrade, `npm pack --dry-run --workspace cli`: the command was refused by the permission layer (both the workspace form and the form run from `cli/`), so "the tarball lists no `llms.txt`" rests on reading `cli/package.json` → `files` (`dist`, `scripts`, `templates`, `README.md`, `LICENSE`, `NOTICE`), not on execution.
- Evidence downgrade, gate 6a: `bash scripts/test.sh` (run-gates) reports 6a `FAIL`, and its only hit is `./.git:1:gitdir: …`, the worktree pointer file this working copy was created with, not `llms.txt`. That `llms.txt` carries no machine path rests on `grep -n "/Users/" llms.txt` returning nothing. The link contract was checked by executing a probe (`harness-runs/scratch/llms_links.py` via `scripts/scratch-run.sh`): line 1, the blockquote before the first `## `, and all 22 link targets resolving as `blob` files or non-empty `tree` directories, none with a fragment or query and none under a `removed_paths` entry.
