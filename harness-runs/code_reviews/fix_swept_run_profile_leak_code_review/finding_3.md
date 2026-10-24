### 3. The rewritten § 1.4 "What moved" sentence says `cleanup-run-copies.test.mjs` runs against an `init`-built fixture, which it does not

**File:** `docs/outer-loop-verification.md` → `### 1.4 \`cleanup-merged-worktrees.sh\``, the **Owed a re-drive on the clone layout.** paragraph, on the quoted substring "asserts both arms, the dry run and the profile removal against an `init`-built fixture".

This branch rewrote that sentence so that it also names the profile removal. It kept the claim that `cli/test/cleanup-run-copies.test.mjs` uses an `init`-built fixture, and the claim is false. The suite's `fixture()` never runs the CLI's `init`. It runs `git init` on a bare origin and on a `demo` checkout, writes `harness.config.json` itself, and copies the template sweep and `lib/harness-run-lib.sh` into `scripts/` (see the module header: "the template sweep and `lib/harness-run-lib.sh` copied into `scripts/`"). The difference matters to a reader who has to reproduce or extend this evidence. An `init`-built fixture would also exercise the generator's copy of the script. This suite tests the template directly.

**Fix:** in that sentence only, replace

```
asserts both arms, the dry run and the profile removal against an `init`-built fixture.
```

with

```
asserts both arms, the dry run and the profile removal against a throwaway checkout carrying the template sweep and `lib/harness-run-lib.sh`.
```

Leave the file's other `init`-built fixture mentions alone, for example the `cli/test/create-worktree.test.mjs` sentence. Those describe other suites. This is a documentation edit and runs no test.
