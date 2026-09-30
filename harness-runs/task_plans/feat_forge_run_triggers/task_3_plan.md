### Task 3 — Derive a branch name from an issue title in the run library

**Goal:** Put the branch-naming rule the task prompt decided (*Branch naming — decided*) in one place, `cli/templates/scripts/lib/harness-run-lib.sh`. The trigger job derives through it today (Task 7), and a future `/autonomous-sdlc-harness:branch-prompt` or adapter can derive the same name. It is deterministic, calls no model, and has no confirmation step.

**Depends on:** Task 2, which adds `hr_inbox_route_var <filename>`. It sets `HR_INBOX_KIND` and `HR_INBOX_BRANCH` and returns 0 on a match, 1 on none. This task's inbox check calls it and spells no pattern itself.

**Where this task stops.** These functions derive and judge a name. They read `git` state and write nothing: no fetch, no branch, no file. The caller fetches `origin/<defaultBranch>` first when it wants a fresh answer (Task 7 does). `/autonomous-sdlc-harness:branch-prompt` keeps its confirmed, model-deduced name and is not touched (the prompt: *"This branch does not change it."*).

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the three functions and their two constants, in a new section with its own header comment.
- `cli/test/branch-naming.test.mjs` (new) — the rule, case by case.

**Work:**

- [ ] **The rule, and why each refinement.** Open the new section with a comment stating the rule and the reasons behind it:
  - The fold is ASCII-only under `LC_ALL=C`, so `é` becomes a separator, never a letter. That is the library's own precedent in `hr_repo_slug` ("Both halves are also ASCII-only"). A locale-dependent `tr` would derive different names on different runners, and a lowercase ASCII result passes every `git check-ref-format` rule and closes the macOS and Windows case collision (research T5).
  - The cap is `HR_BRANCH_SLUG_MAX=60` characters, cut before the suffix. The name becomes a working-copy directory component (`<projectName>-<branch>`) and prefixes artifact names such as `<branch>_task_prompt.md`. Sixty keeps every such component far under a 255-byte file-name limit, and keeps the name readable in the Actions run list. GitHub documents no ref-length limit (T5).
  - The suffix runs from `_2` up to `HR_BRANCH_SUFFIX_MAX=99`. The first branch carries none, matching the prompt's own `Version bump` → `version_bump`, and `_2` reads as "the second".
  - The fallback for an empty slug is the caller's `<fallback>`: `issue_<number>` from Task 7, `task_<GITHUB_RUN_ID>` from Task 8.
- [ ] **`hr_branch_slug <text>`** prints the slug and returns 0, or prints nothing and returns 1 when the result is empty. It lowercases A–Z, replaces every run of characters outside `[a-z0-9]` with one `_`, trims `_` from both ends, cuts to `HR_BRANCH_SLUG_MAX` and trims a trailing `_` the cut exposed. Worked examples: `Version bump` → `version_bump`; `feat: move button to the bottom of the page` → `feat_move_button_to_the_bottom_of_the_page`; `PROJ-123: Fix login` → `proj_123_fix_login`; `🚀🚀` → nothing, return 1.
- [ ] **`hr_branch_name_taken <root> <name> [<registry>]`** returns 0 when taken, 1 when free, and 2 when it cannot tell. It sets `HR_TAKEN_WHY` to one short phrase naming the collision (for the trigger's comment). Taken means any of:
  - `hr_branch_is_protected` answers 0; an answer of 2 makes this function answer 2;
  - `git -C <root> ls-remote --heads origin` lists a branch equal to `<name>` compared case-insensitively. The case-insensitive compare is T5's: `Version_bump` and `version_bump` are one directory on macOS. A failed `ls-remote` → 2;
  - a local `refs/heads/<name>` exists;
  - the tree of `origin/<defaultBranch>` holds, under the configured `<state_dir>`, a directory named exactly `<name>` or a file named `<name>_task_prompt.md`, `<name>_story_plan.md` or `<name>_docs.md`. These are the artifacts every task or docs run of that name commits, so a merged-and-deleted branch still leaves them. An absent `origin/<defaultBranch>` → 2;
  - `<registry>` is named, exists, and `hr_registry_get` finds a record for `<name>` there. Test existence with `-f` first, because `hr_registry_get` creates an absent registry and this function writes nothing.
- [ ] **`hr_derive_branch <root> <text> <fallback> [<registry>]`** prints the name and returns 0; returns 2 when a `taken` check could not tell (never a guessed name); returns 3 when every suffix through `HR_BRANCH_SUFFIX_MAX` is taken. The base is `hr_branch_slug <text>`, else `<fallback>`. Before judging it, confirm the base routes back to itself: `hr_inbox_route_var` on `<base>_task_prompt.md`, `<base>_review.md`, `<base>_review_2.md` and `<base>_docs.md` must each give `HR_INBOX_BRANCH` equal to `<base>`. A base that does not is replaced by `<fallback>` once, and a fallback that does not → 2. This is the prompt's *"check that no derived name makes the inbox filename patterns ambiguous"*, made executable rather than argued. Then return the base if free, else the first free `<base>_<n>`.
- [ ] **`cli/test/branch-naming.test.mjs`** opens with the rule it enforces and drives the functions by sourcing the written library under a fixture `init` wired, with a bare `origin` built in the test. Cover:
  - the slug examples above;
  - the 60-character cap with the trailing `_` trimmed;
  - an emoji-only title falling back;
  - `version_bump` free, then taken by a live branch → `version_bump_2`;
  - an uppercase `Version_Bump` on origin making `version_bump` taken;
  - a `<state_dir>/task_prompts/version_bump_task_prompt.md` on `origin/<defaultBranch>` with no live branch making it taken (a merged, deleted branch);
  - `defaultBranch`'s own name and a `protectedBranches` glob never being returned;
  - a registry record making the name taken;
  - a failing `ls-remote` (an unreachable `origin` URL) returning 2 with nothing printed.

**Verification:**

- `npm test -- test/branch-naming.test.mjs` from `cli/` passes.
- The two acceptance-2 cases are asserted directly: a second issue with the same title gets the next indexed name, and a title whose slug names a protected branch or a merged branch's artifacts never reuses that name.
- Read the new section: it calls no `git fetch`, `git push`, `git branch`, `hr_registry_set`, `hr_registry_init`, `mkdir` or `cp`, and the library header's list of write exceptions is unchanged by this task.
