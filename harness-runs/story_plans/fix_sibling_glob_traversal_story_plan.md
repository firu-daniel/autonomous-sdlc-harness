# Story: Close the sibling-glob traversal in the guards' path-anchored arms

## Context

This branch closes a hole in the four allow-only guards. `hc_path_anchored_patterns` (`plugin/hooks/lib/harness-config-lib.sh`) emits `case` globs, and `hc_matches_any_pattern` grants any piece that matches one of them. The sibling-stem arms end in a `*`: `cd <work_root>/<project_name>-*`, and the tail-free `<runner> --prefix <work_root>/<project_name>-*[/<appDir>]`. That `*` matches text the shell has not expanded and the glob never normalises. So a `..` component, an expansion, a quote, or a whole subcommand can sit inside the wildcard and still match. A session in a run copy reaches the same arm through its own paths, because every run copy sits at `<work_root>/<project_name>-<branch>`. Planning turned up a second route through a different arm. The space-suffixed `cd <root> *`, `cd <app_dir> *` and `cd <state_dir> *` arms accept a second word after the directory. zsh reads `cd <old> <new>` as "replace `<old>` in `$PWD` with `<new>`", so that word moves the directory. The Bash tool on this machine runs under zsh: the derivation command's shell error was printed in zsh's `(eval):1: no matches found` form. The route is derived from zsh's documented two-operand `cd`. Task 4 measures it, and nothing about it is recorded as measured until then.

**The mechanism: paired veto globs.** Every arm `hc_path_anchored_patterns` emits stays an arm. Each arm whose wildcard can carry a hostile spelling is now followed by one or more **veto** lines. A veto line is a `case` glob prefixed with `!`, and it is bound to the nearest arm above it. `hc_matches_any_pattern` grants a piece only when it matches an arm and none of that arm's own vetoes. The vetoes test only the text a `*` matched. They are the two reject lines the rewrite helpers already apply, a literal `/../` (or trailing `/..`) and the `[A-Za-z0-9._/-]` whitelist, plus, for the space-suffixed `cd` arms, a rule that the tail is one redirection word.

Six alternatives were rejected:
- **Physical resolution** (`cd -P`, `pwd -P`, a realpath per piece). It contradicts **THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS**, adds a fork per piece and a TOCTOU, and falsely refuses paths reached through macOS's `/tmp` symlink. It also cannot resolve a sibling that does not exist yet.
- **Moving the reject lines into `hc_in_workspace`.** That is exactly what the library's **THEY LIVE IN THE TWO HELPERS** note forbids without new measurements, and it would not reach the arms anyway: they never call it.
- **A per-guard operand check.** That makes four copies of what **THIS IS THE ONE DEFINITION** says has one home.
- **A new matcher that whitelists the whole operand.** It would also refuse the literal arms whenever the checkout path or `appDir` carries an out-of-class character, which moves §2.4 (b)'s "the `cd` arms are untouched" bound and K13, b2 and b3.
- **Lexically normalising `..`.** It still needs the expansion whitelist, because an unexpanded `$x` cannot be normalised.
- **A single-segment stem glob.** A POSIX `case` glob cannot express it without `extglob`, and a sourced library sets no shell options.

The chosen mechanism keeps both binding library notes. The vetoes are globs, with no lookup and no fork, and the character class is reused, not widened. It stays one definition: every guard reaches it through the shared matcher, so no guard's code changes. Its new sibling `cd <work_root>/<project_name>-*/<appDir>` and `/<stateDir>` arms are subsumed by the existing `cd <work_root>/<project_name>-*` arm, so they widen nothing. They exist only so that a scoped `appDir` under a sibling keeps its allow. Task 2 owns all of this.

