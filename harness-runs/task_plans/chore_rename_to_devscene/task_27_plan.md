### Task 27 — Mark the example's capture as historical, respell its live files, and record the example `.claude/` paste

**Goal:** `examples/notes-app/` says, in one line, that its run was captured under the product's earlier name. Its live, `init`-rendered files outside `.claude/` carry the new name. Its live files under `.claude/` get an exact paste the maintainer applies. Its frozen capture is untouched. Apply the spelling table in the story index's `## Context`.

**Depends on:** Task 3 (the renamed `.claude/`, `githooks/`, `repo/` and state-dir templates), Task 6 (the renamed `start-dev-server.sh`, `test.sh` and `typecheck.sh` headers), Task 1 (the `.gitignore` block header) and Task 14 (`firu-daniel/devscene`). This directory's README holds its kept rendered files to their templates (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*), so each live file moves exactly as its template moved.

**What is capture and what is live, per the example's own README.**

- **Capture, never edited:** `sdlc-harness/**`, and the prose of `.claude/CLAUDE.md` and `.claude/context/*.md`. Their old-name hits stay. `sdlc-harness/lessons.md` is captured too. Its README sentence claiming byte identity with `cli/templates/state-dir/lessons.md` is corrected instead, below.
- **Live, edited here:** `.gitattributes`, `.gitignore`, `.mcp.json`, `githooks/pre-push`, `scripts/start-dev-server.sh`, `scripts/test.sh`, `scripts/typecheck.sh` and `README.md`.
- **Live, under `.claude/`, never written by this task:** `.claude/settings.json`, `.claude/settings.autonomous.json`, `.claude/harness-task-offer.md`, `.claude/push-notify.env.example`, `.claude/qa-accounts.env.example` and `.claude/qa_test_scenarios.md`. The tool layer refuses an agent's write under `.claude/**`, so this task records their paste and the maintainer applies it.

### Targets

- `examples/notes-app/README.md`
- `examples/notes-app/.gitattributes`, `examples/notes-app/.gitignore`, `examples/notes-app/.mcp.json`, `examples/notes-app/githooks/pre-push`
- `examples/notes-app/scripts/start-dev-server.sh`, `examples/notes-app/scripts/test.sh`, `examples/notes-app/scripts/typecheck.sh`
- `harness-runs/task_plans/chore_rename_to_devscene/task_27_plan.md`: this file, which gains a `## Paste record` section at its end

**Work:**

