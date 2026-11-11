### Task 15 — Respell the marker and workflow names in the plugin's agents, flow document and instructions

**Goal:** Make every plugin asset that quotes the review-round marker, the handle, the state labels or a workflow file name say the new name.

**Depends on:**
- Task 3: `remote-run.sh` writes the review-round line `<!-- devscene round collected_at=<utc> reviews=<ids> comments=<ids> -->` and steers runs from `@dev-scene <verb>` comments.
- Task 2: the workflow templates are `devscene-run.yml` (its step `Check out the run's branch` keeps that name), `devscene-resume.yml`, `devscene-trigger.yml` and `devscene-control.yml`.

**Where this task stops.** It respells literals only, and adds no words: each agent's word count stays as it is (`.claude/context/plugin.md` → `## Writing agent prose`). `plugin/commands/harness-read-mention.md`, `plugin/commands/README.txt` and `plugin/instructions/mention_reading.md` carry no old literal and are not targets: the handle reaches a mention session at run time as `comment.md`'s `handle:` line. Every `sdlc-harness` naming the `stateDir` default under `plugin/` stays (`## Context` → *What keeps its current spelling*).

### Targets

- `plugin/agents/prompt-injection-reviewer.md`
- `plugin/agents/user-review-fix-plan-writer.md`
- `plugin/docs/AUTONOMOUS_FLOW.md`
- `plugin/instructions/autonomous_pause_and_ledger.md`
- `plugin/instructions/prompt_injection_screen.md`

**Work:**

- [ ] `plugin/agents/prompt-injection-reviewer.md` and `plugin/agents/user-review-fix-plan-writer.md`: change the quoted `` `<!-- sdlc-harness round … -->` `` to `` `<!-- devscene round … -->` `` in both. The two files quote one wire literal, so they must stay byte-identical to each other at that span (`.claude/context/conventions.md` → *"The plugin corpus quotes its own literal wire strings across files"*).
- [ ] `plugin/docs/AUTONOMOUS_FLOW.md`:
  - in the remote-execution row, respell the four workflow file names, `` `@dev-scene` comment commands `` and `` `devscene: <state>` label ``, leaving `harness-task` unchanged;
  - in the park and pause paragraphs, respell `` `@dev-scene answer <n>` `` and `` `@dev-scene pause` ``.
- [ ] `plugin/instructions/autonomous_pause_and_ledger.md`: respell the usage-limit row's `` `devscene-resume.yml` poller ``. `plugin/instructions/prompt_injection_screen.md`: respell `` `devscene-run.yml` → **Check out the run's branch** ``.
- [ ] Before editing, run the wire-literal sweep `grep -rnE "<!-- sdlc-harness|@sdlc-harness|sdlc-harness: |harness-(trigger|run|control|resume)\.yml" plugin`. Take every file it lists. A file it lists that is not a target above is a finding to report, not a file to skip.

**Verification:**

- `grep -rnE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml" plugin` prints nothing.
- `grep -rnE "sdlc-harness([^/]|$)" plugin` prints only `stateDir`-default lines: `hooks/lib/harness-config-lib.sh`, `instructions/main_repo_resolution.md`, `scripts/release-qa-user.sh` and `scripts/reserve-qa-user.sh`.
- `grep -rn "<!-- devscene round … -->" plugin/agents` lists both agent files.
