### Task 2 — Prove the clone-first order for the library's commit and fast-forward in a new `cli/test/clone-ref-order.test.mjs`, and move `run-copy-clone-arm.test.mjs` to it

**Goal:** Lock in Task 1's compare-and-swap order at the library level. Commit in the clone between sync-in and the ref update, and expect the operation to refuse with nothing moved on either side. Rewrite the existing failed-sync-out cases, whose staging assumed the old main-first order.

**Depends on:** Task 1. These are the contracts this file asserts:
- `hr_copy_ref_swap_var <main> <gitdir> <ref> <new> <old> <reflog>` → `0` both moved; `4` nothing moved (the clone's ref moved since sync-in, or the main swap failed and the clone was rolled back); `5` the clone moved, the main checkout did not, and the rollback failed.
- `hr_commit_paths_var` → `4` on the branch-moved refusal; on helper `5`, the landed path with `HR_COMMIT_SYNC_FAILED=1`.
- `hr_run_fast_forward_var` → `0` / `1` / `5` as its header states.

This task changes no script.

### Targets

- `cli/test/clone-ref-order.test.mjs` (new)
- `cli/test/run-copy-clone-arm.test.mjs`

**Work:**

- [ ] `clone-ref-order.test.mjs`: build the fixture as `cli/test/run-copy-clone-arm.test.mjs` builds its own: a throwaway main checkout under the system temp directory with a bare `origin`, a `harness.config.json`, the template library copied in, and a clone made by `hr_clone_create_var`. Open with the rule it enforces: *on a clone a branch moves clone ref first, main checkout second, and a commit landing in the clone after sync-in is refused with nothing moved on either side*. Keep a `RED ONCE` note naming the mutation each case fails under.
- [ ] **The commit race.** Use a `git` shim placed first on `PATH`, the technique `run-copy-clone-arm.test.mjs` and `wrapper-clone-arm.test.mjs` already use. The shim commits once in the clone right before the first `update-ref` the operation issues. Then `hr_run_copy_check_var` followed by `hr_commit_paths_var` returns `4`, and both copies' `refs/heads/<branch>` equal their pre-call values: the main checkout's is the sync-in tip, and the clone's is the shim's commit. The red-once mutation is the main-first order: the main checkout moves and the clone refuses, leaving the two diverged.
- [ ] **The fast-forward race.** The same shim, before `hr_run_fast_forward_var`'s swap: it returns `1`, with neither ref moved and the clone's working tree unchanged. Add a positive control in the same fixture with no shim, where both refs and the tree move to the target.
- [ ] **The rollback-failure exit.** A shim that lets the clone swap pass, fails the main checkout's `update-ref`, and commits in the clone before the rollback. The helper returns `5`. `hr_commit_paths_var` then reports the landed path (`HR_COMMIT_SYNC_FAILED=1`), and the next `hr_run_copy_check_var` either syncs the clone in or refuses it as diverged. Assert whichever one Task 1's code produces, and state it in the case title.
- [ ] `run-copy-clone-arm.test.mjs`: re-stage every case that forces a failed sync-out by moving the clone's ref right after the main checkout's `update-ref -m`. Under the clone-first order that staging now hits the clone's swap first, so each such case asserts the new outcome: a `4` refusal with nothing moved. Leave no case asserting the old "main moved, clone did not follow" state, which can no longer occur. Also rewrite case (b)'s subtest *"the clone rewound behind the main checkout"*, which asserts `g.status === '1'` and `/the clone is behind the main checkout/`: Task 1 turns that state into a heal, so it asserts the heal instead (status `0`, the clone's and the main checkout's `refs/heads/<branch>` equal), and case (b)'s title *"…, and a clone behind it"* becomes one that says the clone behind it is healed. Task 3's `clone-sync.test.mjs` heal case is the library-level proof; this subtest keeps the copy-check path covered. Update its header's description of the technique.

**Verification:**

- `npm test --workspace cli -- test/clone-ref-order.test.mjs` passes, one plain foreground command from the repository root.
- `npm test --workspace cli -- test/run-copy-clone-arm.test.mjs` passes.
- Each `RED ONCE` mutation turns the named case red. Apply it to the temp copy of the library inside a fixture, never to `cli/templates/scripts/lib/harness-run-lib.sh`. Record each in the header.
