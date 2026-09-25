### Task 3 — Give the outer-loop library `hr_execution_target` and the shared run-registry primitives

**Goal:** Let every outer-loop script read `execution.target` through the one library that reads `harness.config.json` for that family, and move the run-registry read/write primitives out of the watcher into that library, because a second script (`remote-run.sh`, Tasks 5–8) now reads and writes the same registry and a second copy of `registry_set` would be a second owner of a contract (`.claude/context/conventions.md` → `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"*).

**Depends on:** Task 1, whose schema default (`"local"`) and enum (`local`, `github-actions`) this reader mirrors.

**The interface, stated once for every consumer** (Tasks 4, 5, 6, 9, 11, 12 call these):

- `hr_execution_target <repo_root>` — prints `local` or `github-actions`; the schema default `local` when the key is absent; exit `0` with a value, `2` (printing nothing) when the configuration is unresolvable; a stored value outside the enum is **not** guessed about: exit `2`, the same refusal `hr_phase_enabled` makes for a non-boolean.
- `hr_registry_init <registry_file>`, `hr_registry_set <registry_file> <branch> <key> <value>`, `hr_registry_get <registry_file> <branch> <key>`, `hr_registry_branches <registry_file>` — the bodies of the watcher's current `registry_init` / `registry_set` / `registry_get` / `registry_branches`, byte-for-byte in behaviour (`{"runs": {"<branch>": {…}}}`, values written as JSON strings, `branch` and `updated_at` stamped on every write, `mktemp` + `mv`), parameterised by the file instead of the watcher's `$REGISTRY` global.
- The watcher keeps its four function names as one-line wrappers — `registry_set() { hr_registry_set "$REGISTRY" "$@"; }` and so on — so none of its hundreds of call sites changes.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the reader, its jq emit line and the four primitives; and the header's own scope statements, which the moved writers would otherwise falsify: the opening scope sentence (*"the one place every generated outer-loop script resolves … reads … answers … derives the anchors"*), the `JURISDICTION.` paragraph (*"nothing here writes anything inside a repository"*) and the `THE ONE EXCEPTION TO "WRITES NOTHING", AND ITS FENCE:` paragraph (*"nothing else here writes at all"*).
- `cli/templates/scripts/autonomous-watcher.sh` — the four wrappers replacing the bodies.
- `cli/test/outer-loop-scripts.test.mjs` — a case for `hr_execution_target`.

**Work:**

- [ ] In `hr_config_load`'s single `jq`, emit `s("execution.target"; try .execution.target catch null)` beside the other scalars, and add `hr_execution_target` to the typed readers with a comment in the section's style (schema default, what 1 and 2 mean). No other reader of the key may exist in the family.
- [ ] Move the four registry bodies into a new library section `THE RUN REGISTRY`, headed like the lane section, stating that the registry's JSON shape and status vocabulary are the watcher header's contract and that this section only implements reading and writing it. The library sets no shell options (`.claude/context/conventions.md` → `## Shell assets`), so the moved bodies must not rely on any the watcher sets.
- [ ] Amend the library header in this same edit (`.claude/context/cli.md` → `## What "done" means here`: a change either satisfies its module header's rule or amends it). (1) The opening scope sentence gains a clause: it also implements the run registry's reads and writes for the scripts that share it. (2) `JURISDICTION.`'s *"nothing here writes anything inside a repository"* becomes *"nothing here writes inside a repository except through the named write exceptions below"*. (3) The `THE ONE EXCEPTION …` paragraph becomes a **list of named write exceptions**, heading renamed to `THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES:` — first the machine-level lane (fence unchanged: under `hr_lane_dir`, written only by `hr_lane_*`), second the run registry (fence: `<root>/<state_dir>/autonomous_logs/registry.json` resolved through `hr_state_path`, written only by `hr_registry_init` / `hr_registry_set`) — and its closing guarantee restated: *a caller that calls no `hr_lane_*`, `hr_registry_init` or `hr_registry_set` function still gets a library that only reads*. Task 4 appends a third entry to this list, so write it as a list a later section extends, not a sentence.
- [ ] Replace the watcher's four bodies with the wrappers, and keep its registry field-set comment block where it is (it documents the watcher's fields, and Tasks 9–12 extend it).
- [ ] `outer-loop-scripts.test.mjs`: against a throwaway fixture, source the written library in `bash -c` and assert `hr_execution_target` prints `local` with the key absent, `github-actions` when set, and exits 2 for `"execution":{"target":"gitlab"}`; and that `hr_registry_set` then `hr_registry_get` round-trips a value into a fresh registry file shaped `{"runs":{…}}`. State the rule in the suite's header.

**Verification:**

- `bash scripts/test.sh` exits 0 — in particular every existing watcher suite (`watcher-park-loop.test.mjs`, `watcher-park-resume.test.mjs`, `outer-loop-scripts.test.mjs`) passes unchanged, which is the evidence the move preserved behaviour.
- `grep -n "registry_set()\|registry_get()" cli/templates/scripts/autonomous-watcher.sh` shows only one-line wrappers.
- The header's write-exception list names every section that writes: `grep -n -E "THE WRITE EXCEPTIONS|THE RUN REGISTRY|hr_lane_\*|hr_registry_(init|set)" cli/templates/scripts/lib/harness-run-lib.sh` — each writing section the grep shows (the lane and `THE RUN REGISTRY`) and each writing function is named in the `THE WRITE EXCEPTIONS …` paragraph with its fence, and `grep -n "THE ONE EXCEPTION" cli/templates/scripts/lib/harness-run-lib.sh` has no hit.
- The watcher's REPRO `status` and `a launch` entries, run by hand against a throwaway fixture per its header, produce the same registry file as before this task.
