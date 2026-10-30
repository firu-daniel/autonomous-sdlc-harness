### Task 5 — Teach the absent-path check a sibling clone and the watcher's manifest list

**Goal:** Make `scripts/sandbox-absent-path-check.sh` able to take the owed re-take, AP1–AP5 plus the new AP6. AP6 is a sibling clone's protection and leftovers. The script must read a second sibling clone's paths in every phase, record and sweep the same manifest the watcher now writes, and report the sibling's own git state after `sweep`. Today its `write_manifest` re-derives the watcher's manifest by hand from the non-glob entries. After Task 2 the watcher lists glob expansions too, so a hand copy would measure a manifest the watcher no longer writes.

**Depends on:**

- **Task 4**, which puts `hr_profile_deny_paths <profile>` into `scripts/lib/harness-run-lib.sh`, the copy this script sources. Its contract: print the profile's `denyWrite` strings without `*` verbatim, then each `*` string's expansion against the directories that exist, `<parent>/<name><suffix>` for each matching directory. Exit 1, printing nothing, when the profile is unreadable.
- **Task 2**, whose watcher writes the manifest this script mirrors: `hr_profile_deny_paths` of the per-run profile, plus `.mcp.json` under each `--add-dir` root. On a bubblewrap host the per-run profile carries exact trio entries for every **other** sibling whose `.git` is a directory, and none of the base's three trio glob strings. So the sibling must exist **before** `sandbox-probe.sh run --leg headless-parity` renders it. Task 7's Gate 15 text tells the maintainer to create it first.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. The script is hand-written for this repository, not a `cli/templates/` file, and keeps its standalone shape: `set -u`, no `-e`, Linux only.

### Targets

- `scripts/sandbox-absent-path-check.sh`

**Work:**

- [ ] **The sibling.** `SIB=${SIB:-$M-sbx_sibling}`, taken only when `$SIB/.git` is a directory. Otherwise `SIB` is empty and every sibling step below is skipped. `run`'s stamp gains `sibling: <path>` or `sibling: none`. The header's usage text says the sibling is the maintainer's: they create it with `git clone --shared` before the probe starts, and the script never creates or removes it.
- [ ] **`write_entries`.** Keep the profile's entries verbatim in `profile-entries.txt`. Into `entries.txt`, add each `hr_profile_deny_paths "$P"` line not already listed. Then add, when absent from both lists, the clone's trio, the two `.mcp.json` paths, and, with a sibling, `$SIB/.git/commondir`, `$SIB/.git/config.worktree` and `$SIB/.git/objects/info/http-alternates`. So every path a glob yields is inspected in every phase, and the sibling's trio is inspected whether or not the profile names it.
- [ ] **`write_manifest`.** Call `hr_placeholder_manifest_write "$O/manifest.absent"` with `hr_profile_deny_paths "$P"`'s lines plus `$C/.mcp.json` and `$S/.mcp.json`, mirroring the watcher's `spawn_engine`. Exit 1 with a message naming `$P` when `hr_profile_deny_paths` fails. Replace the loop that skipped `*` lines. `run`'s count line keeps saying how many profile entries are globs, and no longer says they are not inspected.
- [ ] **The inspector and `sweep`.** The inspector's trailing `git status` loop also covers the sibling when there is one: a fifth argument, passed by `outside` and by `inspect_calls`. After its existing lines, `sweep` appends `git status (sibling)	exit <n>` when there is a sibling. `hr_run_copy_check_var` stays on the clone only, because the sibling is no registered run copy. Bring the header's per-phase description in line.

**Verification:**

- `bash -n scripts/sandbox-absent-path-check.sh` exits 0.
- On this macOS checkout, `bash scripts/sandbox-absent-path-check.sh run` exits 2 with its `Linux only` line and writes nothing, as before.
- `grep -n 'hr_profile_deny_paths' scripts/sandbox-absent-path-check.sh` shows it in `write_entries` and in `write_manifest`, and `write_manifest`'s body reads no line of `profile-entries.txt` directly.
