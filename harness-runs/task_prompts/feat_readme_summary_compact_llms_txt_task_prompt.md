`feat_readme_summary_compact_llms_txt` closes three `ROADMAP.md` items: priority **1** *README summary and
checklist*, priority **2** *Compact the README* and priority **37** *`llms.txt`*.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

---

## 1. README summary and checklist (roadmap priority 1)

The roadmap row: *"Open with three plain lines — what it is, what you get — and a five-step checklist: install,
`init`, `/harness-analyze` (in Claude Code, not the terminal), `doctor`, start the daemon. Caveats move below
it."*

### What to deliver

1. `README.md` opens, directly under the H1, with three plain lines that say what the harness is and what an
   adopter gets from it. A reader who stops there knows whether it is for them.
2. Next comes a five-step checklist: install the plugin, run `init`, run `/harness-analyze`, run `doctor` and
   start the daemon. Each step is one runnable command or one short instruction. The `/harness-analyze` step
   states that it is typed into an interactive Claude Code session, not the terminal.
3. Every caveat attached to those steps goes below the checklist. That includes the published-path status, the
   directory-source install for contributors, the interactive-only limit and the `.claude/` write wall. None of
   it sits between the checklist steps.
4. The quick start's steps A–F, the diagram and the paragraphs under it stay below the checklist, reduced by §2.
   The checklist and the lettered steps must not repeat each other: merge them, or make the lettered steps the
   detail behind each checklist line.

## 2. Compact the README (roadmap priority 2)

The roadmap row: *"Cut the README to what a new reader needs: short sentences, one idea per paragraph, and the
long measured caveats moved into the docs they belong to, linked rather than inlined."*

`README.md` is 166 lines. Most paragraphs run past 150 words. `## Scope and limits` →
`### Measured while building that evidence, and not fixed here` holds four measurement write-ups (the
interactive-only slash spellings, the `.claude/` write wall, the missing-remote behaviour and the `jj` shapes),
and the `git only` bullet under `### The shape of the system` is a fifth.

### What to deliver

1. Each long caveat moves into the reference document that already covers its subject. That document then has
   the full measured text, including the version numbers and the "measured on" details. The README keeps one or
   two plain sentences per caveat plus a link to the section. Pick each destination from what the document
   already says. `docs/cli.md` §7 already has the `jj-repository` and `remote` checks, `docs/development.md` §6
   already covers first-message command matching, and `docs/analyze.md` covers what `/harness-analyze` writes.
2. No fact is lost. Every claim the README makes now is either still in the README or present at the linked
   destination. The plan lists each moved paragraph and where it ended up.
3. The rest of the README gets the same treatment: short sentences and one idea per paragraph. That includes
   the three paragraphs under the diagram, `## How it is measured` and `## Two ledgers`.
4. Links into the README keep working. Find every file that links to a README heading or anchor, such as
   `#scope-and-limits`, or quotes a README heading like `README.md` `## Two ledgers` in `ARCHITECTURE.md`. Keep
   the heading, or edit every file that cites it.

### Establish, do not assume

- **Whether a destination document already states the caveat differently.** If it does, merge the two into
  one statement. Do not add a second copy next to the first.
- **Whether any test, gate or generator reads the README's text** (`scripts/run-gates.sh`, `cli/test/`), so a
  wording change does not break a check.
- **Whether `docs/development.md` → `## 6. The roadmap this tree defers to`, item 9's row, describes the README's
  structure** in a way this branch makes false. That row records what item 9 delivered, so change it only
  where it makes a claim about the current file.

## 3. `llms.txt` (roadmap priority 37)

The roadmap row: *"An LLM-readable summary of the project at the repository root."*

### What to deliver

1. `llms.txt` at the repository root, in the llmstxt.org format: an H1 with the project name, a blockquote
   summary, then H2 sections that list links with a one-line description each. It covers what the harness is,
   the two halves, the quick start, and the reference documents under `## Where to read more`.
2. The summary is based on the finished README from §1 and §2, so write it after both.
3. Every link in it resolves on `main`. `scripts/publish-main.sh` → `removed_paths` strips
   `harness.config.json`, `.claude`, `githooks`, `harness-runs` and `scripts` from `main`, so `llms.txt` links to
   none of them.
4. A check that fails when a link in `llms.txt` stops resolving, added where this repository's other link and
   path checks already live.

### Establish, do not assume

- **Whether the file needs to be in the npm package's `files`** or is only for the repository.

## Roadmap bookkeeping

On completion, each of the three rows in its area table is marked `Done`, and the three entries leave the
`## Index`. The remaining entries are renumbered with no gaps and keep their current order.

## Out of scope

- Generating an `llms.txt` for adopters from `init`.
- Changing what the harness does. This branch only rewrites and moves prose, apart from the link check in §3.

## Acceptance

1. `README.md` opens with the three lines and the five-step checklist, and no caveat comes before the end of the
   checklist.
2. `README.md` is materially shorter. Every paragraph moved out of it can be found at its linked destination,
   and every link or heading citation into the README resolves.
3. `llms.txt` exists, follows the format, and its link check passes on the tree `publish-main.sh --dry-run`
   builds.
4. `ROADMAP.md` shows all three rows as `Done` and the index is renumbered.
5. `bash scripts/run-gates.sh` prints no new failure.
