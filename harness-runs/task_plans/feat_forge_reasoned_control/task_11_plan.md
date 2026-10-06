### Task 11 — Bring the other documents of record in line with mentions

**Goal:** Correct every document of record outside `docs/github-run-control.md` that this branch falsifies or leaves incomplete (scope register rows 6, 9, 27, 28, 30, 42, 43, 51, 70, 71 and 72). That covers four things: which job reads the credential secrets; the upgrade routes for an older `harness-control.yml` and for a pin older than mentions; `doctor`'s `forge` check; and the root-level lists of the plugin's assets, which must name the new command `/autonomous-sdlc-harness:harness-read-mention` (Task 8). It also adds the hand-run Gate 12 leg that will first observe a mention on a real repository.

**Depends on:**

- **Task 5.** `harness-control.yml`'s act step passes `IN_OAUTH` / `IN_API` from `secrets.CLAUDE_CODE_OAUTH_TOKEN` / `secrets.ANTHROPIC_API_KEY` on `issue_comment` events only. Three comment-only, `continue-on-error` steps install Node and `claude` and fetch the plugin. `Fetch the pinned plugin` clones the plugin at the release `harness-run.yml`'s `HARNESS_CLI_VERSION` pins. A pin older than this branch has no mention command, and `remote-run.sh control` then answers a mention that the plugin carrying the mention command is not available, naming that pin.
- **Task 6.** `doctor`'s `forge` check now warns when a present `harness-control.yml` carries neither `secrets.` reference. A mention is then answered that it was not read, the `@sdlc-harness <verb>` commands still work, and the route is `init --force`. Its pass line also names mentions.
- **Tasks 2–3, 7 and 8.** The mention path, and the plugin command `plugin/commands/harness-read-mention.md` with the instruction file it loads, `plugin/instructions/mention_reading.md`, that read a mention, as `docs/github-run-control.md` → `### Mentions read by an agent` (Task 9) describes them. Link there; do not restate it.

**Where this task stops.** Every rule of the mention path is cited to `docs/github-run-control.md` §1, §6 and §8 (Tasks 9–10), never restated. Rows of the scope register marked `no-change` are left alone. No outer-loop file is added by this branch, so `docs/watcher.md`'s script table is not touched.

### Targets

- `docs/remote-execution.md` — `### Every secret and variable` (the two credential rows) and `### Upgrading`.
- `docs/cli.md` — the `init` walkthrough's comment-command sentence and the `forge` check paragraph.
- `docs/team-accounts-research.md` — the *"Only the run job holds a Claude credential."* bullet (row 30), and `### Option B`'s `**What would change.**` bullet *"… no change, since none holds a credential."* (row 51).
- `docs/development.md` — Gate 12 observation `(xiv)`.
- `README.md` — the *"**The plugin carries the process assets a run executes.**"* paragraph (row 70) and the Mermaid diagram's `plugin/` node (row 71).
- `llms.txt` — the `plugin/` entry (row 72).

**Work:**

- [ ] **`remote-execution.md`.**
  - In the `CLAUDE_CODE_OAUTH_TOKEN` row's *Read by* cell, add *"and `harness-control.yml`'s act step, on `issue_comment` events only, for the mention agent ([`github-run-control.md`](github-run-control.md) → `## 6.`)"*. Leave the `ANTHROPIC_API_KEY` row's *"as above"* covering it, and make sure the *Required* cell still reads true: the job fails before launch applies to `harness-run.yml` only.
  - In `### Upgrading`, in the bullet list where *"An old `harness-trigger.yml` or `harness-control.yml`"* is described, add two bullets.
    - An old `harness-control.yml` with re-rendered scripts passes the agent no credential, so every mention is answered that it was not read, while the commands work. `doctor`'s `forge` check warns about it. The route is `init --force`, in a fenced block:

      ```
      npx autonomous-sdlc-harness@<version> init --force
      ```
    - A `harness-run.yml` pinned to a release older than mentions leaves the control job's plugin without the mention command, so a mention is answered that the plugin carrying it is not available. The route is the existing `init --upgrade-workflows` re-render this section already describes; cite it rather than restating it.
- [ ] **`docs/cli.md`.**
  - In the `init` walkthrough sentence *"a comment opening with `@sdlc-harness` and a verb steers the run"*, add that a mention anywhere else in a comment is read by an agent (`github-run-control.md` → `## 1.`).
  - In the `forge` check paragraph (*"`forge` never fails, and it is the key's reporter"*), add the new warning: when, what it says, and its `init --force` route. Also extend the pass description to name mentions, matching Task 6's text.
