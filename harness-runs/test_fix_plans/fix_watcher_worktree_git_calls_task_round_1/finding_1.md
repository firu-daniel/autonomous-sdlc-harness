### 1. Bare `/branch-user-review` spelling in `remote-review-payloads.test.mjs`

**Site:** `cli/test/remote-review-payloads.test.mjs`, the file's opening JSDoc header. Quoted substring: `` the verb the supervised `/branch-user-review` runs `` (line 2 at the time of writing; use it only to navigate).

**Failing test:** none — test (gate 6d, `plugin command spellings carry the prefix`, run by `scripts/check-command-spelling.sh`)

**Failure (from the log):**

```
  FAIL  6d plugin command spellings carry the prefix (exit 1)
        check-command-spelling: cli/test/remote-review-payloads.test.mjs:2 — bare command spelling; write /autonomous-sdlc-harness:<name>
```

**Diagnosis:** New this round. This branch added `cli/test/remote-review-payloads.test.mjs`, and its header names the plugin command with a bare slash (`/branch-user-review`). `scripts/check-command-spelling.sh` scans every tracked file outside its excluded paths. It flags any `/branch-*` or `/harness-analyze` spelling that does not carry the `/autonomous-sdlc-harness:` prefix, unless an `EXEMPTIONS` entry covers that line. No entry covers this line, and none should: a test header is ordinary prose, not a quoted record. Other suites spell the command in the qualified form, for example `cli/test/remote-control-mention.test.mjs` (`` `/autonomous-sdlc-harness:branch-user-review` ``).

**Fix:**

- [ ] In `cli/test/remote-review-payloads.test.mjs`, line 2, replace `` `/branch-user-review` `` with `` `/autonomous-sdlc-harness:branch-user-review` ``. Reflow the JSDoc line only if it gets too long. Change no other text.
- [ ] Do not add an `EXEMPTIONS` entry to `scripts/check-command-spelling.sh`.
- [ ] Grep the same file for any other bare `/branch-` or `/harness-analyze` spelling and qualify each one the same way. At the time of writing there is none.

- **Deviations from plan:** The finding names no test file (`none — test (gate 6d …)`), so the row-`G.4` check took the fix-site fallback: the header at the quoted substring still carried the bare `/branch-user-review`, so the fix was implemented (the JSDoc lines 2–3 reflowed to fit the qualified spelling; no other text changed). `scripts/check-command-spelling.sh` was **not run** (a gate script is never run in this unit); the close rests on `grep -nE '/(branch-|harness-analyze)' cli/test/remote-review-payloads.test.mjs` returning no match after the edit, and on `bash scripts/typecheck.sh` → `PASS: typecheck`. Gate 6d itself is verified by the Run gates phase's `bash scripts/test.sh` run.