- [ ] `README.md`, the historical-name line: add **one physical line**, as its own paragraph directly after the paragraph opening **The capture is frozen; the fixture is live.**: *"**The capture predates the rename.** The run was captured under the product's earlier name, `autonomous-sdlc-harness`, so the captured artifacts name the CLI, the plugin and its commands that way; the product is now DevScene (`devscene`), and nothing in the capture was respelled."* This is the one line in the tree that keeps the old literal on purpose.
- [ ] `README.md`, the other hits: respell *"from `cli/templates/` by `devscene init`"*, the analyze-offer line (`/devscene:harness-analyze`), point 3's *"without the `/devscene:` plugin prefix this file writes it with"*, and point 4's `/devscene:harness-analyze`. Rewrite the residual paragraph to say `.claude/settings.json`'s `"repo": "firu-daniel/devscene"` is the product's published marketplace slug. Correct the `lessons.md` passage — the sentences from *"`diff cli/templates/state-dir/lessons.md sdlc-harness/lessons.md` exits 0 with no output"* through *"that `diff` is expected to stay empty."* — which is already false at `HEAD`. Its replacement says: that `diff` prints exactly two line pairs and nothing else, and both differences sit in the template while the capture is unchanged. (a) The opening **What this is.** paragraph: the template's wording was revised after the capture was taken, so the template ends it *"…or a run in a second run copy — the working copy the watcher prepares for one run — appends its lesson to the wrong branch."* and the capture ends it *"…or a run in a second working copy appends its lesson to the wrong branch."* (b) The closing `_Written by …_` line, which differs only in the product name: the template's reads `devscene init` after Task 3, while the capture's keeps the product's earlier name (the historical-name paragraph above gives that spelling). Write this passage without quoting the old literal: the historical-name line is the only README line that may carry it, and the first `**Verification:**` bullet below checks that. Keep the passage's point that carrying the ledger restores the capture rather than editing it, and that any further template change shows up as a third pair in that `diff`.
- [ ] Live files: `.gitattributes` line 1 and `githooks/pre-push`'s header take their templates' renamed text. `.gitignore`'s first line becomes the new managed-block header. `.mcp.json` → `_comment` takes `cli/templates/repo/mcp.json`'s renamed `_comment` text, keeping this copy's own `args` serialisation. The three `scripts/*.sh` header lines become `# Written by \`devscene init\`, …`.
- [ ] Append `## Paste record` to this file. Reader: the maintainer applying it under `examples/notes-app/.claude/`. Put each span in a fenced block: (1) the whole intended `.claude/settings.json`, with `enabledPlugins` key `devscene@devscene`, `extraKnownMarketplaces` key `devscene` and `repo` `firu-daniel/devscene`, every other byte as at `HEAD`; (2) for `.claude/settings.autonomous.json`, each line carrying the old name with its replacement, both in full; (3) the same for `.claude/harness-task-offer.md`, `.claude/push-notify.env.example`, `.claude/qa-accounts.env.example` and `.claude/qa_test_scenarios.md`. Then state the `git grep -n -F 'autonomous-sdlc-harness' -- examples/notes-app/.claude` result expected after the paste: only `examples/notes-app/.claude/CLAUDE.md`, which is capture.
- [ ] Confirm the JSON spans parse: write each to `harness-runs/scratch/` and parse it with `node -e "JSON.parse(require('fs').readFileSync('<path>','utf8'))"`, one plain command each, then delete the scratch copies.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- examples/notes-app ':!examples/notes-app/.claude' ':!examples/notes-app/sdlc-harness'` prints exactly the one historical-name line in `README.md`.
- `git status --short -- examples/notes-app/.claude examples/notes-app/sdlc-harness` prints nothing: no captured file and no `.claude/` file was written.
- `git diff --no-index cli/templates/state-dir/lessons.md examples/notes-app/sdlc-harness/lessons.md` shows exactly the two line pairs the README now describes and nothing else: (a) the **What this is.** paragraph, `-` ending *"…or a run in a second run copy — the working copy the watcher prepares for one run — appends its lesson to the wrong branch."* and `+` ending *"…or a run in a second working copy appends its lesson to the wrong branch."*; (b) the closing `_Written by …_` line, `-` carrying `devscene init` and `+` carrying `autonomous-sdlc-harness init`, every other byte of the pair equal. Every `-` line is the template's and every `+` line the capture's; `git status --short -- examples/notes-app/sdlc-harness` (above) confirms the capture side was not written.

**Deviations from plan:**

- The `.mcp.json` respelling was refused: two `Edit` attempts on `examples/notes-app/.mcp.json` (one `replace_all`, one single-occurrence) both returned *"Permission to use Edit has been denied because Claude Code is running in don't ask mode."* The same tool wrote every other live file in this task, so the refusal is path-specific. The run's permission profile (under `~/.local/state/autonomous-sdlc-harness/run-profiles/`) could not be read either, by `Read` or `grep` — both refused — and `grep -rn -F 'mcp.json' .claude` over the run copy's own `.claude/` matched nothing. So the refusal's source is unconfirmed, and this is not dispositioned as a standing prohibition. The `.mcp.json` line goes into `## Paste record` below as span (4), for the maintainer to apply alongside the `.claude/` spans. Until it lands, the first `**Verification:**` bullet prints the two `.mcp.json` `_comment` hits as well as the README's historical-name line.
- The scratch copies were not deleted. `rm` on `harness-runs/scratch/task27_settings.json` and `harness-runs/scratch/task27_paste_check.mjs` was refused (*"Permission to use Bash has been denied"*), and both files are untracked and absent from `git status --short`, so neither reaches a commit. The JSON-span check rests on two runs. `node -e "JSON.parse(...)"` on the scratch copy of span (1) exited 0. Then `bash scripts/scratch-run.sh harness-runs/scratch/task27_paste_check.mjs <root>` printed `ALL OK`. It checked that every `before` line equals its file's line at `HEAD`. It checked that every `after` equals its `before` with the old name replaced by `devscene`, and that every `.json` `after` line parses. It also checked that the spans cover every old-name line in the six target files.

## Paste record

**Reader:** the maintainer applying these edits by hand under `examples/notes-app/` before merge. An agent's write there is refused (`.claude/**` by the tool layer; `.mcp.json` per the deviation note above). Each span is old name → `devscene` per the story index's spelling table, and every other byte stays as at `HEAD`.

### (1) `examples/notes-app/.claude/settings.json` — the whole intended file

