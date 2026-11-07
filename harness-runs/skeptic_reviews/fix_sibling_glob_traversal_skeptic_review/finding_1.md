### 1. The stem arm's class veto takes `allow` away from every sibling and run-copy path below a scoped `appDir`, and the record says the `cd` arms are unaffected

**File:** `plugin/hooks/lib/harness-config-lib.sh`, in the **THE PATH-ANCHORED ARMS' VETOES ARE THE SAME TWO LINES IN GLOB FORM** paragraph: "and the scoped-`appDir` cost above, exactly as they were"
**And:** `docs/guard-verification.md` §2.4. Inventory row `b`: "the tail-free `--prefix` arm, the `cd` arms and every bare configured command are untouched (rows b1–b7)". Row b's **The bound, as a claim:** paragraph: "*the loss is exactly the `--prefix`-with-a-subcommand spelling, and nothing that does not carry a subcommand after the directory moves.*" §2.2's row `K13`: "the `cd` arms are unaffected". The `(m)` subsection's **The costs, m40–m42** paragraph and its fault-injection table.

**The problem.** Task 2 put the class veto `!cd $wt*[!A-Za-z0-9._/-]*` under the sibling stem arm `cd $wt*`. That veto fires on **any** character outside the class anywhere in the text the `*` matched. It does not fire only on a traversal or an expansion. Under a sibling worktree or a run copy, the stem arm was the only arm that granted a `cd` to a path **below** a configured directory. All the other `cd` arms are exact (`cd $root`, `cd $app_abs`, `cd $state_abs`, `cd $wt*/$app_rel`, `cd $wt*/$state_rel`) or take only a redirection tail (`cd <dir> *>*`). So when `appDir` is scoped, every one of these spellings moved from `allow` to SILENT:

- `git -C <srepo> status && cd <stem>x/packages/@acme/storefront/src && ls`. The tail `x/packages/@acme/storefront/src` carries `@`, so the class veto withdraws the stem arm. The subsumed `cd <stem>*/packages/@acme/storefront` arm needs the piece to end at the app directory, so it does not match. No other arm matches, and `cd` is not in `hc_safe_prefixes`. Before the branch, `hc_matches_any_pattern` returned 0 on the bare `cd $wt*` match.
- In a run copy `<copy>` = `<work_root>/<project_name>-<branch>` of a scoped-`appDir` adopter, `cd <copy>/packages/@acme/storefront/src` and `cd <copy>/packages/@acme/<another package>` are SILENT for the same reason. The copy's own path is matched only by the stem arm, and `cd $app_abs` is exact. Every unattended run executes in a run copy, so in a scoped monorepo `cd <copy>/packages/@acme/ui && npm test` now costs a prompt, and in an unattended run a prompt is a stall.

The same applies to any sibling or run-copy path that carries any character outside the class, such as `node_modules/@types/…`. That generalisation is a consequence of the same veto and needs no separate fix. The scoped-`appDir` subpath is the shape the existing records make claims about.

This is reachable, and it is wrong in two ways:

1. **The task prompt's constraints are not met.** The constraints say "No ordinary shape loses its allow" and "Any recorded decision that moves is either a finding or is argued in its row." Row `(m)` argues m40–m42 as costs. It records nothing about a subpath below a scoped `appDir`, and m39, its only scoped row, is the exact app directory, which the new subsumed arm buys back. Row `b`'s 2026-11-07 re-drive drove b1–b7, which are all on the main checkout (`cd <scoped app_dir>`, exact). It reported "`moved-by-branch`: none", which is true of those rows and silent about this shape.
2. **The records are now false, and they are the ones a maintainer is told to check "before re-litigating one".** Row `b`'s bound, its "the `cd` arms … are untouched", `K13`'s "the `cd` arms are unaffected", and the library's new sentence saying the scoped-`appDir` cost is "exactly as they were" all state an invariant the branch broke. A maintainer who gets a prompt on `cd <copy>/packages/@acme/ui` would read row `b`, conclude that the guard set cannot produce that prompt, and look for the cause elsewhere.

