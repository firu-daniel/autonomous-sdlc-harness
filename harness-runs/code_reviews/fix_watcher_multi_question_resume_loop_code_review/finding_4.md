### 4. The mode contract still says no file outside the plugin names the clarification-channel anchor, but `docs/watcher.md` now names it

**Files and sites:**
- `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors`. Four sentences are affected:
  - the bold Class (i-b) title: "the one out-of-scope file that mentions them, `autonomous-watcher.sh`, mentions them only in forms a move leaves true";
  - the *Reason* paragraph: "**No out-of-scope file resolves either anchor by a name a relocation would strand.** `autonomous-watcher.sh` is the only out-of-scope file that mentions them at all";
  - the paragraph after it: "Relocating either therefore needs **no** `autonomous-watcher.sh` edit — **every** site a move would falsify is in scope.";
  - the same paragraph: "What makes this the cheapest of the anchor follow-ups is that the whole repoint set is in scope, **not** that it is short."
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → the paragraph **What `<scripts_dir>/autonomous-watcher.sh` resolves — and what it does not.**: "and every citer a **rename** would strand is in scope".

**Problem.** Task 12 added a citation to `docs/watcher.md` → `## 4. Pausing, parking and the usage gate`: "The protocol itself is the plugin's (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`)". That cites one of Class (i-b)'s two anchors by file **and** heading, from a file outside the plugin. It is not the only such citer. `.claude/context/plugin.md` → `## The placeholder vocabulary` has cited the same file and heading since before this branch: `git grep -n "Clarification channel" dev -- . ':!plugin' ':!harness-runs'` already returns it on `dev`. Neither document ships: `docs/` and `.claude/context/` are in neither the plugin nor the `cli/package.json` `files` list.

The five sentences above all say that nothing out of scope is stranded by a relocation or rename. The branch adds a second citer that such a move would strand, so the claim is now false in two ways. It is also a closed claim ("the one", "the only", "every citer"), and the same paragraph says that no list of this set is closed.

**Who gets it wrong:** a maintainer relocating or renaming the channel section. That is the follow-up this section describes. If they believe the contract, they repoint only the plugin citers. `docs/watcher.md` §4 and `.claude/context/plugin.md` would then point at a heading that no longer exists. The citations follow the house citation form and should stay. The contract text is what is wrong.

The scope register's row 5 marked `mode_contract.md` `no-change` because the channel's file names and pairing were kept. It did not account for the citation Task 12 added.

**Fix.** Limit each "nothing out of scope is stranded" claim to **shipped** files. Name the non-shipped citers only as examples, and never as a closed set or a count. Every replacement below is exact text. Each "before" string occurs once in its file.

- [ ] **Class (i-b) bold title** (`plugin/instructions/mode_contract.md`). Replace:

  `without stranding anything out of scope: the one out-of-scope file that mentions them, `autonomous-watcher.sh`, mentions them only in forms a move leaves true.**`

  with:

  `without stranding anything shipped out of scope: no shipped out-of-scope file names either one by file or heading, and `autonomous-watcher.sh`, whose headless prompt is built around them, mentions them only in forms a move leaves true.**`

- [ ] **Reason paragraph, first sentences** (same file). Replace:

  `**No out-of-scope file resolves either anchor by a name a relocation would strand.** `autonomous-watcher.sh` is the only out-of-scope file that mentions them at all, and it names **neither the file nor any heading**:`

  with:

  `**No shipped out-of-scope file resolves either anchor by a name a relocation would strand.** `autonomous-watcher.sh`, the shipped out-of-scope file whose headless prompt is built around them, names **neither the file nor any heading**:`

  (This drops "the only … that mentions them at all" instead of qualifying it. Shipped files outside the plugin also mention the channel in lowercase prose, for example `cli/templates/state-dir/README.md` and the doctor and generator modules under `cli/src/`. So "the only shipped out-of-scope file that mentions them" would be false as well.)

- [ ] **Reason paragraph, closing sentence** (same file). Directly after the sentence that ends `…their index pairing and the watcher's park/resume detection breaks with it.`, append (with a leading space):

  ` Documents in the harness repository that do not ship are a different matter: some cite the channel anchor by file **and** heading — for example `docs/watcher.md` → `## 4. Pausing, parking and the usage gate` and `.claude/context/plugin.md` → `## The placeholder vocabulary` — and a relocation or rename strands them exactly as it strands an in-scope citer. The same repo-wide grep that finds the in-scope set finds them.`

- [ ] **Relocation sentence** (same file). Replace:

  `Relocating either therefore needs **no** `autonomous-watcher.sh` edit — **every** site a move would falsify is in scope.`

  with:

  `Relocating either therefore needs **no** `autonomous-watcher.sh` edit — **every** shipped site a move would falsify is in scope, and the non-shipped documents that cite either anchor are repointed in the same move.`

- [ ] **"Cheapest" sentence** (same file). Replace:

  `What makes this the cheapest of the anchor follow-ups is that the whole repoint set is in scope, **not** that it is short.`

  with:

  `What makes this the cheapest of the anchor follow-ups is that every shipped citer in the repoint set is in scope, **not** that the set is short.`

- [ ] **The owning fork** (`plugin/instructions/task_plan_writing_instructions_autonomous.md`). Replace:

  `and every citer a **rename** would strand is in scope:`

  with:

  `and every shipped citer a **rename** would strand is in scope (documents in the harness repository that do not ship also cite the channel heading — for example `docs/watcher.md` and `.claude/context/plugin.md` — and the same repo-wide grep finds them):`

- [ ] **Verify.** From the checkout root, run both sweeps:
  1. `git grep -n "task_plan_writing_instructions_autonomous\|Clarification channel — file format\|Ask-vs-assume policy" -- . ':!plugin' ':!harness-runs'`. Every hit must be in a non-shipped path: under `docs/` or `.claude/`, or a root-level document. No hit may be under `cli/templates/`, `cli/src/` or `cli/scripts/`. The `.claude/context/conventions.md` hit cites the file for commit trailers and names neither anchor heading, so it is not a citer of either anchor.
  2. `git grep -in "clarification channel" -- . ':!plugin' ':!harness-runs'`. Every hit must be one of three kinds: `autonomous-watcher.sh` (either copy), which is lowercase prose and the ownership-disclaiming comment; another shipped file under `cli/` whose mention is lowercase prose that names neither the owning file nor a heading; or a non-shipped document. The amended text covers each kind. If any shipped hit names the owning file or the heading, stop and report it: the "shipped" qualifier would then be false.
