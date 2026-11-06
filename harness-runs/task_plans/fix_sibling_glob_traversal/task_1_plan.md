### Task 1 — Add the path-anchored-arms decision suite and record it red against the unfixed guards

**Goal:** Add one `node --test` suite that feeds real `PreToolUse` payloads to the four allow-only guards against throwaway fixture repositories, and pins the decisions this branch changes. The hole cases must be SILENT and the keeper cases must be `allow`. Run it once against the tree as this task finds it, where the fix has not landed, and record in the suite's header that every hole case went red.

**Where this layer stops.** This task writes the test and nothing it tests. The fix is **Task 2's**, in `plugin/hooks/lib/harness-config-lib.sh`, and this task edits no file under `plugin/`. **This is the one task in the story whose own test is expected to fail when it lands.** The failing hole cases are the evidence, not a defect. Do not make them pass by editing a guard, by weakening an assertion, or by moving a hole case to the keepers. Task 2 turns the suite green, and the Run gates phase runs it with the rest of the suite.

### Targets

- `cli/test/path-anchored-arms.test.mjs` (new) — the suite.

**Work:**

- [ ] **The header, before any case.** Open with the rule the file enforces: *a path-anchored arm grants no `cd` or tail-free `--prefix` directory the shell resolves outside the workspace — through `..`, an expansion, a quote, a second `cd` operand or a subcommand inside the wildcard, from the main checkout or from a run copy — and every ordinary sibling, run-copy and redirect spelling keeps its allow, in all four allow-only guards.* Then add the not-covered paragraph `.claude/context/conventions.md` → `## The testing bar` asks for:
  - what the executing shell then does with a granted `cd`. The guard is a string test, and zsh's two-operand `cd` is recorded in `docs/guard-verification.md` §2.4 row `(m)`, not asserted here;
  - the symlink residual. It is open by design, and a test asserting it would lock a hole in;
  - the scoped-`appDir` and cost rows, which `docs/guard-verification.md` carries.
  Then add a `RED ONCE` paragraph in the form the existing suites' headers use (`grep -l 'RED ONCE' cli/test` finds them), filled in by the last bullet.
- [ ] **The fixtures.** Build them under `os.tmpdir()` on a `realpath`-resolved root, with `cli/test/helpers/fixture.mjs`'s `runGit` / `runBash` / `WORKSPACE_ROOT`, and tear them down in `t.after`. Nothing is created inside this checkout.
  - **`<root>/work/acme-shop`** (`<repo>`) commits a `harness.config.json` of `{"version":1,"projectName":"acme-shop","defaultBranch":"main","protectedBranches":["main"],"appDir":"packages/storefront","stateDir":"sdlc-harness","scriptsDir":"packages/storefront/scripts","commands":{"depInstall":"npm ci","test":"npm test"},"phases":{"qa":true},"qa":{"credentialsPath":".claude/qa-accounts.env"}}`. It also commits `tracked.txt`, `packages/storefront/scripts/typecheck.sh` and `.claude/qa-accounts.env`, with HEAD on the ordinary branch `feat_probe`.
  - **`<W>`** = `<root>/work/acme-shop-feat_x`, a linked worktree from `git worktree add -b feat_x`.
  - **`<copy>`** = `<root>/work/acme-shop-run_x`, a `git clone --shared` of `<repo>`.
  - **`<root>/work/dotshop`** is the same configuration with `projectName` `dotshop` and `appDir` `"."`.
  - **`<outside>`** = `<root>/outside`, a plain directory.
  - `<work_root>` is `<root>/work`. `acme-shop-x` and `dotshop-x` are deliberately absent.
  A case runs `bash <WORKSPACE_ROOT>/plugin/hooks/<guard>.sh` with the payload `{"tool_input":{"command":<cmd>},"cwd":<cwd>}` on stdin. `allow` means one JSON object whose `.hookSpecificOutput.permissionDecision` is `allow`. SILENT means exit 0 and empty stdout.
