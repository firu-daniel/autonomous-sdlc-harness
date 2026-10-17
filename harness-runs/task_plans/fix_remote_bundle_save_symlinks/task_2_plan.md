### Task 2 — Make `remote-run.sh save` and `restore` read the trusted `stateDir` and skip a linked status or registry file

**Goal:** Make the `save` and `restore` verbs resolve the state directory from the same trusted configuration the library now uses. In a job, that is `HARNESS_GITHUB_DEFAULT_COMMIT`'s `harness.config.json`. When the checkout's own value differs, they log the difference. `save` also applies the symbolic-link test to the two files it reads before the bundle write: the status source it checks for the previous job's `run_id`, and `autonomous_logs/registry.json`, which `hr_remote_status_write` reads when the job wrote no status.

**Depends on:** Task 1. That task defines these contracts in `cli/templates/scripts/lib/harness-run-lib.sh`, and this task calls them exactly as stated:

- `hr_remote_state_dir_var <root>` — called directly, never in `$(…)`. It sets `HR_REMOTE_STATE_DIR` (repo-relative), `HR_REMOTE_STATE_FROM` (`trusted` | `checkout`), `HR_REMOTE_STATE_WHY` (one sentence) and `HR_REMOTE_STATE_CHECKOUT` (the checkout's own `stateDir`, or empty when unreadable). It returns `0` resolved, `1` a missing argument, and `2` unresolvable.
- `hr_remote_link_free_var <root> <rel>` — returns `0` when no component of `<root>/<rel>` below `<root>` is a link. Otherwise it returns `1` with `HR_REMOTE_LINKED` set to the first linked component's absolute path.
- The skip-line text `skipped <path>: <linked> is a symbolic link`.

`hr_remote_bundle_write`, `hr_remote_bundle_restore` and `hr_remote_move_aside` already resolve their own `stateDir` through that helper, and they are Task 1's. This task edits none of the library.

**Where this file stops.** No test lands here: **Task 3** writes `cli/test/remote-save-links.test.mjs` and drives these verbs through it. No `docs/` edit lands here either; that is **Task 4**. The `sync` verb's mirror restore is unchanged by this task: outside a job the library's helper already answers `checkout`.

### Targets

- `cli/templates/scripts/remote-run.sh` — the setup gate, `verb_save`, `verb_restore`, and the header's `save` / `restore` paragraphs.

**Work:**

- [ ] **Setup gate.** In `# The repository and its configuration.`, the `case "$verb"` arm `restore|save|continue|poll|discard)` gates on `hr_state_path "$root"`. Move `restore` and `save` to an arm of their own that calls `hr_remote_state_dir_var "$root"` and keeps the existing `setup_fail "cannot resolve …"` message on a non-zero return; `setup_fail` already exits 0 for `save`. So `save` no longer depends on the checkout's own `harness.config.json` parsing. Leave `continue`, `poll` and `discard` on their current gate.
- [ ] **The difference line.** Add one shared shell function in `remote-run.sh`, called by both verbs, that prints this line on stderr when `HR_REMOTE_STATE_FROM` is `trusted` and `HR_REMOTE_STATE_CHECKOUT` differs from `HR_REMOTE_STATE_DIR`:
  `remote-run.sh: <verb>: the checkout's harness.config.json names stateDir '<checkout value>', the trusted configuration at <HARNESS_GITHUB_DEFAULT_COMMIT> names '<trusted value>'; using '<trusted value>'`
  An empty checkout value is written as `no readable stateDir`. Print nothing when the two agree.
- [ ] **`verb_save`.** Build `registry_file` and `status_source` as `$root/$HR_REMOTE_STATE_DIR/autonomous_logs/registry.json` and `$root/$HR_REMOTE_STATE_DIR/$HR_REMOTE_STATUS_SOURCE`, in place of `hr_state_path "$root" …`. Before either is read, test it with `hr_remote_link_free_var "$root" "$HR_REMOTE_STATE_DIR/<rel>"`. On `1`, print `remote-run.sh: save: skipped <path>: <HR_REMOTE_LINKED> is a symbolic link` on stderr and treat that file as **absent**:
  - a linked status source is neither `run_id`-checked nor moved aside;
  - a linked registry makes the never-started rule apply exactly as an absent one does when the status source is absent too.

  When the status source is present and unlinked, `hr_remote_bundle_write` is called as today and never reads the registry. Everything else stays byte-identical: the previous-job `run_id` check and its move to `.previous`, the never-started empty bundle, the `case $?` messages, the `GITHUB_STEP_SUMMARY` table, and exit 0 on every path.
- [ ] **`verb_restore`.** Call `hr_remote_state_dir_var "$root"` once at its top and print the difference line. Build its own three paths from `$root/$HR_REMOTE_STATE_DIR/…`: the download directory `autonomous_logs/remote_download/<branch>/<id>`, the answer directory `$HR_REMOTE_CLARIFY_DIR/<branch>`, and `$HR_REMOTE_STATUS_SOURCE` for the park-loop clear. These replace the three `hr_state_path "$root" …` calls, so every byte `restore` places agrees with where `hr_remote_bundle_restore` places the bundle. Do not change the lineage bound, the `--resume answer` checks or any refusal.
- [ ] **Header.** Update the `save` paragraph of the script's header (the one opening "`save` WRAPS `hr_remote_bundle_write`"):
  - `stateDir` comes from the trusted configuration at `HARNESS_GITHUB_DEFAULT_COMMIT` in a job, and from the checkout outside one, and why;
  - the difference line;
  - a linked source, status file or registry is skipped with one line and never fails the save.

  Add the matching `stateDir` sentence to the `restore` paragraph, the one describing `hr_remote_bundle_restore` in job mode.

**Verification:**

- `bash -n cli/templates/scripts/remote-run.sh` exits 0, and the edit uses no bash 4 construct.
- `grep -n 'hr_state_path "\$root"' cli/templates/scripts/remote-run.sh` shows no hit inside `verb_save` or `verb_restore`.
- In a throwaway fixture adopted with this tree's `init`, by hand:
  1. `remote-run.sh save feat_x <out>` with `autonomous_logs/registry.json` replaced by a link to a sentinel, and no status source. The output is the never-started empty bundle, the skip line names the registry, and the sentinel's bytes appear nowhere under `<out>`.
  2. The same run with `HARNESS_GITHUB_DEFAULT_COMMIT` set to a commit whose `stateDir` differs from the working tree's. The run prints the difference line and reads the committed directory.
- Task 3's suite is the automated proof; this task names no other test file.
