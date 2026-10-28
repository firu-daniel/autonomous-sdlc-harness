### Task 3 — Bring the root watcher and `remote-run.sh` level with their templates and name this branch in PD19's follow-up cell

**Goal:** Make `scripts/autonomous-watcher.sh` and `scripts/remote-run.sh`, this checkout's adopted copies, byte-identical to the templates Tasks 1 and 2 changed. Then record in `docs/sandbox-verification.md` §5 PD19's follow-up cell that this branch is the follow-up.

**Depends on:** Task 1 and Task 2.

- Task 1 changed `cli/templates/scripts/autonomous-watcher.sh` in two ways: `running_count`'s `status = running` filter, and the `pid ""` written in the same `registry_set` call as each terminal status, plus the comments those changes falsified.
- Task 2 changed `cli/templates/scripts/remote-run.sh` in one place: `verb_stop`'s write became `hr_registry_set "$registry" "$branch" remote_stopped_at "$stopped_at" status failed pid ""`, and the header paragraph describing that write now says the same call clears `pid`. Task 2's other edits are `cli/` test and comment files, and none of them reaches this task.

The templates are the source. This task makes no change of its own to either script's behaviour or wording: whatever differs between a root copy and its template is resolved toward the template. Before this branch, each root copy was byte-identical to its template.

**This is the catch-all task**, the `layers[]` row whose `path` is `"."`. Its implementer reads every configured layer's conventions document. All three targets sit outside `cli/` and `plugin/`.

### Targets

- `scripts/autonomous-watcher.sh`: made byte-identical to `cli/templates/scripts/autonomous-watcher.sh`, keeping its file mode.
- `scripts/remote-run.sh`: made byte-identical to `cli/templates/scripts/remote-run.sh`, keeping its file mode (`100755` in the index, while the template is `100644`; the modes differ today and must still differ).
- `docs/sandbox-verification.md` → §5, the PD19 row's last (follow-up) cell. Nothing else in that file.

**Work:**

- [ ] `scripts/autonomous-watcher.sh`: give it exactly the template's content. Apply Task 1's edits, or replace the content with the template's bytes. Either way, keep the file's existing mode, with no `100755` to `100644` flip.
- [ ] `scripts/remote-run.sh`: give it exactly the template's content, the same way. Keep its `100755` mode. Touch no other file under `scripts/`.
- [ ] `docs/sandbox-verification.md`: in the PD19 row, replace only the follow-up cell's text, *"Owed a follow-up (no branch or issue yet), in the watcher, not the probe."*. The new cell names the branch `fix_watcher_running_count_pid_reuse` as the follow-up, in the watcher, not the probe. It claims no merge commit, pull request number or measurement, since none exists yet. Leave the row's observation cell and its middle cell untouched. Leave §0 *The probe's third run* and §5's opening paragraph untouched (the story index's `## Scope register`, rows 2 to 4).

**Verification:**

- `cmp scripts/autonomous-watcher.sh cli/templates/scripts/autonomous-watcher.sh` exits 0, and `cmp scripts/remote-run.sh cli/templates/scripts/remote-run.sh` exits 0. `git diff --summary -- scripts/autonomous-watcher.sh scripts/remote-run.sh` reports no mode change. This guards the third `Top risks:` entry.
- In `git diff -- docs/sandbox-verification.md`, every changed line is the PD19 row. Within that row, only the follow-up cell's text differs.
- Re-run the register's command, `git grep -n -e 'PD19' -e 'running_count' -- docs README.md ARCHITECTURE.md plugin examples`. Every hit must be a site in the story index's `## Scope register`, with no hit outside those rows.
- The unit's whole-tree type check (`commands.typecheck`) passes.
