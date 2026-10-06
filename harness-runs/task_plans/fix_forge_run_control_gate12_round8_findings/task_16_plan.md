### Task 16 — `branch-resume`: a `killed` run whose job GitHub never started, a first run included

**Goal:** `/autonomous-sdlc-harness:branch-resume`'s GitHub route tells the operator what a `paused` / `killed` run now covers. Its `paused` bullet says: *"A `pause_reason: killed` — a job that ended mid-run — resumes exactly like any other paused run, from the committed ledger."* After Tasks 6 and 7, `remote-run.sh sync` and `fetch` also report `paused` / `killed` for a run whose `run` job GitHub never started (Gate 12 round 8, finding 3). When that run was the branch's first, the branch carries no flow-progress ledger, so "from the committed ledger" is false for it.

**Depends on:**
- **Task 7**, which gives `remote_state` this rule: a run whose `run` job GitHub never started is `paused` / `killed` when an older run carries a bundle, or when its dispatch's comment records its engine (`forge_dispatch_engine_var`), even with no bundle in any run. With neither it stays `failed`. `fetch` prints the recovered engine as `engine:`, the field this command already reads.
- **Task 6**, whose never-started detail reads `GitHub did not start the job of run <id> (<reason>): <url>`.

The facts this file relies on from the existing code, unchanged by this branch:
- `remote-run.sh start` commits only the task prompt, so a first run's branch has no ledger until its job writes one;
- `remote-run.sh restore`, finding no previous bundle, logs `no previous bundle for <branch>; this is its first job` and starts the job as the branch's first.

**Where this task stops.** The dispatch this bullet names, `remote-run.sh dispatch <branch> --engine <engine> --resume pause --chain 0`, is unchanged. Only the prose about what such a resume continues from changes. `docs/remote-execution.md`'s matching `## 1.` row and `## 4.` paragraph are **Task 13's**.

### Targets

- `plugin/commands/branch-resume.md`: step 6, **GitHub route**, the **`paused`** bullet's `pause_reason: killed` sentence.

**Work:**

- Replace "A `pause_reason: killed` — a job that ended mid-run — resumes exactly like any other paused run, from the committed ledger." with two sentences:
  - "A `pause_reason: killed` — a job that ended mid-run, or one GitHub never started — resumes exactly like any other paused run, from the committed ledger."
  - "When the job GitHub never started was the branch's first, the branch has no ledger yet: the resumed job finds no previous bundle and starts as the branch's first, from its committed task prompt."

  Keep the `<engine>` rule above it as it is. An empty engine is still reported with the GitHub route and never guessed, which is what a never-started run with no recorded engine gets.

**Verification:**

- `git grep -nE "pause_reason: killed|ended mid-run" -- plugin`: the one hit in `plugin/commands/branch-resume.md` names a job GitHub never started and the no-ledger first run.
- The sentence's wording matches Task 7's header text in `cli/templates/scripts/remote-run.sh` (`` THE `killed` AND `expired` MAPPINGS ``) and the `restore` literal `no previous bundle for $branch; this is its first job`. Grep the template for both.
- No frontmatter line of `branch-resume.md` changes (`git diff` touches only the bullet), so the manifest gate has nothing new to judge; Phase G runs it.
