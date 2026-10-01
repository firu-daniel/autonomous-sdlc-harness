# general review — ### 1. A command for one branch adopts every GitHub-started run, creating working copies and running each branch's bootstrap on this machine — iteration 0

## Must Fix
1. **The plugin's flow map still describes the removed `adopt` verb as the step that makes a GitHub run local** — `plugin/docs/AUTONOMOUS_FLOW.md` (the "Remote execution — dispatch, the job, its state bundle and the resume poller" row) — "`remote-run.sh`'s `trigger`, `start` and `adopt` verbs are that trigger's event adapter, its one placement-and-dispatch entry, and the step that makes a run started on GitHub local"
   This unit deletes `verb_adopt` from `cli/templates/scripts/remote-run.sh`, and `adopt` is now an unknown verb (exit 1). This row still names it as a live verb with a role. An agent or maintainer reading the flow map would believe a run started on GitHub is made local through `remote-run.sh adopt`. Running that now fails with `unknown verb 'adopt'`, and the document never mentions the GitHub route that replaced it. The cited target no longer exists. Confirmed by `grep -rn '\`adopt\`' plugin/`: this is the only reference to the verb left in `plugin/`. The task file does not list this file, but the stale reference is a direct result of removing the verb.
   **Fix:** Change the clause to: "`remote-run.sh`'s `trigger` and `start` verbs are that trigger's event adapter and its one placement-and-dispatch entry; a run started on GitHub needs no local record, because the local commands act on it through GitHub".

## Should Fix
1. **§5's lead still names `adopt` and says no local copy is made, which contradicts the new §4 bullet** — `docs/github-issue-trigger.md` (`## 5. Working the run`) — "no adopt, no local copy, no sync and no running watcher"
   `adopt` no longer exists, so "no adopt" refers to a verb that is gone. "No local copy" also conflicts with the bullet this unit added to `## 4.`, which says `/autonomous-sdlc-harness:branch-user-review` makes a `create-worktree.sh --existing --no-bootstrap` copy for the branch it names and removes it after the push. A reader comparing the two sections cannot tell which one is right. No command's behaviour depends on this text. The task file assigns §5 to Finding 3, but this unit introduced the contradiction.
   **Fix:** Change the clause to: "no local record, no sync and no running watcher — `branch-user-review` alone makes a short-lived, un-bootstrapped copy of the branch it names (§4)".

---

<!-- Preserved below: the cli layer's review of the same unit and iteration, written to this path first. -->

# cli review — ### 1. A command for one branch adopts every GitHub-started run, creating working copies and running each branch's bootstrap on this machine — iteration 0

## Nice to Have
1. **Reflowed comment line runs to 134 columns** — `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_remote_record_init`) — "watcher's `launch_remote_run` — in one write, so no reader sees half of them. `status` is left to the caller, which writes it only"
   The edit joined two comment lines into one, so this line is 134 characters long. Every other comment line in the library wraps at about 80 columns. Nothing reads it differently, but it stands out against the wrapping around it. Confirmed by running `awk '{print length}'` over the comment block.
   **Fix:** Re-wrap the comment at about 80 columns, for example:
   ```
   # The fields a remote run's record starts with — the one list, written by the
   # watcher's `launch_remote_run` — in one write, so no reader sees half of
   # them. `status` is left to the caller, which writes it only once its run
   # exists. 1 when the write failed.
   ```
