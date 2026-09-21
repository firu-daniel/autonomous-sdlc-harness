# Docs-catalog orchestrator loop (autonomous)

**Skip this phase unless `phases.docs` is `true` in `harness.config.json`.**

## Resolved values

The tokens below are neither Mode-contract **bindings** (this file declares none) nor ordinary **path placeholders** (`<branch>`, `<slug>`, `<i>`, `<step>`, `<doc_title>`, `<output_path>`, `<path>`, `<MAIN_REPO>`, which this file's own text resolves): they are derived at runtime or resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this run is executing in — the run's **own worktree**, not the main checkout. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. It is written `$REPO_ROOT` in the invocations below. |
| `<docs_root>` | config value | `docs.root` — the repo-relative directory holding the documentation corpus this loop builds. Read **only** when `phases.docs` is `true`, which is the same gate that decides whether this loop runs at all. |
| `<scripts_dir>` | config value | `scriptsDir` — the repo-relative directory the wrapper scripts this file invokes by path live in. The commit / push / watcher scripts named by path here are outer-loop scripts rather than generated wrappers — they are named by their destination path, and the item that delivers them settles it. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<project_name>` | config value | `projectName` — the adopting project's short identifier (`init` defaults it to the repository directory name). `## Final entry — INDEX` uses it as written, as the stem of the INDEX title and of that entry's commit subject. |
| `<default_branch>` | config value | `defaultBranch` — the branch work starts from and merges back into. Never a remembered branch name. Bound for completeness — no step in this file consumes it. |
| `<protected_branches>` | config value | `protectedBranches` — the branches the commit wrapper and the `git-commit-branch-guard.sh` hook refuse to commit or push to, and the branches the hard boundary below forbids merging into. The effective set is these together with `<default_branch>`. |
| `<parity_vocabulary>` / `<reference_impl>` | config value | `parity.referenceName` / `parity.referenceImplPath` — the name of the reference implementation this project is kept in parity with, and the path to it. Read **only** when `phases.parity` is `true`; with that phase off, a checklist entry carries no reference pointer and the writer returns no `parity_gaps:`. |

---

The canonical loop for `/autonomous-sdlc-harness:branch-start-docs-autonomous`. You are the **orchestrator**: you dispatch `docs-writer` / `docs-reviewer`, flip checklist boxes, and commit. You never write or review a doc yourself.

This loop is deliberately lean — no planner, no code/parity/architecture/skeptic reviewers, no QA, no statistics, no flow-progress ledger, no clarification channel. It reuses only the shared **path resolution**, **kill switch**, **safety checks**, **commit/push wrappers**, and the **pause protocol**, all named below.

---

## Setup (once, at session start)

1. **Paths (Override-A equivalent).** Resolve `<repo_root>` exactly as `## Resolved values` above states — a **bare** `git rev-parse --show-toplevel` (this worktree, not the main repo) — and write it `$REPO_ROOT` below. Every path you pass to an agent is **absolute** under `$REPO_ROOT` — worktree agents otherwise write to the main repo. `<MAIN_REPO>` (for the global kill switch only) is the first entry of `git worktree list`.
2. **Kill switch (Override-B equivalent).** If `<MAIN_REPO>/<state_dir>/AUTONOMOUS_STOP` exists, halt before dispatching anything and report it. Do NOT delete it.
3. **Branch.** `git branch --show-current` → `<branch>`.
4. **Read + parse the checklist** at `$REPO_ROOT/<state_dir>/docs_catalog/<branch>_docs.md`. It is an ordered list of entries; each entry is one doc and carries: a `[ ]`/`[x]` box, `slug`, `type` (`feature`|`concept`), `output_path`, `title`, and an `entry` blob. The **final** entry is always the `INDEX` (see below). See **Checklist entry format**.
5. **Dispatch counter.** Initialise `<state_dir>/.dispatch_counter` if absent; increment it by 1 before **each** agent dispatch; if it would exceed `MAX_TOTAL_DISPATCHES` (default **700**), halt and report (a runaway backstop, not an expected stop). Sizing: worst case is `entries × (2 + 2·fix_cap)` dispatches (1 write + 1 review + `fix_cap` write→review rounds each); a 50-entry checklist at fix-cap 3 needs 400, so 700 leaves headroom while still catching a genuine re-dispatch runaway.

---

## Checklist entry format (parse contract)

Each entry is a block like:

```
- [ ] `recent-searches-panel` · feature · <docs_root>/features/recent-searches-panel.md
      title: Recent Searches Panel
      entry: usecases: recentSearch, searchHistory ; screen: search/components/searchPanel/* + search/* ; stored_data: users/{id}/recent_searches, users/{id}/settings/search_history ; <parity_vocabulary>: <reference_impl>/presentation/panels/recent_searches_panel
```

The feature, slug, screen paths and stored-data set paths above are an illustrative worked example — a "recent searches panel" — so the parse contract has something concrete to be about. A real checklist names the adopting repository's own features, and carries the `<parity_vocabulary>` hint only when `phases.parity` is `true`.

The `entry:` blob is a small set of **research starting-point hints** — a use-case group, a screen, the feature's backend stored-data sets (as search points), and, when `phases.parity` is `true`, a pointer into `<reference_impl>`. It is deliberately NOT an exhaustive file list and NOT a scope boundary: the `docs-writer` researches outward from it (forward trace + stored-data provenance — see the writer's methodology). Parse the whole block per entry and pass `title`, `type`, `output_path`, and the raw `entry` blob straight through to the `docs-writer`. The `[ ]`/`[x]` box on the first line is the **only** iteration state.