**How each of the four allow-only guards reaches the arms, and how the change reaches it.** All four build their arms with `hc_path_anchored_patterns "$top"` and test a piece with `hc_matches_any_pattern`, so the veto semantics reach every one of them without touching their code.
- **`allow-safe-compounds.sh`**: through `is_safe`, on every piece. It reaches every `cd` arm and every tail-free `--prefix` arm.
- **`allow-qa-credentials-read.sh`**: through `is_safe`, after `load_prefix_sets`, on every piece that does not name the credentials file. This includes the `cd` in front of a `cat .claude/<creds>`.
- **`autonomous-script-allowlist-guard.sh`**: through `is_safe`, on every non-script piece. Its `run_cwd` takes the first `cd` operand verbatim, so in a run copy a `cd <copy>/<scriptsDir>/../../…` puts a relative `.sh` token textually under `<copy>/<scriptsDir>/` while it runs from outside. The arm granting that `cd` piece is the only thing standing in the way.
- **`git-rewrite-branch-guard.sh`**: through `is_safe_prefix`. `update_cwd_from_cd` then threads the granted `cd` into later pieces. A plain `rm` is still refused by its `$top` test. A bare `git rm` or `git mv` with no `-C` is accepted after any granted `cd`, so a traversal `cd` there is a hole of its own (derived; Task 4 measures it).

**What the branch records.** The answers to the clarification park set two of them.
- **Q1 → (B).** This branch writes its own CLOSED record: a new §2.4 inventory row `(m)` with its row set and fault injection, the §2.4 (a) `cd` sentence corrected for a session in a run copy, a §1.5 note of its own, and a §3.1 block. It does not touch `chore_record_guards_from_clone`, does not cite its commit, and leaves the i19 row alone.
- **Q2 → the writer's default.** The run measures the §1.3 fork counts before and after. It ships the paired §1.2 timing recipe in a fenced block and writes an explicit "owed, taken by hand" line. It puts no in-run wall-clock figure in any document of record.

The test task ships first, as the configured layer order puts it: `cli`, then `plugin`, then `general`. Its suite goes red on the unfixed tree, and that run is the red-once record the task prompt asks for. Task 2's fix turns it green, and the full suite runs in the Run gates phase. Every script stays `bash` 3.2-compatible.

**Top risks:**
1. **A veto that over-refuses an ordinary shape.** Tasks 1, 4 and 5 guard it by asserting the sibling, run-copy and redirect keepers against both trees and re-driving every §2 standing row.
2. **A veto family that is silently inert.** Task 4's fault injection removes each family alone, keeping the controls fixed.
3. **Records written from a measurement the doc task cannot reproduce.** The drivers live in the gitignored scratch tree. Task 7 re-runs each one before writing, and returns a blocker if a driver is missing rather than reconstructing figures.

**Manual setup required:**
- §1.2's composite row, before and after this branch's library, taken by hand outside any headless session on an otherwise idle machine, with the paired recipe Task 7 ships in §1.2. Until it is filled in, the "owed, taken by hand" line Task 7 writes stands.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_sibling_glob_traversal/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, in the configured layer order, with the catch-all layer last.

1. [x] **Task 1** — Add the path-anchored-arms decision suite and record it red against the unfixed guards _(layer: cli)_ _(points: 20)_
2. [ ] **Task 2** — Pair every wildcard-bearing path-anchored arm with veto globs and honour them in `hc_matches_any_pattern` _(layer: plugin)_ _(points: 20)_
3. [ ] **Task 3** — Describe the vetoed arms in the four guards' headers and REPRO blocks and in `plugin/hooks/README.md` _(layer: plugin)_ _(points: 15)_
4. [ ] **Task 4** — Drive the `(m)` row set, its fault injections and the fork counts on paired trees _(layer: general)_ _(points: 20)_
5. [ ] **Task 5** — Re-drive §2.1, §2.2 and §2.5's piece-matching matrices on paired trees _(layer: general)_ _(points: 20)_
6. [ ] **Task 6** — Re-drive §2.3's fail-closed matrix, §2.4's rows a–l and §2.6's file-tool rows on paired trees _(layer: general)_ _(points: 20)_
7. [ ] **Task 7** — Record the closure in `docs/guard-verification.md` — §2.4 row `(m)`, the §2.4 (a) correction, the §2 re-drive, §3.1, §1.2, §1.3 and §1.5 _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"This branch rewrites that note, together with any other doc text describing the hole as open, to CLOSED with its closing arm named."* — and, for the guard-side records, *"Each affected guard's REPRO block and `plugin/hooks/README.md`, wherever they describe these arms."* The guard scripts and the library are source files, so their headers and REPRO blocks are code-level docs and are owned by Tasks 2 and 3 rather than registered here. The register covers the durable corpus text only.

