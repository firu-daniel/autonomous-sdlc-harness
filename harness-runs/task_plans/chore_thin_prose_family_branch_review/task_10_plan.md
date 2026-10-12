### Task 10 — Measure the three definitions, run the family check probe and record the result in the story index

**Goal:** Fill the `After — definition` and `Δ` cells of the story index's `## Up-front word counts` table from the tree as Tasks 1–9 left it. Then prove mechanically, against `433f312c`, that:
- each agent's definition shrank;
- no read changed;
- no frozen text moved;
- Task 1's shared blocks still match;
- every wire literal and cited anchor survived;
- the scope register still closes.

**Depends on:** Task 4 (the last edit to `branch-reviewer.md`), Task 6 (the last edit to `skeptic-reviewer.md`) and Task 9 (the last edit to `review-plan-reviewer.md`). This is the catch-all (`general`) task. It ships last because it measures what the `plugin` tasks built.

**Where this task stops.** It edits only the story index `harness-runs/story_plans/chore_thin_prose_family_branch_review_story_plan.md`, the file this task is dispatched to fill.
- Within it, only the `After — definition` and `Δ` cells of `## Up-front word counts` change, plus at most one line under that table.
- No line of `## Context`, `## Phase 2 Readiness — Ordered Fix List` or `## Scope register` changes, and no readiness marker is touched.
- It edits no file under `plugin/`.

If a check fails, it records the figures it has and returns a blocker quoting every failing line; it never edits an agent definition itself. The story index is this task's only work file, so its commit stages the index alone and the committer's return carries a `staged: index-only` notice. That is expected here and is not a defect.

**What the figures mean.** Up-front words are an agent's definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents. All three agents read `plugin/samples/sample_code_review.md` and `plugin/samples/sample_code_review/finding_1.md` up front. This branch changes no file under `plugin/instructions/` or `plugin/samples/`, which the probe's `READS-CHANGED` check confirms, so each agent's up-front `Δ` equals its definition's `wc -w` change. The probe counts words as `wc -w` does: runs of non-whitespace characters. `Before` at `433f312c` is 5884, 5099 and 4191.

**What the probe checks:**
- **Frozen text:** every run of words covered by a ten-word window (inside one paragraph) that a family definition shared at `433f312c` with an agent definition outside the family, plus the words between two such runs in one sentence.
- **Bold leads:** every bold lead another agent definition carries verbatim.
- **Task 1's blocks:** the implementability paragraph and `**Checkbox discipline.**` are identical in `branch-reviewer` and `skeptic-reviewer`.
- **Literals:** each file's list of wire literals and cited anchors.

### Targets

- `harness-runs/story_plans/chore_thin_prose_family_branch_review_story_plan.md` → `## Up-front word counts`: the `After — definition` and `Δ` cells, and at most one line under the table.
- `harness-runs/scratch/branch_review_family_check.mjs`: a gitignored probe, written from the text below and never committed. Task 1 wrote the same text; overwrite it.

**Work:**

- [ ] Write `harness-runs/scratch/branch_review_family_check.mjs` with exactly this text:

