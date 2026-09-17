`chore_plugin_prefix_command_sweep` pays the debt `docs/development.md` → `## 6. The roadmap this tree defers to`
records as *"A third debt belongs to no row at all"*. The tree names the plugin commands it ships without the
prefix they are reached by. Once the plugin is installed, every command resolves as
`/autonomous-sdlc-harness:<name>`.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

---

## Why now

An adopter who copies `/harness-analyze` from the `README.md` checklist and pastes it has to rely on the
interactive `/` picker to match it to the prefixed command. That match has only been measured for the bare
name with no argument. The README's own scope bullet *"Every documented `/autonomous-sdlc-harness:…` slash
spelling is interactive-only"* talks about prefixed spellings the README no longer shows. The debt paragraph
also says a partial fix would leave two spellings in one set of documents, so the whole tree is done in one
branch.

## What to deliver

1. **Human-facing sites use the prefixed spelling.** This covers every place a person reads a command name and
   types or pastes it into a session. That includes the `README.md` checklist at the top (step 3
   `/harness-analyze`), the quick start steps under `### Adopting it in your own repository` (including
   `/harness-analyze <target>`), the README's `/branch-prompt` and `/branch-user-review` mentions, the README
   scope bullet above, `llms.txt`, `ARCHITECTURE.md`, `docs/`, `schemas/`, `evals/`, `examples/notes-app/README.md`,
   the `plugin/` READMEs and docs, the `cli/` output strings and templates that print a command for a person,
   and each command's own `**Usage:**` line under `plugin/commands/`.
2. **Model-read sites get a decision, not an automatic swap.** Some sites are instruction text that an agent
   reads and acts on, not text a person retypes. Examples are the flow instructions under `plugin/instructions/`,
   the agent definitions, and `cli/templates/claude/harness-task-offer.md`, which already names the skill as
   `{{pluginName}}:branch-prompt` and says *"the bare name is not valid"*. For each class of site, decide the
   spelling from what an agent actually needs in order to invoke the command, and record the rule once.
3. **The three watcher first-message strings get a decided invocation route.** These are `ENGINE_COMMAND_TASK`,
   `ENGINE_COMMAND_USER_REVIEW` and `ENGINE_COMMAND_DOCS` in `cli/templates/scripts/autonomous-watcher.sh`. They
   are interpolated mid-sentence into `launch_prompt` (*"Run the autonomous engine command … on the current
   branch …"*). Unattended runs in this repository launch successfully with the bare spelling today, and the
   `fix_line_number_citations_never_block` and `feat_readme_summary_compact_llms_txt` runs both completed. Use
   that as evidence of what works, measure the prefixed spelling on the same path, and keep or change the
   strings based on the result.
4. **The debt paragraph is closed.** The *"A third debt"* paragraph in `docs/development.md` §6 records that the
   sweep ran, the rules it applied and the measurements it rests on. It no longer describes the work as owed.
   The README bullet under `### Measured while building that evidence, and not fixed here` and the matching
   measurement text in `docs/development.md` §6 say the same thing.
5. **A check keeps the spellings from drifting apart again.** Add it where this repository's other gates live
   (`scripts/run-gates.sh`). It fails on a bare `/branch-*` or `/harness-analyze` spelling at a human-facing
   site, and it exempts the carve-outs below and whatever model-read classes §2 decides stay bare.

## Carve-outs, kept bare on purpose

These are the two regions the debt paragraph excludes. Keep them excluded unless the plan shows the reason no
longer holds.

- `docs/development.md` §5 gate 8's `/harness-analyze --dry-run` and `/harness-analyze` block.
- Everything under `examples/notes-app/` that `init`, the analyze command or the captured run wrote: the
  generated `.claude/` documents and the `sdlc-harness/` run artifacts. They are a capture, and editing them
  falsifies it. `examples/notes-app/README.md` is not part of the capture and is inside the sweep.

Run artifacts under `harness-runs/` are records of past runs and are not swept either.

## Establish, do not assume

- **The current site set.** Re-derive it with
  `grep -rlE '/(branch-[a-z-]+|harness-analyze)' . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=harness-runs`.
  The debt paragraph's 80 and 73 counts are from 2026-09-07 and the tree has grown since. The plan lists each
  file with its class: human-facing, model-read, watcher string or carve-out.
- **What a pasted command with an argument does interactively.** Find out what happens when
  `/harness-analyze presentation` or `/autonomous-sdlc-harness:harness-analyze presentation` is pasted into an
  interactive session and submitted. The picker may close at the space. An unattended run cannot drive an
  interactive session, so if the run cannot measure this, it says so in the Done summary and in the debt
  paragraph as an open measurement. It does not guess.
- **The headless `claude -p` leg under the current slug.** It was last measured under the former slug `harness`.
  Re-run it if the permission profile allows, and record the Claude Code version. Otherwise record it as not
  re-run.
- **Whether any test pins a bare spelling.** Check `cli/test/` for assertions on `ANALYZE_INVOCATION`, the
  watcher's `launch_prompt` or `init`'s closing report, so they are updated together with what they quote.
- **Whether `plugin/commands/*.md` front matter or file names change.** They should not: the prefix comes from
  the plugin, not the file. Confirm that nothing under `plugin/` is renamed.

## Out of scope

- Renaming any command, skill or plugin.
- Changing what any command does.

## Acceptance

1. The re-derived grep shows no bare spelling at a human-facing site outside the carve-outs.
2. The `README.md` checklist step 3 and the quick start show `/autonomous-sdlc-harness:harness-analyze`.
3. The new drift check passes on the swept tree, and fails when a bare `/harness-analyze` is planted in
   `docs/cli.md` (remove it afterwards and record the output).
4. The watcher strings' route is decided from a recorded measurement, and an unattended run launched after the
   change reaches its first phase.
5. `docs/development.md` §6 no longer lists the sweep as owed, and records every measurement the branch took or
   could not take.
6. `bash scripts/run-gates.sh` prints no new failure.