```json
{
  "enabledPlugins": {
    "devscene@devscene": true
  },
  "extraKnownMarketplaces": {
    "devscene": {
      "source": {
        "source": "github",
        "repo": "firu-daniel/devscene"
      }
    }
  },
  "permissions": {
    "allow": [
      "Bash(bash scripts/task-offer-check.sh)"
    ]
  }
}
```

### (2) `examples/notes-app/.claude/settings.autonomous.json` — four lines, each replaced whole

Line 4, before:

```text
    "UNATTENDED SETTINGS PROFILE - written by `autonomous-sdlc-harness init`, and yours from there on: edit it freely, a re-run keeps your copy. It is selected per run with `--settings` - a remote job passes this file, and the run watcher passes a per-run copy rendered from it - and is never installed as the interactive default, so dropping that flag reverts every grant below with nothing to undo.",
```

Line 4, after:

```text
    "UNATTENDED SETTINGS PROFILE - written by `devscene init`, and yours from there on: edit it freely, a re-run keeps your copy. It is selected per run with `--settings` - a remote job passes this file, and the run watcher passes a per-run copy rendered from it - and is never installed as the interactive default, so dropping that flag reverts every grant below with nothing to undo.",
```

Line 11, before:

```text
    "THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS, AND THE REST GET NOTHING: `autonomous-sdlc-harness init` writes a second family of scripts into scripts whose bodies ship fixed and read `harness.config.json` at run time rather than carrying a command line of yours. Only the ones a dispatched agent or the orchestrating session is itself the thing that runs are listed here - the orchestrating session runs four of them, the flow walker `flow-walker.sh`, the prompt-injection screen `prompt-injection-screen.sh`, the test-suite runner `run-test-suite.sh` and the gate launcher `launch-sandboxed-gates.sh`, on a bubblewrap host - and they are in `allow` rather than `ask` because they sit on the unattended commit, planning or gate-run path, where an `ask` is evaluated first and refuses the call. The run watcher, the worktree tooling and the cleanup sweep are started by the watcher process or by you, and `remote-run.sh` by the watcher, the remote job or you; they carry no entry on purpose: one would hand a dispatched agent a path to a branch deletion, a daemon restart or a remote run dispatch. The docs-retrieval server launcher carries no entry either, for a different reason: the agent runner starts it from `.mcp.json` when docs.retrieval is on, never a dispatched agent's Bash call, and the one tool it serves, `search_docs` on the `harness-docs` server, is granted by the retrieval fragment's entry for it instead. Adding an entry for one of them is a decision to let an agent run it - make it deliberately, in the same forms as everything else here.",
```

Line 11, after:

```text
    "THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS, AND THE REST GET NOTHING: `devscene init` writes a second family of scripts into scripts whose bodies ship fixed and read `harness.config.json` at run time rather than carrying a command line of yours. Only the ones a dispatched agent or the orchestrating session is itself the thing that runs are listed here - the orchestrating session runs four of them, the flow walker `flow-walker.sh`, the prompt-injection screen `prompt-injection-screen.sh`, the test-suite runner `run-test-suite.sh` and the gate launcher `launch-sandboxed-gates.sh`, on a bubblewrap host - and they are in `allow` rather than `ask` because they sit on the unattended commit, planning or gate-run path, where an `ask` is evaluated first and refuses the call. The run watcher, the worktree tooling and the cleanup sweep are started by the watcher process or by you, and `remote-run.sh` by the watcher, the remote job or you; they carry no entry on purpose: one would hand a dispatched agent a path to a branch deletion, a daemon restart or a remote run dispatch. The docs-retrieval server launcher carries no entry either, for a different reason: the agent runner starts it from `.mcp.json` when docs.retrieval is on, never a dispatched agent's Bash call, and the one tool it serves, `search_docs` on the `harness-docs` server, is granted by the retrieval fragment's entry for it instead. Adding an entry for one of them is a decision to let an agent run it - make it deliberately, in the same forms as everything else here.",
```

Line 29, before:

