### Task 3 — State the measured Linux glob treatment in the profile's `_README`, the template's residual line and `doctor`'s note

**Goal:** Replace the generated profile's *"How the Linux sandbox treats a `denyWrite` entry containing `*` is unverified - it may skip one, or expand it …"* with what was measured. Also state the per-run copy's re-rooting of the sibling-glob trio, which Task 2 implements, in every place the generator, the template and `doctor` describe the per-run copy.

**Depends on:**

- **Task 2**, the behaviour this task describes, already shipped in `cli/templates/scripts/autonomous-watcher.sh`:
  - `run_profile_glob_drops`: on `HR_PLACEHOLDER_HOST` `1`, it prints each string of the base profile's `.sandbox.filesystem.denyWrite` that carries a `*` and ends in `/<p>` for a `RUN_PROFILE_COPY_GIT_PATHS` row `<p>` marked `omit`, in base order, one per line. On any other host it prints nothing. `run_profile_render` removes exactly those strings from the per-run copy's `denyWrite`, and `run_profile_check`, given a run copy on such a host, accepts exactly that drop.
  - `run_profile_entries`: on `HR_PLACEHOLDER_HOST` `1`, for each dropped string `g` and its row `<p>`, it runs `hr_deny_glob_expand "$g" "$copy"` and prints `<d>/<p>	entry	deny` for each yielded path whose `<d>/.git` is a real directory (not a symbolic link) and whose parent directory exists. The run copy itself is excluded by identity (`-ef`), and a yielded path carrying a quote, a `*`, a tab or a newline is skipped. The base's `Edit` rules are not touched.

  Every statement this task writes about the per-run copy's drop and re-rooting must match that contract, and cite those two symbols only as Task 2 named them.

**What was measured, and the only Linux facts this task may write:**

- **AP2**, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0: a `denyWrite` entry containing `*` is expanded against the directories that exist when the sandbox starts. A placeholder is mounted at each **absent** path it yields. `docs/sandbox-verification.md` §5 → *The route's re-take (owed)*, AP2.
- **GW1**, 2026-10-29, Claude Code 2.1.312: a new file under an **existing** directory that only a `*` entry covered was written, not refused. `docs/sandbox-verification.md` §8 GW1.

Both facts together keep today's conclusion true: on Linux, only the file-tool side is relied on for the globbed entries. Write nothing about Linux beyond these two facts and Task 2's behaviour.

**Where this layer stops.** This task changes text only. It changes no `denyWrite` or `permissions.deny` entry of the base profile on any host, and no line of `autonomous-watcher.sh`. The per-run copy's behaviour is **Task 2's**. On a bubblewrap host, Task 2's per-run copy takes out of `sandbox.filesystem.denyWrite` the base's sibling-glob entries for the three `COPY_GIT_PATHS` rows whose `bubblewrapDenyWrite` is `false`. For each such row, it adds an exact `denyWrite` entry in every other sibling directory whose `.git` is a real directory and in which that path's parent exists. It leaves the run copy itself out, and every `Edit` rule stays. This task describes that behaviour and implements none of it.

### Targets

- `cli/src/generators/writeProtection.ts` → the `CopyGitPath.bubblewrapDenyWrite` doc comment, and `applyWriteProtection`'s `_README` line *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"*.
- `cli/src/doctor/checks.ts` → the `profile-write-protection` check's passing message, *"How the Linux sandbox treats a … entry containing * is unverified"*.
- `cli/templates/claude/settings.autonomous.json` → two `_README` lines: *"THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"* and *"TWO RESIDUALS, STATED RATHER THAN HIDDEN"*.
- `cli/test/profile.test.mjs` and `cli/test/doctor-profile-sandbox.test.mjs` → the assertions on those texts.

**Work:**