**Derivation entry A — corpus files (command).** Re-run verbatim from the checkout root. It is read-only and was executed while this plan was written:

```sh
git grep -n -o -E '.{0,100}(path-anchored|hc_path_anchored_patterns|hc_matches_any_pattern|cd <work_root>/<project_name>-|`cd` arm|`cd <repo> \*` arm|cd <link>|sibling-worktree arm|two rewrite helpers|exact or space-suffixed).{0,100}' -- 'docs/**/*.md' 'plugin/**/*.md' '*.md' ':!harness-runs/**'
```

Entry A excludes everything under `harness-runs/`. The two standing tracked artifacts there, `lessons.md` and `improvement_suggestions.md`, are covered by entry B.

**Derivation entry B — standing-artifact rows (procedure).**
- **Artifact:** the two standing tracked artifacts under `harness-runs/`, `lessons.md` and `improvement_suggestions.md`.
- **Traversal:** `lessons.md`'s topic headings in file order, then each one-line rule under each. Then `improvement_suggestions.md`'s headings in file order, then each entry under each.
- **Decision rule:** an entry is reached when its text, not its `taught by` attribution, states a property of the guards' path-anchored arms, of the sibling stem `<work_root>/<project_name>-*` as the guards use it, or of `hc_matches_any_pattern`.
- **Walked for this plan, it reached no entry.** The four `lessons.md` lines that mention a sibling glob do so only inside the branch name `fix_linux_sandbox_sibling_glob_trio` in their attribution.

