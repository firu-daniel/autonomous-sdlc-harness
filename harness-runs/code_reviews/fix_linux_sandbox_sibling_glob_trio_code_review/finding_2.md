### 2. A trio glob the expander refuses is dropped from the per-run copy and never re-rooted, with no refusal

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`run_profile_entries`) — `list="$(hr_deny_glob_expand "$g" "$copy")" || break`. The same line is in the self-adopted copy `scripts/autonomous-watcher.sh`.

`run_profile_glob_drops` selects **every** base `denyWrite` string that contains a `*` and ends in `/<p>` for an `omit` row of `RUN_PROFILE_COPY_GIT_PATHS`. `run_profile_render` then removes **all** of them from the per-run copy, and `run_profile_check` accepts that removal. The re-rooting in `run_profile_entries` only covers the shapes `hr_deny_glob_expand` accepts: an absolute path with exactly one `*` that ends its segment. Any other drop makes the expander return 2 (or 3 under `noglob`), and `|| break` then moves on to the next drop without a word. The result:

- the entry is gone from the per-run copy's `denyWrite`;
- no sibling gets an exact entry in its place;
- the launch goes ahead, and nothing is logged.

`run_profile_glob_drops`' header argues that only `writeProtection.ts → protectedPaths` writes such an entry. But the base profile's own `_README` tells adopters to add `deny`/`denyWrite` entries freely. An adopter-added `/srv/*/proj-*/.git/commondir`, or `/srv/proj-*x/.git/commondir` (a `*` mid-segment), matches the drop filter and is refused by the expander. On a bubblewrap host the sandbox-side protection that entry gave every sibling then disappears silently. That breaks the task prompt's constraint *"The wrappers' trust checks are not weakened"*, and the watcher's own posture of refusing a launch rather than passing a weaker profile (exit 3 for a path it cannot spell).

**Fix:** fail closed. When the expander refuses a drop, refuse the render rather than skipping it.

1. In `run_profile_entries`, replace

   ```bash
         list="$(hr_deny_glob_expand "$g" "$copy")" || break
   ```

   with

   ```bash
         list="$(hr_deny_glob_expand "$g" "$copy")" || return 5
   ```

2. In `run_profile_entries`' header, extend the exit list: `… 3 a path was refused, 4 <kind> is neither kind, 5 a base sibling-glob trio entry has a shape hr_deny_glob_expand cannot expand; nothing useful is printed on a non-zero exit.`

3. In `run_profile_render`'s `case "$rc"`, replace the catch-all `*)` arm with two explicit arms:

   ```bash
       4) RUN_PROFILE_REFUSAL="the run copy's kind '$kind' is neither clone nor worktree"; return 1 ;;
       *) RUN_PROFILE_REFUSAL="a sibling-glob denyWrite entry of $SETTINGS_PROFILE for a run copy's .git/commondir, .git/config.worktree or .git/objects/info/http-alternates cannot be re-rooted: the watcher expands only an absolute entry with one '*' ending its segment"; return 1 ;;
   ```

4. Copy the edited `cli/templates/scripts/autonomous-watcher.sh` byte for byte over `scripts/autonomous-watcher.sh`, so the self-adopted copy stays identical to its template.

5. In `cli/test/watcher-run-profile.test.mjs`, add a case. It writes a base profile carrying one extra `denyWrite` entry `<f.dir>/*/x-*/.git/commondir` (two `*`s), the same way the `// --- Refusal` block's cases write a perturbed base. It then asserts:
   - under `HR_PLACEHOLDER_HOST=1`, `run_profile_render <branch> <copy> clone` exits non-zero, and `RUN_PROFILE_REFUSAL` matches `/cannot be re-rooted/`;
   - under `HR_PLACEHOLDER_HOST=0`, the same render exits 0, so macOS is unchanged.

   Run only that file: `npm test --workspace cli -- test/watcher-run-profile.test.mjs`.

6. **Docs: no edit is owed.** Neither document that describes the per-run copy lists the render's refusal reasons. Both say generically what a render refusal does, and that sentence already covers the new exit 5:
   - `docs/watcher.md` → `### The per-run profile`, the paragraph after **The launch check**'s list: *"A refused check, or a copy that cannot be rendered, starts nothing: `watcher.log` carries `not launching '<branch>': <reason>`"*.
   - `docs/cli.md` §6, the paragraph that begins *"It lives at `${XDG_STATE_HOME:-$HOME/.local/state}/…`"* (the one carrying **The launch check**): the same sentence, *"A refused check, or a copy that cannot be rendered, starts nothing"*.

   The re-rooting bullets, `docs/watcher.md`'s *"the three removed trio entries re-rooted by exact path"* and `docs/cli.md` §6's *"the three trio entries taken out of the base, re-rooted at every other sibling clone by exact path"*, describe the base's three generated entries. The generator writes those in the one-`*` shape the expander accepts, so they stay true after this fix. Residual 12 (`docs/cli.md` §6, the item beginning **"Linux placeholders: the interim position"**) lists no render refusal either. Leave all of these unchanged.

- **Deviations from plan:** Step 4 writes `scripts/autonomous-watcher.sh`, outside the dispatched `cli` path. The finding assigns it, and Findings 3 and 4 of this review did the same mirror. A `cp` was refused, so the same three edits were applied to the mirror by hand; `cmp` of the two files reported no difference.
  - Re-dispatched on the `general` (`.`) layer, which covers all three files: steps 1–5 were found already applied in the working tree and were not re-edited. `cmp` again reported the template and the mirror identical; `bash scripts/typecheck.sh` printed `PASS: typecheck`; `npm test --workspace cli -- test/watcher-run-profile.test.mjs` reported `# tests 23`, `# pass 23`, `# fail 0`, the new case included.
