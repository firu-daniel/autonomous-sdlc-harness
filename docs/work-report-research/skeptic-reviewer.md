# Work report research — skeptic-reviewer

## Verdict

**Recommend with changes.** This agent gains more from a work report than the per-unit agents do, for two reasons:
- It is dispatched about once per branch, so even per-tick writes are cheap.
- Its clean **`verdict: PASS` records that the stage passed but not which checks ran** (`skeptic-reviewer.md:178` writes no file). The autonomous ledger flips `C2g`/`C2m`/`C2f` (`autonomous_pause_and_ledger.md:82-84`) and D.2 prints "passed clean" (`core:676`); semi-autonomous runs keep no ledger, so there even the stage trace is chat-only. In this repository's run artifacts PASS is roughly a third of branches: 30 skeptic indices against 44 code reviews in `harness-runs/`.

Four changes are required:
1. **Write the report once, just before returning.** `sed -i` ticking is allowed (`settings.autonomous.json:39`), but write-once is chosen: PASS may touch no disk, in-place ticking would work around the deliberate no-`Edit` read-only guarantee (`skeptic-reviewer.md:10`), and tick timing is unverifiable anyway.
2. **Embed the template in the definition.** No `cp`, and no extra up-front file.
3. **On FAIL, store the report inside `findings_folder`.** C2.3's `review_plan_file` commit already stages that folder.
4. **On PASS, return the report as a section above `verdict: PASS`.** This keeps the no-disk rule. The caller retains the section the way it retains `## Questions`, and must parse the last `verdict:` line. **This PASS copy is not durable** (it lives in the D.2 chat summary and is lost across a pause, `core:669`), so on PASS goal (a) is only met if the autonomous `C2g` flip line carries the evidence (open question 1).

The hard constraint holds (−1 154 agent-owned words). The saving comes from cutting redundancy, not from moving actions out: only about 640 of 5 373 words are actions. The 993-word `## Adversarial checks` section is the grading standard and must stay up front.

## Read tree

Measured with `wc -w` in this checkout. `harness.config.json` sets `stateDir: harness-runs`, the layers `cli`, `plugin` and `general` (`.`), and all `phases.*` to `false`.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/skeptic-reviewer.md` | up-front | 5 373 |
| `.claude/CLAUDE.md` (auto-loaded) | up-front | 1 695 |
| **Every** `layers[].conventions`: `cli.md` 2 647 + `plugin.md` 4 174 + `conventions.md` 5 864 (`skeptic-reviewer.md:75`, "Read **all** of them") | up-front | 12 685 |
| `<state_dir>/lessons.md` = `harness-runs/lessons.md` (`:76`) | up-front | 1 199 |
| Committed code-review index + `finding_*.md`, architecture review + findings, parity review when enabled (`:70-73`) | up-front, variable | e.g. 5 436 + 1 855 (`feat_forge_run_control`), 3 901 + 1 846 (`feat_docs_catalog_retrieval`) |
| Task prompt + story index (`:93`) | up-front, variable | e.g. 10 107 / 8 274 (same two branches) |
| `plugin/samples/sample_code_review.md` + `sample_code_review/finding_1.md` (`:160`; `:81` makes an unreadable "format fixture" a blocker, so they are effectively read) | up-front on the FAIL path | 1 146 + 377 = 1 523 |
| Whole-branch diff hunks + targeted reads (`:85-92`) | up-front, variable | n/a |
| `task_plans/<branch>/task_<N>_plan.md` ("only where … unclear", `:93`) | on demand | variable |
| `<reference_impl>` method end to end (check 2, `:92`) | on demand, parity only | n/a here |
| `unit_loop_core.md` → `## The test-run rule` (`:156`) | on demand | 732 |
| `branch-reviewer.md`, `business-parity-reviewer.md`, `architecture-reviewer.md`, `review-plan-reviewer.md` (`:14`, `:64`) | cited as identities, not read | — |

**Fixed up-front total: 20 952** (5 373 + 1 695 + 12 685 + 1 199), or 22 475 on FAIL with the samples. On top of that comes about 14–17 k words of per-branch inputs. **The agent's own share is 5 373, about a quarter of the fixed load**, and it is the only part this proposal touches.

## Dispatch sites and phases

