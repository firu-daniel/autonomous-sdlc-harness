### Task 9 — Make `cleanup-merged-worktrees.sh` find run copies from the registry and remove a clone through the library, with `--dry-run` deciding by the same rule

**Goal:** The sweep finds the run copy of a gone branch from the run registry, never from `git worktree list`, because a clone is not listed there.
- A clone is removed through `hr_clone_remove_var`.
- A legacy linked worktree, a record carrying no `copy_kind`, is still removed through the existing target check, derived-path equality and `git worktree remove --force`. Both layouts are swept until no worktree run is left.
- `--dry-run` reports the same decision for each.
- The trigger (`[gone]` upstreams), the three refusals, the fail-closed rules and the exit map are unchanged. The script name stays.

**Depends on:** nothing new. It reads a record's fields with the existing `hr_registry_peek <file> <branch> <key>`, which prints `.runs[<branch>][<key>]` (nothing for an absent key) and returns `0`, or returns `1`, printing nothing, when the file is not a readable regular file, `jq` fails, or there is no `.runs[<branch>]`; it never creates the file, takes no lock and never initialises. It calls the existing `hr_clone_remove_var <main> <dir>`, which refuses unless exactly one registry record has `copy_kind` `clone` and a `worktree` canonically `<dir>`, and `<dir>` is `hr_worktree_dir` for that record's branch. It also calls the existing worktree-arm checks it already uses. Task 1 changes none of these.

### Targets

- `cli/templates/scripts/cleanup-merged-worktrees.sh`

**Work:**

- [ ] For each gone branch that passes the three refusals, read its registry record's `worktree` and `copy_kind` with `hr_registry_peek "$registry" "$branch" worktree` and `… copy_kind`, never a hand-written `jq` read of a record field (`.claude/context/conventions.md` → `### Where a new responsibility goes`). Keep the script's existing enumeration `jq`, which `hr_registry_peek` does not cover. A present-but-unreadable registry stays the existing fail-closed refusal, decided **before** any peek, because `hr_registry_peek`'s `1` does not tell an unreadable file from an absent record; after that check a peek's `1` means no record. No record, or a record with no `worktree`, means no copy to remove, and the branch deletion still follows, as the existing skip path does.
- [ ] **`copy_kind` `clone`:** call `hr_clone_remove_var "$main_repo" "$worktree"`. On refusal, print the existing skip line with `HR_CLONE_REFUSAL` as the reason, and the branch deletion still follows. A record naming a path that no longer exists is reported as already gone and is not an error.
- [ ] **No `copy_kind` (a legacy worktree):** keep today's arm unchanged. That is `hr_wrapper_target_check_var`, canonical equality with `hr_worktree_dir`, then `git worktree remove --force`, and it is now reached from the record's `worktree` rather than from a `worktree list` scan. Keep the `git worktree prune` at the end.
- [ ] `--dry-run` runs the same decision for both arms and prints `[dry-run] would remove …` or `[dry-run] would skip … (<reason>)` without calling either removal. The clone arm's would-decision applies `hr_clone_remove_var`'s refusal conditions without removing: the registry match and the derived path, both of which the script can read.
- [ ] Rewrite the header for the registry-driven sweep. Rewrite **ONLY THE BRANCH'S OWN WORKING COPY IS REMOVED** for both arms, the step list (1. remove the copy, by kind; 2. `git branch -D`), the `--dry-run` paragraph and the `REPRO` block: add one arm with a clone made by `hr_clone_create_var`, and keep the worktree arm as the legacy case.

**Verification:**

- Each `REPRO` arm, run by hand against a throwaway fixture under the system temp directory, does what it states:
  - a gone branch's clone and local branch are removed;
  - a gone branch whose record is `running` is untouched;
  - a legacy worktree with a record is removed;
  - `--dry-run` removes nothing and names the same decisions.
- `bash -n` under macOS `/bin/bash` (3.2) exits 0.
