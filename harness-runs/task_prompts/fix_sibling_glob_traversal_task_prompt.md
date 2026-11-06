`fix_sibling_glob_traversal` closes a hole in the guard set's path-anchored arms. The sibling-worktree arms that `hc_path_anchored_patterns` emits (`plugin/hooks/lib/harness-config-lib.sh`) are `case` globs ending in `*`. The glob never normalises, so a `..` traversal after the sibling stem matches it and leads anywhere on the machine. Three allow-only guards then grant a command that runs outside the workspace without a permission prompt. Nothing needs to be written to the repository first.

Found on 2026-11-06 while re-driving `docs/guard-verification.md` §2 with the payload's `cwd` in a clone (#275 §5). That round's record is on the unmerged branch `chore_record_guards_from_clone`. Its 2026-11-06 note in §1.5 states the hole as open. This branch rewrites that note, together with any other doc text describing the hole as open, to CLOSED with its closing arm named.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Re-take every measurement below against the tree you plan on before relying on it. They were taken at `7f7bb33d`.

---

## What is there today

- **The arms.** `hc_path_anchored_patterns` builds the sibling stem `wt="$work/$project-"` and emits `cd $wt*`. For each runner word, it also emits the exact tail-free `<word> --prefix $wt_app`, where `wt_app` is `$wt*/<appDir>`, or `$wt*` when `appDir` is `.`. Its header comment, **THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS**, states the design. The four allow-only guards build their path-anchored arms from this one function.
- **What already refuses a traversal elsewhere.** `hc_git_piece_in_workspace` and `hc_runner_piece_in_workspace` apply a literal `/../` reject and a path-character whitelist to a `-C` / `--prefix` directory carrying a subcommand. The library's comment **THE TWO REJECT LINES IN BOTH HELPERS ARE ONE UNIT** and §2.2 explain why. In the rewrite guard, `hc_in_workspace` is the same kind of glob. There a second test catches a traversal: the resolved path must be under `$top`. §2.1's D/F rows show that this test is load-bearing. The `cd` arms and the tail-free `--prefix` arms have neither defence.
- **Measured on §0's primary fixture (`appDir: packages/storefront`, `depInstall: npm ci`) with a real directory `/tmp/tv` outside the workspace.** `<work_root>/acme-shop-x` does not exist:

  | Command | guard | decision |
  |---|---|---|
  | `git -C <repo> status && cd <work_root>/acme-shop-x/../../…/tmp/tv && npm ci` | `allow-safe-compounds.sh` | **allow** |
  | `git status && npm --prefix <work_root>/acme-shop-x/../../…/tmp/tv/packages/storefront` | `allow-safe-compounds.sh` | **allow**, with no anchor piece |
  | `git -C <repo> status && cd <work_root>/acme-shop-x/../../…/tmp/tv && cat .claude/qa-accounts.env` | `allow-qa-credentials-read.sh` | **allow** |
  | the same `cd`, then `bash packages/storefront/scripts/typecheck.sh` | `autonomous-script-allowlist-guard.sh` | SILENT |
  | the same `cd`, then `rm x` | `git-rewrite-branch-guard.sh` | SILENT |
  | `cd <work_root>/acme-shop-x/../../…/tmp/tv && npm ci`, with no anchor piece | `allow-safe-compounds.sh` | SILENT. The `cd` becomes the anchor and does not resolve to a repository |
  | the `--prefix … ci` spelling, which carries a subcommand | `allow-safe-compounds.sh` | SILENT. The runner helper's `/../` reject catches it |
  | `cd <repo>/sdlc-harness/../../…/tmp/tv && ls` and `cd <app_dir>/../../…/tmp/tv && ls`, behind the anchor | `allow-safe-compounds.sh` | SILENT. Those arms are exact or space-suffixed |

- **A run copy adds a second route to the same arm.** Every run copy sits at `<work_root>/<project_name>-<branch>`, so for a session inside one, the sibling glob also covers the copy's own paths. From a run copy (a `git clone --shared` or a linked worktree alike), `git -C <repo> status && cd <repo>/../../…/tmp && ls` is **allow**. From the main checkout it is SILENT. The same applies to `cd <repo>/<symlink out> && ls`, which contradicts §2.4 (a)'s sentence that the `cd` arms do not accept the symlink.
- **What a grant reaches.** After the `cd`, the remaining pieces only need to match `hc_safe_prefixes`, and that set includes the configured `commands.*`. `npm ci` in an arbitrary directory runs that directory's `package.json` lifecycle scripts. The bound §2.4 (a) argues for the symlink residual is *no execution that in-repo write access does not already grant*. This hole needs no in-repo write, so that bound does not cover it.

## The goal

1. **No path-anchored arm grants a directory outside the workspace**, from the main checkout or from a run copy, by any spelling the shell resolves outside it. That includes `..` components, and whatever else the plan finds that reaches the same place: an expansion, a quote, a trailing slash, a `.` component. The plan decides the mechanism, and says why it chose that one over the others it considered. The library's **DO NOT widen the class** and **THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS** notes are binding unless the plan argues against one of them on the record.
2. **Every guard that builds on these arms is covered**, not only the three measured above. The plan lists, for each of the four allow-only guards, which arms it reaches and how the change reaches it.
3. **Records.**
   - `docs/guard-verification.md`:
     - a new row set in §2.4, marked CLOSED and naming the arm that closes it, carrying every row in the table above, the run-copy rows and the controls showing that ordinary sibling and run-copy spellings still allow;
     - a fault injection showing which leg produces each refusal;
     - §2.4 (a)'s `cd` sentence corrected for a session in a run copy.
   - Each affected guard's REPRO block and `plugin/hooks/README.md`, wherever they describe these arms.
   - `cli/test/`: tests that go red when the fix is removed. Record that each one was actually run red once.

## Constraints

- **No ordinary shape loses its allow.** That covers `cd <work_root>/<project_name>-<branch> && git status`, `git -C <sibling> status --short`, the tail-free `--prefix` on a real sibling, and every row §2 records as `allow`. Re-drive §2's standing matrices against the fixed tree. Any recorded decision that moves is either a finding or is argued in its row.
- **No existing refusal gets weaker**, in any guard.
- **The per-call cost is measured.** These guards run on every Bash call. Take §1.2's composite row paired, before and after. If the mechanism adds a fork or a filesystem lookup per piece, state the cost.
- **Scripts stay bash 3.2-compatible**, the macOS system `bash`.
- `scripts/run-gates.sh` must pass.