- **Sole dispatch:** `plan_orchestration_instructions_core.md` → `### C2.1 Generate the skeptic review` (lines 340–367). It runs once per branch, after Phase C and before Phase E. The heartbeat is `[C2 · skeptic-review · iter 0]`.
- **Re-dispatch:** `### C2.2`, step 2 (`:387`), runs on each `review-plan-reviewer` FAIL, up to `iteration >= 5`. It uses the literal `Adjust the skeptic-review index at … per findings at <findings_file>.`, also quoted at `skeptic-reviewer.md:64`. `review-plan-reviewer` writes no file on PASS (`review-plan-reviewer.md:64`, `:177`), so each `review_<i>.md` there is one FAIL and one Adjust re-dispatch: 4 files (`feat_forge_run_control` 1, `feat_forge_run_triggers` 2, `fix_remote_job_permission_profile` 1) over 30 indexed branches.
- **Flows that run it:**
  - the autonomous plan flow (`plan_orchestration_instructions_autonomous.md:161`, `:309`; ledger entries `C2g`, `C2m` and `C2f` at `autonomous_pause_and_ledger.md:82-84`);
  - the semi-autonomous flow (`branch-implement-plan-semi-autonomous.md:29`).
- **Flows that never run it:** the supervised flow (no reviewers), the user-review fix flows (no grep hits), and docs runs (`docs_orchestration_instructions_autonomous.md:24`). Run modes cannot turn it off (`run_mode_instructions.md:83`).
- **Downstream readers of its output:**
  - `review-plan-reviewer` (C2.2), which reads `finding_<N>.md` files by name (`review-plan-reviewer.md:82`, `:107-108`);
  - `committer` `review_plan_file` (C2.3);
  - unit-loop row `C2.4` (`unit_loop_core.md:202`);
  - D.2 Done summary (`core:676`, `:681`);
  - `/autonomous-sdlc-harness:branch-status`, which reads `<state_dir>/skeptic_reviews/` and scans review artifacts for `deferred`, `assumption`, `BLOCKED`, `unreachable` (`plugin/commands/branch-status.md:43`, `:45`). A `work_report.md` there would feed that scan (S9's text alone could match), so it needs the same ignore clause.

## Prose classification

Section totals are measured with `sed -n 'a,bp' | wc -w`. The four-way split is my estimate against each total. Ranges include their headings; the 20 ranges sum to 5 372 (file `wc -w` 5 373).

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 101 | 0 | 0 | 101 | 0 | Read by Claude Code |
| Intro (8–10) | 291 | 20 | 120 | 0 | 151 | Four "real escape" anecdotes are repeated in checks 1–4; the no-`Edit` rationale is long |
| `## What you are NOT` (12–14) | 137 | 30 | 70 | 0 | 37 | "De-dup over *filed* findings, not a charter fence" is load-bearing |
| `## Resolved values` (16–33) | 774 | 0 | 330 | 0 | 444 | `<app_dir>` is "bound for completeness — no step … consumes" it (`:23`); the `<repo_root>` row restates CLAUDE.md's checkout-root rule; the placeholder paragraph (`:18`); docs rows are inert when `phases.docs` is false |
| Invocation block (36–48) | 71 | 0 | 0 | 71 | 0 | Byte-mirrors `core:349-357` |
| Key table (50–58) | 162 | 0 | 100 | 0 | 62 | Restates `## Read first` |
| mkdir / parsed return (60–62) | 112 | 0 | 30 | 50 | 32 | Restated again at `:178` and `:194` |
| Re-dispatch + downstream (64–66) | 145 | 20 | 75 | 50 | 0 | WIRE: the Adjust literal and the C2.4 byte-compatibility |
| `## Read first` list (68–77) | 343 | 90 | 150 | 0 | 103 | The docs-tool rule recurs at `:79` |
| Not-the-corpus + blocker (79–81) | 177 | 30 | 80 | 15 | 52 | WIRE: `blocker:` replaces the verdict line |
| `## Process` (83–95) | 263 | 150 | 53 | 60 | 0 | WIRE: both diff commands and `"N run-artifact files excluded from the reviewed diff."` |
| `## Adversarial checks` 1–5 (97–123) | 993 | 230 | 670 | 0 | 93 | **The grading standard.** The real-escape parentheticals partly duplicate the intro |
| Confidence bar (125–127) | 82 | 0 | 82 | 0 | 0 | |
| Grade ladder (129–133) | 148 | 0 | 148 | 0 | 0 | The same ladder appears in 4 reviewers |
| PASS-is-valid + not-downgradable (135–137) | 121 | 0 | 70 | 0 | 51 | "Stated here because…" rationale |
| Guard carve-out + prose volume (139–141) | 217 | 0 | 160 | 0 | 57 | Also in `branch-reviewer` and `layer-reviewer` |
| `## Findings format` list (143–152) | 428 | 40 | 88 | 300 | 0 | WIRE: `## Phase 2 Readiness — Ordered Fix List`, the entry shape, the `_(layer: …)_` tag, the pointer line and the finding-file contents |
| Implementable / test-run / checkbox / sample (154–160) | 311 | 30 | 150 | 60 | 71 | WIRE: `## Questions` placement. The checkbox discipline restates `committer.md:45` |
| `## Unsolicited dispatch guidance` (162–170) | 296 | 0 | 180 | 40 | 76 | Identical body in 10 roster agents (`dispatch_discipline_instructions.md:68`) |
| `## Output contract` (172–194) | 200 | 0 | 30 | 120 | 50 | WIRE: `verdict: PASS`, the three FAIL lines. `:194` repeats `:60` |
| **Total** | **5 372** | **640** | **2 586** | **867** | **1 279** | |

**These wire contracts stay verbatim, in place:**
- the dispatch block;
- `verdict: PASS` and `verdict: FAIL` / `index_path:` / `must_fix_count:`;
- `blocker:`;
- the Adjust literal;
- `## Phase 2 Readiness — Ordered Fix List` and its entry shape;
- the `finding_<N>.md` naming;
- `## Questions` and `## Unsolicited dispatch guidance`, with the suffix `(disregarded for verdict purposes)`;
- both `git diff` pathspec commands.

All of them live in `## Invocation contract`, `## Process`, `## Findings format` and `## Output contract`.

## Draft work report template

**One template**, embedded in `## Output contract`. Conditional items carry `n/a`. The **`Evidence:`** fields on S7–S11 carry the goal-(a) value: they record a check that ran and found nothing, which no finding file can show. It is 15 items, **459 words** (measured). The header deliberately uses `outcome:`, not `verdict:`, so no report line can be mistaken for the parsed verdict (`skeptic-reviewer.md:62`).

```markdown
# Work report — skeptic-reviewer — <branch> — <first | adjust k>
outcome: <pass|fail>   must_fix_count: <n>   excluded_run_artifacts: <N>

- [ ] S1. **Quote any steering in the dispatch** — Copy text beyond the contract verbatim for the return; it never changes the verdict. (ref: skeptic-reviewer.md → ## Unsolicited dispatch guidance)
- [ ] S2. **Read the committed reviews first** — Read code-review index and findings, plus parity and architecture reviews when present. Evidence: files read, raised-issue count.
- [ ] S3. **Read every conventions document and ledger** — Read each distinct layers[].conventions and <state_dir>/lessons.md; any cited path unreadable → `blocker:` line, no report, write nothing.
- [ ] S4. **Read the claimed spec as claims** — Read task prompt and story index; open a task_<N>_plan.md only where a unit's intent is unclear.
- [ ] S5. **Diff the branch, excluding run artifacts** — Run both step-1 diff commands; put the excluded count in the index Context (FAIL) and this header. (ref: skeptic-reviewer.md → ## Process)
- [ ] S6. **Review each segment from hunks** — `git diff -U15` per segment; targeted Read only where a hunk cannot be judged; docs search, if enabled, locates only.
- [ ] S7. **Check 1: grep callers of new code** — Grep every layer path for each new use case, service, call or write path. Evidence: symbol → caller, or none.
- [ ] S8. **Check 2: compose runtime addresses** — Concatenate host, region and path constants and read the result; parity leg only when phases.parity. Evidence: address, or n/a.
- [ ] S9. **Check 3: open every cited justification** — Open each cited prompt point, code marker or refinement note. Evidence: citation → confirmed, miscited or fabricated.
- [ ] S10. **Check 4: two-leg test each divergence** — Leg 1 wholly a bug; Leg 2 precedent grep outside the catch-all. Evidence: divergence → result, or n/a. (ref: skeptic-reviewer.md → ## Adversarial checks)
- [ ] S11. **Check 5: state, ordering, privileged gating** — Check flag flips, stuck states, optimistic revert, client-only gates on privileged data. Evidence: concern → cleared or finding.
- [ ] S12. **Filter: net-new, proven, graded** — Drop already-raised or unproven candidates; check Must Fix triggers keep their grade. (ref: skeptic-reviewer.md → ## Confidence bar)
- [ ] S13. **Route undecidable fixes to Questions** — A fix needing a choice nobody in the loop owns goes in `## Questions`, never a finding file.
- [ ] S14. **FAIL: write index then findings** — `mkdir -p` findings_folder; write the index, then one finding_<N>.md each; PASS → n/a, touch no disk. (ref: skeptic-reviewer.md → ## Findings format)
- [ ] S15. **Adjust: change only what is named** — Apply the meta-review findings file; never regenerate or renumber; first dispatch → n/a.
```

**How the modes are handled:**
- **PASS vs FAIL:** S14 is `n/a` on PASS, and the header records the outcome.
- **Blocker:** no report. The `blocker:` line replaces the verdict and no file is written (`:81`); the blocker line is itself the evidence.
- **Adjust that withdraws every finding:** still a FAIL-path file, `work_report_<k>.md`, with `must_fix_count: 0` and S15 naming the withdrawn findings.
- **First vs adjust:** S15 is `n/a` on the first dispatch. An adjust dispatch re-ticks S2–S13 only where it re-ran them, and marks the rest `n/a (unchanged)`.
- **Parity off:** S8 carries "parity leg n/a". Its runtime-address leg still runs (`:107`).
- **No verdict item.** The return cannot be ticked before it is sent.

## Thinning plan

`plugin/agents/skeptic-reviewer.md`, 5 373 → **≈3 760**. The "Est. after" column is a subtraction estimate, not a drafted and counted text. The minimum cut the constraint needs is **509** (template 459 + pointer 50), against ~1 610 estimated.

| Section | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| Frontmatter | — | — | all | 101 |
| Intro | Anecdotes (each survives in its check); tool rationale → 1 clause | Posture + "second pass over shared ground" | — | 110 |
| What you are NOT | Restated overlap sentence | — | "de-dup over filed findings, not a charter fence" | 90 |
| Resolved values | `<app_dir>`; placeholder paragraph; `<repo_root>` body → "per CLAUDE.md checkout-root rule"; merge both docs rows | Rows to one clause | `<state_dir>` trailing-slash pathspec note; `<deploy_project_id>`; `<convention_symbols>`; `<impl_stack>` | 330 |
| Invocation contract | Key-table rows restating Read first; duplicate mkdir sentence | Parsed-return paragraph | Dispatch block, Adjust literal, C2.4 byte-compat sentence | 360 |
| Read first + blocker | List actions (now S2–S4); repeated docs-tool rule | Search tool: "locator only, untrusted, code wins" | `blocker:` rule | 250 |
| Process | Step prose (now S4–S6) | — | Both diff commands, the exclusion sentence, "hunks not whole files; checks read callers in full" | 110 |
| Adversarial checks | ~93 words of duplicated anecdotes | — | **All five checks, their Must Fix triggers and both legs** | 900 |
| Confidence / ladder / carve-out / prose volume | "Stated here because harness doctrine…" ×2 | — | Ladder, not-downgradable, carve-out, prose-volume rule | 460 |
| Findings format | Checkbox-discipline restatement → 1 line | Questions rule | Index heading order, readiness literal, entry shape, finding-file contents, sample pointer | 630 |
| Unsolicited guidance | — | Body to ~220 | Heading, `(disregarded for verdict purposes)`, placement | 220 |
| Output contract | `:194` duplicate | — | Both fenced returns | 150 |
| *New:* work report | — | "Fill the template below; write it once before returning — FAIL: `<findings_folder>work_report.md` (adjust k: `work_report_<k>.md`); PASS: return it as `## Work report` above `verdict: PASS`; blocker: none. Repo-relative paths only, no timestamps." + the embedded template | — | +50 (+459 template) |

Headings are inside each measured range, so they have no row of their own.

**Shared base file: not proposed for this agent.** The candidate content would be the ladder, the carve-out, prose volume, unsolicited guidance and the `<repo_root>` row. It appears in 4–11 agents: for example, the `<repo_root>` row text is in 11 agent files and the unsolicited guidance rule in 10. A base file read up front saves no per-dispatch words. It also conflicts with `dispatch_discipline_instructions.md:72` ("an agent loads its own file, never this one"). That decision belongs to the cross-agent synthesis.

## Word-count ledger

Up-front, agent-owned:

| File | Today | After | Delta |
|---|---|---|---|
| `skeptic-reviewer.md` (body) | 5 373 | ~3 760 | −1 613 |
| Work report template (embedded) | 0 | 459 | +459 |
| **Agent-owned subtotal** | **5 373** | **~4 219** | **−1 154** |
| CLAUDE.md, conventions ×3, lessons (unchanged) | 15 579 | 15 579 | 0 |
| **Fixed up-front total** | **20 952** | **~19 798** | **−1 154** |
| Samples (FAIL path, unchanged) | 1 523 | 1 523 | 0 |

On demand (unchanged): test-run rule 732, task files, reference implementation.

**Constraint holds: yes**, with margin: the estimates could be ~1 100 words too optimistic before it fails. The template costs +459. It is paid for by the −1 613 of cuts, which are worth making with or without work reports. Nothing was moved behind a `ref:`, so no on-demand file grows.

**Read-list conflict (lead 13): none.** `.claude/CLAUDE.md:40-43` names `conventions.md`, the per-layer files and, for branch-level review, the lessons ledger; the definition (`:75-76`) asks for the same set, so the counted set is the same either way.

## Storage and lifecycle

- **Frequency.** One dispatch per branch, plus one per C2.2 meta-review FAIL (at most 4). Observed: 4 adjust dispatches over 30 indexed branches, ≈1.1 reports per FAIL branch and ≈1.09 per branch overall.
- **Key and index.** The brief's `work_reports/<branch>/<phase>/<agent>/report_<i>.md` gives no benefit here. The ledger id `C2` is invisible to the agent and absent in semi-autonomous runs. **Use the caller's `findings_folder`** (`<state_dir>/skeptic_reviews/<branch>_skeptic_review[_<round>]/`), which already encodes branch and round in both flows:
  - first dispatch → `work_report.md`;
  - adjust *k* → `work_report_<k>.md`, with *k* = 1 + the `review_<i>.md` number in the Adjust literal's `<findings_file>`. The agent derives it; the caller needs no change.
  - **Collision-safe (lead 10):** `findings_folder` is per branch and round, and *k* follows the meta-review iteration within one C2.2 loop. A second skeptic round gets a suffixed folder. The meta folder `skeptic_review_plan_reviews/<branch>/` is not round-suffixed, so its own `review_<i>.md` could be overwritten across rounds. That is pre-existing and does not affect the report name.
- **Tools.** `tools: Read, Glob, Grep, Bash, Write, mcp__harness-docs__search_docs` (`:4`). There is no `Edit`, and `:10` makes that deliberate ("Do not treat it as an oversight to work around"). Unattended runs allow `Bash(cat:*)` and `Bash(sed:*)` (`settings.autonomous.json:36`, `:39`), `mkdir -p` (`:45`) and `Write(/<repoRoot>/**)` (`:50`), but not `cp`. So `sed -i` ticking is possible. It is not chosen, because it would sidestep the tool-level read-only guarantee, PASS may not touch disk at all, and tick timing proves nothing. An embedded template plus a single `Write` is the design.
- **FAIL: committed for free.** C2.3's `review_plan_file` stages `${plan_path%.md}/` whole and unconditionally (`committer.md:113`). Its subject is fixed (`chore: add code review for <branch>`) and is **excluded** from subject reconciliation (`committer.md:89`). **Lead 3 therefore does not bite**: no reconciliation signal is hidden, and no fixed-path commit misses the report.
- **Downstream consumers (leads 9, 11).** `review-plan-reviewer`'s orphan check is worded over `finding_<N>.md` (`:107-108`), and C2.4 reads `finding_<K>.md` by name, so neither should misread the file. `/autonomous-sdlc-harness:branch-status`'s keyword scan (`branch-status.md:45`) would. All three should get an explicit "ignore `work_report*.md`" clause.
- **No leakage (lead 12).** The agent writes "with `Write` and absolute paths" (`:186`) and builds paths from `<repo_root>` (`:23`), so evidence lines would naturally carry absolute worktree paths. The pointer line requires repo-relative paths and no timestamps.
- **PASS: must not touch disk.** This applies at `skeptic-reviewer.md:60`, `:178` and `:194`, and the caller relies on it at `core:360` and `:364`. The autonomous `C2g` flip lands "with no artifact commit behind it" (`plan_orchestration_instructions_autonomous.md:184`).

  A PASS file would be untracked, would not trip the tracked-clean invariant (`autonomous_pause_and_ledger.md` → `## 3`), and would **never be committed**. It could also be swept into a later `task`/`review_item` commit that stages paths from `git status --short`.

  **Fix:** return the filled report as a `## Work report` section above `verdict: PASS`. C2.1 retains it verbatim, the same way it retains `## Questions` (`core:367`), and D.2 prints one line from it. This is a wire change in three places: `skeptic-reviewer.md` `## Output contract`, `core` C2.1 and D.2. C2.1's parse must take the **last** `verdict:` line, or the one outside any `##` section. **Durability gap:** D.2 is chat output and a session resumed after a pause cannot restate what it did not walk (`core:669`), so a PASS report is lost if the run pauses between C2 and D.
- **Hooks.** Every matcher in `plugin/hooks/hooks.json` is `Bash`. `Write` is unhooked, so nothing blocks the write.

## Risks and costs

- **Cost is low for this agent.** One `Write` (≈600 output tokens) per dispatch, against a dispatch that already makes dozens of `git diff` and `grep` calls. Even 15 per-tick rewrites would be marginal here, unlike `layer-reviewer`. Write-once is still recommended, because tick timing adds no verifiable value.
- **Goal a: evidence lines only.** Nothing can prove *when* a box was ticked (lead 6 applies). The value is in S2 and S7–S11's `Evidence:` fields, especially on PASS: today a clean pass is indistinguishable from a pass that never ran check 1. On PASS that evidence is durable only if it reaches a committed artifact (see Storage). On FAIL, finding files already carry proof (`:152`), so the report adds only the negative evidence.
- **Ref-starvation (lead 7) applies strongly.** `## Adversarial checks` (`:97-123`) is the standard every finding is graded by. If items S7–S11 replaced it, the agent would grep callers without the "every layer path, or you grade a wired feature dead" scope (`:102`). It would also run Leg 2 without excluding the catch-all (`:116`). **The checks stay up front**, and the items only index them.
- **Misapplication of S12.** "Drop already-raised" can be misread as "skip checks 1/3/4 because `branch-reviewer` runs them". `:14` and `:99` exist to prevent that, so the S12 `ref:` and the kept `## What you are NOT` text must survive thinning.
- **Reviewing other agents' reports (lead 5): safe if keyed by branch.** The skeptic's diff excludes `:(top,exclude)<state_dir>/*<branch>*` (`:87`). I verified that the pathspec `*` matches across `/`: `git ls-files -- ':(top)harness-runs/*feat_forge_run_control*'` returns 109 nested paths. So any report tree that carries `<branch>` in its path is excluded. A report store **without** the branch stem in its path would land in the reviewed diff and be graded. Keep `<branch>` in every agent's report path.
- **Meta-review sees the report.** `review-plan-reviewer` reads the findings folder. It could grade evidence lines against findings, which is useful, or raise noise on report formatting. Its contract needs a one-line stance either way.
- **Callers, tests, scripts.** No `cli/test/*.mjs`, script or hook quotes skeptic prose. `cli/src/generators/stateDir.ts:84-86` lists only directory names. The thinning breaks nothing mechanical. The parsed wire is `core:363-367` and `:387`.

## Open questions

1. Should the PASS report travel in the return (proposed here) or be committed (lead 8)? The cheapest durable route is in the autonomous flow: the `C2g` flip is already a commit on the PASS arm (`plan_orchestration_instructions_autonomous.md:184`), so it could carry the S7–S11 evidence in its ledger line or stage the report. Semi-autonomous runs would still need a new commit point.
2. Should every reviewer key its report under its existing `findings_folder` rather than a uniform `work_reports/` tree? Whichever tree is chosen must carry `<branch>`, so the skeptic's and branch-reviewer's exclusion pathspecs keep working.
3. Should `review-plan-reviewer` be told to ignore `work_report*.md`, or to cross-check its evidence lines against the findings?
4. Should D.2 print the PASS report's evidence (a "skeptic passed clean — checks 1–5 ran: …" line) or only retain it?
5. The `<app_dir>` row ("no step … consumes") and the `<repo_root>` row are duplicated across 11 agents. Remove them corpus-wide by hand, independently of this proposal?

## Review response

All Must Fix and Should Fix findings are accepted and applied, plus Nice to Have 1–4. There are no rebuttals. One clarification on Must Fix 1: the reviewer's carried-through body estimate of ≈3 880 keeps the old separate "Headings 130" row. Because every measured range already includes its heading, that row double-counted, so I removed it. The body estimate is ≈3 760, which gives −1 154 agent-owned and a fixed total of ≈19 798. The constraint holds under either figure.