```js
// Branch-review family check: frozen cross-family text, shared bold leads, the
// Task 1 shared blocks, wire literals, unchanged reads and word counts.
// Base commit 433f312c. Read-only: reads the tree and `git show` output, writes nothing.
// Usage: node branch_review_family_check.mjs [plugin/agents/<name>.md ...] (default: all three)
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const BASE = '433f312c';
const root = fileURLToPath(new URL('../..', import.meta.url));
const FAMILY = ['branch-reviewer.md', 'skeptic-reviewer.md', 'review-plan-reviewer.md'];
const args = process.argv.slice(2).map((a) => a.replace(/^.*\//, ''));
const CHECK = args.length ? args : FAMILY;
const now = (p) => readFileSync(join(root, p), 'utf8');
const then = (p) => execFileSync('git', ['-C', root, 'show', `${BASE}:${p}`], { encoding: 'utf8' });
const toks = (t) => t.match(/\S+/g) ?? [];
const paras = (t) => t.split(/\n[ \t]*\n/).map(toks).filter((p) => p.length);
const N = 10;
let fail = 0;
const bad = (m) => { fail++; console.log(m); };
// 1. Words: the definition is the whole up-front change, because no read changes.
for (const f of CHECK) {
  const p = `plugin/agents/${f}`; const b = toks(then(p)).length; const a = toks(now(p)).length;
  console.log(`WORDS ${f} before=${b} after=${a} delta=${a - b}`);
  if (a >= b) bad(`WORDS-NOT-LOWER ${f}`);
}
const reads = execFileSync('git', ['-C', root, 'diff', '--name-only', BASE, '--', 'plugin/instructions', 'plugin/samples'], { encoding: 'utf8' }).trim();
if (reads) bad(`READS-CHANGED ${reads.split('\n').join(' ')}`);
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
// 3. Bold leads another agent definition carries verbatim (inside or outside the family).
const allText = Object.fromEntries(listing.map((n) => [n, then(`plugin/agents/${n}`)]));
for (const f of CHECK) {
  const cur = now(`plugin/agents/${f}`);
  for (const line of allText[f].split('\n')) {
    const m = line.match(/^\s*(?:(?:[-*]|\d+\.)\s+)?(?:\|[^|]*\|[^|]*\|\s*)?(\*\*[^*]+\*\*)/);
    if (!m) continue;
    if (!listing.some((n) => n !== f && allText[n].includes(m[1]))) continue;
    if (!cur.includes(m[1])) bad(`LEAD ${f}: ${m[1]}`);
  }
}
// 4. Task 1's shared blocks read the same in branch-reviewer and skeptic-reviewer.
const para = (t, lead) => t.split(/\n[ \t]*\n/).find((p) => p.trimStart().startsWith(lead)) ?? null;
for (const lead of ['**Every finding must be implementable as written', '**Checkbox discipline.**']) {
  const a = para(now('plugin/agents/branch-reviewer.md'), lead); const b = para(now('plugin/agents/skeptic-reviewer.md'), lead);
  if (!a || !b || a.trim() !== b.trim()) bad(`SHARED-BLOCK differs or missing: ${lead}`);
}
// 5. Wire literals and cited anchors.
const LIT = {
  'branch-reviewer.md': ['## Resolved values', '## Invocation contract', '## Read first (everything — the branch reviewer needs full context)', '## Process',
    '### Pass 1 — Independent review (always)', '### Pass 0 — the deterministic sweep', '### Pass 2 — Reconcile with per-unit findings (two-pass mode only)',
    '## Findings format (split: index + per-finding files)', '## Common findings to look for (high-yield checks)', '## Unsolicited dispatch guidance', '## Output contract',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/code_review_instructions.md` → `## Flow` step 2', '`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase B` → `### B.1 Generate the review plan`',
    'Branch: <branch>', 'Story plan: <story_path>', 'Task prompt: <task_prompt_path>', 'per_task_findings_root: <per_task_findings_root>',
    'Output: write the code-review **index** to <code_review_path> and one self-contained finding_<N>.md per finding to <code_review_findings_dir>, then report back with the index path.',
    '`Adjust the code-review index at <code_review_path> and the per-finding files in <code_review_findings_dir> per findings at <findings_file>.`',
    'blocker:', "git diff <default_branch>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'",
    "git diff <default_branch>...HEAD --shortstat -- ':(top)<state_dir>/*<branch>*' ':(top)<state_dir>/docs_catalog/reviews/*'",
    '"N run-artifact files excluded from the reviewed diff."', '`git diff -U15 <default_branch>...HEAD -- <segment files>`',
    "git diff <default_branch>...HEAD --unified=0 -- <every layers[].path scope of <layer_path_map>> | grep -E '^\\+[^+]' | grep -nE '<regex>'",
    "| grep -E '^\\+<the export declaration form>'", '<state_dir>/task_plan_point_reviews/<branch>_task_plan/', '`<state_dir>/task_prompts/<branch>_task_prompt.md`',
    '`<state_dir>/story_plans/<branch>_story_plan.md`', '`<state_dir>/task_plans/<branch>/task_<N>_plan.md`', '<state_dir>/code_reviews/<branch>_code_review.md',
    '<branch>_code_review_2.md', '<state_dir>/code_reviews/<branch>_code_review/finding_<N>.md', '<branch>_code_review_2/', '## Questions',
    '`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md`', '`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review/finding_1.md`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`', '## Phase 2 Readiness — Ordered Fix List',
    '`N. [ ] **Finding K** — <short title> _(layer: <one or more of <layer_names>>)_`', '`→ [finding_3.md](<branch>_code_review/finding_3.md)`',
    '`Pass 2 carried over N items, skipped M (already covered) and K (stale).`', 'not written into any saved file', 'Regex — *replace with your project\'s*', '(disregarded for verdict purposes)'],
  'skeptic-reviewer.md': ['## What you are NOT', '## Resolved values', '## Invocation contract', '## Read first', '## Process', '## Adversarial checks (your high-yield scope)',
    '## Confidence bar (limit false-positive churn)', "## Findings format (split: index + per-finding files) — identical to the branch-reviewer's", '## Unsolicited dispatch guidance',
    '## Output contract', '### 1. No net-new findings (PASS)', '### 2. Findings (FAIL)', '`<deploy_project_id>`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase C2` → `### C2.1 Generate the skeptic review`',
    'Branch: <branch>', 'Story plan: <story_path>', 'Task prompt: <task_prompt_path>', 'code_review_index: <code_review_path>', 'index_path: <skeptic_review_path>',
    'findings_folder: <skeptic_review_findings_dir>',
    'Output: review the whole-branch diff adversarially, de-duplicate against the already-committed code/parity/architecture reviews, write the skeptic-review index to <skeptic_review_path> and one self-contained finding_<N>.md per net-new finding to <skeptic_review_findings_dir>, then report back.',
    '`Adjust the skeptic-review index at <skeptic_review_path> and the per-finding files in <skeptic_review_findings_dir> per findings at <findings_file>.`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The unit loop`', '`C2.4`', '<state_dir>/code_reviews/<branch>_code_review.md',
    '<state_dir>/business_parity_branch_reviews/<branch>_parity_review.md', '<state_dir>/architecture_branch_reviews/<branch>_arch_review.md', '<state_dir>/architecture_reviews/<branch>/',
    'blocker:', "git diff <default_branch>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'",
    "git diff <default_branch>...HEAD --shortstat -- ':(top)<state_dir>/*<branch>*' ':(top)<state_dir>/docs_catalog/reviews/*'",
    '"N run-artifact files excluded from the reviewed diff."', '`<state_dir>/task_prompts/<branch>_task_prompt.md`', '`<state_dir>/story_plans/<branch>_story_plan.md`',
    '`<state_dir>/task_plans/<branch>/task_<N>_plan.md`', '`// TODO: @claude add a follow up task for this: …`', '<state_dir>/skeptic_reviews/<branch>_skeptic_review.md',
    '<state_dir>/skeptic_reviews/<branch>_skeptic_review/finding_<N>.md', '`→ [finding_3.md](<branch>_skeptic_review/finding_3.md)`', '## Questions',
    '`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md`', '`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review/finding_1.md`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`', '## Phase 2 Readiness — Ordered Fix List',
    '`N. [ ] **Finding K** — <short title> _(layer: <one or more of <layer_names>>)_`', 'verdict: PASS', 'verdict: FAIL', 'index_path: <index_path>', 'must_fix_count: <integer>',
    '(disregarded for verdict purposes)'],
  'review-plan-reviewer.md': ['## Resolved values', '## Invocation contract', '## Read first', '## Process', '## What to check', '### False positives (Must Fix)',
    '### Missed checks (Must Fix when applicable to the diff)', '### Unactionable gates (Must Fix)', '### Reference-implementation parity spot-check (Must Fix)',
    '## Unsolicited dispatch guidance', '## Output contract', '`### Missed checks`', '`## Phase B` → `### B.2 Meta-review the review plan`', '`## Phase C2` → `### C2.2 Meta-review the skeptic review`',
    'review_path: <code_review_path>', 'findings_dir: <code_review_findings_dir>', 'review_path: <skeptic_review_path>', 'findings_dir: <skeptic_review_findings_dir>',
    'plan_path: <story_path>', 'findings_folder: <review_plan_review_folder>', 'findings_folder: <skeptic_review_meta_folder>', 'iteration: <meta_review_index>',
    '<state_dir>/review_plan_reviews/<branch>/', '<state_dir>/skeptic_review_plan_reviews/<branch>/', '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The unit loop`',
    '`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md`', '`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review/finding_1.md`', 'blocker:',
    "`git diff <default_branch>...HEAD --name-only -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'`",
    '`git diff -U15 <default_branch>...HEAD -- <file>`', '## Phase 2 Readiness — Ordered Fix List', '`## Phase 2 readiness`', '`## Phase 2 Readiness appendix`',
    '`N. [ ] **Finding K** — <short title>`', '_(layer: <one or more of <layer_names>>)_', '`<branch>_code_review_2.md` ↔ `<branch>_code_review_2/`', '**Deviations from plan:**',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`', '`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`',
    "`grep -n '^## Phase [A-Z]' <that file>`", '`## Phase boundaries`', 'verdict: PASS', 'verdict: FAIL', 'findings_file: <full_path>', 'must_fix_count: <N>',
    '# Review plan meta-review — iteration {iteration}', '<findings_folder>/review_{iteration}.md', '**Fix:**', 'Nothing else.', 'those 3 lines', '(disregarded for verdict purposes)'],
};
for (const f of CHECK) for (const l of LIT[f]) if (!now(`plugin/agents/${f}`).includes(l)) bad(`LITERAL ${f}: ${l}`);
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
```

- [ ] Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs` as one plain foreground command, with no file argument so that it checks all three definitions. Its last line is `PASS` or `FAIL <n>`, and its exit status matches.
- [ ] Fill the table from the probe's three `WORDS` lines.
  - Copy each `after=` figure into its row's `After — definition` cell and each `delta=` figure into `Δ`.
  - Check that each `before=` equals the row's `Before — definition`. A mismatch means the base tree moved: record it under the table.
  - On `FAIL`, keep the figures you recorded, write one line under the table saying the probe failed, and return a blocker quoting every `WORDS-NOT-LOWER`, `READS-CHANGED`, `FROZEN`, `LEAD`, `SHARED-BLOCK` and `LITERAL` line the probe printed. Do not edit `plugin/`.
- [ ] Re-run the story index's `## Scope register` derivation commands C1, C2, C3 and C3b verbatim. Every file or distinct path each prints must be a row of the register (read C3's and C3b's paths with their `433f312c:` prefix removed). Record any path with no row under the table and return a blocker naming it.
- [ ] Re-run the sample-pointer sweep `plugin/agents/README.txt` owns, `grep -rno 'samples/[A-Za-z0-9_<>/]*\.md' plugin/agents/`, and check that the lines for the three family files name the same sample paths as at `433f312c`. Those paths are `samples/sample_code_review.md` and `samples/sample_code_review/finding_1.md` in each file. Record any mismatch under the table and return a blocker.

**Verification:**

- The probe's last line is `PASS` and it exits `0`.
- Every `After — definition` and `Δ` cell of `## Up-front word counts` is filled from that run, and every `Δ` is below `0`.
- `git diff --name-only` lists only the story index as changed by this task.
- `git diff -- harness-runs/story_plans/chore_thin_prose_family_branch_review_story_plan.md` changes only those cells, plus at most one line under the table.
