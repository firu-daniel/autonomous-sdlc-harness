`plugin/instructions/improvement_observations_instructions.md`: an improvement-observations file names every
path repo-relative. It never writes an absolute path from the machine that ran it, so the file never breaks
gate `6a no machine paths` once it is committed.

> ⚠️ **Locate every anchor in this prompt by quoted text or heading, never by line number.**

---

## The defect

The observations file is the one run artifact whose job is to quote what happened: the failing command, what
it printed, and the file it hit (`## What the orchestrator may log — rules` → rule 2, *"Encountered, not
imagined."*). When that output holds an absolute path, the path goes into the file as written, and it gets
committed and merged to `dev`.

Four of the files under `harness-runs/improvement_observations/` did this. `fix_gate_6a_worktree_git_file`
(#26) removed the home path from them by hand:
`feat_docs_catalog_retrieval.md`, `feat_docs_retrieval_eval.md`, `feat_readme_summary_compact_llms_txt.md` and
`fix_watcher_multi_question_resume_loop.md`. In each, the **evidence:** line quotes gate 6a's hit, the worktree's
`.git` pointer file, as `gitdir: /Users/<user>/Work/<checkout>/.git/worktrees/…`. A file written to report
gate 6a's false alarm ended up holding a real machine path.

Nothing stops this from happening again. The instructions tell the orchestrator to write the file at an
**absolute**, `$REPO_ROOT`-anchored path (`## Where it is written` → **Write mechanics — absolute write,
repo-relative commit.**). They say nothing about the paths it writes **inside** the file, and gate 6a now
passes in a worktree run. So the next leaked path is only caught when someone runs the gates on `dev` after
the merge.

## What to deliver

1. **A content rule.** `## The entry format` states that any path inside an entry is repo-relative. A path under
   the run's own checkout is written from the checkout root. A path in another checkout of the same repository
   (the main checkout, or a sibling worktree) is written without its machine prefix, with a word saying which
   checkout it is in. The home directory, the checkout root and any other absolute location on this machine
   never appear. The rule also covers quoted command output: evidence that quotes an absolute path is rewritten
   by the same rule, and the rewrite does not count as changing the evidence.
2. **A check before the commit.** `## Commit mechanics` checks the written file for machine paths before it
   runs the commit wrapper. On a hit, the orchestrator rewrites the offending text by the rule in 1 and checks
   again. It never commits a file that still contains one. The step stays best-effort, like the rest of Phase D
   (`## What the orchestrator may log — rules` → rule 4): if the check cannot run, the orchestrator logs that
   and goes on.
3. `plugin/docs/AUTONOMOUS_FLOW.md` and every other file that paraphrases the entry format or the Phase D
   commit sequence is updated to match.

## Establish, do not assume

- **What the check matches.** The instructions run in adopting repositories whose home directory and checkout
  layout are unknown. Work out which strings together cover the observed leak and hold in any adopter: the home
  directory, this checkout's root, the main checkout's root from the first `git worktree list` entry, or some
  combination. Also settle how an unattended run can execute the check without a permission prompt, going by
  the checkout-root rule in the always-loaded project file.
- **Which other files quote Phase D's commit steps**, so the new check is added everywhere they are quoted.
- **Whether any other agent-written artifact class leaked a machine path into `dev`'s history.** Report what
  you find. Change nothing outside improvement observations on this branch.

## Out of scope

- Task prompts. They are written by hand, not by agents.
- `harness-runs/architecture_reviews/chore_gate_10_real_catalog_measurement/review_0.md`. Its one hit names an
  external corpus outside the repository, which the task prompt gave it, so a repo-relative path does not
  exist for it.
- Gate 6a itself, and what it excludes.
- Rewriting existing observations files. `dev` already has them clean.

## Acceptance

1. `## The entry format` states the repo-relative rule, including the rule for quoted command output.
2. `## Commit mechanics` runs the machine-path check before the wrapper and says what the orchestrator does on a
   hit.
3. Take a sample observations entry that quotes a `gitdir:` line with this machine's main-checkout path, and put
   it through the check as written. It must flag the entry, and after the rewrite in deliverable 1 it must pass.
   Record both outputs, and remove the sample afterwards.
4. `bash scripts/run-gates.sh` prints no new failure.
