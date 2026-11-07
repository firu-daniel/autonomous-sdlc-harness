### 1. A zsh numeric-glob operand (`<->/…`) passes the `cd <dir> *[<>]*` twin's operand vetoes, so zsh's two-operand `cd` still leaves the workspace

**File:** `plugin/hooks/lib/harness-config-lib.sh` (`hc_path_anchored_patterns`): "cd $root *[<>]*"
**And:** `plugin/hooks/git-rewrite-branch-guard.sh` (the piece loop): "s/[[:space:]]+[0-9]*[<>][^[:space:]]+[[:space:]]*$//"

**The problem.** Task 2 replaced each space-suffixed `cd <dir> *` arm with `cd <dir> *[<>]*` and three operand vetoes. The library's comment says those vetoes "admit only a single redirection word (`2>/dev/null`, `>/dev/null`, `2>&1`, `&>/dev/null`)". §2.4 row `(m)` of `docs/guard-verification.md` records the zsh two-operand `cd` route (m25–m27) as **CLOSED** on that basis. But the arm and its vetoes admit `<` as well as `>`, and in zsh a word containing both is not necessarily a redirection. `<x-y>` is zsh's **numeric-range glob**, a default glob operator that needs no `EXTENDED_GLOB`, and `<->` matches any all-digit name. Take the tail `<->/../../outside`:

- **Arm** `cd <repo> *[<>]*`: the tail contains `<`, so the arm matches.
- **Veto 1** `!cd <repo> *[!0-9<>&A-Za-z/._-]*`: every character of `<->/../../outside` is in the class, so it does not fire.
- **Veto 2** `!cd <repo> [!0-9<>&]*`: the tail opens with `<`, which is in the set, so it does not fire.
- **Veto 3** `!cd <repo> [0-9]*[!0-9]*[<>]*`: the tail is not digit-led, so it does not fire.

So `hc_matches_any_pattern` grants `cd <repo> <->/../../outside`. Under zsh (this session's Bash tool runs zsh: its errors print in the `(eval):1: no matches found` form), the operand globs to `1/../../outside` whenever an all-digit directory exists in the working directory. `mkdir -p` is in `hc_safe_prefixes`' base set, so the same compound can create one. zsh's `cd <old> <new>` then substitutes `1/../../outside` for `<repo>` in `$PWD` and moves outside the workspace, which m25/m26 measured for a plain operand. Concretely, `allow-safe-compounds.sh` derives **allow** on:

```
git -C <repo> status && mkdir -p 1 && cd <repo> <->/../../outside && npm ci
```

That runs `npm ci` with an outside directory's lifecycle scripts, which is the capability the task prompt's "What a grant reaches" names. The three other allow-only guards read the same arms, so `cat .claude/<creds>` and `bash <scripts_dir>/<x>.sh` ride the same way.

`git-rewrite-branch-guard.sh` is reached even more directly. Before matching, its trailing-redirect `sed` strips any final word matching `[0-9]*[<>][^[:space:]]+`, so `cd <repo> <->/../../outside` reaches `is_safe_prefix` as the bare `cd <repo>`. The exact arm grants it, and `update_cwd_from_cd` threads `<repo>`. A following `rm tracked.txt` then passes `validate_rm_piece` against `<repo>`, while zsh deletes `outside/tracked.txt`. The library change alone does not close this guard, because the strip runs first.

This is **derived from the matcher's source and zsh's documented glob operators, not measured**. Bash probes outside read-only git were refused in this review session. The fix below includes the measurement.

**Fix.** Admit `>` only. No admitted redirection word contains `<`.

1. In `plugin/hooks/lib/harness-config-lib.sh` → `hc_path_anchored_patterns`, in the `cat <<EOF` heredoc, rewrite each of the three twin groups. Shown for `$root`; apply the same to `$app_abs` and `$state_abs`:

   ```
   cd $root *>*
   !cd $root *[!0-9>&A-Za-z/._-]*
   !cd $root [!0-9>&]*
   !cd $root [0-9]*[!0-9]*>*
   ```

   A `<` anywhere in the tail is then outside veto 1's class, and as a first character it also fires veto 2. Every word the comment admits (`2>/dev/null`, `>/dev/null`, `2>&1`, `&>/dev/null`) still matches the arm and no veto. Update that function's comment ("The three operand vetoes under each ` *[<>]*` twin"), and the **THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS** paragraph's "a tail that must carry a redirection operator" sentence, to say `*>*`. Then add one sentence: a `<` is refused because zsh reads `<x-y>` as a numeric-range glob, so a `<`-bearing word can be a second `cd` operand.
2. In `plugin/hooks/git-rewrite-branch-guard.sh`'s piece loop, change the strip to output redirects only:

   ```sh
   piece=$(printf '%s' "$piece" | sed -E 's/[[:space:]]+[0-9]*>[^[:space:]]+[[:space:]]*$//')
   ```

   In the same file's **A TRAILING REDIRECT IS STRIPPED BEFORE A PIECE IS MATCHED** header paragraph, add that only a `>`-bearing word is stripped, because a `<`-led word can be a zsh numeric glob and a second `cd` operand. The cost is one prompt for a trailing input redirect on an `rm` piece, which is a narrowing, never a permit.
3. In `cli/test/path-anchored-arms.test.mjs`, add two entries to the `holes` array:

   ```js
   ['m44', COMPOUNDS, `git -C ${repo} status && mkdir -p 1 && cd ${repo} <->/../../outside && npm ci`, repo],
   ['m45', REWRITE, `git -C ${repo} status && cd ${repo} <->/../../outside && rm tracked.txt`, repo],
   ```

   Run that file alone (`npm test --workspace cli -- test/path-anchored-arms.test.mjs`). It is the file this fix edits.
4. In `docs/guard-verification.md`:
   - Add m44 and m45 to §2.4 row `(m)`'s table, and N153 and N154 to §3.1's veto block. Measure each by driving the two guards on the branch's merge-base tree and on the fixed tree, by §2.4 `(m)`'s own method.
   - Re-run that section's four fault-injection variants with the new rows, and update the `v3` / `v4` row counts with the result.
   - Replace every `*[<>]*` spelling with `*>*`: §2.1's residual list (the r3 paragraph), row `(m)` in the inventory table, the `(m)` subsection's intro and "Which two trees" paragraph, the `v3` row, and the §3.1 veto-block intro.
   - Add one sentence to the `(m)` subsection's **The second operand** paragraph recording the numeric-glob spelling and its measured decision.
