# general review — ### 4. Record both 2026-10-31 sessions (AP1–AP8 on round 1's head, and the AP7 control) and bring the documents of record into line — iteration 2

I checked every filled AP1–AP8 cell, the §0 sentence, the §6 bullet, the upstream report's bullets and `docs/cli.md` residual 12 against `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review_2.md` → *The two sessions (2026-10-31)*. They match it. No `not run — owed` is left in AP1–AP8, and `grep -rn "Owed on the round's head"` outside `harness-runs/` returns nothing. AP8's three verdict names match the strings `scripts/sandbox-absent-path-check.sh` → `write-probe` writes and `docs/development.md` → *The absent-path check, by hand.* quotes.

## Should Fix
1. **AP3 says "the 21 untracked built-ins", but the reading it quotes lists 20** — `docs/sandbox-verification.md` (§5 *The round's head, taken 2026-10-31*, row AP3) — "the 21 untracked built-ins (§6)"
   AP3 is read after `sweep`, and `sweep` removed `<clone>/.mcp.json`. So the quoted `git status (clone)` output has no `.mcp.json`. It runs from `.bash_profile` to `.zshrc` and is 20 paths (`wc -w` on the quoted list prints `20`). The same document's §6 bullet says `sweep` "leaves all but `.mcp.json`", which also gives 20. A reader who counts the quote will find it does not match the count beside it. The fix plan's wording ("with the 21 untracked built-ins") is where the error came from.
   **Fix:** Replace "the 21 untracked built-ins (§6)" with "the 21 built-ins (§6) less `.mcp.json`, which the sweep removed".

2. **The two stamp blocks are labelled "the report's lines verbatim", but they are not the report's lines** — `docs/sandbox-verification.md` (§5 *The round's head, taken 2026-10-31*) — "Session 1's stamp, the report's lines verbatim:" and, under **AP7's session, the control.**, "Its stamp, the report's lines verbatim:"
   `scripts/sandbox-absent-path-check.sh` → `run` (the same code at `d764fb2b`) writes `stamp.txt` in this order: `date`, `clone: $C`, `sibling`, `profile`, `main`, `main head`, `git`, `claude`, `bwrap`, `uname`, `apparmor_restrict_unprivileged_userns`. Each block differs from that in three ways:
   - it moves `clone:` to the end;
   - it gives `clone:` as the probe-branch suffix (`chore_sbx_probe_20261031080639`), where the real line holds the clone's full path `$C`;
   - it leaves out the `sibling:`, `main:` and (in session 1) `profile:` lines.

   The blocks are what the fix plan asked for: the review's six shared lines plus the date and clone it gives for each session. What is wrong is only the label "verbatim". Anyone comparing a later report against these blocks, or grepping one for `clone: chore_sbx_probe_…`, gets no match. The 2026-10-30 stamps above them say "verbatim" and are verbatim. I confirmed this by reading the script; I did not run it.
   **Fix:** Relabel both leads, for example "Session 1's stamp: the six lines both reports share, verbatim from the review, with this session's `date` and its probe clone's name (the report's `clone:` line holds the clone's full path)", and say the same for AP7's session.

## Nice to Have
1. **A missing comma** — `docs/sandbox-verification.md` (§5 **The route's re-take (owed).**) — "Three records follow taken on 2026-10-30"
   **Fix:** "Three records follow, taken on 2026-10-30".
