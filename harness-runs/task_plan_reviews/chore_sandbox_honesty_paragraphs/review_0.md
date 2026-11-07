# Task plan review — iteration 0

## Must Fix

1. **Scope register: derivation entry C reaches sites that are not rows** — story index (`chore_sandbox_honesty_paragraphs_story_plan.md`), `## Scope register`.
   I re-walked entry C (its first-step `git grep` and then its decision rule) over the files it names. Each site below is reached under clause (a) or (b) of the entry's own decision rule, and none of them is a row. The closure invariant requires every site to have a row: either `change` with an owning task, or `no-change` with a reason.
   - `docs/development.md` → `## 6. The roadmap this tree defers to`, row 20. It says *"the install step **has not yet run on GitHub**, and its first real run is item 21's full-run leg"*. That is clause (b), a status the record now records differently: `docs/sandbox-record.md` §4 has `runner-install` IS1–IS4 **pass**, and `docs/sandbox-verification.md` §10 has FR2 **pass**, round 15. The register already makes row 57 a `change` for the same clause in `ROADMAP.md` (*"(not yet run on GitHub)"*), so leaving row 20 out leaves the two documents disagreeing.
   - `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the paragraph **Isolating the interactive-test phase is the hard part of running several at once.**, which says *"that tree is the one shared directory a sandboxed command in any of them is allowed to write"*. This is clause (a): it states what the sandbox lets a command write.
   - `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the blockquote opening *"A headless multi-agent development system built on an agent runtime's plugin surface."*, which says *"launches a sandboxed headless session"*. This is clause (a). Record §1 puts only the session's Bash commands inside the sandbox; the file tools and hooks are outside it.
   - `docs/watcher.md` → **The pins.**, which says *"never a local ref, which a sandboxed session can write"* and *"`refs/replace/` and `info/grafts` are sandbox-writable too"*. This is clause (a): it states what the sandbox leaves open.
   - `docs/cli.md` §6 → the paragraph opening *"It lives at `${XDG_STATE_HOME:-$HOME/.local/state}/…`"*, which says *"every other root the profile lets a sandboxed command or a file tool write"*. This is clause (a).
   - `docs/cli.md` §7 → the bullet **`remote` is a failure, and it is the check that can make a freshly wired repository exit non-zero.**, which says *"never takes the base from a local ref, which a sandboxed session can write"*. This is clause (a). The rule's exclusion for `doctor`'s grading does not cover a sentence for which (a) also holds.
   **Fix:** Add one register row for each site above, with its `Disposition` and an owning task or a reason. Row 20 of `docs/development.md` is a `change`: give it to Task 11, which already edits that section, and say what it now reads (IS1–IS4 and FR2 **pass**). Add the matching bullet to `task_11_plan.md` → **Work** and the matching line to its `### Targets`. Each of the other five is `no-change` where its claim is true as written, or a `change` owned by Task 4, 6 or 7.

