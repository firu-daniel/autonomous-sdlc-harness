### Task 34 — Respell the example's live files and the examples README

**Goal:** Make the worked example's live files name its renamed config file `devscene.config.json` and its renamed state directory `devscene/`, the way `init` would render them now. Its README and the examples index point at the renamed files.

**Depends on:**
- Task 15, which moved `examples/notes-app/harness.config.json` to `devscene.config.json` (with `stateDir` `devscene`), moved the captured run to `examples/notes-app/devscene/`, and renamed `examples/devscene.config.json`.
- Tasks 8 and 9, whose templates these renders follow.

**Where this task stops.**
- The example's `.claude/` live renders are under `.claude/**`, which no task writes. They are in Task 35's `## Paste record`.
- The capture (the run artifacts, `.claude/CLAUDE.md` and `.claude/context/*.md`) is frozen and is not edited (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*).
- The README's paragraph *"The capture predates the rename"* keeps `autonomous-sdlc-harness`, the product's earlier name (row 2's exception in `## Context`'s spelling table), and gains no sentence.

### Targets

- `examples/README.md`
- `examples/notes-app/README.md`
- `examples/notes-app/.gitignore`
- `examples/notes-app/githooks/pre-push`
- `examples/notes-app/scripts/start-dev-server.sh`, `examples/notes-app/scripts/test.sh`, `examples/notes-app/scripts/typecheck.sh`

**Work:**

- [ ] `examples/notes-app/.gitignore`: apply rows 1, 2 and 5 to its managed block, so each state-directory rule names `devscene/` and the opt-out rule names `.claude/devscene-no-offer`. The block's other lines and the project section stay.
- [ ] `examples/notes-app/scripts/{start-dev-server,test,typecheck}.sh` and `githooks/pre-push`: apply row 1 to the root-resolution comment and the `[ -f "$candidate/devscene.config.json" ]` test. Keep the rendered command lines and the rendered protected-branch `case` arm.
- [ ] `examples/notes-app/README.md`: apply rows 1, 2, 4 and 6 everywhere except the *"The capture predates the rename"* paragraph's `autonomous-sdlc-harness`. That covers the `devscene/` mentions, `diff cli/templates/state-dir/lessons.md devscene/lessons.md`, the live-file list's `.claude/devscene-task-offer.md`, `/devscene:analyze` and `devscene.config.json`. `examples/README.md`: apply rows 1 and 2.
- [ ] The example's frozen `.claude/CLAUDE.md` still points at `.claude/harness-task-offer.md`. The paste record renames that live file, so after the paste the captured pointer names a path that no longer exists. Leave the capture as it is. Task 35's closing report lists the dangling pointer as a deliberate leftover.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-no-offer|harness-task-offer|harness-analyze' -- examples/README.md examples/notes-app/README.md examples/notes-app/.gitignore examples/notes-app/githooks examples/notes-app/scripts` prints only `examples/notes-app/README.md`'s `autonomous-sdlc-harness` line.
- `bash -n` on each of the three example scripts exits 0.
