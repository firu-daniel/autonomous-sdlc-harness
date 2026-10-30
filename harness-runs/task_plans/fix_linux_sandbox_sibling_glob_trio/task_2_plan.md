### Task 2 — Re-root the base's sibling-glob trio at every other sibling on a bubblewrap host, and record every glob's absent paths in the manifest

**Goal:** On a bubblewrap host, the per-run copy must name the run copy's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` in **no** `denyWrite` entry, glob or exact, and keep protecting every other sibling's trio by exact path. The absent-path manifest must also record every absent path a remaining glob yields. Then sandboxed git works in the run copy, and a killed session's glob-made leftovers are swept. The design, and why it re-roots rather than drops, is in the story index `## Context`.

**Depends on:**

- **Task 1**, for these two contracts:
  - `hr_deny_glob_expand <entry> [<exclude>]`. `<entry>` is absolute, with exactly one `*` that ends its segment, `<parent>/<stem>*<suffix>`. It prints `<parent>/<name><suffix>` for each matching name that is a directory (`-d`), skips one that is `-ef` `<exclude>`, and skips a name carrying a newline. It exits 0, including on no match. It exits 2 on another shape and 3 under `set -f`, printing nothing either way.
  - `hr_profile_deny_paths <profile>`. It prints the profile's `denyWrite` strings without `*` verbatim, then each `*` string's `hr_deny_glob_expand` output with no exclude. It exits 1, printing nothing, when the profile is unreadable.

**What this task does not do.** It changes no generator, template profile or `doctor` text. Task 3, which ships after this one, describes this task's drop and re-rooting in `writeProtection.ts`, the `_README` and `doctor`'s note, citing `run_profile_glob_drops` and `run_profile_entries` as this task leaves them.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`:
  - the `THE PER-RUN PROFILE` comment block;
  - a new `run_profile_glob_drops`;
  - `run_profile_entries`, `run_profile_render` and `run_profile_check`;
  - `spawn_engine`'s placeholder-manifest block.
- `cli/test/watcher-run-profile.test.mjs`: the render and check cases, and its `cloneEntries` / `assertBasePlus` helpers.
- `cli/test/watcher-placeholder-host.test.mjs`: the manifest and sweep cases.

**Work:**

- [ ] **`run_profile_glob_drops`**, new, placed just after `RUN_PROFILE_COPY_GIT_PATHS`. **The contract Task 3 restates:** on `HR_PLACEHOLDER_HOST` `1`, it prints each string of `$SETTINGS_PROFILE`'s `.sandbox.filesystem.denyWrite` that carries a `*` and ends in `/<p>` for a `RUN_PROFILE_COPY_GIT_PATHS` row `<p>` marked `omit`, in base order, one per line. On any other host it prints nothing. It exits 1 when the base cannot be read.
  - Only `cli/src/generators/writeProtection.ts` → `protectedPaths` writes such an entry: the sibling glob joined to a `COPY_GIT_PATHS` row. So the set is read off the base, never rebuilt from `projectName`, and a base spelled through a different path to the work root still matches.
  - Update the `THE PER-RUN PROFILE` block. Replace *"Linux may skip a \`*\` denyWrite entry"* with the measured fact: AP2, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0, a glob is expanded and a placeholder is mounted at each absent path. Say that on a bubblewrap host the trio's glob entries are therefore taken out and re-rooted.
- [ ] **`run_profile_entries`**. Add a bullet to its header and the code for it. On `HR_PLACEHOLDER_HOST` `1`, for both copy kinds, take each `run_profile_glob_drops` line `g` and its row `<p>`, and run `hr_deny_glob_expand "$g" "$copy"`. For each printed path `<d>/<p>`, print `<d>/<p>	entry	deny` when two things hold:
  - `<d>/.git` is a directory and not a symbolic link;
  - `<d>/<p>`'s parent directory exists.

  A printed path carrying a quote, a `*`, a tab or a newline is **skipped**, not refused, so a sibling's name can never refuse a launch. Every other path keeps today's exit-3 refusal. A non-zero `hr_deny_glob_expand` adds no line. A `run_profile_glob_drops` failure exits 1, as an unreadable protected set does today. Everything else the function prints is unchanged.
- [ ] **`run_profile_render`**. It sets `.sandbox.filesystem.denyWrite` to the base's list **minus** exactly the `run_profile_glob_drops` strings, then appends as today. Pass the drop list into the one `jq` call; never edit the base file.

  **`run_profile_check`**. When `<copy>` is given and `HR_PLACEHOLDER_HOST` is `1`, it compares the copy against the base with exactly the `run_profile_glob_drops` strings removed from `.sandbox.filesystem.denyWrite`. Every other clause is unchanged: the strict-sandbox clause, the appended-only delta, string entries, twins. With no `<copy>`, as in job mode, or on any other host, it compares against the base as today. A job's launch on a bubblewrap host therefore passes the base unchanged and is still accepted. Update both functions' header comments to state the drop.
- [ ] **`spawn_engine`'s manifest block.** Replace the inline `jq … select(type == "string" and (contains("*") | not))` read of `$settings_file` with `hr_profile_deny_paths "$settings_file"`, so the manifest also lists each absent path every remaining glob yields at launch. Keep the `.mcp.json` per `--add-dir` root, the writable-root refusal and every log line. When `hr_profile_deny_paths` fails, log `placeholder manifest: could not read the denyWrite list of $settings_file for '$branch' — the next sweep removes nothing for this session` and write no manifest. The block runs in both modes, so job mode records glob expansions too. Update the block's comment.
- [ ] **Tests.**
  - `watcher-run-profile.test.mjs`:
    - Extend `cloneEntries` / `assertBasePlus` to take the drop list.
    - Placeholder-host clone case: a second sibling `<projectName>-other` exists with a real `.git/objects/info/`. The copy's `denyWrite` carries none of the base's three trio glob strings. It carries `<other>/.git/commondir`, `…/config.worktree` and `…/objects/info/http-alternates` as exact entries, and no exact trio entry for `f.clone`. Every base `Edit` rule is still in `permissions.deny`. `run_profile_check` prints `0|`.
    - The check refuses on a placeholder host. It refuses a copy that also drops the base's `<glob>/.mcp.json`, with the `differs from the base profile` refusal. With no `<copy>` argument it refuses a copy carrying the drop.
    - With the seam off, the copy is the base plus today's entries, and the base's trio globs are present.
    - A sibling whose `.git` is a file gets no entry.
    - Extend the mirror subtest `run_profile_entries on a clone is the surface, then COPY_GIT_PATHS in order` for the sibling lines.
  - `watcher-placeholder-host.test.mjs`:
    - The case `after a launch the manifest lists exactly the absent exact denyWrite and --add-dir .mcp.json paths` becomes the set of `hr_profile_deny_paths`' absent paths plus the `.mcp.json` paths. It must include the second sibling's absent trio and its absent `.mcp.json` under the base glob.
    - New case: a 0-byte, read-only leftover at that sibling's `.git/commondir`, recorded by a launch, is removed by the next pass-start sweep and logged `placeholder sweep: removed …`.
    - With the seam off, the existing case still writes no manifest.

**Verification:**

- `npm test --workspace cli -- test/watcher-run-profile.test.mjs` and `npm test --workspace cli -- test/watcher-placeholder-host.test.mjs` pass, including the cases above.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` exits 0.
- `git grep -n 'Linux may skip' -- cli/templates/scripts` prints nothing.