```text
    "THE BROWSER HALF, ADDED ONLY WHEN TWO CONDITIONS BOTH HOLD - THE INTERACTIVE TEST PHASE IS ENABLED, AND ITS DRIVER IS THE BROWSER ONE: the `enabledMcpjsonServers` key, the `mcp__` entries at the end of `allow` and the port and liveness probes beside them were merged in because `phases.qa` was true AND `qa.driver` was `web-playwright` when this file was generated. Fail either condition and none of them is written at all, so an adopter who never drives a browser pays neither the browser tool schemas in every session's context nor a launched browser process. With a MOBILE driver that is not merely a saving: the mobile variants of the interactive test agent are declared-not-implemented in this release and carry built-ins-only tool allowlists, so a server started here would be one no agent could ever call - which is why the repository's own `.mcp.json` is withheld in the same run rather than left declaring servers this profile never starts. Turning the phase on in `harness.config.json`, or changing `qa.driver` to `web-playwright`, and re-running `autonomous-sdlc-harness init` does NOT rewrite this file — it is yours once written; copy the entries in from a fresh generation, or re-run it with --force, which takes a .bak first.",
```

Line 29, after:

```text
    "THE BROWSER HALF, ADDED ONLY WHEN TWO CONDITIONS BOTH HOLD - THE INTERACTIVE TEST PHASE IS ENABLED, AND ITS DRIVER IS THE BROWSER ONE: the `enabledMcpjsonServers` key, the `mcp__` entries at the end of `allow` and the port and liveness probes beside them were merged in because `phases.qa` was true AND `qa.driver` was `web-playwright` when this file was generated. Fail either condition and none of them is written at all, so an adopter who never drives a browser pays neither the browser tool schemas in every session's context nor a launched browser process. With a MOBILE driver that is not merely a saving: the mobile variants of the interactive test agent are declared-not-implemented in this release and carry built-ins-only tool allowlists, so a server started here would be one no agent could ever call - which is why the repository's own `.mcp.json` is withheld in the same run rather than left declaring servers this profile never starts. Turning the phase on in `harness.config.json`, or changing `qa.driver` to `web-playwright`, and re-running `devscene init` does NOT rewrite this file — it is yours once written; copy the entries in from a fresh generation, or re-run it with --force, which takes a .bak first.",
```

Line 33, before:

```text
    "THE PHASE'S OWN HELPER SCRIPTS ARE NOT ALLOW-LISTED HERE - ADD THEM BY HAND, ONCE: the port, dev-server and QA-user helpers this phase runs ship inside the harness plugin and are invoked as `bash ${CLAUDE_PLUGIN_ROOT}/scripts/<name>.sh`. Keeping the token in an entry rescues nothing, because the guard matches the raw command string and a substitution anywhere in that string defeats the match however the entry is worded (measured against `claude` 2.1.227, with the limits of that measurement recorded in the harness repository's own `docs/development.md` section 3). So each line you add must name a RESOLVED root - `Bash(bash <resolved plugin root>/scripts/<name>.sh:*)`, in the same unquoted form the wrapper entries above use, naming the script FILE rather than the directory holding it, because a directory-prefix entry was measured not to match either. That form is what a resolved command meets, whatever kind of file names the helper - an adoption run on 2026-08-26 reached three of them through it and stalled at none - but WHICH root it resolves to does depend on that: a helper named in an instruction file is resolved by the agent itself, one named in an agent definition body has the token substituted by the runtime, and on a directory-sourced marketplace those two were measured to be different directories. Add the line once per helper per root where they differ. `autonomous-sdlc-harness init` does not generate these lines, and an unknowable root is not the reason - it is recorded per plugin in the agent runner's own `installed_plugins.json`. What stops the generator is that `init` may run before the plugin is enabled, and that the path carries the plugin VERSION, so a line written once goes silently stale on the next upgrade. The resolving is therefore done at check time instead: run `npx autonomous-sdlc-harness doctor` and paste what its `plugin-permissions` check prints - it re-resolves both roots on every run and names each missing line exactly, grouped by root. The helper names are declared once, in the plugin's own `scripts/README.md`, and are deliberately not repeated here. Until those lines exist the phase's helper calls are refused, per the completeness line above. This file is written create-if-absent, so the lines you add survive every later `autonomous-sdlc-harness init`: a plain re-run keeps the whole file, and `--force`, the one run that regenerates it from the template after a .bak, re-reads it first and CARRIES FORWARD every `permissions.allow` entry naming a plugin root this machine still resolves - the lines above among them. The one it does not carry is an entry naming a root it no longer resolves, which is what a plugin upgrade leaves behind: that run names each entry it dropped, and `doctor` names them on every run after it. That exception applies only where the plugin DOES resolve on the machine running it - where none of its roots resolve at all, nothing there can tell a stranded entry from one you pasted a minute ago, so the run carries every absolute entry outside the checkout forward UNVERIFIED and says so in those words.",
```

