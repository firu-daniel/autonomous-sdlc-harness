### Task 5 — Open `README.md` with three plain lines, the five-step checklist and the caveats below it

**Goal:** Rewrite the top half of `README.md`, from the H1 through the end of `## Quick start`. It must open with three plain lines saying what the harness is and what an adopter gets, then a five-step checklist, then every caveat attached to those steps. The diagram, the three paragraphs under it and the quick start's lettered steps follow, cut to short sentences with one idea per paragraph. The lettered steps become the detail behind each checklist line and do not repeat it.

**Depends on:** Tasks 2, 3 and 4. They have already placed the measured caveats in the documents this task's caveat lines link to:

- interactive-only slash spellings → `docs/development.md` → `## 6. The roadmap this tree defers to`
- the `.claude/` write wall → `docs/analyze.md` → `## 3. What it may write`
- contributor directory-source install → `docs/development.md` → `## 1. Source types and the plugin root` (already there; no earlier task needed)

**Where this task stops.** This task owns the file from the H1 down to, but not including, `## How it is measured`. `## How it is measured`, `## Two ledgers`, `## Scope and limits` and `## Where to read more` belong to Task 6, and this task leaves them byte-identical. The README's `[Scope and limits](#scope-and-limits)` links may stay as they are, because Task 6 keeps that heading.

**Invariants this task must keep** (the story index's `## Context` names who cites each):

- `## Quick start` keeps its exact heading text, and the lettered steps **A–F** stay beneath it (cited by `cli/README.md`).
- Every command an adopter is told to run keeps the `npx autonomous-sdlc-harness …` form (cited by `cli/src/commands/init.ts` and `cli/test/profile.test.mjs`).
- The plugin paragraph under the diagram still says the plugin carries the two flow documents alongside its other process assets (agents, slash commands, hooks, instructions, samples, helper scripts). `plugin/docs/README.md` says *"the repository's root README frames the flow documents that way"*, so that sentence may not be dropped even though `plugin/README.md` repeats the inventory.
- No caveat sits between the checklist's first step and its fifth.
- No new `item <N>` phrase (`docs/development.md` §6's legend rule).

### Targets

- `README.md` — from the H1 through the end of `## Quick start`.

**Work:**

- [ ] **Three plain lines, directly under the H1.** Replace the current opening paragraph with three short plain sentences, each on its own line or as a three-sentence paragraph. They say: what it is (an autonomous delivery harness for Claude Code), what goes in and what comes out (a change request in; a planned, implemented, independently reviewed branch pushed and ready for human review out), and what an adopter installs (a Claude Code plugin and a Node CLI). No links, no caveats, no bold. A reader who stops there knows whether it is for them.
- [ ] **The five-step checklist, next.** A numbered list, one line each, each naming the lettered step below that details it:
  1. Install the plugin: `claude plugin marketplace add firu-daniel/autonomous-sdlc-harness`, then `claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness` (step A).
  2. Wire your repository: `npx autonomous-sdlc-harness init` (step B).
  3. Teach it the codebase: type `/harness-analyze` **in an interactive Claude Code session** opened on the repository, not in the terminal (step C).
  4. Verify: `npx autonomous-sdlc-harness doctor` (step D).
  5. Start the daemon: `npx autonomous-sdlc-harness daemon install`, then `npx autonomous-sdlc-harness daemon start` (step E).

  Steps 1 and 5 are each one short instruction made of two commands. That is deliberate: `daemon install` and `plugin install` do not stand on their own.
- [ ] **The caveats, directly below the checklist**, as a short bulleted block with a bold lead such as **Before you run it**. There are four bullets, each one or two sentences plus a link. (a) *Published:* the npm package and the marketplace are live, so the checklist runs as written, and `npm view autonomous-sdlc-harness version` answers with the version. (b) *Contributors:* a clone installs the plugin as a directory source, and the built CLI is `node cli/dist/cli.js`; link `docs/development.md` §1 and §5. (c) *Interactive only:* step 3's command answers `Unknown command` in a headless `claude -p` session; link `docs/development.md` §6. (d) *The `.claude/` write wall:* step 3 writes under `.claude/`, which no permission entry can open to an unattended run, and it fails silently there, so run it supervised and check the documents changed; link `docs/analyze.md` §3.
- [ ] **The diagram and the three paragraphs under it**, below the caveats and unchanged in content. Split each bold-led paragraph into short paragraphs of one idea each: what the plugin carries, what the CLI carries and why it is a separate package, and how a drop becomes a pushed branch. Keep every link each paragraph carries today (`plugin/README.md`, `plugin/docs/README.md`, `docs/cli.md`, `cli/README.md`, `docs/watcher.md`, `plugin/docs/AUTONOMOUS_FLOW.md`). A sentence whose fact is already at one of those links may be dropped, except the plugin paragraph's flow-documents statement (see **Invariants**). Record it in the moved-facts table under **Verification**.
- [ ] **`## Quick start`.** The *Status* paragraph is gone from here: its fact is caveat (a), and its contributor-route sentence is caveat (b). *See it without adopting it* keeps its commands, cut to short sentences. In *Adopting it in your own repository*, each lettered step **A–F** keeps its bold `**X. …**` lead, gains *"(checklist step N)"*, and **drops every code block the checklist line already carries**. Step C keeps only the one-target form, `/harness-analyze <target>`, as its extra detail. What each step says becomes the detail: what `init` writes, what the analyze step fills, what `doctor`'s exit status means, launchd versus systemd, *"Then just ask for the change"*, and step F's teammate path, which keeps *"accept the workspace trust dialog"* and `/reload-plugins` because no other document states them. Step A's contributor paragraph shrinks to the pointer caveat (b) already gives, and step C's two-limits sentence shrinks to a pointer to caveats (c) and (d).

**Verification:**

- `sed -n '1,/^## /p' README.md` shows the H1, the three lines, the checklist and the caveat block, in that order, with nothing between checklist steps 1 and 5.
- **Moved-facts table.** In the task's final report, list every sentence removed from this region (diff against `git show dev:README.md`) beside where its fact now stands: a line kept in the README, or a linked document with its section. The expected homes are: *Status* → caveat (a) and `docs/development.md` §1/§5; step A's `marketplace add` accepted forms and the `file://` rejection → `docs/development.md` §1 (*"`file://` URLs are rejected outright"*); step A's gate-8 scratch wiring → `docs/development.md` §5 gate 8; step B's inventory → `docs/cli.md` §2; step C's what-it-may-write → `docs/analyze.md` §3; step D's checks → `docs/cli.md` §7; step E's launchd/systemd split → `docs/cli.md` §9; the conversational-offer wiring → `cli/templates/claude/CLAUDE.md` and `cli/templates/claude/harness-task-offer.md`; `<state_dir>` default → `docs/config.md` §3. A removed sentence with no home fails the task.
- `git grep -n -E "autonomous-sdlc-harness (init|doctor|daemon)" -- README.md` shows every hit prefixed by `npx`.
- `grep -n "^## \|^### " README.md` still lists `## Quick start`, `### See it without adopting it` and `### Adopting it in your own repository`, and everything from `## How it is measured` down is byte-identical to `dev`.
- `grep -n -E "items? [0-9]+" README.md` reports nothing the `dev` README did not.
- Every relative link in the region resolves: for each `](path)` target, `git ls-files --error-unmatch <path>` exits 0, or the target is a directory holding tracked files.
