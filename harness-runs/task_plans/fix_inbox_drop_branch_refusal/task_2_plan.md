### Task 2 — Refuse a protected, unresolvable or invalid branch at the top of `process_inbox_file`, and document it in the watcher header and the inbox README template

**Goal:** Make the watcher refuse a drop whose derived branch is protected, has an unresolvable protected set, or is not a valid branch name. It refuses at intake, for all three patterns and both `execution.target` values, before anything is created, committed, pushed, launched or dispatched. It archives the drop as `rejected_<ts>_<name>`, writes one log line naming why and sends one `failed` notification. The task also states this behaviour in the watcher's own header and in the adopter-facing inbox README.

**Depends on:** Task 1, which adds `hr_inbox_branch_refusal_var <root> <branch>` to `cli/templates/scripts/lib/harness-run-lib.sh`. The contract this task calls:
- Return **0**: the branch may be acted on, and `HR_INBOX_REFUSAL` is `""`.
- Return **1**: the branch is refused, and `HR_INBOX_REFUSAL` is exactly one of these:
  - `'<branch>' is not a valid branch name (git check-ref-format --branch)`
  - `'<branch>' is a protected branch in '<root>/harness.config.json'`
  - `whether '<branch>' is protected cannot be judged: the protected set in '<root>/harness.config.json' cannot be resolved`

This task never re-derives any of those answers. The behavioural cases are **Task 3's**, and `docs/watcher.md` is **Task 4's**.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`: `process_inbox_file`, the comment above `reject_preserving_status`, and the file header (`REMOTE DISPATCH`, plus the `routing` entry of the `REPRO` block).
- `cli/templates/state-dir/autonomous_inbox/README.md`: the sentence on what is archived under `rejected_` (Scope register row 1).

**Work:**

- [ ] `process_inbox_file`: immediately after `engine_kind="$HR_INBOX_KIND"`, insert the intake check. It must sit **above** `local log_path=…`, the `hr_execution_target` read, `kill_switch_active` and everything below them.
  - Call `hr_inbox_branch_refusal_var "$MAIN_REPO" "$branch"`.
  - On 1, call `log "rejecting '$fname': $HR_INBOX_REFUSAL — nothing created, committed or launched"`. This copies the unroutable arm's `rejecting '$fname': …` form.
  - Then call `reject_preserving_status "$branch" "$file" "$fname" "(refused at intake: $HR_INBOX_REFUSAL — nothing created, committed or launched; drop it again under an unprotected, valid branch name)"`, then `return 0`.
  - Reuse that helper and add no new archive-and-notify function. It archives as `rejected_<ts>_<name>`, notifies `failed` and never calls `registry_set`, which is exactly the "nothing created" requirement. Nothing above it in the function may write a file, so the run log is never created for a refused branch.
- [ ] Comments inside the same function and its neighbour:
  - In the routing banner above `process_inbox_file` (the block ending *"A filename matching none of the three is logged and ARCHIVED…"*), add a paragraph saying that a routed name whose branch `hr_inbox_branch_refusal_var` refuses is archived as `rejected_` too, with one `failed` notification and no registry record. Say it sits ahead of the shared guards and of the target read because it is a property of the name, which no waiting changes, and that this is why a GitHub-bound drop never reaches `remote-run.sh`.
  - Widen the comment above `reject_preserving_status` to name this second caller, which has no record at all.
- [ ] Watcher header:
  - In `REMOTE DISPATCH`, add a bullet stating that the intake refusal applies to a remote drop before the target is even read, so no `remote-run.sh sync`, commit, push or `launch_remote_run` happens for it, and the user sees the reason in the local log and notification rather than in the job's own refusal.
  - In the `REPRO` block's `routing` entry, right after the `notes.md -> archived as rejected_<ts>_notes.md, …` lines, add an entry in the same column layout. That fixture's `defaultBranch` is `trunk`, so the entry uses `trunk_task_prompt.md`, which is archived as `rejected_<ts>_trunk_task_prompt.md` with one `failed` notification, no registry record and no working copy. The entry also says the same holds for `trunk_review[_<n>].md` and `trunk_docs.md`, for a name `git check-ref-format --branch` refuses (`a..b_task_prompt.md`, `foo.lock_review_2.md`), and when the protected set cannot be resolved.
- [ ] `cli/templates/state-dir/autonomous_inbox/README.md`, second paragraph: after the sentence on files matching none of the three patterns, add one sentence. A file that does match, but whose branch is protected, cannot be judged because the configuration's protected set cannot be resolved, or is not a valid git branch name, is archived under the same `rejected_` prefix before anything is created. It gets one log line and one failure notification naming why, and no registry record, for every pattern and whether the run would execute locally or on GitHub. Use the README's existing plain vocabulary ("the run daemon", "the harness's prompt command"), with no function names. Leave the rest of the file byte-identical, including the closing paragraph about the `README.md` exemption.

**Verification:**

- `grep -n 'hr_inbox_branch_refusal_var\|hr_execution_target "\$MAIN_REPO"\|kill_switch_active; then' cli/templates/scripts/autonomous-watcher.sh`: within `process_inbox_file`, the refusal call's line number is lower than both of the others.
- `grep -n 'registry_set\|log_path' cli/templates/scripts/autonomous-watcher.sh`: within `process_inbox_file`, no hit sits between `hr_inbox_route_var "$fname"` and the new refusal's `return 0`.
- The new header `REPRO` lines and the README sentence name the `rejected_` archive, the single `failed` notification and the absence of a registry record. Task 3's cases then prove the behaviour end to end.
