### 3. Six script and generator comments still say the generated profile emits three forms, the third a sibling worktree's

**Files:**
- `cli/src/generators/scripts.ts` (`scriptInvocation`'s doc comment) — "its repo-root-absolute and sibling-worktree twins are the profile's to derive"
- `cli/templates/scripts/scratch-run.sh` (header, `WHY A WRAPPER EXISTS AT ALL.`) — "three forms by the generated permission profile"
- `cli/templates/scripts/scratch-run.sh` (the comment above `script_dir=`) — "three forms the permission profile emits include a sibling worktree's own copy"
- `cli/templates/scripts/test.sh`, `cli/templates/scripts/typecheck.sh`, `cli/templates/scripts/start-dev-server.sh` and `cli/templates/scripts/deploy.sh` (the comment above `script_dir=`) — "all three forms the permission profile emits"
- the rendered copies of the first three wrappers in the live fixture: `examples/notes-app/scripts/test.sh`, `examples/notes-app/scripts/typecheck.sh`, `examples/notes-app/scripts/start-dev-server.sh`

The story's scope register excluded `*.sh` and `*.ts` from its derivations on the grounds that code comments were *"planned as code inside the tasks"*. No task plan names these files. After this branch, `init`'s base profile emits two forms for each script: the repo-relative invocation and the repo-root-absolute twin. The third, the run copy's own exact path, is appended by the watcher's per-run copy (`run_profile_render`). It is not a sibling-worktree glob, and the generator does not derive it. An adopter who reads one of these comments and checks `.claude/settings.autonomous.json` finds two forms, not the three the comment promises. These are wording fixes: no behaviour depends on them.

**Fix:** text-only edits. Leave every other byte unchanged.

1. `cli/src/generators/scripts.ts` → `scriptInvocation`'s doc comment: replace `its repo-root-absolute and sibling-worktree twins are the profile's to derive and are deliberately not produced here.` with `its repo-root-absolute twin is the profile's to derive, and a run copy's exact twin the run watcher's per-run copy's, and neither is produced here.`
2. `cli/templates/scripts/scratch-run.sh`, header: replace `allow-listed literally in` / `# three forms by the generated permission profile` with `allow-listed literally in` / `# two forms by the generated permission profile, plus the run copy's exact path in the run watcher's per-run copy`. Re-wrap the comment lines as needed.
3. `cli/templates/scripts/scratch-run.sh`, the comment above `script_dir=`: replace `three forms the permission profile emits include a sibling worktree's own copy,` with `forms the permission profiles allow-list include a run copy's own copy,`.
4. In each of `cli/templates/scripts/test.sh`, `typecheck.sh`, `start-dev-server.sh` and `deploy.sh`, and in each of `examples/notes-app/scripts/test.sh`, `typecheck.sh` and `start-dev-server.sh`, replace the three comment lines

   ```
   # the checkout this copy belongs to, so all three forms the permission profile emits — the
   # repo-relative one, its absolute twin and a sibling worktree's own copy — run at the root of the
   # checkout they were invoked out of, whatever directory the caller stood in.
   ```

   with

   ```
   # the checkout this copy belongs to, so every form the permission profiles allow-list — the
   # repo-relative one and its absolute twin in the base profile, and a run copy's own exact path in
   # the run watcher's per-run copy — runs at the root of the checkout it was invoked out of,
   # whatever directory the caller stood in.
   ```

   The fixture copies get the same edit because `examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"* keeps rendered wrappers in step with their templates. The comment carries no `{{…}}` token, so the edit is byte-identical in both.

Do not edit this checkout's self-adopted `scripts/` copies. The story index's `**Manual setup required:**` re-renders them after merge.

No test file is edited, so the fix runs no test. `cli/test/outer-loop-scripts.test.mjs` compares each written outer-loop script with its template at run time, so a comment edit to `scratch-run.sh` keeps that comparison byte-equal. The full suite runs later, in the Run gates phase.
