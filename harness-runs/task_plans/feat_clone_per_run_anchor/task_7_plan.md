### Task 7 — Make `hc_main_root` prefer the anchor for the QA-lock helpers, and say "run copy" in the hooks and scripts READMEs

**Goal:** Make the QA-lock helpers place the main checkout the way the plugin's other readers now do. `hc_main_root` first takes `HARNESS_MAIN_REPO` when it names a main checkout, and otherwise answers exactly as today, from `git rev-parse --git-common-dir`. A reserve issued in a clone then lands in the main checkout's lock set, and every session no launcher started is unchanged. Move the two directory READMEs this layer owns for those scripts and the guards to the words **run copy** in the same pass.

**Why the helpers may read the variable and the outer-loop scripts may not.** `reserve-qa-user.sh` and `release-qa-user.sh` run **sandboxed**, from the interactive-test agent's Bash calls, and are no `sandbox.excludedCommands` entry. A value a sandboxed command forges can only point the cooperative lock set at another directory the sandbox may write, which it could already do. **No guard calls `hc_main_root`**, so no guard's decision depends on the variable. Re-check that with the grep under **Verification**, and state it in the function's header.

**The name.** `HARNESS_MAIN_REPO`, owned by `cli/src/core/mainRepoAnchor.ts` → `MAIN_REPO_ANCHOR_VARIABLE` (Task 1), whose header declares `hc_main_root` as one of its literal mirrors outside the package. The plugin cannot import it, so the literal is spelled once, inside `hc_main_root`.

**Where this task stops.** The suite that proves the new arm, `cli/test/qa-user-locks.test.mjs`, is **Task 14's**: a `cli`-layer file, placed after this task. The `docs/guard-verification.md` note is **Task 15's**. The test suite's blanking of the variable is **Task 4's**, so an existing `qa-user-locks` case never sees a parent's value.

### Targets

- `plugin/hooks/lib/harness-config-lib.sh` — `hc_main_root` and its header comment; the library's REPRO block.
- `plugin/scripts/reserve-qa-user.sh`, `plugin/scripts/release-qa-user.sh` — the **WHY THE LOCKS LIVE IN THE MAIN CHECKOUT'S STATE DIRECTORY.** paragraph and its twin, and each REPRO block. No behaviour of their own changes.
- `plugin/scripts/README.md` — the **`reserve-qa-user.sh [slot]`** entry.
- `plugin/hooks/README.md` — the run-copy wording.

**Work:**

- [ ] **`hc_main_root`.** Before the `--git-common-dir` probe, read `${HARNESS_MAIN_REPO-}`. Use it only when it is non-empty, absolute, a directory, and its `.git` is a **directory** holding no `commondir`, which is the shape of a main checkout. Then print its `pwd -P` and return 0. Anything else, including an empty value, falls through to today's code unchanged.
  - Bash 3.2: `[ -d … ]`, `case`, `cd … && pwd -P`, no `[[ ]]` features the library does not already use.
  - The library sets no shell option (`.claude/context/conventions.md` → `## Shell assets`).
  - The header comment gains three sentences: the anchor is read first, for the QA-lock helpers, which run sandboxed; no guard calls this function; an absent or unusable value falls back to the common-dir answer.
- [ ] **The REPRO blocks.** In the library's REPRO block, add one line reproducing the new arm:
  - `HARNESS_MAIN_REPO=<a main checkout> bash -c '. <lib>; hc_main_root <any checkout>'` prints the anchor;
  - with the anchor set to a directory that is not a main checkout, the line prints today's answer.

  In each QA script's REPRO block, add the reserve or release from a `git clone --shared` with the anchor set, and the lock directory it then names.
