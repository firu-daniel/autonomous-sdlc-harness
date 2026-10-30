### 1. On a bubblewrap host the per-run copy still carries the run copy's own trio `Edit` rules, and on Linux they mount the placeholders that break git

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`run_profile_render`) — "def rules:" and ".permissions.deny |= add_absent([$e[] | rules[]])"; the same file's `run_profile_glob_drops` — "run_profile_glob_drops() {", and `run_profile_check` — "if ! drops=\"$(run_profile_glob_drops)\"; then"
**Also:** `cli/src/generators/writeProtection.ts` (`CopyGitPath.bubblewrapDenyWrite`'s doc comment) — "its `Edit` rules stay"; the same file's `applyWriteProtection` — "their \`Edit\` rules stay"; `cli/src/doctor/checks.ts` (the `profile-write-protection` check's pass message) — "and refuses a run copy carrying one"; `cli/templates/claude/settings.autonomous.json` → the `_README` line "TWO RESIDUALS, STATED RATHER THAN HIDDEN" — "while the `Edit` deny rules carry the same globs and hold everywhere"; the self-adopted copy `scripts/autonomous-watcher.sh`.

**What is wrong.** This was checked against the current tree. On a placeholder host (`HR_PLACEHOLDER_HOST` `1`), `run_profile_entries` marks the clone's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` lines `omit`. `run_profile_render` keeps those lines out of `denyWrite` (`select(.action != "omit")`). But it still appends **every** line's `Edit` rules to `.permissions.deny` (`[$e[] | rules[]]`, with no action filter). It also never removes the base profile's glob `Edit` rules for the trio, `Edit(//<work_root>/<project>-*/.git/commondir)` and its `/**` form, and the same pair for the other two. Those rules match the run copy too.

Session 1 of the user's 2026-10-30 review found the per-run profile carrying 18 trio `Edit` rules. Session 2, the control, removed only those 18. In that session the clone's `commondir` and `http-alternates` placeholders disappeared, the leftovers after the kill disappeared, and sandboxed `git status` in the clone exited 0. That is the measurement: on Linux, Claude Code also enforces an `Edit(...)` deny rule inside the bubblewrap sandbox. It mounts the same `/null` placeholder at an absent path inside a write root, globs included.

**Why dropping them costs nothing** (the user's reasoning, to be restated in the comments). On Linux the sandboxed shell can already write these three paths in the run copy, because no `denyWrite` entry names them there. The `Edit` rule only stops the file tools from doing the same thing. The protection that matters is the wrappers' trust check and the watcher's launch check, and both fail closed (`hr_clone_target_check_var`, condition 3; `spawn_engine`'s launch check).

**Fix.** Make every change only where `HR_PLACEHOLDER_HOST` is `1` and a run copy is given. macOS, any host the probe answers `0` for, and job mode (which passes the base unchanged and checks it with no `<copy>`) must stay byte-identical to today.

1. **Exact rules.** In `run_profile_render`, an `omit` line contributes no `Edit` rules either. Change the `permissions.deny` append to `add_absent([$e[] | select(.action != "omit") | rules[]])`. Update `run_profile_entries`' header, which today defines `omit` as the `denyWrite` entry only: on a placeholder host, `omit` now means the per-run copy carries neither the `denyWrite` entry nor the `Edit` rules for that run-copy path.
2. **The base's glob rules.** Add a sibling of `run_profile_glob_drops`, e.g. `run_profile_edit_drops`. On `HR_PLACEHOLDER_HOST` `1` it prints each string of `$SETTINGS_PROFILE`'s `.permissions.deny` that carries a `*` and is `Edit(/<g>)` or `Edit(/<g>/**)`, where `<g>` ends in `/<p>` for a `RUN_PROFILE_COPY_GIT_PATHS` row `<p>` marked `omit`. It prints them in base order, one per line, and never prints a string carrying a newline. Off a placeholder host it prints nothing. It returns 1 when the base is unreadable or `.permissions.deny` is neither absent nor a list. As with the `denyWrite` drops, read the rules off the base and never rebuild them from `projectName`.
   - `run_profile_render` removes exactly those strings from `.permissions.deny` before its appends.
   - `run_profile_check` removes the same strings from `$B`'s `.permissions.deny` when `<copy>` is given, exactly as it does for `$drop` in `denyWrite`.
   - Give a failure its own `RUN_PROFILE_REFUSAL` sentence.
   - The check must still refuse a copy that drops any other base `permissions.deny` entry.
3. **Sibling rules stay.** The sibling lines `run_profile_entries` emits are `entry deny`, so they keep both `Edit` forms. Finding 2 owns that guarantee and its test. Nothing here may filter them.
4. **The `.git/config`, `.git/hooks` and `.git/objects/info/alternates` rows** keep their `Edit` rules on every platform, exact and glob. Only the three `omit` rows are dropped.
5. **Comments.** Update the comments to say what the code now does, and why, citing the control (2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0):
   - the `THE PER-RUN PROFILE` banner;
   - `run_profile_render`'s header ("with exactly the run_profile_glob_drops strings removed …");
   - `run_profile_check`'s *"The base" is …* paragraph;
   - the `spawn_engine` launch-check comment;
   - `CopyGitPath.bubblewrapDenyWrite`'s doc comment in `writeProtection.ts`, which says "its `Edit` rules stay". Do **not** rename the field: the watcher mirror and `cli/test/watcher-run-profile.test.mjs` key on it.
   - The mirror declaration in `writeProtection.ts`'s module header stays accurate, but update the third-column wording there, because `omit` now covers the `Edit` rules too.
6. **Adopter-facing text.** Edit these three strings:
   - `applyWriteProtection`'s `_README` sentence, "…out of \`denyWrite\`, also leaves the base's sibling-glob entries … their \`Edit\` rules stay…";
   - `doctor`'s `profile-write-protection` pass message in `cli/src/doctor/checks.ts`;
   - the template `_README` line "TWO RESIDUALS, STATED RATHER THAN HIDDEN" in `cli/templates/claude/settings.autonomous.json`, which says the `Edit` deny rules "hold everywhere".

   Each must say all of the following:
   - On Linux, Claude Code enforces the `Edit` deny rules inside the sandbox too, mounting the same placeholder at an absent path inside a write root (measured 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0).
   - On a bubblewrap host, the per-run copy therefore also leaves out the run copy's own `Edit` rules for those three paths, the exact rules and the base's glob rules alike.
   - Each other sibling keeps them by exact path.

   Finding 3 refines the clause "refuses a run copy carrying one" afterwards. Keep it here as it is.
7. **What an unattended run cannot write.** The notes-app rendering `examples/notes-app/.claude/settings.autonomous.json` is under `.claude/`, and an unattended run's tool layer refuses it. Leave it for a manual re-render, as this branch's story plan already does under **Manual setup required**, and say so in the commit body.
8. **Tests.** Edit only these four test files:
   - `cli/test/watcher-run-profile.test.mjs`:
     - Extend `assertBasePlus`, or add a placeholder-host variant, so that on a placeholder host `permissions.deny` is the base minus the `Edit` drops, plus the `rules` of every non-`omit` entry.
     - Add a case showing `run_profile_check` accepting the placeholder-host render.
     - Add a case showing it refusing a copy that drops any other base `permissions.deny` string.
     - Add a case showing that with the seam off, the render is byte-identical to today's, `Edit` rules included.
     - Mirror the `globDrops` helper with an `editDrops` helper read off the base.
   - `cli/test/watcher-placeholder-host.test.mjs` → the launch case, "after a launch the manifest lists exactly the absent denyWrite paths…": assert that the rendered profile's `permissions.deny` names none of `<clone>/.git/{commondir,config.worktree,objects/info/http-alternates}`, exact or by a `*` rule, and that the clone's `.git/config`, `.git/hooks` and `objects/info/alternates` rules are still there.
   - `cli/test/profile.test.mjs` → the write-protection `_README` assertions on `protectionLine` (the line starting `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN`), beside the existing sibling-glob check, which asserts "leaves the run copy's ${omitted} out of \`denyWrite\`, also leaves the base's sibling-glob entries for those same paths out of it, and adds an exact entry for each of them in every other sibling run copy whose .git is a directory":
     - Assert the three new claims of step 6 literally: on Linux the `Edit` deny rules are enforced inside the sandbox; the per-run copy also leaves out the run copy's own trio `Edit` rules, exact and glob; each other sibling keeps them by exact path.
     - Keep the existing substring assertions, or adjust them so they match the rewritten sentence exactly. Never delete one without asserting its claim in the new wording.
   - `cli/test/doctor-profile-sandbox.test.mjs` → case `'(a) passes on a freshly generated profile, stating the Linux residual'`, which asserts "leaves a run copy's ${omitted.join(', ')} out of sandbox.filesystem.denyWrite, also drops the base's sibling-glob entries for those paths and re-roots them by exact path at every other sibling run copy":
     - Extend it to assert the same three claims in the rewritten `profile-write-protection` pass message: `Edit` deny rules enforced inside the sandbox on Linux; the run copy's own trio `Edit` rules left out of the per-run copy; the exact-path `Edit` rules kept at each other sibling.
     - Keep the existing assertions matching the rewritten message, adjusting a substring only where the rewording touches it.

   Run each edited file alone: `npm test --workspace cli -- test/<name>.test.mjs`, for `watcher-run-profile`, `watcher-placeholder-host`, `profile` and `doctor-profile-sandbox`.
9. **The self-adopted copy.** Copy `cli/templates/scripts/autonomous-watcher.sh` byte for byte onto `scripts/autonomous-watcher.sh`, keeping its mode, so Gate 15's re-take runs the new render. `cmp` the two afterwards.

**Docs** (`docs/cli.md` §6 and `docs/watcher.md`) are Finding 2's. The measurement record and the new `dd` row are Findings 5 and 6.
