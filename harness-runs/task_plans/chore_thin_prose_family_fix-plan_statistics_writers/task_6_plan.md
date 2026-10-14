### Task 6 — Measure the three definitions, run the family check probe and record the result in the story index

**Goal:** Fill the `After — definition`, `After — up-front` and `Δ up-front` cells of the story index's `## Up-front word counts` table from the tree as Tasks 1–5 left it. Then prove mechanically, against `13a2ed4c`, that:
- each definition shrank, and each agent's up-front count fell;
- no file under `plugin/instructions/` or `plugin/samples/`, and no other agent definition, changed;
- no frozen text moved, and no bold lead, heading line, fenced block or frontmatter changed;
- every wire literal and cited anchor survived;
- every sample pointer the three definitions carry still resolves;
- the scope register still closes.

**Depends on:** Task 2 (the last edit to `user-review-fix-plan-writer.md`), Task 3 (the only edit to `test-fix-plan-writer.md`) and Task 5 (the last edit to `statistics-plan-writer.md`). This is the catch-all (`general`) task. It ships last because it measures what the `plugin` tasks built.

**Where this task stops.** It edits only the story index `harness-runs/story_plans/chore_thin_prose_family_fix-plan_statistics_writers_story_plan.md`, the file this task is dispatched to fill.
- Within it, only the `After — definition`, `After — up-front` and `Δ up-front` cells of `## Up-front word counts` change, plus at most one line under that table.
- No line of `## Context`, `## Phase 2 Readiness — Ordered Fix List` or `## Scope register` changes, and no readiness marker is touched.
- It edits no file under `plugin/`.

If a check fails, record the figures you have and return a blocker quoting every failing line; never edit an agent definition yourself. The story index is this task's only work file, so its commit stages the index alone and the committer's return carries a `staged: index-only` notice. That is expected here and is not a defect.

**What the figures mean.** Up-front words are an agent's definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md`, the adopter's conventions documents and `<state_dir>/lessons.md`. The probe counts words as `wc -w` does: runs of non-whitespace characters.
- **`user-review-fix-plan-writer`** reads `plugin/samples/sample_user_review_fix_plan.md` and its three `finding_<N>.md` files (1959 words) before and after the branch.
- **`test-fix-plan-writer`** reads `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (597 words). Before the branch it also read the same four sample files (1959 words); after Task 3 it reads them only on demand, so they leave its up-front count.
- **`statistics-plan-writer`** reads `plugin/samples/sample_statistics.md` (1509 words) before and after.
- The probe's `READS-CHANGED` check confirms that no read file changed, so each `After — up-front` figure is the definition's `after=` figure plus the reads its row lists for after the branch.

**What the probe checks**, run with no file argument:
- **Frozen text:** every run of words covered by a ten-word window (inside one paragraph) that a family definition shared at `13a2ed4c` with an agent definition outside the family, plus the words between two such runs in one sentence (`FROZEN`).
- **Structure:** every bold lead (`LEAD`), every heading line (`HEADING`), every fenced block (`FENCE`) and the frontmatter (`FRONTMATTER`) of each definition at `13a2ed4c` is still in it.
- **Literals:** each file's list of wire literals and cited anchors is present at `13a2ed4c` (`LITERAL-NOT-AT-BASE`) and still present now (`LITERAL`).
- **Unchanged files:** no change under `plugin/instructions/` or `plugin/samples/` (`READS-CHANGED`), and none to another agent definition (`OTHER-AGENT-CHANGED`).
- **Words:** each definition's count fell (`WORDS-NOT-LOWER`).

### Targets

- `harness-runs/story_plans/chore_thin_prose_family_fix-plan_statistics_writers_story_plan.md` → `## Up-front word counts`: the three `After` and `Δ` columns, and at most one line under the table.
- `harness-runs/scratch/fix_plan_statistics_family_check.mjs`: a gitignored probe, written from the text below and never committed. Task 1 wrote the same text; overwrite it.

**Work:**

