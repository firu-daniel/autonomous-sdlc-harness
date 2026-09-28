### Task 1 — Serialize `hr_registry_set` behind a `mkdir` lock, add multi-key writes and an atomic create, proven by a concurrent-writer suite

**Goal:** Make the run registry's single writer safe against concurrent writers from separate processes and from a background subshell. Every `hr_registry_set` becomes a locked read-modify-write whose temp file sits beside the registry, so the `mv` is a same-filesystem rename. One call can write several keys of one record in one step, and creating the registry never truncates one that already exists. A new suite drives many processes at once. It must fail against today's writer before the fix goes in.

**Where this layer's task stops.** This task changes the library and its own suite only. It does **not** change any caller:
- the watcher's paired writes, and the order of its tags against `PAUSE`, are **Task 2's**;
- `remote-run.sh`'s writes are **Task 3's**.

Both of those tasks add cases to the suite this task creates. Existing four-argument calls must behave exactly as before, so no caller breaks when this lands alone.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_registry_init`, `hr_registry_set`, the `THE RUN REGISTRY.` section comment, and the header's `THE WRITE EXCEPTIONS` entry 2 plus its `FILE DISCIPLINE` / `NAMING` paragraphs where they describe the writer.
- `cli/test/registry-writer.test.mjs` (new): the concurrent-writer suite, owned by this task. Tasks 2 and 3 each append one case.
- `cli/templates/state-dir/autonomous_logs/README.md` → the inventory paragraph opening *"One readable transcript"*.

**Work:**

- [ ] **Test first.** Create `cli/test/registry-writer.test.mjs`, opening with the rule it enforces: *every write any process makes to one registry record survives every other concurrent write, and a pair written together is never seen apart*. Source the written library the way `cli/test/outer-loop-scripts.test.mjs` → `libCall` does: an `init`-wired fixture through `createFixture` / `runCli`, then `bash -c '. "$1"; …'` through `runBash`. Its cases:
  - (a) **Distinct keys at once.** At least 24 separate `bash` processes, started together with `Promise.all`, each call `hr_registry_set <registry> feat_x key_<i> v_<i>` against one registry. Every `key_<i>` is present afterwards, and the file parses as `{"runs": {…}}`.
  - (b) **A pair is never split.** One process writes `a` and `b` together with the same value `i`, for `i` = 1…N. A second process reads the record N times, and every read has `a == b`.
  - (c) **A stale lock is broken.** Plant the lock directory by hand with an mtime older than the ceiling (`touch -t`). A set then succeeds, and no lock directory is left behind.
  - (d) **Creating never truncates.** Many concurrent `hr_registry_get` calls race one `hr_registry_set` on an **absent** file, and the written key survives.

  **Run the file once against the unchanged library and record in your return which cases failed.** Case (a) must fail today, or it does not prove the race. Only then change the library.
- [ ] **The lock** in `hr_registry_set`:
  - It is a `mkdir` lock at `<file>.lock`, with the stale-breaking shape `hr_lane_acquire` already uses: rename aside first, then empty it, so a second breaker cannot remove a fresh owner.
  - The owner file carries a **per-call unique token**, the `mktemp` name of this call's temp file. `$$` cannot be the token: it is the parent's pid inside `spawn_engine`'s `( … ) &` subshell, and bash 3.2 has no `BASHPID`.
  - Staleness is judged by the lock directory's age through the existing `hr_lane_mtime`, never by pid liveness, because the stall watchdog kills the engine subshell mid-write. Reuse `hr_lane_mtime` rather than copying it.
  - The wait is a bounded poll (`sleep 0.05`, a fractional sleep both BSD and GNU `sleep` accept). Its two ceilings are library-internal constants, not environment values, because the header allows policy-carrying environment values for the lane only. Suggested values: a stale-lock age of 10 s, and a wait ceiling a little above it. Argue the chosen values in the section comment: a registry write is one `jq` over a small file.
  - If the lock cannot be had, print one stderr line naming the lock path, make no write and return 1.
  - Release only when the owner token is still this call's.
  - The temp file is `mktemp "<registry dir>/.registry.XXXXXX"`, never a bare `mktemp`, so the `mv` is an atomic rename and unlocked readers (`hr_registry_get`, `hr_registry_branches`, `usage_paused_count`'s `jq`) stay safe without a lock.
- [ ] **Multi-key writes and atomic create.**
  - Widen the signature to `hr_registry_set <file> <branch> <key> <value> [<key> <value> …]`. It makes one `jq` pass, takes one lock and does one `mv`, and still stamps `branch` and `updated_at`.
  - An odd count of key/value arguments (or none) returns 1 and writes nothing.
  - The jq floor is 1.5, so `$ARGS` and `--args` are unavailable. Pass each pair as indexed `--arg k0 … --arg v0 …`, and generate only those variable names into the program text. No value ever enters the program text.
  - `hr_registry_init` creates the file atomically: write `{"runs":{}}` to a temp file in the same directory, `ln` it to the registry name (which fails when the name exists), then remove the temp file. A reader's init can then never truncate a registry a writer just created.
  - `hr_registry_set` calls init under its lock.
- [ ] **The library header and section comment.**
  - Update write exception 2 so it names the lock directory `<file>.lock` and the registry-directory temp file as inside its fence.
  - Update `THE RUN REGISTRY.` so it states: the lock and why it exists (every script sharing the file, and the watcher's own background subshell); the multi-key form and when a caller must use it (a pair a concurrent reader must never see apart); and the atomic create.
  - Leave `FILE DISCIPLINE`'s stderr pass-through consistent with the one new stderr line.
- [ ] `cli/templates/state-dir/autonomous_logs/README.md`: add one sentence to the inventory paragraph. It says a `registry.json.lock` directory exists only for the width of one registry write. A leftover one after a crash is broken automatically by the next writer, and is never removed by hand while a watcher runs.

**Verification:**

- `cli/test/registry-writer.test.mjs` fails case (a) against the library as it was, recorded in the return, and passes after the change.
- Read `hr_registry_set` and confirm that the four-argument form writes exactly what it did before: the same key, value, `branch` and `updated_at`, and the same `{"runs": {…}}` shape. Add a four-argument round-trip assertion to case (a) of this task's own suite.
- `bash scripts/typecheck.sh` passes. The library is outside the compiler, so this proves only that nothing under `cli/src` moved.
- Grep the library for a bare `mktemp)` and for `BASHPID`, and find neither in the registry section.

**Deviations from plan:**
- *Run the file once against the unchanged library* and the suite's pass after the change: no conventions document states a single-file test command, so `cli/test/registry-writer.test.mjs` was not run (`unit_loop_core.md` → `## The test-run rule`, point 3); deferred to the Run gates phase. The red/green evidence rests instead on scratch probes run through `scripts/scratch-run.sh` that drive the same cases against `git show HEAD:` of the library and against the changed one. Against the unchanged library: (a) FAIL, 12 of 24 keys lost (a separate 5-round probe lost 10-14 of 24 each round); (b) FAIL, 40 of 40 reads split, because the old writer ignored the second pair; (c) FAIL, the planted `registry.json.lock` was left behind; (d) PASS, 0 of 5 rounds lost the write; odd-count refusal FAIL, exits 0,0,0. Against the changed library, all of them pass.
- The wait ceiling is measured by the clock (`date +%s`), not only by a count of `sleep 0.05` polls: a probe showed 240 polls took 42.7 s, because each poll forks `stat` and `date`. The poll count is kept as the ceiling only when `date` gives no epoch. After the change, a lock kept fresh made the write fail after 11.7 s, with the one stderr line and no write.
- The stale-breaker also puts the lock back when the `owner` it moved aside is not the one it judged stale. That covers a second breaker that re-took the lock between the check and the rename, which the plain `hr_lane_acquire` shape would take from its new owner.
- The lock work sits in two new functions, `hr_registry_lock` and `hr_registry_unlock`, plus `hr_registry_dir`. Write exception 2 and the header's list of writers name them.
- The section comment says "no per-subshell pid variable" rather than naming `BASHPID`, so the plan's own `BASHPID` grep over the registry section comes back empty.