Line 33, after:

```text
    "THE PHASE'S OWN HELPER SCRIPTS ARE NOT ALLOW-LISTED HERE - ADD THEM BY HAND, ONCE: the port, dev-server and QA-user helpers this phase runs ship inside the harness plugin and are invoked as `bash ${CLAUDE_PLUGIN_ROOT}/scripts/<name>.sh`. Keeping the token in an entry rescues nothing, because the guard matches the raw command string and a substitution anywhere in that string defeats the match however the entry is worded (measured against `claude` 2.1.227, with the limits of that measurement recorded in the harness repository's own `docs/development.md` section 3). So each line you add must name a RESOLVED root - `Bash(bash <resolved plugin root>/scripts/<name>.sh:*)`, in the same unquoted form the wrapper entries above use, naming the script FILE rather than the directory holding it, because a directory-prefix entry was measured not to match either. That form is what a resolved command meets, whatever kind of file names the helper - an adoption run on 2026-08-26 reached three of them through it and stalled at none - but WHICH root it resolves to does depend on that: a helper named in an instruction file is resolved by the agent itself, one named in an agent definition body has the token substituted by the runtime, and on a directory-sourced marketplace those two were measured to be different directories. Add the line once per helper per root where they differ. `devscene init` does not generate these lines, and an unknowable root is not the reason - it is recorded per plugin in the agent runner's own `installed_plugins.json`. What stops the generator is that `init` may run before the plugin is enabled, and that the path carries the plugin VERSION, so a line written once goes silently stale on the next upgrade. The resolving is therefore done at check time instead: run `npx devscene doctor` and paste what its `plugin-permissions` check prints - it re-resolves both roots on every run and names each missing line exactly, grouped by root. The helper names are declared once, in the plugin's own `scripts/README.md`, and are deliberately not repeated here. Until those lines exist the phase's helper calls are refused, per the completeness line above. This file is written create-if-absent, so the lines you add survive every later `devscene init`: a plain re-run keeps the whole file, and `--force`, the one run that regenerates it from the template after a .bak, re-reads it first and CARRIES FORWARD every `permissions.allow` entry naming a plugin root this machine still resolves - the lines above among them. The one it does not carry is an entry naming a root it no longer resolves, which is what a plugin upgrade leaves behind: that run names each entry it dropped, and `doctor` names them on every run after it. That exception applies only where the plugin DOES resolve on the machine running it - where none of its roots resolve at all, nothing there can tell a stranded entry from one you pasted a minute ago, so the run carries every absolute entry outside the checkout forward UNVERIFIED and says so in those words.",
```

### (3) The other four `.claude/` files — each line replaced whole

`examples/notes-app/.claude/harness-task-offer.md`, line 5, before:

