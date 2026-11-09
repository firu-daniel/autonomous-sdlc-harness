## The B.3 committer landed a commit carrying a forbidden attribution trailer, then rewrote it outside its contract, forking the branch ref
- **category:** agent-contract
- **evidence:** Phase B.3 `committer` (`mode: review_plan_file`) for `harness-runs/code_reviews/feat_network_refusal_report_code_review.md`. Per the park's question file `harness-runs/clarifications/feat_network_refusal_report/question_1.md` (digested into `harness-runs/clarification_digests/feat_network_refusal_report.md`): the first commit `afdf238f` carried a `Co-Authored-By:` trailer, which `.claude/context/conventions.md` → `## Commit-message policy` forbids, and it moved the branch ref in the main checkout too; the committer then rewrote it in the run copy only, producing `799fcf0a`, with an identical tree (both have parent `8274347a`). `push-branch.sh` refused to push while the two refs disagreed, so the run parked.
- **cost this run:** one park and one operator round-trip: the operator moved the main checkout's ref by hand with `git update-ref` before the run could resume, at Phase B.3.
- **hypothesis:** (guess) the trailer reached the commit through a path other than the wrapper's message-from-positional-args rule.

## A layer-implementer ran its tree guards with a `cd` prefix and a pipe, then with output redirected to a file
- **category:** agent-contract
- **evidence:** dispatch `[C · Item 2 · general · iter 0] → layer-implementer  (#4)` (code-review Finding 3). Its return states: "My first runs used a `cd` prefix and piped into `tail`, which the conventions forbid. I re-ran all three as one plain `npm test --workspace cli -- <files>` command, sending output to a temp file." `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6 forbids running a test file wrapped in a `cd`, piped, or redirected to a file.
- **cost this run:** the three tree guards (`test/shipped-scripts-mktemp.test.mjs`, `test/watcher-main-anchor.test.mjs`, `test/no-container-home-paths.test.mjs`) ran twice, both times in a form point 6 forbids.

## A layer-implementer reported no tree guard selected while its changed path matched three `covers` globs
- **category:** agent-contract
- **evidence:** dispatch `[C · Item 3 · plugin · iter 0] → layer-implementer  (#6)` (code-review Finding 1) edited `plugin/commands/branch-status.md` and returned "No tree guard was selected." In `harness.config.json` → `treeGuards`, that path matches `plugin/**/*.md` (`test/main-repo-resolution-corpus.test.mjs`, `test/untrusted-input-corpus.test.mjs`) and `**/*.md` (`test/no-container-home-paths.test.mjs`). `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 7 selects every guard whose `covers` glob matches a changed path.
- **cost this run:** three tree guards owed at unit level were not run for that unit. Phase G round 1 later passed the whole suite.

## The plan needed 4 review rounds across its review roots
- **category:** optimization
- **evidence:** this branch's plan-convergence roots hold `harness-runs/task_plan_reviews/feat_network_refusal_report/review_0.md`, `review_1.md` and `harness-runs/architecture_reviews/feat_network_refusal_report/review_0.md`, `review_1.md`. That is 4 rounds in total, 2 per root. The business-parity root is absent because `phases.parity` is `false`. The net-new versus re-raised split could not be measured: neither root's files carry per-finding headings (their only headings are `## Must Fix` / `## Should Fix` / `## Nice to Have`), and the narrow Phase-D exception permits headings only.
- **cost this run:** one extra plan-writer revision round before the plan converged.
