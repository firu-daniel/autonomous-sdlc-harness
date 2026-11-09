### Task 4 — Add the intake refusal to `docs/watcher.md` §1 step 2

**Goal:** State the new intake refusal in the watcher's design-of-record document. Its own *Who reads this* line names someone "debugging why a dropped file did not become a run", and it says what the watcher "refuses". Step 2 currently lists only the unroutable-name archive (Scope register row 3).

**Depends on:** Task 2, which makes `process_inbox_file` refuse at intake. The refusal runs right after routing and before every guard and before `execution.target` is read. It covers a derived branch that is protected (the configured `defaultBranch` or a `protectedBranches` entry), whose protected set cannot be resolved from `harness.config.json`, or that `git check-ref-format --branch` does not accept as written. It applies to all three patterns and to local and remote drops alike. The drop is archived as `rejected_<timestamp>_<name>`, with one log line naming why, one `failed` notification and no registry record, and nothing is created, committed, pushed, launched or dispatched. This task describes that behaviour and changes no code.

### Targets

- `docs/watcher.md` → `## 1. The loop in one page`, step 2 (the sentence *"A name matching none of them is archived as `rejected_<timestamp>_<name>` and no registry record is written for it."*).

**Work:**

- [ ] Step 2: directly after the quoted sentence, add one or two sentences stating the refusal described under **Depends on**, in the plain register step 2 already uses. Name `hr_branch_is_protected` as the protected-set answer it reuses, as this document already names library functions elsewhere.
  - Say that it applies to all three patterns and to a remote drop before anything is dispatched.
  - Say that it sends one `failed` notification, unlike the unroutable archive.
  - Say why it precedes step 3's guards: no amount of waiting changes a name.
- [ ] Leave step 3's guard order and every other step as they are.

**Verification:**

- The new sentence's claims match `cli/templates/scripts/autonomous-watcher.sh` → `process_inbox_file` as Task 2 left it: the call's position ahead of `kill_switch_active` and `hr_execution_target`, the `rejected_` archive, and `reject_preserving_status`'s single `failed` notification. Check them against that code, not against this file's summary.
- `git grep -n 'rejected_' -- docs/watcher.md` shows the original unroutable sentence unchanged, plus the new one.