**Proof (derived from the matcher's source; Bash probes that ran the hooks were refused in this review session).** Pattern list on §0's scoped fixture S, stem `<stem>` = `<work_root>/scoped-shop-`:

```
cd <stem>*
!cd <stem>*[!A-Za-z0-9._/-]*        <- matches: '@' in "x/packages/@acme/storefront/src"
!cd <stem>*/..
!cd <stem>*/../*
cd <stem>*/packages/@acme/storefront   <- no match: piece ends in "/src"
...
cd <stem>*/sdlc-harness              <- no match
```

`hc_matches_any_pattern`: the first arm sets `hit=0`, the class veto sets `hit=1`, and no later arm matches, so it returns 1. `is_safe` then reaches the prefix loop, and no `hc_safe_prefixes` entry begins with `cd` (`lib/harness-config-lib.sh` → `hc_safe_prefixes`'s heredoc), so it returns 1 → SILENT. On the merge-base tree the `case` block in `hc_matches_any_pattern` returned 0 on `cd <stem>*` → allow.

**Fix.** Record the cost and correct the records that contradict it. Whether to buy the cost back is a separate question, listed under the review's Questions and not part of this fix.

1. `plugin/hooks/lib/harness-config-lib.sh`, paragraph **THE PATH-ANCHORED ARMS' VETOES ARE THE SAME TWO LINES IN GLOB FORM**. Replace "which leaves it, and the scoped-`appDir` cost above, exactly as they were." with: "which leaves it exactly as it was. The scoped-`appDir` cost above grows by one shape: under a sibling worktree or a run copy, the stem arm's class veto refuses a `cd` to any path carrying a character outside the class, so a path BELOW a scoped `appDir` (`<stem>x/packages/@acme/storefront/src`) costs one prompt, while the app directory itself keeps its allow through the subsumed `cd <stem>*/<appDir>` arm (`docs/guard-verification.md` §2.4 row `(m)`, m46–m47)."
2. In the same file, paragraph **THE TWO REJECT LINES IN BOTH HELPERS ARE ONE UNIT**. After "while the tail-free `--prefix` arm, the `cd` arms and every bare configured command are unaffected", add: ", except a `cd` below that directory under a sibling worktree or a run copy, which the stem arm's class veto refuses (see the next paragraph)".
3. `docs/guard-verification.md` §2.4, row `(m)`'s table. Measure these two rows by the subsection's own method (the scratch driver of the m44 / m45 re-drive, merge-base tree against the branch tip) and add them after m45:
   - `| m46 | \`git -C <srepo> status && cd <stem>x/packages/@acme/storefront/src && ls\`, on S | S's root | compounds | allow | **SILENT** | class veto — cost |`
   - `| m47 | \`git -C <scopy> status && cd <scopy>/packages/@acme/storefront/src && ls\`, where \`<scopy>\` is a \`git clone --shared\` of S at \`<stem>run_x\` | \`<scopy>\` | compounds | allow | **SILENT** | class veto — cost |`

   Use the measured decisions. If either measures differently from the derivation above, record what was measured and say so in the row.
4. In the same subsection:
   - Extend **The costs, m40–m42** paragraph's heading to "m40–m42, m46–m47". Add one sentence: "m46 and m47 are a scoped `appDir`'s subpaths under a sibling and under a run copy: the stem arm was the only arm granting a `cd` below a configured directory there, and the `@` is outside its class veto, so they prompt, while m39's exact app directory keeps its allow through the subsumed arm."
   - Re-run `v2` and `v4` with the two new rows. Update their row counts and the "rows that move" lists to what was measured (expected: `v2` gains m46 and m47, `v4` gains both).
   - Update the "`expectation breaks: 0 of N rows`" sentence of the re-drive that measured them.
5. In the same file, inventory row `b`. Replace "the tail-free `--prefix` arm, the `cd` arms and every bare configured command are untouched (rows b1–b7)" with "the tail-free `--prefix` arm, the `cd` arms on the checkout itself and every bare configured command are untouched (rows b1–b7); under a sibling worktree or a run copy, a `cd` below the scoped directory costs one prompt too, from row `(m)`'s stem-arm class veto (m46–m47)".
6. Row b's **The bound, as a claim:** paragraph. Append after the italic claim: "On the checkout itself. Since row `(m)`'s vetoes, a `cd` below the scoped directory under a sibling worktree or a run copy also moves (m46–m47), refused by the stem arm's class veto rather than by the helper's whitelist."
7. §2.2's row `K13`. Replace "the `cd` arms are unaffected" with "the `cd` arms on the checkout itself are unaffected; a `cd` below the scoped directory under a sibling or a run copy is §2.4 `(m)`'s m46–m47".
8. §2.4 inventory row `m`'s **Cost:** sentence. After "three redirect spellings on a `cd`, one prompt each (m40–m42)", insert ", a `cd` below a scoped `appDir` under a sibling or a run copy, one prompt each (m46–m47)".

No test change. The suite's header already excludes cost rows ("and the cost rows, which `docs/guard-verification.md` carries"), and this fix adds no hole or keeper.
