### 2. `(m)` fails under full-suite load, on the same launched-run path

**Site:** `cli/test/launch-sandboxed-gates.test.mjs`:
- the case `test('(m) the vector pins Claude Code\'s built-in protected paths at the target\'s root, .claude read-only after every denyWrite entry'` (near line 621, navigation hint only);
- the shared fixture builder `launcherFixture`, at `await appendFile(join(dir, LIB), \`\nhr_placeholder_host_probe_var() {` (near line 190).

The vector this case inspects is built by `lsg_bwrap_args_var` in `cli/templates/scripts/launch-sandboxed-gates.sh` (self-adopted copy `scripts/launch-sandboxed-gates.sh`). See the loop `for rel in .bash_profile .bashrc .gitconfig .gitmodules .idea .profile .ripgreprc .vscode .zprofile .zshrc; do` and the `.claude` bind after it.

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs`: `(m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry`

**Failure, as the log reports it:**

```
== gate 4 — init against a throwaway fixture
  FAIL  4 npm test (exit 1)
        not ok 356 - (q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding
        not ok 360 - (m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry
...
        # tests 3310
        # pass 3303
        # fail 2
        # skipped 5
        # duration_ms 2302661.677625
```

The log carries **no assertion detail** for test 360. It keeps only the `not ok` line.

**Diagnosis.**

1. **New this round, and not caused by a code change.** `(m)` passed in `review_1_round_1.log` on the same tree: `git diff --stat 90d8bdd9 ac03c117` lists only round-1 plan files.
2. **What `(m)` checks.** Its vector checks are deterministic for a given tree:
   - the `.claude` `--ro-bind` is last among the target's binds;
   - no bind under `.claude` follows it;
   - `.bashrc`, `.gitmodules` and `.vscode` are pinned.

   The static reading matches them against `lsg_bwrap_args_var`:
   - the built-in loop runs after the `denyWrite` loop;
   - the `.claude` bind follows the built-in loop;
   - the `.git` bind and the credential masks come after that, and none of them lies under `.claude`.

   Those checks passed in round 1. What `(m)` shares with `(q)`, `(l)` and `(g)(h)` is the launched-run path:
   - `f.launch` → `[3, 'pending\n']`;
   - `f.collect` → `pass`;
   - `f.until(… 'bwrap-exited' …)`.

   That is the path whose fixed 30 s library bound Finding 1 diagnoses.
3. **Persisting pattern, new case.** This case is new this round. The pattern is not: round 1 failed `(g)(h)` on the same path with the same code.

**Suspected shared cause:** likely the same cause as Finding 1. It is the same launched-run path in the same file, on identical code, and the failing case moved between rounds under a ~38-minute full-suite run, while the case's vector assertions are deterministic and passed in round 1.

**Fix.**

- [ ] Finding 1's fixture-level change (append a `scaleBound`-scaled `HR_TEST_RUN_STALE_SECONDS` to the fixture library in `launcherFixture`) is the fix for this case too, because `(m)` builds its fixture through `launcherFixture(t)`. Confirm that the edit sits in `launcherFixture` itself and not in a case body, so `(m)`, `(l)`, `(g)(h)` and `(q)` all inherit it.
- [ ] Re-read `(m)` against the current `lsg_bwrap_args_var` and confirm by inspection that the case's vector assertions still match it:
  - `.claude` is bound after the built-in loop;
  - nothing under `<target>/.claude/` is bound after it, before the `--`;
  - the three sampled built-ins are pinned either `--ro-bind <p> <p>` or `--ro-bind /dev/null <p>`.

  If the reading finds a real mismatch, fix the side that departs from the launcher header's THE BWRAP VECTOR. If that side is the launcher, edit `cli/templates/scripts/launch-sandboxed-gates.sh` and `scripts/launch-sandboxed-gates.sh` together and keep them byte-identical. Never loosen the assertion.
- Do not delete, skip or weaken any assertion of `(m)`.

## Already passing

- **(a) Named test and what was read.**
  - Test: `(m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry`, run from `cli/test/launch-sandboxed-gates.test.mjs`.
  - Fix site read for sub-step 1: `launcherFixture` already carries Finding 1's change (commit `ced9413b`). The `appendFile(join(dir, LIB), …)` call appends `HR_TEST_RUN_STALE_SECONDS=${STALE_BOUND_S}`, with `const STALE_BOUND_S = scaleBound(30);`. The change is in the shared builder, not in a case body, so `(m)`, `(l)`, `(g)(h)` and `(q)` all inherit it.
  - Sub-step 2 (inspection): `(m)` was re-read against `lsg_bwrap_args_var` in `cli/templates/scripts/launch-sandboxed-gates.sh`. `cmp` reports that file byte-identical to `scripts/launch-sandboxed-gates.sh`. The assertions match the builder:
    - The `.claude` `--ro-bind` is appended after the `for rel in .bash_profile .bashrc … .zshrc` loop, and that loop runs after the `denyWrite` loop.
    - The only binds after `.claude` and before `--` are the `.git` bind and the credential masks (home paths). None lies under `<target>/.claude/`.
    - `.bashrc`, `.gitmodules` and `.vscode` are each pinned, as either `--ro-bind <p> <p>` or `--ro-bind /dev/null <p>`.
  - No mismatch was found, and the launcher header's THE BWRAP VECTOR agrees.
- **(b) Command and result.** `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs`, run from the repository root at HEAD `ced9413b`, reported `ok 16 - (m) the vector pins Claude Code's built-in protected paths …`. File totals: `# tests 16`, `# pass 16`, `# fail 0`.
- **(c) No code file edited.** This detail file is the only write.