- [ ] **The QA scripts' headers.** Restate the placement sentence in **WHY THE LOCKS LIVE IN THE MAIN CHECKOUT'S STATE DIRECTORY.** and its `release-qa-user.sh` twin: `hc_main_root`, from `HARNESS_MAIN_REPO` when the launcher set it, else from `git rev-parse --git-common-dir`, so every run copy names the same one. "Parallel runs live in SEPARATE working copies" becomes "separate run copies"; "every worktree run loads the main checkout's profile" becomes "every run".
- [ ] **The two READMEs, under the wording rule restated from the story index's `## Context`.** Prose that means the run's own copy says **run copy**; a linked worktree as such, `git worktree`'s behaviour, a `.git` pointer file and every name (`create-worktree.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh`) keep their words, and so does every heading.
  - `plugin/scripts/README.md`: *"so every worktree shares them"* becomes *"so every run copy shares them"*; the wrapper-family line naming *"the commit / push / worktree wrappers"* keeps its names.
  - `plugin/hooks/README.md`: the allowlist guard's row *"or one of its sibling worktrees"*, the `cleanup-merged-worktrees.sh` row's *"Removing sibling working copies"*, and *"the same script inside any sibling worktree"* move to run copies. The `core.hooksPath` paragraph about *"a commit was made in a sibling worktree"* describes git's shared `.git/config` and keeps its words.

**Verification:**

- `grep -rn 'hc_main_root' plugin/hooks` prints only lines of `plugin/hooks/lib/harness-config-lib.sh`: no guard calls it.
- `grep -rn 'HARNESS_MAIN_REPO' plugin/hooks plugin/scripts` prints only lines inside `hc_main_root`, its comment, the REPRO blocks and the two scripts' header paragraphs.
- `bash -n` on each of the three shell files exits 0.
- Run the library's new REPRO lines against a throwaway `git init` fixture under the system temp directory, carrying a `harness.config.json`, plus a `git clone --shared` of it (`.claude/context/plugin.md` → `## Verifying a change in this layer`). With the anchor set to the fixture, `hc_main_root <clone>` prints the fixture's physical path. With the anchor unset or set to the clone, it prints what it prints today. Record the outputs in the deviation notes.
- `grep -rn 'worktree list' plugin/hooks plugin/scripts` prints nothing.

- **Deviations from plan:**
  - The `hc_main_root` header comment carries one sentence beyond the three the plan lists: why the anchor is needed at all (a `git clone` run copy has its own git directory, so the common-dir answer alone names the clone). Without it a maintainer reading "read first" has no reason not to delete the arm.
  - Verification record — the library's REPRO lines, run with `/bin/bash` 3.2.57 against a throwaway `git init -b main` fixture under `$TMPDIR` carrying `harness.config.json`, a `git clone --shared` of it and a `git worktree add` of it (paths shortened to `<T>`; all printed under `/private/var/folders/…/<T>`):
    - anchor unset, `hc_main_root <T>/clone` → `<T>/clone` (today's answer);
    - `HARNESS_MAIN_REPO=<T>/main`, `hc_main_root <T>/clone` → `/private/…/<T>/main` (the fixture's `pwd -P`);
    - anchor = the clone → `<T>/clone`; anchor = the linked worktree (`.git` a file), a relative `main`, an empty value → `<T>/clone` (each falls through to today's answer);
    - anchor unset, `hc_main_root <T>/wt` → `<T>/main`; anchor = a missing directory, `hc_main_root <T>/wt` → `<T>/main`;
    - anchor set, empty `<root>` → exit 1, nothing printed.
  - QA scripts' new REPRO lines, same fixture with `phases.qa: true`, `stateDir: "st"` and a two-account credentials file in both copies: from `<T>/clone` with `HARNESS_MAIN_REPO=<T>/main`, `reserve-qa-user.sh` printed `1`, exit 0, and created `<T>/main/st/qa_user_locks/user_1` while `<T>/clone/st` did not exist; `release-qa-user.sh 1` printed `release-qa-user: released account slot 1`, exit 0, leaving the lock set empty.
  - Greps: `grep -rn 'hc_main_root' plugin/hooks` → only `plugin/hooks/lib/harness-config-lib.sh` lines (the REPRO line and the definition); `grep -rn 'HARNESS_MAIN_REPO' plugin/hooks plugin/scripts` → only the function, its comment, the three REPRO blocks and the two scripts' header paragraphs; `grep -rn 'worktree list' plugin/hooks plugin/scripts` → no output, exit 1. `bash -n` on the three shell files → exit 0 each.