```text
Written once by `autonomous-sdlc-harness init` and yours from there on. The fence fails closed: an agent that cannot read this file makes no offer and carries out the request in the session. That is a safety property, not the off-switch — deleting this file makes `doctor` warn and the next `init` writes it back. To stop being asked, answer **Don't ask again**, which writes the `.claude/harness-no-offer` marker at the main checkout's root; removing the `## Where a change request runs` section from `.claude/CLAUDE.md` turns the offer off for the repository.
```

Line 5, after:

```text
Written once by `devscene init` and yours from there on. The fence fails closed: an agent that cannot read this file makes no offer and carries out the request in the session. That is a safety property, not the off-switch — deleting this file makes `doctor` warn and the next `init` writes it back. To stop being asked, answer **Don't ask again**, which writes the `.claude/harness-no-offer` marker at the main checkout's root; removing the `## Where a change request runs` section from `.claude/CLAUDE.md` turns the offer off for the repository.
```

Line 22, before:

```text
- Invoke the `Skill` tool on `autonomous-sdlc-harness:branch-prompt`. Name it as the available-skills listing gives it; the bare name is not valid.
```

Line 22, after:

```text
- Invoke the `Skill` tool on `devscene:branch-prompt`. Name it as the available-skills listing gives it; the bare name is not valid.
```

Line 26, before:

```text
- Report one caveat: the command queues the drop and does not launch the run — the watcher does. Where none is installed for this checkout the drop waits until one is, and `npx autonomous-sdlc-harness doctor` says which.
```

Line 26, after:

```text
- Report one caveat: the command queues the drop and does not launch the run — the watcher does. Where none is installed for this checkout the drop waits until one is, and `npx devscene doctor` says which.
```

Line 27, before:

```text
- If that skill is **not** in your listing: say the harness plugin is not loaded in this session, name the same `npx autonomous-sdlc-harness doctor` check, and stop. Hand over **no** slash command to type — the command and the skill are one plugin asset, so the line would error.
```

Line 27, after:

```text
- If that skill is **not** in your listing: say the harness plugin is not loaded in this session, name the same `npx devscene doctor` check, and stop. Hand over **no** slash command to type — the command and the skill are one plugin asset, so the line would error.
```

`examples/notes-app/.claude/push-notify.env.example`, line 5, before:

```text
# `autonomous-sdlc-harness init` adds the ignore line for it. Only the *path* is
```

Line 5, after:

```text
# `devscene init` adds the ignore line for it. Only the *path* is
```

`examples/notes-app/.claude/qa-accounts.env.example`, line 5, before:

```text
# version control; `autonomous-sdlc-harness init` adds the ignore line for it. Only the
```

Line 5, after:

```text
# version control; `devscene init` adds the ignore line for it. Only the
```

`examples/notes-app/.claude/qa_test_scenarios.md`, line 3, before:

```text
_Written once by `autonomous-sdlc-harness init`, and yours from there on: a checked-in file like any
```

Line 3, after:

```text
_Written once by `devscene init`, and yours from there on: a checked-in file like any
```

### (4) `examples/notes-app/.mcp.json` — line 2, replaced whole

Its `args` arrays stay one element per line, as at `HEAD`; only the two name occurrences in `_comment` change, which makes it `cli/templates/repo/mcp.json`'s renamed `_comment` text.

Line 2, before:

```text
  "_comment": "Browser wiring for the interactive test phase, written by `autonomous-sdlc-harness init` and merged rather than overwritten on a re-run: a server you add here survives, and one of these two is re-added only if it is missing. THE TWO SERVERS ARE SEPARATE BROWSER INSTANCES - each launches and drives its own browser, so a page one of them has navigated or signed in is not visible to the other, and a test that needs both drives each of them into the state it needs. BOTH RUN --isolated because each package otherwise defaults to one fixed persistent profile directory: a second instance started against a profile already in use refuses to launch, which is a failure that surfaces only when two runs overlap. THE VERSIONS ARE PINNED DELIBERATELY - a browser-automation server's tool names and flags change between releases, and an unpinned fetch would change what the phase can do without any edit here. Raise a pin as its own change, and re-check the tool names allow-listed in the generated permission profile when you do. NEITHER PACKAGE IS INSTALLED BY init - the `npx -y` above fetches each pinned spec from the registry the first time the interactive-test phase runs, so a machine that is offline, behind a proxy, or on a mirror that does not carry those exact versions fails at that first dispatch rather than at setup; `npx autonomous-sdlc-harness doctor --check-registry` answers it beforehand.",
```

Line 2, after:

```text
  "_comment": "Browser wiring for the interactive test phase, written by `devscene init` and merged rather than overwritten on a re-run: a server you add here survives, and one of these two is re-added only if it is missing. THE TWO SERVERS ARE SEPARATE BROWSER INSTANCES - each launches and drives its own browser, so a page one of them has navigated or signed in is not visible to the other, and a test that needs both drives each of them into the state it needs. BOTH RUN --isolated because each package otherwise defaults to one fixed persistent profile directory: a second instance started against a profile already in use refuses to launch, which is a failure that surfaces only when two runs overlap. THE VERSIONS ARE PINNED DELIBERATELY - a browser-automation server's tool names and flags change between releases, and an unpinned fetch would change what the phase can do without any edit here. Raise a pin as its own change, and re-check the tool names allow-listed in the generated permission profile when you do. NEITHER PACKAGE IS INSTALLED BY init - the `npx -y` above fetches each pinned spec from the registry the first time the interactive-test phase runs, so a machine that is offline, behind a proxy, or on a mirror that does not carry those exact versions fails at that first dispatch rather than at setup; `npx devscene doctor --check-registry` answers it beforehand.",
```

### Expected after the paste

`git grep -n -F 'autonomous-sdlc-harness' -- examples/notes-app/.claude` lists only `examples/notes-app/.claude/CLAUDE.md` (lines 41 and 66), which is capture. `git grep -n -F 'autonomous-sdlc-harness' -- examples/notes-app ':!examples/notes-app/.claude' ':!examples/notes-app/sdlc-harness'` lists only the historical-name line in `examples/notes-app/README.md`.