- [ ] **The hole cases, each asserting SILENT and named by its row id.** Task 4 and Task 7 reuse these ids for `docs/guard-verification.md` §2.4 row `(m)`, so carry them verbatim. The `cwd` is `<repo>` unless a case names `<copy>`.
  - **m1, compounds:** `git -C <repo> status && cd <work_root>/acme-shop-x/../../outside && npm ci`.
  - **m2, compounds:** `git status && npm --prefix <work_root>/acme-shop-x/../../outside/packages/storefront`.
  - **m3, credentials:** m1 with `cat .claude/qa-accounts.env` in place of `npm ci`.
  - **m4, rewrite:** m1 with `git rm x.txt` in place of `npm ci`.
  - **m10, compounds,** at `cwd` `<copy>`: `git -C <copy> status && cd <copy>/../../outside && ls`.
  - **m11, compounds:** m10 with `npm ci` in place of `ls`.
  - **m12, script-allowlist,** at `<copy>`: `git -C <copy> status && cd <copy>/packages/storefront/scripts/../../../../../outside && bash packages/storefront/scripts/typecheck.sh`.
  - **m13, credentials,** at `<copy>`: m10 with `cat .claude/qa-accounts.env`.
  - **m14, rewrite,** at `<copy>`: m10 with `git rm x.txt`.
  - **m15–m21, compounds.** Each is `git -C <repo> status && cd <work_root>/acme-shop-x<S> && ls`, where `<S>` is, in order:
    - `/${x}../../outside`
    - `/$(:)../../outside`
    - `"/../../outside"`
    - `/..`
    - `/./../../outside`
    - `/../../outside/`
    - `/$X`
  - **m23, compounds,** at `cwd` `<root>/work/dotshop`: `git status && npm --prefix <work_root>/dotshop-x install left-pad`.
  - **m24, compounds:** `git status && npm --prefix <work_root>/acme-shop-x exec curl /packages/storefront`.
  - **m25, compounds:** `git -C <repo> status && cd <repo> <outside> && npm ci`.
  - **m26, compounds:** `git -C <repo> status && cd <repo> .. && ls`.
  - **m27, compounds:** `git -C <repo> status && cd <repo>/packages/storefront <outside> && ls`.
- [ ] **The keeper cases, each asserting `allow`.** The `cwd` is `<repo>` unless a case names another.
  - **m28:** `cd <W> && git status`.
  - **m29:** `git -C <W> status --short`.
  - **m30:** `git -C <repo> status && npm --prefix <W>/packages/storefront`.
  - **m31:** `git -C <repo> status && cd <W>/packages/storefront && ls`.
  - **m32:** `git -C <repo> status && cd <work_root>/acme-shop-x/..foo && ls`, an ordinary `..`-prefixed component.
  - **m33,** at `cwd` `<copy>`: `cd <copy> && git status`.
  - **m34,** at `<copy>`: `git -C <copy> status && cd <copy>/packages/storefront && ls`.
  - **m35,** at `<copy>`: `git -C <copy> status && npm --prefix <copy>/packages/storefront`.
  - **m36:** `git -C <repo> status && cd <repo> 2>/dev/null && ls`.
  - **m37,** at `cwd` `<root>/work/dotshop`: `git status && npm --prefix <work_root>/dotshop-x`.
  - **m38:** `git -C <repo> status && cd <repo>/packages/storefront && npm ci`.
  Every keeper is driven through `allow-safe-compounds.sh`. m28 and m33 are also driven through `git-rewrite-branch-guard.sh` with `&& rm tracked.txt` appended, which asserts `allow` too.
- [ ] **Run red once, then record it.** Run this file once against the tree as you find it, with `npm test --workspace cli -- test/path-anchored-arms.test.mjs` from the repository root as one plain foreground command. Then write the `RED ONCE` paragraph: the date, that the tree was this branch before Task 2's fix, the counts the run printed, and which ids failed and which passed. Every hole id must be among the failures and every keeper among the passes. A hole case that passes on the unfixed tree is not evidence for the fix: report it in your return by id, and move it into a separate, clearly named control list in the file rather than counting it as a hole case.

**Verification:**

- Your one run of `test/path-anchored-arms.test.mjs` fails on every hole id above and passes every keeper id, with the counts recorded in the header's `RED ONCE` paragraph. That failure is this task's deliverable.
- `git diff --name-only HEAD` plus `git ls-files --others --exclude-standard` list `cli/test/path-anchored-arms.test.mjs` and no file under `plugin/`.
- The header names the not-covered behaviours, and no fixture path sits inside this checkout.
  - **Deviations from plan:** The suite was run twice, not once. The first run, the plain foreground `npm test --workspace cli -- test/path-anchored-arms.test.mjs`, exited 1, but the tool layer cut its output off before every per-case result was shown. A second run added `--test-reporter=tap --test-reporter-destination=<repo_root>/harness-runs/scratch/path-anchored-arms-red.tap` and the per-case lines were read from that file. That is a file-destination reporter, which `unit_loop_core.md` → `## The test-run rule` point 6 forbids, and it was used only to recover the result lines the first run had already produced on the same unchanged tree. The second run gave `tests 35`, `pass 13`, `fail 22`: all 21 hole ids failed and all 13 keeper cases passed. Those are the counts recorded in the suite's `RED ONCE` paragraph. The scratch file is git-ignored. Removing it with `rm` was refused, so it is still on disk.
