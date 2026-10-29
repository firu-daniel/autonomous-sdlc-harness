### Task 5 — Say what the fallback now does in the `profile-main-anchor` check and the profile's `_README` line

**Goal:** Stop the CLI saying that a reader without `HARNESS_MAIN_REPO` falls back to the copy itself in a clone. After Tasks 2 and 4 the fallback reaches the main checkout from a run clone, through the clone's `objects/info/alternates` and the main checkout's run registry, and stops rather than use the copy. Elsewhere it still takes the first `git worktree list` entry. The check's grade, its wording of the fault, and its remedy are unchanged.

**Depends on:** Task 2, which creates `plugin/instructions/main_repo_resolution.md` → `## The fallback`. This task cites it repo-relative. `.claude/context/conventions.md` → `## The layers` lets `cli/src` name a `plugin/` file only in a doc comment and in `doctor`'s report text, and both uses here are of those two kinds.

**What the fallback is, for the wording below.** When a bare `printenv HARNESS_MAIN_REPO` prints nothing, a plugin reader takes the first `worktree ` line of `git worktree list --porcelain`, except in a run clone. There, it takes the main checkout that the clone's one-line `.git/objects/info/alternates` names, but only if that checkout's run registry records this clone at this path. Otherwise it stops with a sentence. The reads it needs are already allowed by `Bash(git rev-parse:*)`, `Bash(git worktree:*)` and the profile's `Read(…/**)` rules, so a run without the anchor rule makes more reads but is not stopped. The grade stays `warn`.

### Targets

- `cli/src/doctor/checks.ts` — `PROFILE_MAIN_ANCHOR_CHECK`'s doc comment and its `warn(…)` message.
- `cli/src/generators/permissionProfile.ts` — the `appendReadme` line beginning `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE:`.

**Work:**

- [ ] **`checks.ts` doc comment.** Replace *"falls back to the first `git worktree list` entry: right in the main checkout and in a linked worktree, but the copy itself in a clone"* with the fallback stated above. Cite `plugin/instructions/main_repo_resolution.md` → `## The fallback`. Keep every other sentence: the `ask`/`deny` reasoning, the `warn` grade, and the `--remote-job` paragraph, whose *"the fallback answers the same directory there"* is still true.
- [ ] **`checks.ts` message.** In the `warn(…)` string, replace *"and it falls back to the first \`git worktree list\` entry — right in the main checkout and in a linked worktree, but the copy itself in a clone"* with a clause saying the reader falls back to the rule in `plugin/instructions/main_repo_resolution.md`. That rule reaches the main checkout from a run clone through its alternates file and the run registry, at the cost of extra reads on every resolution. Keep the rest byte-identical, because `cli/test/doctor-main-anchor.test.mjs` asserts these substrings:
  - `missing from its allow list`, `ask list`, `deny list` and `init --force`, the remedy sentence;
  - the trailing `\n${MAIN_REPO_ANCHOR_RULE}` line.

  Every name in the message comes from `core/mainRepoAnchor.ts`'s constants, as the doc comment requires.
- [ ] **`permissionProfile.ts` `_README` line.** Keep the prefix `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE:` and the `${MAIN_REPO_ANCHOR_READ}` / `${MAIN_REPO_ANCHOR_RULE}` interpolations. Change *"and fall back to the first git worktree list entry when it prints nothing"* to say that when it prints nothing, they fall back to the main checkout a run clone's alternates file names and its run registry confirms, or else to the first git worktree list entry. Keep *"so removing the … entry costs only that fallback"*. The line is plain prose with no backticks, like its neighbours.

**Verification:**

- Read the edited `warn(…)` string and confirm it still carries every substring `cli/test/doctor-main-anchor.test.mjs` asserts: `missing from its allow list`, `ask list`, `deny list`, `init --force`, and the trailing rule line.
- `git grep -n -F 'copy itself in a clone' -- cli/src` finds nothing.
- `git grep -n -F 'main_repo_resolution.md' -- cli/src` finds the doc comment and the message, and the path exists under `plugin/instructions/`.
- `commands.typecheck` exits 0.
