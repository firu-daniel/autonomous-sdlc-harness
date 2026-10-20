`feat_clone_per_run_anchor` gives every reader of the main checkout one explicit anchor that still holds once an autonomous run's copy is a `git clone --shared` of the main checkout instead of a linked worktree. It also moves the prose that means "the run's own copy" to the words **run copy**. It is the second of three branches. `feat_clone_per_run` taught the library and the excluded wrappers to trust and operate on a clone, and the next branch switches new runs to clones. **Every real run still gets a linked worktree when this branch merges**, and every reader must resolve exactly as it does today in both a worktree and the main checkout.

It starts from a `dev` that carries `feat_clone_per_run`. Read what that branch shipped in `docs/watcher.md` §2 and `docs/cli.md` before designing anything.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Re-verify each one in the merged code before planning on it.

## Why

**The main checkout is found as the first entry of `git worktree list`.** Inside a clone that answer silently resolves to the clone itself, **including the global kill switch**. Today it resolves this way in:

- **The scripts:** `hr_main_repo`, the watcher, `setup-worktree.sh` and the QA-lock helpers' `hc_main_root` under `plugin/scripts/`.
- **The plugin's `<MAIN_REPO>` binding:** `plugin/instructions/dispatch_discipline_instructions.md`, `task_plan_writing_instructions_autonomous.md`, `autonomous_pause_and_ledger.md`, `improvement_observations_instructions.md`, `clarification_digest_instructions.md`, `plugin/agents/committer.md` and `plugin/agents/qa-tester.md`.
- **The `AUTONOMOUS_STOP` checks** of the `*_autonomous.md` flow documents and `branch-start-*-autonomous.md`.
- **The registry and inbox commands:** `plugin/commands/branch-{prompt,status,answer,pause,resume,user-review}.md`.

`git grep -n 'worktree list' -- plugin` lists them.

## The goal

1. **One anchor per consumer.**
   - **Unsandboxed code** (the excluded wrappers and every script the watcher runs) keeps placing the main checkout from its **own location**. That never resolved through `git worktree list` and cannot be forged from inside the sandbox. It never reads the new anchor, because an assignment prefix on an excluded call could set it.
   - **The plugin's readers** (agents, commands, instruction documents) read a value the sandbox cannot forge. Settle in the plan between:
     - an environment variable every launcher of an unattended session sets, which a sandboxed command cannot change in its parent;
     - a file under the main checkout's state directory that the registry already owns.

     A file inside the run copy is sandbox-writable and **must not** be the anchor. The readers need a literal, allow-listable command to read it, following the checkout-root rule in `cli/templates/claude/CLAUDE.md`. When the anchor is absent (a supervised session in the main checkout, or any session no launcher started), the reader falls back to today's first `worktree ` line, so the main checkout resolves exactly as today.
2. **Every launcher sets it.** Find every site that launches an unattended session: the watcher, and the remote job if it launches its own. Set the anchor at each one. If the read is a command, add it to the generated profile's `allow` list from an owned constant, and keep `doctor` grading it.
3. **Measure that a sandboxed call sees it.** Add an owed `docs/sandbox-verification.md` row: a sandboxed Bash call in a watcher-launched session runs the read command and prints the main checkout. If a sandboxed call does not see it, every plugin reader silently falls back, so that row decides whether this branch merges.
4. **Move every plugin reader.** Each file that declares `<MAIN_REPO>` carries one byte-identical resolution row, stated once in the plan. The `AUTONOMOUS_STOP` checks, the registry and inbox commands and the QA-lock helpers use the same resolution. Close with a grep: every remaining `worktree list` in the plugin corpus sits inside that row or its stated fallback, never alone.
5. **Keep the test suite isolated from it.** An environment variable the launcher sets reaches every child of the session, the Run gates' `node --test` and each suite's subprocesses included. A suite that runs a QA-lock helper or the watcher would then act on the **real** main checkout.
   - `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV` already blanks `HARNESS_GITHUB_DEFAULT_COMMIT` for exactly this reason. Blank the anchor there too.
   - Check every suite that builds its own `env` from `process.env`.
   - Verify by running the suites with the anchor set to a real directory in the parent shell.
6. **"Run copy" wording.** Prose that means "the run's own copy" says **run copy**, in the plugin corpus, the adopter-facing templates and the developer documents (`ARCHITECTURE.md`, `ROADMAP.md`, `docs/config.md`, `docs/retrieval.md`, `docs/remote-execution.md`). A sentence about a **linked worktree as such** keeps the word: `git worktree`'s own behaviour, or a `.git` pointer file. The `plugin/` corpus quotes its own literals, so a renamed term is an edit to every file that carries it. A block several agents carry is one wording, copied byte-for-byte into every copy, and an agent definition's word count does not rise (`.claude/context/plugin.md` → `## Writing agent prose`).
7. **Docs of record.** `docs/watcher.md` and `docs/cli.md` say how the anchor is set, read and graded, and what a session no launcher started resolves.

## Constraints

- **Names stay:**
  - the scripts (`create-worktree.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh`);
  - the token `<worktree_glob>`;
  - the registry field `worktree`;
  - the `doctor` check id `worktrees`;
  - every code identifier.

  Each is a deny-list basename, permission entry, wire field or cited anchor in installed copies.
- How the run loads the plugin does not change.
- Do not widen `allowWrite`.
- Scripts stay bash 3.2 compatible.
- No test is ever aimed at this repository's own main checkout.
- `scripts/run-gates.sh` passes.

## Not in this branch

- **The layout switch.** That covers:
  - `create-worktree.sh`, the watcher's launch and `remote-run.sh` cutting clones;
  - the per-run profile and the whole-`<main>/.git` write denial;
  - cleanup from the registry, migration, and `branch-prompt.md`'s collision guard.
- `.claude/CLAUDE.md` and `cli/templates/claude/CLAUDE.md`'s opt-out clause. It runs only in a user-typed supervised session.
- The process-level sandbox and WSL2.