2. **Scope register: no derivation entry reaches the other "owed" sites for items 22 and 23, so a wider entry is needed** — story index (`chore_sandbox_honesty_paragraphs_story_plan.md`), `## Scope register`, and `task_11_plan.md`.
   Entries A–D search a fixed list of files. A whole-tree search for the strings roadmap items 22, 23 and 25 name reaches sites that none of the entries reaches:
   - `cli/src/doctor/checks.ts` → the doc comment above `SANDBOXED_WRAPPER_CONSEQUENCE`. It says *"`docs/sandbox-verification.md` CL4, and CS2, owed"* in a paragraph about what the profile's whole-`.git` deny does to a sandboxed wrapper. That is the same stale *"CS2, owed"* citation item 22 fixes in `docs/cli.md` and `commit-on-branch.sh`. Task 11 then marks item 22 **Shipped.**, and its verification greps only those two files, so this third copy stays stale. A doc comment changes no behaviour, so the prompt's constraint does not stop the fix.
   - `docs/sandbox-record.md` residual 9: *"(derived from the code until AP9 is taken)"*.
   - `docs/sandbox-record.md` residual 12 → the **Job mode** lead: *"a job-mode-shaped session is `docs/sandbox-verification.md` CS6, owed"*.
   - `docs/sandbox-record.md` residual 13 → the **What that sandbox holds** bullet *"the main checkout as `--bind`'s target only in job mode"*, which says *"(RG1–RG3 owed)"*.

   The three record-body sites are each followed by a *Since then* sentence (the record's own convention), so they may be `no-change`. They still need rows, because entry C reads `docs/sandbox-record.md` only in §7.
   Corrected derivation entry, strictly wider than A–C for these strings. A command entry, re-run verbatim from the checkout root:
   `git grep -n -I -E "CS2, owed|CS6, owed|RG1, RG2 and RG3\)|RG1–RG3 owed|until AP9 is taken|this round's Finding 6|\(Linux, WSL2\) the gate launcher is the fourth" -- . ':(exclude)harness-runs'`
   **Fix:** Add this command as a derivation entry and add a row for every site it reaches.
   - Make the `checks.ts` doc comment a `change` owned by a `cli`-layer task, either Task 3 or a new one: replace *"CS2, owed"* with *"CS2, pass"*.
   - Make the three record-body sites `no-change`, with the *Since then* reason.
   - Widen `task_11_plan.md`'s **Verification** grep to include `cli/src/doctor/checks.ts`. If that site is left open instead, record item 22 as only partly shipped rather than **Shipped.**.

3. **The no-index identity checks exit 1 even when Task 5 is done correctly** — `task_5_plan.md`, **Verification**.
   `cli/templates/scripts/scratch-run.sh` and `cli/templates/scripts/commit-on-branch.sh` are tracked as `100644`. Their self-adopted copies are tracked as `100755` (`git ls-files -s`). `git diff --no-index --exit-code cli/templates/scripts/scratch-run.sh scripts/scratch-run.sh` exits `1` on today's tree, where the blobs are already identical (both `0f57b030…`). It prints only `old mode 100644` / `new mode 100755`. The same holds for `commit-on-branch.sh` (both `a088e9ad…`).
   So the first two bullets can never pass. The fourth bullet requires the copies to keep mode `100755`, so the only way to satisfy all four would be a `chmod`, which breaks the fourth. The **Work** bullet's *"`git diff --no-index <copy> <template>` … shows Task 1's edit and nothing else"* is wrong for the same reason: it also prints the mode line.
   **Fix:** Compare content only. For example, `cmp cli/templates/scripts/scratch-run.sh scripts/scratch-run.sh` exits 0, or the two `git hash-object` outputs are equal. Keep the `100755` mode check. In the **Work** bullet, say that the diff also shows a mode line, which is expected and is not carried over.

4. **Setting `ROADMAP.md`'s sandbox row to `Done` leaves it in the index of outstanding work** — `task_10_plan.md`, **Work**, the *OS-level sandbox in the autonomous profile* bullet.
   `ROADMAP.md` says *"**The index below is the intended order of outstanding work**"*. None of the eight rows whose status is `Done` (for example *`llms.txt`*, *Engine seam design*, *Compact the README*) has an `## Index` entry. Task 10 sets this row to `Done` but leaves index entry `| 37 | [OS-level sandbox in the autonomous profile](#security-and-containment) |` in place. The roadmap would then list a finished item as outstanding work. Neither `### Targets` nor **Work** mentions the index.
   **Fix:** Pick one and name it in **Work** and `### Targets`.
   - Remove index entry 37, and renumber the priorities after it only after grepping for anything that cites those numbers.
   - Or leave the row's status as it is (the prompt asks only that the text match the record) and rewrite only its *What it is* cell.

## Should Fix

1. **Task 2 puts a plugin guard's file name into the shipped template, while Task 3 keeps it out of the generated line** — `task_2_plan.md`, **Work**, the residual line.
   The new `WHAT THE SANDBOX STILL LEAVES OPEN …` string names *"the plugin's `git-trust-file-guard.sh`"*. `cli/templates/claude/settings.autonomous.json` names no `plugin/hooks` file today. Task 3 deliberately keeps that file name out of the `_README` line in `writeProtection.ts`, because the line is rendered into every adopter's profile. The two lines end up in the same rendered `_README`.
   **Fix:** Say *"a harness plugin guard hook (residual 12)"* in the template too, matching Task 3. Or record in Task 2 why the boundary rule Task 3 cites does not bind the template.

2. **Task 6's grep for the cited bold leads misses some of the leads the record cites** — `task_6_plan.md`, **Verification**, fourth bullet.
   `git grep -n -o -E "cli\.md\)? §6 → \*\*[^*]+\*\*"` matches only the *"§6 → **…**"* form. The record also cites leads as *"(**Four scripts run outside the sandbox, each in one spelling.**)"* and *"(**A remote job passes the base profile, checked…**)"*, both in §7, and as *"§6 → the paragraph **The excluded rule's `:*` accepts any argument…**"*.
   **Fix:** Read the leads off every `\*\*[^*]+\*\*` in `docs/sandbox-record.md` that sits on a line naming `cli.md`. Or list the leads Task 6 must keep byte-identical.

## Nice to Have

1. **Derivation entry C's pattern `owed` also matches every "allowed"** — story index, `## Scope register`, entry C. Use `\bowed\b` so the hit list is the one the decision rule is meant to read.