One token inside the blob is special. If the blob contains an `existing:` token (e.g. `existing: architecture/ARCHITECTURE.md (refresh)`, or `existing: architecture/STATE_MANAGEMENT.md + guides/STATE_BEST_PRACTICES.md (merge + dedupe)`), parse out its file path(s) — they are relative to `<docs_root>`, so make each absolute as `$REPO_ROOT/<docs_root>/<path>`, treating a **bare filename** (no `/`) in an `A + B` merge list as relative to the **directory of the preceding path** in the same list (e.g. `architecture/NAVIGATION_PATTERN.md + NAVIGATION_LIFECYCLE.md` → the second file is `<docs_root>/architecture/NAVIGATION_LIFECYCLE.md`) — and carry them as a structured `existing_doc` (the refresh/merge target(s)) **in addition to** the raw blob. Most entries have no `existing:` token (the common feature-doc case); then `existing_doc` is omitted.

---

## Resume (every re-entry — fresh, or pause-resume)

Before doing anything, re-read the checklist and **jump to the first `[ ]` entry**; skip every `[x]` entry (its doc is already written and committed). There is no other resume state — the committed checkboxes are the ledger. Within an entry there is no partial state: an entry is atomic (write → review → commit flips its box in one commit), so a crash mid-entry leaves the box `[ ]` and the entry re-runs cleanly (the writer overwrites its own half-written file).

---

## Per-entry loop (walk `[ ]` entries top-to-bottom)

**Safety check before EACH agent dispatch:** re-check `<state_dir>/STOP` (per-run soft stop → finish nothing new, stop) and `<state_dir>/PAUSE` (see **Honoring a PAUSE**). Then increment `<state_dir>/.dispatch_counter`. Emit a heartbeat line `[docs · <slug> · <step>]` so the run is tailable. Then **compose the prompt — knowledge, not conclusions**: the dispatch is exactly the fields the step you are running names — step 1's, step 2's, step 3's same-fields-plus-`findings_file`, or `## Final entry — INDEX`'s own — plus at most the sanctioned `context_notes:` line; the rule and the record it owes are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`.

For entry `E` (unless `E` is the INDEX — see below):

1. **Write.** Dispatch `docs-writer` with `mode: catalog`, `doc_type`, `doc_title`, `doc_slug`, the `entry` hint blob, and the absolute `output_path` (`$REPO_ROOT/<output_path>`). When this entry's blob carried an `existing:` token, also pass the parsed `existing_doc` (the absolute refresh/merge target path(s)); omit it otherwise. It researches outward from the hints, writes the one doc, and returns `doc_path:` / `unverified:` / `parity_gaps:` / `notes:`.
2. **Review.** Dispatch `docs-reviewer` with `mode: catalog`, `doc_path`, the same `entry` hints, the same `existing_doc` (when one was passed to the writer, so the reviewer can verify the merge/supersede), `findings_path = <state_dir>/docs_catalog/reviews/<slug>/review_<i>.md` (start `i=0`), and `iteration=i`. It returns `verdict:` PASS|FAIL + `findings_file:` + `summary:`.
3. **Fix loop (cap 3).** On `FAIL`, re-dispatch `docs-writer` with the same fields **plus** the reviewer's `findings_file` to revise, then re-review at `i+1`. Repeat at most **three times**. If still `FAIL` after the cap: **do not stall** — record `<slug>` + the open `findings_file` in `<state_dir>/docs_catalog/needs_review.md` (append; create if absent) and proceed to commit the doc as-is (an imperfect doc committed + flagged beats a stuck run; docs carry no runtime risk).
4. **Harvest parity gaps.** *Applies only when `phases.parity` is `true` in `harness.config.json`; with that phase off the writer returns no `parity_gaps:` and this step is a no-op.* If the writer returned any `parity_gaps:`, append them under a `## <slug>` section in `<state_dir>/docs_catalog/parity_gaps.md` (create if absent). This file feeds the INDEX.
5. **Flip the box.** Edit the checklist: change this entry's `- [ ]` to `- [x]` (this exact entry only).
6. **Commit + push.** Stage exactly the files that changed this entry and commit via the wrapper, then push (see **Commit mechanics**):
   - always: the new `output_path` + the checklist file;
   - when changed this entry: `<state_dir>/docs_catalog/parity_gaps.md`, `<state_dir>/docs_catalog/needs_review.md`, and the `<state_dir>/docs_catalog/reviews/<slug>/` findings.
   - Subject: `docs: <doc_title>`.

