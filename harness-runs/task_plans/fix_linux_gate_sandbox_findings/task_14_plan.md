### Task 14 — F14's fixture: a tree guard that fails on any file naming the Gate 15 container user's home

**Goal:** Add a tree-reading test that fails, on any machine, when a tracked or untracked-unignored file in this repository spells the home directory of the user Gate 15's container recipe runs as. A reintroduction then fails at the unit that writes it, on macOS too, rather than only as a gate 6a failure inside the container.

**Depends on:** Tasks 11, 12 and 13, which rewrite every such spelling out of `harness-runs/`, `docs/development.md` and `docs/sandbox-verification.md`. After them, `git grep -l -e '/home/prob[e]'` prints nothing, which is the state this guard holds. **Registered by Task 15**, the catch-all task that adds this file's `treeGuards` entry to `harness.config.json` (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 8).

**Why a guard, and why it is legitimate here.** `.claude/context/conventions.md` → `## The testing bar` allows guarding text where no behavioural test reaches the rule, and `harness.config.json` → `treeGuards` already lists tests of that kind. Gate 6a cannot carry this rule outside the container, because there `$HOME` is someone else's home. The guard only reads. It writes nothing and aims no command at the repository.

### Targets

- `cli/test/no-container-home-paths.test.mjs` (new)

**Work:**

- [ ] Header comment, opening with the rule: *no file in this repository spells the home directory of the user Gate 15's container recipe creates, because inside that container `$HOME` is that directory and gate 6a fails on any spelling of it* (docs/sandbox-verification.md §5 F14). Give the allowed spellings: `~/` or `$HOME` in a shell line, `<home>` in prose and quoted output. Name the user source below, and state that the guard never spells the path itself.
- [ ] Read the recipe user from `docs/development.md` (under `WORKSPACE_ROOT`): the one fenced-block line matching `^useradd -m -s /bin/bash ([a-z_][a-z0-9_-]*)$`. Assert exactly one such line exists, so a recipe change re-points the guard rather than silencing it. Build the needle as `['', 'home', user].join('/')`. The test file never carries the literal.
- [ ] List the files with `git ls-files -z --cached --others --exclude-standard`, run with `execFileSync('git', [...], { cwd: WORKSPACE_ROOT })` and an argument vector, never a shell string. Read each regular file as UTF-8, skipping a path that no longer exists and anything that is not a regular file. Collect every `path:line` whose line contains the needle as a plain substring, with no boundary condition of any kind. That is exactly what gate 6a's `grep -rn "$HOME"` matches inside the container, so the needle in backticks, in quotes, followed by `:`, `)`, `.` or `,`, or as the prefix of a longer user name is a hit, as it is for gate 6a. Assert the list is empty, printing every hit in the failure message.
- [ ] One test, titled `F14: no file in the tree names the Gate 15 container user's home`.

**Verification:**

- `npm test --workspace cli -- test/no-container-home-paths.test.mjs` passes on this branch's tree.
- `git grep -n -e '/home/prob[e]' -- cli/test/no-container-home-paths.test.mjs` prints nothing.
- Reading the test: the needle is matched as a bare substring (`line.includes(needle)` or its equivalent), as gate 6a's `grep` matches `$HOME`. No regex boundary, no following-character test and no word-boundary clause narrows it.
- The title is present byte for byte, because Task 13 cites it in `docs/sandbox-verification.md` §5 F14.

**Deviations from plan:**

- A non-regular file is skipped by `lstatSync`, so a symlink is skipped rather than followed.
- Evidence downgrade: a mutation check (plant an untracked file carrying the needle, confirm the test fails, remove it) was refused by the tool layer in don't-ask mode and was not run. That the guard fails on a hit rests on reading the code: `line.includes(needle)` over every listed regular file, then `assert.deepEqual(hits, [])`.