- [ ] Write `harness-runs/scratch/fix_plan_statistics_family_check.mjs` with exactly the text under `### Probe` below. Then run `bash scripts/scratch-run.sh harness-runs/scratch/fix_plan_statistics_family_check.mjs` as one plain foreground command, with no file argument, so that it checks all three definitions. Its last line is `PASS` or `FAIL <n>`, and its exit status matches.
- [ ] Fill the table from the probe's `WORDS` lines.
  - Copy each `after=` figure into its row's `After — definition` cell.
  - Add the row's after-branch reads (1959, 597 and 1509 respectively) to get `After — up-front`, and subtract `Before — up-front` to get `Δ up-front`.
  - Check that each `before=` equals the row's `Before — definition`. A mismatch means the base tree moved: record it under the table.
  - On `FAIL`, keep the figures you recorded and write one line under the table saying the probe failed. Return a blocker quoting every line the probe printed other than `WORDS` and the last line. Do not edit `plugin/`.
- [ ] Re-run the story index's `## Scope register` derivation commands C1, C2, C3 and C3b verbatim. Every file or distinct path each prints must be a row of the register; read C3's and C3b's paths with their `13a2ed4c:` prefix removed. Record any path with no row under the table and return a blocker naming it.
- [ ] Re-run the sample-pointer sweep that `plugin/agents/README.txt` → `Sample fixture pointers — never rewrite one to make it resolve` owns, `grep -rno 'samples/[A-Za-z0-9_<>/]*\.md' plugin/agents/`, and the same sweep at the base, `git grep -n -o -E 'samples/[A-Za-z0-9_<>/]*\.md' 13a2ed4c -- plugin/agents/`.
  - For each of the three definitions, the set of distinct sample paths it names must be the same in both outputs.
  - Every path must resolve against `find plugin/samples -type f`, with `<N>` standing for each `finding_` file.
  - Record any difference under the table and return a blocker.

### Probe