Move to the next `[ ]` entry.

---

## Final entry — `INDEX`

When the only remaining `[ ]` entry is the `INDEX`, build the second-brain map. Dispatch `docs-writer` with `mode: catalog`, `doc_type: concept`, `doc_title: <project_name> Docs Index`, `doc_slug: index`, `output_path: $REPO_ROOT/<docs_root>/INDEX.md`, and an `entry` blob instructing it to: (a) read the checklist + every doc now under `<docs_root>/features/` and `<docs_root>/concepts/`, (b) produce a grouped, linked map (features by domain area, concepts by area) where every entry links its doc, and (c) fold in `<state_dir>/docs_catalog/parity_gaps.md` as a "`<parity_vocabulary>` parity gaps" section — only when `phases.parity` is `true`, since that file exists only then — and `<state_dir>/docs_catalog/needs_review.md` as a "Flagged for human review" section. Review it with `docs-reviewer` on the same field set as step 2 — `mode: catalog`, `doc_path`, the same `entry` blob, `findings_path = <state_dir>/docs_catalog/reviews/index/review_<i>.md` (start `i=0`), `iteration=i` — under step 3's fix cap, then flip its box and commit (`docs: <project_name> Docs Index`).

> Both dispatches in this section are governed by **Safety check before EACH agent dispatch** above — including its compose-the-prompt boundary, which here means *this section's own* field set.

---

## Honoring a PAUSE