- [ ] `writeProtection.ts`, `bubblewrapDenyWrite`'s doc comment: say that a row marked `false` is also left out of the per-run copy's `denyWrite` in its **sibling-glob** form, citing AP2 on Claude Code 2.1.314 / bubblewrap 0.8.0. Say that the watcher re-roots it at every other sibling by exact path (`cli/templates/scripts/autonomous-watcher.sh` → `run_profile_glob_drops`, `run_profile_entries`). Keep *"The base profile carries every row on every host"*.
- [ ] `writeProtection.ts`, `applyWriteProtection`'s `_README` line:
  - Replace the clause *"How the Linux sandbox treats a \`denyWrite\` entry containing \`*\` is unverified - it may skip one, or expand it to the paths that exist when the sandbox starts - so on Linux only the file-tool side is relied on for the globbed entries"* with the two measured facts above, then *"so on Linux only the file-tool side is relied on for the globbed entries"*. Keep the list of globbed entries that follows it.
  - Keep the sentence *"On a host sandboxed by bubblewrap, Claude Code enforces an exact entry for a path that does not exist by mounting a placeholder at that path"* verbatim.
  - Extend the omission clause after it: the per-run copy there also leaves the base's sibling-glob entries for those same paths out of `denyWrite`, and adds an exact entry for each of them in every **other** sibling run copy whose `.git` is a directory. Then keep *"their \`Edit\` rules stay, and the watcher refuses to launch or resume a run copy carrying one"*.
  - Build every path list from `COPY_GIT_PATHS` as today, never retyped.
- [ ] `checks.ts`, the passing message: replace *"How the Linux sandbox treats a ${denyWritePath} entry containing * is unverified, so on Linux only the file-tool side is relied on for the globbed paths"* with the same two measured facts in one sentence, keeping *"so on Linux only the file-tool side is relied on for the globbed paths"*. Extend the closing clause to say that the per-run copy also drops the base's sibling-glob entries for those paths and re-roots them at every other sibling. Keep building the list from `COPY_GIT_PATHS`.
- [ ] `settings.autonomous.json`, two `_README` lines, citing `docs/sandbox-verification.md` §5 AP2 and §8 GW1 in each:
  - The *"TWO RESIDUALS"* line: replace *"how the Linux sandbox treats the globbed \`denyWrite\` entries is unverified - it may skip one, or expand it to the paths that exist when the sandbox starts - so"* with the two measured facts, then *"so"*.
  - The *"THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"* line: replace *"and how the Linux sandbox treats a \`denyWrite\` entry carrying one is unverified"* with the same two measured facts: on Linux such an entry is expanded against the directories that exist when the sandbox starts (AP2, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0), and a new file under an existing matched directory was written, not refused (GW1). Keep the line's conclusion as it stands: a run copy is sandbox-writable, so only the main checkout's copy is excluded.
  - Leave the rest of both lines, and every other line, byte-identical, and add no `{{…}}` token.
- [ ] Tests:
  - `profile.test.mjs`: assert that the write-protection line carries no *"is unverified"*, carries the AP2 fact with `2.1.314`, and still carries the placeholder clause. Assert that it states the sibling-glob drop and re-rooting for the three paths, with the list built from `COPY_GIT_PATHS`.
  - `doctor-profile-sandbox.test.mjs`: replace the `includes('is unverified')` assertion with the same checks against the passing message.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` and `npm test --workspace cli -- test/doctor-profile-sandbox.test.mjs` pass.
- `git grep -nE 'may skip one|containing \* is unverified|globbed .denyWrite. entries is unverified|carrying one is unverified' -- cli/src cli/templates/claude` prints nothing. The same phrases left elsewhere are other tasks' targets, never this task's.
- `git grep -n 'run_profile_glob_drops' -- cli/templates/scripts/autonomous-watcher.sh` prints the function's definition, so the symbol this task cites resolves.
- `jq -e . cli/templates/claude/settings.autonomous.json` exits 0, and `git diff -U0 -- cli/templates/claude/settings.autonomous.json` shows exactly two changed lines: the *"THREE COMMANDS RUN OUTSIDE THE SANDBOX"* line and the *"TWO RESIDUALS"* line.