````js
// Fix-plan and statistics writers family check: frozen cross-family text, bold leads,
// headings, fenced blocks, frontmatter, wire literals, unchanged reads and word counts.
// Base commit 13a2ed4c. Read-only: reads the tree and `git show` output, writes nothing.
// Usage: node fix_plan_statistics_family_check.mjs [plugin/agents/<name>.md ...]
// With no argument it checks all three definitions.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const BASE = '13a2ed4c';
const root = fileURLToPath(new URL('../..', import.meta.url));
const FAMILY = ['user-review-fix-plan-writer.md', 'test-fix-plan-writer.md', 'statistics-plan-writer.md'];
const args = process.argv.slice(2).map((a) => a.replace(/^.*\//, ''));
const CHECK = args.length ? args : FAMILY;
for (const f of CHECK) if (!FAMILY.includes(f)) { console.log(`NOT-IN-FAMILY ${f}`); process.exit(2); }
const now = (p) => readFileSync(join(root, p), 'utf8');
const then = (p) => execFileSync('git', ['-C', root, 'show', `${BASE}:${p}`], { encoding: 'utf8' });
const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();
const toks = (t) => t.match(/\S+/g) ?? [];
const paras = (t) => t.split(/\n[ \t]*\n/).map(toks).filter((p) => p.length);
const N = 10;
let fail = 0;
const bad = (m) => { fail++; console.log(m); };
// 1. Words, and the files that must not change: the reads and every other definition.
for (const f of CHECK) {
  const p = `plugin/agents/${f}`; const b = toks(then(p)).length; const a = toks(now(p)).length;
  console.log(`WORDS ${f} before=${b} after=${a} delta=${a - b}`);
  if (a >= b) bad(`WORDS-NOT-LOWER ${f}`);
}
const reads = git('diff', '--name-only', BASE, '--', 'plugin/instructions', 'plugin/samples');
if (reads) bad(`READS-CHANGED ${reads.split('\n').join(' ')}`);
const others = git('diff', '--name-only', BASE, '--', 'plugin/agents').split('\n').filter((n) => n && !FAMILY.includes(n.replace(/^.*\//, '')));
if (others.length) bad(`OTHER-AGENT-CHANGED ${others.join(' ')}`);
// 2. Frozen text: a 10-word window (inside one paragraph) shared at BASE with an agent
//    definition outside the family, plus the words between two such runs in one sentence.
const listing = then('plugin/agents/').split('\n').filter((n) => n.endsWith('.md'));
const outside = listing.filter((n) => !FAMILY.includes(n));
const winSet = new Set();
for (const n of outside) for (const p of paras(then(`plugin/agents/${n}`))) for (let i = 0; i + N <= p.length; i++) winSet.add(p.slice(i, i + N).join(' '));
const endsSentence = (w, nx) => /[.?!](\*\*|\*|`|\)|")*$/.test(w) && nx !== undefined && /^[A-Z*`(\-|]/.test(nx);
for (const f of CHECK) {
  const cur = ' ' + toks(now(`plugin/agents/${f}`)).join(' ') + ' ';
  for (const p of paras(then(`plugin/agents/${f}`))) {
    const x = new Array(p.length).fill(false);
    for (let i = 0; i + N <= p.length; i++) if (winSet.has(p.slice(i, i + N).join(' '))) for (let k = i; k < i + N; k++) x[k] = true;
    const sid = []; let s = 0;
    for (let i = 0; i < p.length; i++) { sid.push(s); if (p[i] === '|' || endsSentence(p[i], p[i + 1])) s++; }
    const g = x.slice();
    for (let id = 0; id <= s; id++) {
      const idx = p.map((_, i) => i).filter((i) => sid[i] === id && x[i]);
      if (idx.length >= 2) for (let k = idx[0]; k <= idx[idx.length - 1]; k++) g[k] = true;
    }
    for (let i = 0; i < p.length;) {
      if (!g[i]) { i++; continue; }
      let j = i; while (j < p.length && g[j]) j++;
      const run = p.slice(i, j).join(' ');
      if (!cur.includes(' ' + run + ' ')) bad(`FROZEN ${f}: ${run.slice(0, 160)}`);
      i = j;
    }
  }
}
// 3. Structure that stays byte-for-byte: frontmatter, every heading line, every bold lead,
//    and every fenced block (the dispatch prompts, commands, marker lines, return blocks).
const leadRe = /^\s*(?:(?:[-*]|\d+\.)\s+)?(\*\*[^*]+\*\*)/;
const fences = (t) => t.match(/^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*$/gm) ?? [];
for (const f of CHECK) {
  const b = then(`plugin/agents/${f}`); const a = now(`plugin/agents/${f}`);
  if (b.split('\n---\n')[0] !== a.split('\n---\n')[0]) bad(`FRONTMATTER ${f}`);
  const aLines = new Set(a.split('\n'));
  for (const line of b.split('\n')) if (/^#{1,6} /.test(line) && !aLines.has(line)) bad(`HEADING ${f}: ${line}`);
  for (const line of b.split('\n')) { const m = line.match(leadRe); if (m && !a.includes(m[1])) bad(`LEAD ${f}: ${m[1]}`); }
  for (const blk of fences(b)) if (!a.includes(blk)) bad(`FENCE ${f}: ${blk.split('\n').slice(1, 2).join('').trim().slice(0, 120)}`);
}
// 4. Wire literals and cited anchors, each present at BASE and kept.
const LIT = {
  'user-review-fix-plan-writer.md': [
    '`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md`', '`## Flow` step 5', '`## Flow` step 7', '`## Flow` step 8', '`## Flow` step 11',
    '`## Process` step 4', '`## Revision mode`', '## Read on demand (no auto-loaded context)', "Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.",
    '`<scripts_dir>/remote-run.sh`, the header\'s `control` paragraph', '`## Review by @<login>`', '`(The review carries no summary.)`', '`Requested changes on`', '`Commented on`', '`Approved`', '`Reviewed … dismissed`',
    '`## Inline comments`', '`<!-- sdlc-harness round … -->`', '`#discussion_r`', '`comments=`', '`git show <sha> --stat`', '`git show <sha> -- <files>`', '`git show <sha>:<file>`',
    '**Task-plan task number**', '**Code-review finding number**', '**Previous fix-plan item**', '**Commit SHA**', '**File and line**', '**Pull-request review comment**', '**Freeform description**',
    'highest numeric suffix wins; unsuffixed = round 1', 'pick by the round number cited; default to the most recent prior round', '`### Task K — <title>`',
    '<state_dir>/story_plans/<branch>_story_plan.md', '<state_dir>/task_plans/<branch>/task_<K>_plan.md', '<state_dir>/code_reviews/<branch>_code_review*.md', '<state_dir>/code_reviews/<branch>_code_review*/finding_<K>.md',
    '<state_dir>/user_reviews/<branch>_fix_plan*.md', '<state_dir>/user_reviews/<branch>_fix_plan*/finding_<K>.md',
    '**Valid (Must Fix)**', '**Valid (Should Fix)**', '**Valid (Nice to Have)**', '**Invalid**', '**Needs clarification**', '`## Out of scope / verified-OK`',
    '`${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan.md`', '`${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan/finding_<N>.md`', 'Heading text MUST match exactly — the orchestrator keys off it.',
    '`<state_dir>/user_reviews/<branch>_fix_plan.md`', '`<branch>_fix_plan_2.md`', '`# User-Review Fix Plan: <branch>`', '`## Context`', '`## Phase 2 Readiness — Ordered Fix List`',
    '`N. [ ] **Finding K** — <short title>. _(layer: <one or more of <layer_names>>)_`', 'Never re-sort against a remembered layer list.', '"lowest blast-radius first" → "wider refactors last"',
    '**single source of truth**', '`## Must Fix` / `## Should Fix` / `## Nice to Have`', '**plain `### N. Title` heading (NO `[ ]` in the heading)**', '`→ [finding_3.md](<branch>_fix_plan/finding_3.md)`',
    ' **Review comments:** <id>[, <id>…]', '`<scripts_dir>/remote-run.sh`, the header\'s `deliver` paragraph', '`## Source observations`', '**This stays in the index**',
    '`<state_dir>/user_reviews/<branch>_fix_plan/finding_<N>.md`', '`**Review comments:** <id>[, <id>…]`', '**The folder name mirrors the index round suffix:**', '`<branch>_fix_plan_2/finding_<N>.md`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`', '**Quality checks before saving:**', 'site anchor you grep-verified in the current tree',
    '6. **Append net-new lessons to the ledger.**', '**initial-write mode only**', '`<repo_root>/<state_dir>/lessons.md`', '`- **<rule>** _(taught by: <branch>)_`', '`taught by`',
    'A ledger entry carries the one-line rule a future run acts on, never the argument for it.', '`(pending — questions for user)`', '`<branch>_fix_plan_2/`',
    '`## Rejected findings`', '(rejected round <i>; rebutted round <j> — call stands)', '**`call stands` is unavailable for a Must Fix:**', 'A user\'s own observation is authoritative: never record it here.'],
  'test-fix-plan-writer.md': [
    'substitution row `G.4`', '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## Substitution table`', '`<state_dir>/test_fix_plans/<branch>_<gate_key>_round_<gate_round>.md`',
    '`<state_dir>/test_run_logs/<sanitized branch>/<gate_key>_round_<gate_round>.log`', 'Use the path as given, never rebuild it', '## Read on demand (no auto-loaded context)',
    'nothing you write may point a reader back at it for detail', '**`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`** — before writing any finding.',
    "Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.", 'byte-exact', '**static** failures',
    'A `not run` line is neither a failure nor a pass, and never yields a finding.', '*new this round*', '*persisting*', 'there is no baseline to blame it on',
    '**Rewrite machine paths before quoting.**', '`printenv HOME`', '`<home>`, giving `<home>/…`', '`## Process` step 5',
    '`${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan.md`', '`${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan/finding_<N>.md`', 'Heading text must match exactly — the caller keys off it.',
    '`# Test Fix Plan: <branch> — <gate_key> round <gate_round>`', '`## Phase 2 Readiness — Ordered Fix List`', '`N. [ ] **Finding K** — <short title>. _(layer: <one or more of <layer_names>>)_`',
    'every failing test keeps its own entry', '`→ [finding_3.md](<branch>_<gate_key>_round_<gate_round>/finding_3.md)`', '`## Not fixable on this branch`', '`## Source failures`',
    '`<per-finding folder>finding_<K>.md`', '`**Failing test:**`', '`none — <gate name>`', '`none — typecheck`', '`none — typecheck (the formatter check)`',
    '`**Suspected shared cause:** likely the same cause as Finding <K> — <one-line reason>`', 'it never merges findings, drops one or moves a failure to `## Not fixable on this branch`',
    'A consumer implements the fix from this one file alone.', 'No finding asks for a test run, gate run or test-file run (`## The test-run rule`)',
    '## Quality checks before returning', '`grep -rlF`', '**Never run the configured `commands.typecheck` or `commands.test` string, a gate, or a test file.**', '**Never append to `<state_dir>/lessons.md`.**',
    '`(pending — questions for user)`', 'Do not paste the plan content back.', 're-run `## Quality checks before returning`', 'do not re-diagnose failures the findings do not reopen',
    '`## Rejected findings`', '(rejected round <i>; rebutted round <j> — call stands)', '**`call stands` is unavailable for a Must Fix:**'],
  'statistics-plan-writer.md': [
    '`${CLAUDE_PLUGIN_ROOT}/samples/sample_statistics.md`', 'Match its section order and heading text exactly', "Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.",
    '`<state_dir>/story_plans/<branch>_story_plan.md`', '`<state_dir>/user_reviews/<branch>_review*.md`', '`<default_branch>..HEAD`',
    'Status `pre-user-review`.', 'Status `post-user-review`.', 'Re-count from scratch and **overwrite** the existing file.', '`user_review_issues = 0`',
    '`statistics_file:`, `story_plan_tasks:`, `user_review_issues:`, `success_rate:`, `status:`', '**Do not rename a return line', '**non-halting**',
    '**The output file is overwritten, never appended.**', 'modulo `last_updated`', '`^\\d+\\.\\s*\\[[ x]\\]\\s*\\*\\*Task\\b`', '**Count both `[ ]` and `[x]`**', '`story_plan_tasks`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `### The dispositioned outcome`', '**plain, single-statement**', '`record disposition of `', '**any line of whose message**',
    'leading word `record` matching however it is cased, every byte after it exactly', '**first** following ` — `', '**`dispositioned_points`**',
    '`story_points_total = story_plan_tasks`', '("no `_(points: …)_` tags in the story index — fell back to the legacy task-count denominator")', '`_fix_plan`',
    '**precedence, never a sum**', '`grep -cE \'^#{2,4} +[0-9]+[.):]\' <file>`', '`grep -cE \'^[0-9]+\\.|^[-*][[:space:]]\' <file>`', '`## 3 things that broke`', '`## 2026-08 regression sweep`',
    'State the grep that matches it beside the count', '**which arm produced it, and the grep that produced it**', '**Do not improvise a count**', '**fixed rubric**',
    '**Major** → `15` points', '`[major]`', 'Keyword sightings (`parity`, `broken`, `crash`) are *signals* to consider Major', '**Trivial** → `2` points', '`[trivial]`', '**Minor** → `5` points',
    '`issue_cost_total = 0`', 'success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent', 'record **`0%`**, never a negative number', 'record `n/a`',
    '`mkdir -p <state_dir>/branch_statistics/<branch>`', 'do not use a Bash heredoc for the file body', '`# Branch statistics: <branch>`', '`## Summary`', '`## Counts breakdown`', '**story-index source**', '**user-review source**',
    '**the enumeration arm and the grep that produced each file\'s count**', '(Major `15` / Minor `5` default / Trivial `2`)', '`## Status`', '(real `YYYY-MM-DD`, not the sample\'s placeholder)', '`## Notes`',
    '**When `dispositioned_points > 0`, or any dispositioned unit was matched without points, state it here**', '`<N>` story points closed without a fix (`Task K`, `Finding K`, …) — the rate counts them as delivered.',
    'Omit the sentence only when the match set was empty.', 'and write no file.'],
};
for (const f of CHECK) for (const l of LIT[f]) {
  if (!then(`plugin/agents/${f}`).includes(l)) bad(`LITERAL-NOT-AT-BASE ${f}: ${l}`);
  else if (!now(`plugin/agents/${f}`).includes(l)) bad(`LITERAL ${f}: ${l}`);
}
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
````

**Verification:**

- The probe's last line is `PASS` and it exits `0`. It printed three `WORDS` lines, one per definition, each with a negative `delta`, and no other line.
- Every `After — definition`, `After — up-front` and `Δ up-front` cell of `## Up-front word counts` is filled from that run, and every `Δ up-front` is below `0`.
- The scope register's derivation commands print no path that lacks a register row, and the sample-pointer sets match the base for all three definitions.
- `git diff --name-only` lists only the story index as changed by this task.
- `git diff -- harness-runs/story_plans/chore_thin_prose_family_fix-plan_statistics_writers_story_plan.md` changes only those cells, plus at most one line under the table.
