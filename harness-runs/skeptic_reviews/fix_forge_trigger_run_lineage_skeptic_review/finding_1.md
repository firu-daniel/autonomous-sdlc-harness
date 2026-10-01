### 1. `branch-answer`'s GitHub route now passes a relative `--answers-from`, which `dispatch` resolves against the main checkout, so in a linked-worktree session no answer is ever sent

**File:** `cli/templates/scripts/remote-run.sh`, the block under the comment "# Resolved against the caller's directory before the `cd` below." (it handles `bundle_dir`, `prompt_file` and `review_file`, but not `answers_from`). Read with `verb_dispatch` — "file=\"${answers_from%/}/answer_$n.md\"". Test: `cli/test/remote-run.test.mjs`, beside the case 'a named answer file that is missing exits 2 and sends nothing'.

**The problem.** Before this branch, `plugin/commands/branch-answer.md` step 8 wrote the answers under `<tmp>`, a directory made by `mktemp -d`. That path is always absolute. Task 9 replaced it with `<scratch>` = `<state_dir>/scratch/branch-answer-<branch_fold>`, a **repo-relative** path, and step 8 sub-step 4 now runs:

    bash <scripts_dir>/remote-run.sh dispatch <branch> --engine <engine> --resume answer --answers-from <scratch>/answers --indexes "<n> …" --chain 0

`remote-run.sh` does not resolve that relative path against the caller's directory:

- `dispatch` is not among the verbs that take `hr_repo_root` of the working directory (`restore`, `save`, `continue`, `poll`, `pause-requested`, `run-created-at`, `trigger`, `discard`). Its `root` is `root=$(hr_main_repo "${PWD-.}")`, the **first entry of `git worktree list`**, which is the main checkout.
- The pre-`cd` block "Resolved against the caller's directory before the `cd` below." makes `bundle_dir`, `prompt_file`, `review_file` and (for `fetch`) `out_dir` absolute against `$PWD`. It skips `answers_from`.
- The script then runs `cd "$root"`, and `verb_dispatch` reads `file="${answers_from%/}/answer_$n.md"`. A relative `answers_from` therefore resolves against the **main checkout**.

Every other step of the same sequence resolves against the session's own checkout:
- `mkdir -p <scratch>` runs in the session's checkout;
- `fetch <branch> <scratch>` resolves its `<out_dir>` against `$PWD`;
- step 8 sub-step 3 writes `<scratch>/answers/answer_<n>.md` there with the Write tool;
- `discard <scratch>` resolves against `$PWD` with `hr_repo_root`.

**Runtime symptom.** Take a session that runs in a linked worktree, which is how a Claude Code worktree session runs and how this repository's own sessions run (`.claude/CLAUDE.md` → "the checkout you are running in may be a worktree"). There `$PWD` ≠ `hr_main_repo`. `verb_dispatch` looks for `<main checkout>/<state_dir>/scratch/branch-answer-<fold>/answers/answer_<n>.md`. That file does not exist, so the script prints `refused, nothing sent: answer file '…' is missing` and exits 2. Step 8 sub-step 5 reports "nothing reached the run". The scratch sequence then `discard`s `<scratch>`, which deletes the answers the user just typed. Every retry fails the same way, so the parked remote run cannot be answered from that session. The command that the four `branch-*` scratch changes exist to make work in a supervised session is broken by them for every worktree-hosted session. In the main checkout `$PWD` equals `root`, which is why no suite case caught it: every existing `--answers-from` case passes an absolute `join(fx.dir, CLARIFY_DIR)`.

**Why it is net-new.** The code review checked that `discard`'s relative `<dir>` resolves against the caller's directory, and that `fetch`'s `<out_dir>` is the freshly made `<scratch>`. It did not check `dispatch --answers-from`. No architecture or code-review finding names it.

**Fix.**

- [ ] In `cli/templates/scripts/remote-run.sh`, in the block under "# Resolved against the caller's directory before the `cd` below.", add the same case that block already applies to `review_file`, right after the `review_file` case:

  ```bash
  case "$answers_from" in
    ''|/*) ;;
    *) answers_from="${PWD-.}/$answers_from" ;;
  esac
  ```

- [ ] In the same file's header usage line `#                 [--answers-from <clar_dir> --indexes "<n> <n>..."]`, leave the line as it is. In the exit-map text, find "a named answer file is missing" and change it to "a named answer file is missing (a relative --answers-from resolves against the caller's directory)".
- [ ] In `cli/test/remote-run.test.mjs`, add a case right after 'a named answer file that is missing exits 2 and sends nothing'. It runs `dispatch` from a subdirectory of the fixture, so `$PWD` differs from the main checkout the same way a linked worktree's does, and it passes a relative `--answers-from`:

  ```js
  test('a relative --answers-from resolves against the caller\'s directory, not the main checkout', async (t) => {
    const fx = await remoteFixture(t);
    const sub = join(fx.dir, 'caller');
    mkdirSync(join(sub, 'answers'), { recursive: true });
    writeFileSync(join(sub, 'answers', 'answer_1.md'), 'Use B.\n');
    const result = await runBash(sub, [join(fx.dir, SCRIPT),
      'dispatch', 'feat_x', '--engine', 'task', '--resume', 'answer',
      '--answers-from', 'answers', '--indexes', '1',
    ], { HARNESS_GH_CLI: fx.stub, STUB_LOG: fx.log });
    assert.equal(result.status, 0, result.stderr);
    const [argv] = calls(fx);
    const answersArgs = argv.filter((arg) => arg.startsWith('answers='));
    assert.equal(answersArgs.length, 1, 'expected exactly one answers input');
    assert.equal(execFileSync('jq', ['-j', '.["1"]'], { input: answersArgs[0].slice('answers='.length), encoding: 'utf8' }), 'Use B.\n');
  });
  ```

  Every identifier it uses (`remoteFixture`, `runBash`, `SCRIPT`, `calls`, `mkdirSync`, `writeFileSync`, `join`, `execFileSync`) is already imported or defined in that suite. Without the script change this case exits 2 with `answer file 'answers/answer_1.md' is missing`.

`plugin/commands/branch-answer.md` needs no change: once the script resolves a relative `--answers-from` the way it already resolves `--review-file`, the literal it composes is correct.

This fix edits `cli/test/remote-run.test.mjs`, so that suite is the only test it runs. The full suite runs later, in the Run gates phase.
