### Task 26 — Re-render the worked example's profile and wrappers

**Goal:** `examples/notes-app/README.md` states that *"A change that adds or alters a token-carrying `cli/templates/` file still owes this directory the rendered artifact."* This branch alters three such templates:

- `cli/templates/claude/settings.autonomous.json` (Tasks 2, 3, 15, 23);
- `cli/templates/scripts/test.sh` and `typecheck.sh` (Task 17);
- `cli/templates/claude/harness-task-offer.md` (Task 17).

So the example's `.claude/settings.autonomous.json`, `scripts/test.sh`, `scripts/typecheck.sh` and `.claude/harness-task-offer.md` must carry what `init` would now render for that project, under the README's own `/workspace` substitution. These are scope register rows 95, 97 and 186.

**Depends on:** every task that changes those templates or the generators that fill them:

- **Task 15** — `"defaultMode": "dontAsk"`, the `THE PERMISSION MODE IS dontAsk:` line, and the rewritten `_README` lines. In the example's profile those are lines 5, 6, 9, 10 and 13, plus line 22, which is the qa fragment's helper-scripts line.
- **Task 2** — the `sandbox` block:
  - `enabled`, `failIfUnavailable`, `allowUnsandboxedCommands`, `autoAllowBashIfSandboxed`;
  - `excludedCommands` = `Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)` and the `refresh-branch.sh` twin;
  - `filesystem.allowWrite` = the state directory;
  - `network`, whose `allowedDomains` gains `127.0.0.1` because this project has `phases.qa` on with the `web-playwright` driver;
  - the `WebFetch`, `WebSearch` and network-client denies;
  - its `_README` lines.
- **Task 23** — `sandbox.credentials`, and the `Read(/<home>/<rest>)` / `Read(/<home>/<rest>/**)` denies with its `_README` line.
- **Task 3** — the write-protection `denyWrite` entries and their `Edit`/`Write` denies with its `_README` line.
- **Task 17** — the rewritten verdict-line sentence in `test.sh` and `typecheck.sh`, and the rewritten remote-address sentence in `cli/templates/claude/harness-task-offer.md` (*"A remote address is worse: …"*).

**Where this task stops.** The capture under `examples/notes-app/sdlc-harness/`, `.claude/CLAUDE.md` and `.claude/context/` are frozen (README → *"The capture is frozen; the fixture is live."*) and are not touched. The README itself needs no edit: its keep rule and its account of the substitution pass stay true. Re-read its *"The one edit the kept artifacts carry"* paragraph after the edit. If its stated occurrence counts are no longer true, that is a sentence this task falsifies: correct the figures, and keep the method.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`.
- `examples/notes-app/scripts/test.sh`.
- `examples/notes-app/scripts/typecheck.sh`.
- `examples/notes-app/.claude/harness-task-offer.md` — the remote-address sentence (row 186).
- `examples/notes-app/README.md` — only the occurrence figures, if they changed.

**Work:**

- [ ] Render the reference. Build the CLI with `commands.build` as written. Then run `init` for a fresh copy of the example's configuration in a scratch git repository under `harness-runs/scratch/notes-app-render/`, through the scratch-run route the conventions document names for running a file there. Copy in `examples/notes-app/harness.config.json` and the source tree `init` reads.

  If that route is refused, fall back to applying the template diffs by hand. Then say so under `**Deviations from plan:**`, with the refusal quoted.
- [ ] Apply the README's three-clause substitution to the reference profile. The scratch root becomes `/workspace/notes-app`, its parent `/workspace`, and the home directory and account name `/workspace` and `adopter`. Replace **only** what this branch changed in the example's profile:
  - the `_README` lines;
  - `permissions.defaultMode`;
  - the `deny` additions;
  - the whole `sandbox` object.

  Every other byte stays, including entries the capture's adopter carried.
- [ ] Replace the verdict-line sentence in `scripts/test.sh` and `scripts/typecheck.sh` with Task 17's rendered sentence, and the remote-address sentence in `.claude/harness-task-offer.md` with Task 17's rewritten sentence, byte for byte. The copy's one existing difference from the template, the resolved `{{pluginName}}` on the `Skill` line, stays.
- [ ] Remove `harness-runs/scratch/notes-app-render/` in the same session, on every exit path (`harness-runs/lessons.md` → *"A script that creates a temporary working copy … removes it on every exit path"*).

**Verification:**

- `grep -c -E '/Users/|/home/' examples/notes-app/.claude/settings.autonomous.json` prints `0`. No machine path leaked through the substitution.
- `node -e` parsing the profile with `JSON.parse` exits 0.
- `diff cli/templates/claude/harness-task-offer.md examples/notes-app/.claude/harness-task-offer.md` shows only the `{{pluginName}}` line, the one difference it showed before this branch.
- Its `sandbox.excludedCommands` entries begin `Bash(bash /workspace/notes-app/scripts/`. Its `permissions.defaultMode` equals the template's.
- Re-run derivation entry G's two commands with `-n` in place of `-l`, pathspec `examples/notes-app/.claude/settings.autonomous.json examples/notes-app/scripts`. The only remaining hits may be the profile's lines that register row 95 keeps (the qa fragment's un-loaded-tool, `await` and port-probe lines), plus the override clause of the mode line. `"defaultMode": "acceptEdits"` (row 155) must not remain.
- `npm run validate:config:example` is gate 9 leg (i), and it runs in the Run gates phase, not here. This task does not edit `harness.config.json`.

**Deviations from plan:**

- The reference was rendered through the scratch-run route as planned (`init --non-interactive --qa --no-analyze` in `harness-runs/scratch/notes-app-render/notes-app`, a `.mjs` that removed the directory in a `finally`). The rendered profile also carries six `allow` entries outside this branch's scope: the three forms each of `flow-walker.sh` and `run-test-suite.sh`, which predate the branch. Per "Every other byte stays" they were not added. The rendered `_README` line beginning "THE OUTER-LOOP SCRIPTS AN AGENT RUNS" was taken whole, because this branch rewrote it; its text names those two scripts, so the example's `allow` list does not match that line until the pre-branch drift is closed.
- The remote-address sentence was taken from the template as it stands, *"A remote address is no better: the unattended profile denies web access, so the fetch is refused."* The *"A remote address is worse: …"* text the Goal quotes is the old sentence the example carried before this task.
- README figures were corrected under the existing method (`grep -o` over the profile). The old figures (28 occurrences across 23 lines; 27 notes-app, 11 glob, 1 bare) were re-measured against `HEAD` and held. New figures: 106 across 91 lines; 75 `/workspace/notes-app` (19 glob), 30 home-directory, 1 bare. The README now also records that the home-directory clause fired on the re-render, because the credential `Read` denies name the home directory.
- Derivation entry G, run with `-n` over the targets: the remaining hits are lines 5, 6, 10 and 14 (`neither … allow … nor … deny` phrasing, which now says *refused*); line 6's override clause; lines 22 and 28 (sandbox and credentials `_README` lines that name the `PERMISSION_MODE=acceptEdits` override); lines 30, 31 and 32 (qa fragment, kept by row 95); and line 33's dated "stalled at none" measurement. Every one is byte-identical to the template's rendering. `"defaultMode": "acceptEdits"` is gone, and no hits were found under `scripts/`.