**Closure invariant:** every site either derivation entry reaches on the tree this plan was written against appears as a row below. On the finished branch, every line a re-run of entry A prints is either one of these rows or a line this branch itself added (`git diff` against the merge base with `origin/dev` lists it as added).

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/guard-verification.md` → §1.3, *"`allow-safe-compounds.sh`'s other two are the library's `cat <<EOF` heredocs in `hc_path_anchored_patterns` and `hc_safe_prefixes`"* | — | A, `hc_path_anchored_patterns` | `no-change` | Task 2 keeps the arms and vetoes inside the one existing heredoc, so the sentence stays true. Task 7's §1.3 re-drive records a moved cell as a finding |
| 2 | `docs/guard-verification.md` → §1.5(b) table row `` `hc_path_anchored_patterns` `` *"one `cat`, for its heredoc"* | — | A, `hc_path_anchored_patterns` | `no-change` | A dated wall-clock decomposition of costs not addressed. No in-run timing may restamp it, and the per-call figure this change owes is §1.2's hand re-take (Task 7's owed line) |
| 3 | `docs/guard-verification.md` → §1.5(b), *"`hc_path_anchored_patterns` at roughly 6.8 ms net of the floor"* | — | A, `hc_path_anchored_patterns` | `no-change` | Same reason as row 2 |
| 4 | `docs/guard-verification.md` → §2.1 call-order row 6, *"the arms are start-anchored `case` globs"* | — | A, `hc_path_anchored_patterns` | `no-change` | The state assumed at the call site (cleaned, trimmed, one line) is unchanged, and the veto lines are start-anchored `case` globs too |
| 5 | `docs/guard-verification.md` → §2.1 **A.**, *"the `cd` arms for root, `<app_dir>` and `<state_dir>` allow"* | — | A, `` `cd` arm `` | `no-change` | The exact arms are untouched. Task 5 re-drives family A, and a moved row is argued in Task 7 |
| 6 | `docs/guard-verification.md` → §2.1 **D/F.** row *"`cd <work_root>/<project_name>-<branch> && rm <tracked>` (a real worktree)"* | — | A, `cd <work_root>/<project_name>-` | `no-change` | No traversal, so no veto fires, and it stays one of the two rows that show both containment tests are load-bearing |
| 7 | `docs/guard-verification.md` → §2.1 **D/F.** row *"`cd <work_root>/<project_name>-<branch>/../../../etc && rm passwd`"* | — | A, `cd <work_root>/<project_name>-` | `change` | Task 7. The arm's `/../` veto now refuses the `cd` piece before either containment test is reached, so the row gains that leg |
| 8 | `docs/guard-verification.md` → §2.1 **D/F.** row *"`cd <work_root>/<project_name>-<branch>/../<project_name> && rm <tracked>`"* | — | A, `cd <work_root>/<project_name>-` | `change` | Task 7, same reason as row 7 |
| 9 | `docs/guard-verification.md` → §2.1, *"The middle four are the rows a later "simplification" has to fail on"* | — | A, `` `cd` arm `` / arm prose | `change` | Task 7. The load-bearing argument moves to the two rows without a traversal `cd`, and the paragraph names the veto as the new first refusal |
| 10 | `docs/guard-verification.md` → §2.2 **Composition.**, *"K13, whose `cd` arm is already a compound"* | — | A, `` `cd` arm `` | `no-change` | A spelling note, and K13's exact arm is untouched |
| 11 | `docs/guard-verification.md` → §2.2 K13, *"the `cd` arms are unaffected"* | — | A, `` `cd` arm `` | `no-change` | Still true from the main checkout, and Task 2's sibling `/<appDir>` arm keeps it true under a sibling. Task 5 re-drives it |
| 12 | `docs/guard-verification.md` → §2.4 inventory row `b`, *"the tail-free `--prefix` arm, the `cd` arms and every bare configured command are untouched"* | — | A, `` `cd` arm `` | `no-change` | The bound is preserved by the region-only class veto and the sibling `/<appDir>` arm. Task 6 re-drives b1–b7, and Task 4's m39 is the sibling twin |
| 13 | `docs/guard-verification.md` → §2.4 inventory row `g`, *"It is what confines the `cd` arms to one line"* | — | A, `` `cd` arm `` | `change` | Task 7. The sentence rests on §2.1's residual measurement (row 28), which Task 2 moves: the space-suffixed `cd <D> *` twin no longer exists, and every wildcard-bearing arm's class veto excludes a newline from what its `*` matched. Task 7 restates the bound from Task 5's direct-matcher rows `r3a`–`r3d`. The row stays an **OPEN** obligation, because `hc_clean_piece`'s multi-line arm is still unreachable and a caller that splits differently still inherits it |
| 14 | `docs/guard-verification.md` → §2.4(a) row a3, `` `cd <link> && ls` `` | — | A, `cd <link>` | `change` | Task 7. The main-checkout row stands, and its run-copy twins a8 and a9 are added beside it |
| 15 | `docs/guard-verification.md` → §2.4(a), *"The `cd` arms do not (a3) — and not because of the symlink"* | — | A, `` `cd` arm `` (the same line also matches `two rewrite helpers` and `exact or space-suffixed`) | `change` | Task 7. This is the task prompt's §2.4 (a) `cd` sentence, corrected for a session in a run copy |
| 16 | `docs/guard-verification.md` → §2.4(b), *"The tail-free arm survives because it is a literal `case` glob emitted by `hc_path_anchored_patterns`"* | — | A, `hc_path_anchored_patterns` | `no-change` | b2 is the main checkout's literal `--prefix <app_dir>` arm, which carries no veto |
| 17 | `docs/guard-verification.md` → §3.1, *"`cd <repo> && cat <creds>` (the path-anchored arm)"* | — | A, `path-anchored` | `no-change` | A dated block of an earlier change, and the exact arm it names is untouched |
| 18 | `docs/guard-verification.md` → §3.1 N50/N51, *"reached through the `cd` arm"* | — | A, `` `cd` arm `` | `no-change` | A dated block, and `cd <repo>` is an exact arm |
| 19 | `docs/guard-verification.md` → §3.1, *"every path-anchored, `git -C` and `--prefix` keeper each guard's REPRO block lists"* | — | A, `path-anchored` | `no-change` | A dated block's driven set |
| 20 | `docs/guard-verification.md` → §3.1, *"the two extra `cat` are the library's `hc_path_anchored_patterns` and `hc_safe_prefixes` heredocs"* | — | A, `hc_path_anchored_patterns` | `no-change` | A dated block, and the heredoc stays (row 1) |
| 21 | `docs/guard-verification.md` → §3.1 N116, *"the same, through the `cd` arm"* | — | A, `` `cd` arm `` | `no-change` | A dated block, and an exact arm |
| 22 | `docs/guard-verification.md` → §3.4, *"the path-anchored-pattern block lifted out of both guards into the shared library"* | — | A, `path-anchored` | `no-change` | A dated re-implementation record |
| 23 | `plugin/hooks/README.md` → `## The shared library`, *"It also owns the *path-anchored* prefixes — the arms that name a per-checkout directory"* | — | A, `path-anchored` | `change` | Task 3 |
| 24 | `docs/guard-verification.md` → §2.4 inventory row `a`, *"An in-workspace path that is a **symlink out** is accepted by the two rewrite helpers"* | — | A, `two rewrite helpers` | `change` | Task 7. The row's shape is rewritten: the symlink is also accepted by the sibling `cd` arm, for a path under a sibling and, from a run copy, under the copy itself |
| 25 | `docs/guard-verification.md` → §2.5 attribution row, *"the same de-quote **moved** out of `hc_git_piece_parts` and into `hc_repo_dir_from_command`, so the anchor is de-quoted and the two rewrite helpers are not"* | — | A, `two rewrite helpers` | `no-change` | A dated attribution of the de-quote, not a description of any arm's acceptance |
| 26 | `docs/guard-verification.md` → §2.4 **Outcome** paragraph, *"nine open, three closed, and one gap that is not a residual at all"* and its *"Rows `h`, `i`, `j`, `k` and `l` were all added later"* sentence | — | Added by hand from Task 7's edit list (**The counts.**); entry A does not reach it | `change` | Task 7. The open and closed counts and the list of later-added rows gain row `(m)` |
| 27 | `docs/guard-verification.md` → §2.4, *"Row `h` was added with the bare-`&` separator rather than in this section's own round"* | — | Added by hand from Task 7's edit list (**The counts.**); entry A does not reach it | `change` | Task 7. The paragraph gains a sentence for row `(m)`, added with this branch's fix and carrying its own measurement |
| 28 | `docs/guard-verification.md` → §2.1 `#### Residuals recorded, not closed`, the `hc_clean_piece` multi-line bullet, *"`hc_matches_any_pattern` **matches** a `cd <repo> *` arm across the newline"* | — | A, `hc_matches_any_pattern` and `` `cd <repo> \*` arm `` | `change` | Task 7. The measured claim does not survive Task 2 as written: the `cd <repo> *` arm it names becomes `cd <repo> *[<>]*`, and the class veto under it (`!cd <D> *[!0-9<>&A-Za-z/._-]*`), like every wildcard-bearing arm's class veto, has a newline outside its class. That is derived, not measured. Task 5 drives the direct two-line matcher call on both trees (rows `r3a`–`r3d` of `sgt_redrive_pieces.tsv`), and Task 7 restates the bullet from those rows |
