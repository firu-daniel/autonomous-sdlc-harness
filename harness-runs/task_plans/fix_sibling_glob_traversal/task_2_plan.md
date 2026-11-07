### Task 2 — Pair every wildcard-bearing path-anchored arm with veto globs and honour them in `hc_matches_any_pattern`

**Goal:** Close the sibling-glob traversal in the one place all four allow-only guards share. Each arm `hc_path_anchored_patterns` emits whose wildcard can carry a spelling the shell resolves outside the workspace gets its own `!`-prefixed veto globs. `hc_matches_any_pattern` then grants a piece only when it matches an arm and none of that arm's vetoes. No fork is added, no filesystem lookup is made, and no guard's code changes.

**Depends on:** Task 1, which adds the path-anchored-arms decision suite under `cli/test/` and records it red on the tree this task starts from. That suite is this task's acceptance contract. This task neither runs it nor edits it: the Run gates phase does. The contract, restated so you implement it without opening that file (`<repo>` has `projectName` `acme-shop`, `appDir` `packages/storefront`, and `npm` as its runner word):

- **must become SILENT:**
  - a `cd` or a tail-free `npm --prefix` under `<work_root>/acme-shop-x` carrying `/../`, a trailing `/..`, `${x}..`, `$(:)..`, a quote, `/./../`, a trailing-slash traversal, or `/$X`;
  - the same `cd` taken from a run copy as `<copy>/../../outside`, including the script guard's `cd <copy>/packages/storefront/scripts/../../../../../outside && bash packages/storefront/scripts/typecheck.sh`;
  - `npm --prefix <work_root>/dotshop-x install left-pad`, with `appDir` `"."`;
  - `npm --prefix <work_root>/acme-shop-x exec curl /packages/storefront`;
  - `cd <repo> <outside>`, `cd <repo> ..` and `cd <repo>/packages/storefront <outside>`;
- **must stay `allow`:**
  - `cd <W> && git status`, `cd <W>/packages/storefront`, `npm --prefix <W>/packages/storefront`, and `cd <work_root>/acme-shop-x/..foo`, where `<W>` is a real sibling worktree;
  - from a run copy, `cd <copy>`, `cd <copy>/packages/storefront` and `npm --prefix <copy>/packages/storefront`;
  - `cd <repo> 2>/dev/null`;
  - `npm --prefix <work_root>/dotshop-x`, tail-free;
  - `cd <repo>/packages/storefront && npm ci`.

**Where this task stops.** It edits the library alone. The four guards' headers and REPRO blocks and `plugin/hooks/README.md` are **Task 3's**, which describes in prose what this task builds. Every `docs/guard-verification.md` record is **Task 7's**. This task's comments name the record they rely on as `docs/guard-verification.md` §2.4 row `(m)`, which Task 7 writes.

### Targets

- `plugin/hooks/lib/harness-config-lib.sh` — `hc_path_anchored_patterns`, `hc_matches_any_pattern`, `hc_runner_words`, and the comment blocks that describe them.

**Work:**

- [ ] **`hc_path_anchored_patterns`: emit an arm, then that arm's vetoes.** Keep the one existing `cat <<EOF` heredoc for the fixed lines, so the function forks nothing new. Keep the runner lines in the existing `printf` loop. A veto is a line beginning with `!`, followed by a `case` glob, and it binds to the nearest non-`!` line above it. Exactly these, with `<class>` = `A-Za-z0-9._/-`, `<wt>` = `$work/$project-`, and `<D>` each of `$root`, `$app_abs` and `$state_abs`:
  - **The `cd <D>` arms.** Each exact `cd <D>` is unchanged. Each space-suffixed twin `cd <D> *` becomes `cd <D> *[<>]*`, so the tail must carry a redirection operator. Each twin is followed by three vetoes:
    - `!cd <D> *[!0-9<>&A-Za-z/._-]*` — the tail is one word, in a class that admits a redirection;
    - `!cd <D> [!0-9<>&]*` — the tail opens like a redirection;
    - `!cd <D> [0-9]*[!0-9]*[<>]*` — a digit-led word is a descriptor number and nothing more.
    Together they admit `2>/dev/null`, `>/dev/null`, `2>&1` and `&>/dev/null`. They refuse a second `cd` operand, which zsh reads as `cd <old> <new>` against `$PWD`.
  - **The sibling `cd` arm.** `cd <wt>*` is followed by `!cd <wt>*[!<class>]*`, `!cd <wt>*/..` and `!cd <wt>*/../*`.
  - **Two new sibling arms**, emitted only when the relative directory is not `.`: `cd <wt>*/$app_rel` and `cd <wt>*/$state_rel`. Each is followed by `!cd <wt>*[!<class>]*/<rel>` and `!cd <wt>*/../*`. They widen nothing, because every piece they match already matched `cd <wt>*`. They exist so that a scoped `appDir`, such as `packages/@acme/storefront`, under a sibling keeps the allow the class veto on `cd <wt>*` would otherwise cost it.
  - **The runner arms.** `<word> --prefix $app_abs` is unchanged. `<word> --prefix $wt_app` is followed by:
    - when `appDir` is `.`: `!<word> --prefix <wt>*[!<class>]*`, `!<word> --prefix <wt>*/..` and `!<word> --prefix <wt>*/../*`;
    - otherwise: `!<word> --prefix <wt>*[!<class>]*/$app_rel` and `!<word> --prefix <wt>*/../*`.
    The class veto is also what refuses a subcommand riding inside the wildcard, because a space is outside the class.
  - **Signatures Task 4 relies on.** Task 4 fault-injects one family at a time by filtering this function's output in a scratch copy, so keep these four properties:
    - every `/..` veto contains `/..`, and no other veto does;
    - every class veto contains `[!<class>]` spelled exactly `[!A-Za-z0-9._/-]`, and no other line does;
    - the three operand vetoes follow, and only follow, an arm ending ` *[<>]*`;
    - a positive line never begins with `!`.