Immediately after the `<state_dir>/STOP` check, apply `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` §2.2: if `<state_dir>/PAUSE` is present, pause at the next **clean tracked-tree boundary** — which for this loop is **between entries** (an entry's write→commit is atomic, so you are always clean between entries). Append `<state_dir>/PAUSE_PROGRESS.md` (note the next `[ ]` slug), write `<state_dir>/PAUSE_ACK`, emit `PAUSED: <branch> — docs, next <slug>`, and **end the session**. Do NOT delete `<state_dir>/PAUSE` (the watcher owns its lifecycle, and `rm` is not allow-listed in the generated profile — only `rm -rf` is on its deny floor, so a bare `rm` stalls rather than being refused). The watcher classifies the exit `paused` and resumes on `<state_dir>/RESUME`; resume re-reads the checklist and continues at the first `[ ]` (the pause note is a human hint, the checkbox is the truth). This is what makes the run **usage-gated**: when the 5h window maxes out the watcher pauses the run and resumes it when the window resets.

**Self-pause on API overload.** When a `docs-writer` / `docs-reviewer` dispatch dies on an API-infrastructure error rather than on anything the sub-agent did (`Agent terminated early due to an API error: API Error: 529 Overloaded`, likewise `500` / `503`), apply `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` §2.5: it is not a reviewer `FAIL` and advances no iteration cap — re-dispatch immediately, then once more after a backoff of **at most 60 s**, and on the third consecutive failure **self-pause** (append `<state_dir>/PAUSE_PROGRESS.md` noting the reason and the next `[ ]` slug, write `<state_dir>/PAUSE_ACK`, emit `PAUSED: <branch> — docs, next <slug> (API overload)`, end the session). Unlike the usage pause, nothing auto-resumes this one — it waits at registry `paused` for `/autonomous-sdlc-harness:branch-resume`. ⚠️ Never schedule a `Monitor`, never sleep for minutes, and never end the turn intending to continue after a backoff: the headless process is torn down at end of turn, so that exit is `rc=0` with no `PAUSE_ACK` and the watcher stamps the run **`completed`** and notifies **success** for a checklist that was never finished.

---

## Commit mechanics (single source of truth)

Commit **only** through the wrapper — never a raw `git add` / `git commit` (a raw `git commit` carrying a `<branch>` expansion stalls headless on the branch guard). Two rules keep the wrapper reliably auto-allowed by the script-allowlist guard: **(1) write the script-path token UNQUOTED and repo-relative** (`<scripts_dir>/commit-on-branch.sh`, resolved against the ambient worktree cwd) — a surrounding quote makes the token end in `.sh"`, and an absolute-variable path segment (a `$REPO_ROOT/…` prefix, say) can't be resolved textually by the guard; either one defeats its `*.sh`/path match, so the whole invocation silently falls through to `ask` and STALLS a headless run. **(2) The args after the script path may be quoted and may carry a plain `$VAR` or `${VAR}`** (`--repo "$REPO_ROOT"`, paths, message) — but nothing the guard's whole-string construct scan reads: `$(…)`, a backtick, `|` (hence `||`), `>`, `<` (hence a subject naming a `<placeholder>`) or a braced expansion other than a bare `${IDENT}` withholds the allow wherever it sits, subject included. Do **not** prefix a `cd "$REPO_ROOT" &&` (the guard reads that quoted-variable cwd literally and mis-resolves the relative path) — just rely on the worktree cwd the run already starts in:

```zsh
bash <scripts_dir>/commit-on-branch.sh --repo "$REPO_ROOT" \
  "<output_path>" "<state_dir>/docs_catalog/<branch>_docs.md" [<other changed paths…>] \
  -- "docs: <doc_title>"
bash <scripts_dir>/push-branch.sh "$REPO_ROOT"
```

> ⚠️ **No exit-code gate — deliberate.** Do **not** wrap the push in `if [ "$?" -eq 0 ]; then … fi`. Per `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` §1.6 that control-flow block is a headless trap: `allow-safe-compounds.sh` splits on `;` and the ` then bash …` piece begins with a non-allow-listed prefix, so the command falls through the safe-compound allow, nothing else matches it, and the run **stalls on a permission prompt it cannot answer headlessly** — **the commit silently does not land.** `$?` is unreliable across Bash calls anyway (each runs in a fresh shell). No gate is needed: an unconditional push is a harmless no-op whenever no commit landed.

The wrapper stages **only** the explicit paths listed before `--` (`git add -- …`, never `git add -A`/`.`), builds the message from the args after `--` (subject only — no `Co-Authored-By`/trailer, no `--no-verify`), and returns: 0 committed, 1 error (surface it), 2 protected-branch refusal (surface it), 3 nothing-to-commit. `push-branch.sh` is best-effort, non-fatal, only fast-forwards already-committed work, and reaches only the run's **own non-protected** branch — the protected-branch hard boundary is unchanged.

---

## Hard boundary

The flow ends at **"branch ready for review"** and must **never**:

- merge to a branch in `<protected_branches>`,
- push to a branch in `<protected_branches>`, or
- open or push a pull request.

Two layers enforce it at the harness level — the `pre-push` git hook, and above it the plugin's `PreToolUse` protected-branch guard together with the generated permission profile's `Bash(git push:*)` **`ask`** entry, which is evaluated before any `allow` and which an unattended run cannot answer — and this instruction restates the intent so the orchestrator never *attempts* it. Push only the run's own non-protected worktree branch (per commit, above).

**Done summary** (final message, no PR): docs written (count), any `needs_review.md` entries, the `parity_gaps.md` count, and the mandatory `📌 Dispatch additions: …` disclosure line in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## The disclosure line` gives it (including its `none` form, which is a normal outcome). If any dispatch above owes a block under that file's `## The entry format`, run that file's record step **once, before this summary** — never per entry — and commit it by this flow's own **Commit mechanics (single source of truth)** conventions above (the unquoted repo-relative wrapper token, no exit-code gate), which that section owns in full. It is best-effort and never a gate: a failure there is logged and the summary is emitted unchanged. Stop there.

---

## What you must NOT do

- Do **not** dispatch any of the code-engine agents (`layer-implementer`, `layer-reviewer`, any other `*-reviewer` beyond `docs-reviewer`, `qa-tester`, `*-plan-writer`, `statistics-plan-writer`) — none apply to prose.
- Do **not** run any configured `commands.*` string (type-check, tests, the dev server), the underlying package manager, or a browser — the docs flow touches no runtime.
- Do **not** edit doc bodies or the INDEX yourself — the `docs-writer` owns doc content; you own only the checkbox flips and the accumulator files (`parity_gaps.md`, `needs_review.md`).
- Do **not** park to ask a human — there is no clarification channel; unverifiable claims are the writer's `⚠️ unverified` markers, not a stop.
- Do NOT add anything to a dispatch prompt beyond what its governing instruction defines and the one sanctioned `context_notes:` line. The rule — **Knowledge, not conclusions** — and the record you owe for every addition are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`; this list does not restate them.
