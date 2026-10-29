### Task 9 — State the new fallback in `docs/watcher.md` and `docs/cli.md`

**Goal:** Make the two developer documents say what is now true. A reader with no `HARNESS_MAIN_REPO` reaches the main checkout from a run clone through the clone's `objects/info/alternates` and the main checkout's run registry, and stops rather than use the copy. Elsewhere it keeps today's first `git worktree list` entry. `hc_main_root` does the same for the QA-lock helpers.

**Depends on:**

- **Task 2**, which creates `plugin/instructions/main_repo_resolution.md` → `## The fallback`, the single home of the rule.
- **Task 3**, which gives `plugin/hooks/lib/harness-config-lib.sh` → `hc_main_root` three arms:
  - the anchor;
  - a clone arm, taken when the checkout's `.git` is a real directory holding `objects/info/alternates`, which answers the main checkout only if its registry records the clone at its derived path, and otherwise refuses with a sentence;
  - today's `--git-common-dir` answer.
- **Task 4**, which puts this **new clause** at every plugin site:

  ```
  the path a bare `printenv HARNESS_MAIN_REPO` prints, else the path `${CLAUDE_PLUGIN_ROOT}/instructions/main_repo_resolution.md` → `## The fallback` resolves, and a stop with its sentence when it resolves none
  ```

- **Task 5**, which rewrites `doctor`'s `profile-main-anchor` message to match. Its grade stays `warn`.

**The rule, for the prose below** (the story index's F1–F8). Without the variable:

1. Take the toplevel.
2. If its `.git/objects/info/alternates` is absent, use the first `worktree ` line of `git worktree list --porcelain`.
3. Otherwise the alternates file must be one line naming `<candidate>/.git/objects`, where:
   - `<candidate>` is not the copy;
   - `<candidate>` is a main checkout (`.git` a directory with no `commondir`);
   - its run registry records the copy's branch as `copy_kind` `clone` at the copy's path;
   - the copy sits at `<parent of candidate>/<projectName>-<branch>`.
4. If any of those fails, stop with a sentence beginning `cannot resolve the main checkout — `.

### Targets

- `docs/watcher.md` — `### The main-checkout anchor`, the **Read.** paragraph only.
- `docs/cli.md` — the bullet **The main-checkout anchor's read is one exact rule.** and the bullet **`profile-main-anchor` is a warning, and never a failure.** only.

**Work:**

- [ ] **`docs/watcher.md` → **Read.****
  - **The clause.** Replace the old clause with the new clause above, **quoted byte-for-byte**. A `git grep` for the new clause must reach this file, as one for the old clause did. Change the parenthesised source from `plugin/instructions/dispatch_discipline_instructions.md` → `## Resolved values` to `plugin/instructions/main_repo_resolution.md` → `## The fallback`, cited repo-relative.
  - **One sentence of what the fallback does**, from the rule above. It may name today's F2 answer, but it must not repeat the full **old clause** (``the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain` ``) anywhere in the file; the second **Verification:** bullet greps for exactly that string.
  - **The QA-lock sentence** names `hc_main_root`'s three arms in place of *"and otherwise take the common-dir answer"*.
  - **Keep, unchanged:** the allow-rule sentence, the *"no guard calls that function"* clause, the `export` persistence sentence, and the AN1–AN4 citation.
  - **Add one closing sentence:** the fallback from a clone with the variable unset is `docs/sandbox-verification.md` rows AN5–AN6, not yet measured.
- [ ] **`docs/cli.md`, the anchor-rule bullet.**
  - Replace *"Without the rule the read is refused and each reader falls back to the first `git worktree list` entry, which is right in the main checkout and in a linked worktree but names the copy itself in a clone."* with two statements:
    - Without the rule the read is refused, and each reader falls back to the rule in `plugin/instructions/main_repo_resolution.md`. That rule is right in all three layouts, and it stops rather than use a run copy whose registry record it cannot confirm.
    - Its reads are already allowed by `Bash(git rev-parse:*)`, `Bash(git worktree:*)` and the profile's `Read(…/**)` rules, so the fallback needs no new permission.
  - Keep the bullet's other sentences, and its pointer to `watcher.md`, unchanged.
- [ ] **`docs/cli.md`, the `profile-main-anchor` bullet.** Replace *"A run without the rule falls back to the first `git worktree list` entry (§6), so it is worse-served rather than stopped."* with: a run without the rule falls back to that rule (§6), so it makes more reads but is not stopped. Keep the `--remote-job` sentence: a job's checkout is its own main checkout, so the fallback still answers the same directory there.

**Verification:**

- `git grep -n -F 'copy itself in a clone' -- docs` finds nothing.
- `git grep -l -F 'the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`' -- docs plugin` finds nothing. The needle is the **full old clause**: the phrase `` first `worktree ` line `` alone may legitimately appear in `plugin/instructions/main_repo_resolution.md` (Task 2's F2) and in this task's added sentence.
- `git grep -c -F '${CLAUDE_PLUGIN_ROOT}/instructions/main_repo_resolution.md` → `## The fallback` resolves, and a stop with its sentence when it resolves none' -- docs/watcher.md` prints `docs/watcher.md:1`.
- `git diff docs/watcher.md docs/cli.md` touches only the three paragraphs named above. Read it to confirm.
