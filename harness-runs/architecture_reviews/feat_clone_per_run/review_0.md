# Architecture review — iteration 0

## Must Fix

1. **The measured answers on the sync-in fetch's pins have no home under `docs/`: their only record is a test-file header** — offending files: `task_5_plan.md`, `task_15_plan.md`, `task_16_plan.md` and `task_2_plan.md`. Rule source: `.claude/context/conventions.md` → `### Where a new responsibility goes`, row *"a measured fact or a decision of record | `docs/`, and nowhere else"*, read with `## Documents of record` → *"A measured fact states what was measured, the command and the exact message"*.

   The task prompt leaves two points to be settled by measurement: which of the clone's own config keys a local-transport fetch from the clone honours, and whether a hook, filter or fsmonitor in the clone runs during that fetch. The plan puts the record of that measurement in a test file and nowhere else:
   - `task_5_plan.md` → **Header first.** has `cli/test/clone-sync.test.mjs` "record the **measured** answers to the two open points … with `git --version` at the time of writing", and states that the header records what was measured, the command and the outcome. That is the document-of-record shape, placed in a test suite.
   - `task_15_plan.md` → **Depends on**, Task 5 bullet: "They are recorded in `cli/test/clone-sync.test.mjs`'s header: read them there and cite that file, rather than restating a result this plan does not know". Its **Cite the measured fetch pins.** bullet points `docs/cli.md` §6 at that header in the same way.
   - `task_16_plan.md` → the **clone arm: sync-in at the copy check.** row: "Cite `cli/test/clone-sync.test.mjs`'s header for the measured clone-side keys."
   - `task_2_plan.md` → **The fetch's pins.**: the library section header "cites that suite as the measurement".

   As planned, the two documents of record for this surface (`docs/cli.md` §6 and `docs/watcher.md` §2) send a reader to a test file's comment block for the measured facts, and no file under `docs/` states them. The conventions give that responsibility to `docs/` alone. Recording the outcome in the test file as well is allowed, but the test file cannot be the only record.

   **Fix:**
   - `task_15_plan.md`: replace "read them there and cite that file, rather than restating" with a Work bullet that **records** the measured answers in `docs/cli.md` §6, in the documents-of-record shape: each payload measured (`core.fsmonitor`, `uploadpack.packObjectsHook`, a `core.hooksPath` holding `pre-upload-pack` / `reference-transaction` / `post-checkout`, a `filter.<x>` clean/smudge pair, `core.sshCommand`, a planted `.git/shallow` and `.git/info/grafts`), the case in `cli/test/clone-sync.test.mjs` that measures it, the observed outcome, and the `git --version` it was taken on. Transcribe these from Task 5's header after reading it. Name the test file as the reproducible command, not as the record.
   - `task_16_plan.md`: point the sync-in row's citation at that `docs/cli.md` §6 statement, and not at the test header.
   - `task_2_plan.md`: have the library section header cite `docs/cli.md` §6 for the measured outcome. It may also name `cli/test/clone-sync.test.mjs` as the suite that re-checks it. Note that Task 15 lands after Task 2, so the citation is forward-pointing until then.
   - `task_5_plan.md`: the header may keep the observed answers as its statement of the rule it enforces. Add one line saying that the record of the measurement is `docs/cli.md` §6, which Task 15 writes.

## Should Fix

1. **Task 12 makes `cli/src/generators/stateDir.ts` the owner of `autonomous_logs` and leaves a retyped copy in place** — offending file: `task_12_plan.md`. Rule source: `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` (*"a value is imported from its owner rather than retyped"*) and `### Where a new responsibility goes` (*"Before adding a copy of anything, grep for it."*).

   Task 12 exports `RUN_LOGS_DIR` from `cli/src/generators/stateDir.ts` as the single owner of the `autonomous_logs` segment. Its **Verification** then explicitly allows `cli/src/generators/repoRoot.ts`'s private `const LOGS_DIR = 'autonomous_logs'` to stay. Once the owner exists, that private constant is a retyped second source of the same value. It already existed, so this is not a new copy, which is why this is a Should Fix and not a Must Fix.

   **Fix:** in `task_12_plan.md`, either have `cli/src/generators/repoRoot.ts` import `RUN_LOGS_DIR` from `./stateDir.js` in place of its private `LOGS_DIR`, and tighten the verification grep to expect the literal in `stateDir.ts` alone (`stateDir.ts` imports nothing from `repoRoot.ts`, so no cycle results), or record in the deviation notes why `repoRoot.ts` keeps its own copy.

## Nice to Have

- `task_1_plan.md` and `task_4_plan.md` cite `docs/sandbox-verification.md` row CL5 in a library header and in a test header. Task 14, which writes that row, lands thirteen units later, because the catch-all layer ships last. So the citation points at nothing in the intermediate commits. That ordering is the routing's, not the writer's choice. A short "(row CL5, added by this branch)" wording would make the gap visible to a reader of a mid-branch commit.