- [ ] **`docs/team-accounts-research.md`.** Two dated pointers, leaving each bullet's research text as recorded:
  - After the *"Only the run job holds a Claude credential."* bullet (`## 5.` → `### The repository facts the options rest on`), add one dated sentence: since `feat_forge_reasoned_control`, `harness-control.yml`'s act step also reads both secrets, on `issue_comment` events only, for the mention agent; the decision of record is [`github-run-control.md`](github-run-control.md) → `## 6.`.
  - After `### Option B`'s `**What would change.**` bullet *"`harness-trigger.yml`, `harness-control.yml`, `harness-resume.yml` and `authorise_actor`: no change, since none holds a credential."*, add one dated sentence: since `feat_forge_reasoned_control`, `harness-control.yml`'s act step holds the credential on `issue_comment` events for the mention agent, so under this option it would take the same credential kind as `harness-run.yml`; link [`github-run-control.md`](github-run-control.md) → `## 6.`.
- [ ] **`README.md` and `llms.txt`: the plugin's asset lists.** Each enumerates the plugin's commands as the `branch-*` commands plus `harness-analyze`; add the mention reader beside `harness-analyze` in each, leaving the rest of the list as it stands.
  - `README.md` → *"**The plugin carries the process assets a run executes.**"*: after *"the `/autonomous-sdlc-harness:harness-analyze` setup command,"* add *"the `/autonomous-sdlc-harness:harness-read-mention` command the control job runs to read a mention,"*.
  - `README.md` → the Mermaid diagram's `plugin/` node: add `harness-read-mention` beside `/autonomous-sdlc-harness:harness-analyze` on the same `<br/>`-separated line, keeping the node's line count; the diagram must still render (quote marks balanced, no new unescaped `"`).
  - `llms.txt` → the `plugin/` entry: after *"`/autonomous-sdlc-harness:harness-analyze`,"* add *"`/autonomous-sdlc-harness:harness-read-mention`,"*.
- [ ] **`docs/development.md` → `(xiv)`.** Add a mention leg in the observation's existing lettered-leg style, run on the run's pull request, with each `gh` command in a fenced block, one per line. It posts, in turn:
  1. `thanks @sdlc-harness`: no comment, job green;
  2. `The session parked. @sdlc-harness check the question and let me know`, on a parked run: one reply with the agent footer;
  3. `@sdlc-harness it hit the plan loop cap. If the question has an option to give it more rounds, give it three more`, on a parked run whose question offers that option: one `resume=answer` dispatch and a reply quoting the answer;
  4. `@sdlc-harness please stop this`: a confirmation reply and no `harness stop` run;
  5. `@sdlc-harness fix this`: the fixes reply;
  6. a mention on an issue with no run: today's refusal, and no agent run in that job's log;
  7. `@sdlc-harness pause`: no agent run in the log.

  It records, from each job's log:
  - the `claude --version` line;
  - the `Fetch the pinned plugin` step's outcome and the tag it cloned;
  - whether the session followed `/autonomous-sdlc-harness:harness-read-mention` (leg 2's reply carries agent-written text drawn from the context files, not a refusal), the observation that settles `docs/github-run-control.md` → `## 8.`'s slash-command row;
  - each decision line, together with whether it reads `from structured_output` or `from result`.

  That is the observation `github-run-control.md` → `## 8.` waits on. Add the leg to the list of what still owes a first recording, if the section keeps one for (xiv).

**Verification:**

- Re-run the scope register's derivation entry D2 verbatim from the story index. Every hit is ⊆ the register's rows. Rows 27, 28, 30 and 51 now state the new fact, and no hit outside the register states that only the run job reads the credential.
- Re-run the scope register's derivation entry D3 verbatim from the story index. Every hit is ⊆ the register's rows, and the hits on rows 70, 71 and 72 now name `harness-read-mention`.
- Every link this task writes resolves to an existing heading: `github-run-control.md` → `## 1.` and `## 6.`, and `remote-execution.md` → `### Upgrading`. Check each with `grep -n`.
- Every command an adopter or an operator is told to run sits in a fenced block, one command per line (lessons ledger, *Adopter-facing documentation*).
- `docs/cli.md`'s `forge` paragraph and `cli/src/doctor/checks.ts`'s new warning describe the same condition and route. Compare the two by reading them side by side.

**Deviations from plan:**

- `remote-execution.md` → `### Upgrading`: the two mention bullets sit in their own top-level bullet, *"Mentions reach each file only by that file's route too"*, directly after the allow-list bullet, rather than as sub-bullets of it. That bullet's lead scopes its list to *"a copy written before `HARNESS_RUN_ACTORS`"*, which the mention bullets are not.
- `remote-execution.md` → the `CLAUDE_CODE_OAUTH_TOKEN` row's *Required* cell now reads *"the `harness-run.yml` job fails before launch"*, so it stays true now that the *Read by* cell names two jobs.
- `development.md` → `(xiv)` leg (j): the legs before it end with the run's branch deleted, so leg (j) starts a second run (`<issue 2>`, `<slug 2>`, `<pr 2>`). Leg 6's *"no agent run"* is checked as *no decision line*, because the `claude --version` step runs on every `issue_comment` job (`cli/templates/github/workflows/harness-control.yml` → `Install the claude CLI when absent`). Leg 3's `resume=answer` dispatch is observed as one `harness run <slug 2>` run plus a `resumed` comment, since `gh run list` does not show inputs. The round 9 owes list gains leg (j), marked as added after that round.