- [ ] **`hc_matches_any_pattern`: honour the pairing.** Walk the lines once, as today. On an arm line, first return 0 if the previous arm matched and survived its vetoes. Then test the new arm and remember whether it matched. On a `!` line, test the glob after the `!` only when the current arm matched; if it matches, that arm is vetoed. At the end, return 0 if the last arm matched and survived. Keep these unchanged: the arm glob stays unquoted in the `case` label, blank lines are ignored, and the function runs in builtins only. Rewrite its header comment to state the veto semantics and that a veto can only withdraw the arm it follows. It can never grant.
- [ ] **`hc_runner_words`: skip a leading word that begins with `!`.** It joins `''|*/*` in the skip `case`. Such a word is not a runner, and an arm built from it would read as a veto. The skip can only shrink the runner set, and `hc_runner_piece_in_workspace` reads the same list.
- [ ] **Keep every comment in this file true.**
  - **`THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS`** now describes the vetoes as globs too. It drops "any trailing arguments" from the sibling `cd` arm, says the space-suffixed `cd` twins carry only a redirection tail and why (zsh's two-operand `cd`), and names the two new sibling arms.
  - **`THE TWO REJECT LINES IN BOTH HELPERS ARE ONE UNIT`** says the arms' vetoes are the same two lines in glob form. They are applied only to the text a `*` matched, so a literal arm, and the scoped-`appDir` cost the note already records, is untouched. **DO NOT widen the class** binds the vetoes too.
  - **`ONE RESIDUAL, RECORDED SO IT IS NOT RE-LITIGATED: A SYMLINK`**: correct *"Measured, it reaches only these two helpers: the `cd` arms do not match a path BELOW a configured directory"*. The sibling arm matches any path under a sibling, and, for a session in a run copy, any path under the copy itself. So the residual reaches that arm with the same bound: writing the link is a write inside a checkout of the workspace.
  - **`THIS IS THE ONE DEFINITION`** says the four guards reach the vetoes through `hc_matches_any_pattern`, with no guard change.
  - Grep the file for every other comment naming `hc_path_anchored_patterns` or `hc_matches_any_pattern`, and keep each true.

**Verification:**

- Reproduce by hand, per `plugin/hooks/README.md` → `## Reproducing a decision by hand`, on a throwaway `git init` fixture under the system temp directory, never on this checkout. Build it as the Depends-on line describes, with a real `git worktree add` sibling and a `git clone --shared` copy. Drive it with `/bin/bash`, the 3.2 floor. Every **must become SILENT** shape is SILENT and every **must stay `allow`** shape is `allow` through `allow-safe-compounds.sh`. The credentials, script-allowlist and rewrite shapes decide the same way through their own guards. A multi-step probe may live under `harness-runs/scratch/` and run through `bash scripts/scratch-run.sh harness-runs/scratch/<file>.mjs` (or `.py`). `scripts/scratch-run.sh` has no `.sh` interpreter row, so a `.sh` probe exits 66.
- `hc_path_anchored_patterns "<repo>"`, printed on that fixture, shows each veto directly under its arm, with no line beginning with `!` that is not a veto and no other `cat` than the one heredoc.
- `bash -n plugin/hooks/lib/harness-config-lib.sh` under `/bin/bash` exits 0. Nothing added uses a construct newer than bash 3.2: no `[[ … =~ ]]` capture arrays, no associative arrays and no `${var,,}`.
