### 1. `docs/watcher.md` tells a person to `export HARNESS_MAIN_REPO` in their shell, so every later `claude` in that terminal, in any repository, resolves `<MAIN_REPO>` to the wrong main checkout

> **Self-contained per-finding file** for the `feat_clone_per_run_anchor` skeptic-review index (`harness-runs/skeptic_reviews/feat_clone_per_run_anchor_skeptic_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `docs/watcher.md` → `### The main-checkout anchor` → the **A session no launcher started.** paragraph and the fenced block under it, which reads "export HARNESS_MAIN_REPO=/absolute/path/to/main/checkout" (around line 124, navigation hint only).

**Problem.** The paragraph tells a person who starts a session by hand in a clone to run two commands in their terminal:

```bash
export HARNESS_MAIN_REPO=/absolute/path/to/main/checkout
claude
```

`export` sets the variable for the rest of that terminal's life, not only for the `claude` started next. Every reader this branch moved trusts the variable as given and never checks that it belongs to the repository the session is in:

- the plugin's `<MAIN_REPO>` row and clause take "the path a bare `printenv HARNESS_MAIN_REPO` prints" verbatim (for example `plugin/instructions/dispatch_discipline_instructions.md` → `## Resolved values`, and `plugin/commands/branch-status.md` / `branch-prompt.md` step 1);
- `hc_main_root` in `plugin/hooks/lib/harness-config-lib.sh` prints the anchor whenever it is an absolute directory whose `.git` is a directory with no `commondir`, before it ever asks `<root>` for its common dir. It does not compare the anchor with `<root>`.

**Why it is reachable, and what goes wrong.** Someone follows the doc, finishes, then (in the same terminal) `cd`s to another adopted repository, or to that repository's own main checkout, and starts `claude`. That session's `printenv HARNESS_MAIN_REPO` still prints the first repository's main checkout, so:

- `/autonomous-sdlc-harness:branch-prompt` writes its drop into the **first** repository's `autonomous_inbox/`, and runs its collision guard's registry check there too;
- `/autonomous-sdlc-harness:branch-status`, `branch-answer`, `branch-pause` and `branch-resume` read and write the **first** repository's registry and inbox;
- the `AUTONOMOUS_STOP` checks look at the first repository's kill switch;
- `reserve-qa-user.sh` / `release-qa-user.sh` park and release locks under the first repository's `qa_user_locks/`.

None of this produces an error message. The fallback that would have answered correctly never runs, because the read printed a path.

**Fix.** In `docs/watcher.md`, in the **A session no launcher started.** paragraph:

1. Replace the two-line fenced block with one line that scopes the variable to that single session:

   ```bash
   HARNESS_MAIN_REPO=/absolute/path/to/main/checkout claude
   ```

2. Change the sentence before it from "therefore exports the variable first, from that clone, naming the main checkout:" to "therefore sets the variable on that one launch, from that clone, naming the main checkout with no trailing slash:". The prefix form gives the variable to that `claude` process and its children only, which is how `spawn_engine` scopes it (inside the engine subshell). Without the trailing slash, a reader's literal `<MAIN_REPO>/<scripts_dir>/commit-on-branch.sh` matches the profile's allow entry.

3. Add one sentence after the block: "Never `export` it in a shell you go on using: every later session in that terminal, in any repository, would read it and act on this main checkout's inbox, registry, kill switch and QA locks."

This is a documentation-only fix. It asks for no test run.
