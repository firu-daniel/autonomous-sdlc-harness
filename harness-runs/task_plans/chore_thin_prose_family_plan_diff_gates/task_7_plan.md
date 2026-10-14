### Task 7 — Measure both definitions, run the family check probe and record the result in the story index

**Goal:** Fill the `After — definition` and `Δ` cells of the story index's `## Up-front word counts` table from the tree as Tasks 1–6 left it. Then prove mechanically, against `6307573a`, that:
- each agent's definition shrank;
- no read and no other agent definition changed;
- no frozen text moved and no bold lead was lost;
- every line the two definitions share is identical in both;
- every wire literal and cited anchor survived;
- the scope register still closes.

**Depends on:** Task 3 (the last edit to the shared blocks), Task 4 (the last edit to `architecture-reviewer.md`) and Task 6 (the last edit to `business-parity-reviewer.md`). This is the catch-all (`general`) task. It ships last because it measures what the `plugin` tasks built.

**Where this task stops.** It edits only the story index `harness-runs/story_plans/chore_thin_prose_family_plan_diff_gates_story_plan.md`, the file this task is dispatched to fill.
- Within it, only the `After — definition` and `Δ` cells of `## Up-front word counts` change, plus at most one line under that table.
- No line of `## Context`, `## Phase 2 Readiness — Ordered Fix List` or `## Scope register` changes, and no readiness marker is touched.
- It edits no file under `plugin/`.

If a check fails, record the figures you have and return a blocker quoting every failing line; never edit an agent definition yourself. The story index is this task's only work file, so its commit stages the index alone and the committer's return carries a `staged: index-only` notice. That is expected here and is not a defect.

**What the figures mean.** Up-front words are an agent's definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents.
- Both agents read `plugin/instructions/unit_loop_core.md` → `## The test-run rule` up front. This branch changes no file under `plugin/instructions/` or `plugin/samples/`, which the probe's `READS-CHANGED` check confirms.
- So each agent's up-front `Δ` equals its definition's `wc -w` change.
- The probe counts words as `wc -w` does: runs of non-whitespace characters.
- `Before` at `6307573a` is 4915 (`architecture-reviewer`) and 5922 (`business-parity-reviewer`).

**What the probe checks**, run with no file argument:
- **Frozen text:** every run of words covered by a ten-word window (inside one paragraph) that a family definition shared at `6307573a` with an agent definition outside the family, plus the words between two such runs in one sentence.
- **Bold leads:** every bold lead an outside definition carries verbatim stays (`LEAD`). A bold lead only the two family definitions carry is in both or in neither (`PAIR-LEAD`).
- **Shared lines:** every `SHARED` prefix opens one line in each definition, and the two lines are identical. Run with no argument, a mismatch is a failure (`SHARED`), not `SHARED-PENDING`.
- **Literals:** each file's list of wire literals and cited anchors.
- **Unchanged files:** no change under `plugin/instructions/` or `plugin/samples/` (`READS-CHANGED`), and none to another agent definition (`OTHER-AGENT-CHANGED`).

### Targets

- `harness-runs/story_plans/chore_thin_prose_family_plan_diff_gates_story_plan.md` → `## Up-front word counts`: the `After — definition` and `Δ` cells, and at most one line under the table.
- `harness-runs/scratch/plan_diff_gates_family_check.mjs`: a gitignored probe, written from the text below and never committed. Task 1 wrote the same text; overwrite it.

**Work:**

- [ ] Write `harness-runs/scratch/plan_diff_gates_family_check.mjs` with exactly this text:

```js
// Plan/diff-gates family check: frozen cross-family text, bold leads, the in-family
// shared lines, wire literals, unchanged reads and word counts.
// Base commit 6307573a. Read-only: reads the tree and `git show` output, writes nothing.
// Usage: node plan_diff_gates_family_check.mjs [plugin/agents/<name>.md ...]
// With no argument it checks both definitions and fails on any SHARED line that differs.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const BASE = '6307573a';
const root = fileURLToPath(new URL('../..', import.meta.url));
const FAMILY = ['architecture-reviewer.md', 'business-parity-reviewer.md'];
const args = process.argv.slice(2).map((a) => a.replace(/^.*\//, ''));
const CHECK = args.length ? args : FAMILY;
const FULL = args.length === 0;
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
// 3. Bold leads. One an outside definition carries verbatim stays; one only the two
//    family definitions carry stays in both or leaves both.
const allText = Object.fromEntries(listing.map((n) => [n, then(`plugin/agents/${n}`)]));
const leadRe = /^\s*(?:(?:[-*]|\d+\.)\s+)?(?:\|[^|]*\|[^|]*\|\s*)?(\*\*[^*]+\*\*)/;
for (const f of CHECK) {
  const cur = now(`plugin/agents/${f}`); const sib = FAMILY.find((x) => x !== f); const sibNow = now(`plugin/agents/${sib}`);
  for (const line of allText[f].split('\n')) {
    const m = line.match(leadRe); if (!m) continue;
    if (outside.some((n) => allText[n].includes(m[1]))) { if (!cur.includes(m[1])) bad(`LEAD ${f}: ${m[1]}`); continue; }
    if (allText[sib].includes(m[1]) && cur.includes(m[1]) !== sibNow.includes(m[1])) bad(`PAIR-LEAD ${f}: ${m[1]}`);
  }
}
// 4. Lines the two definitions carry identically once every task has landed.
const SHARED = [
  '1. Read the rule-source files above before you judge anything.',
  '- **Plan-review mode, sub-case (b):**',
  "**In plan-review mode, read the index's `## Rejected findings` section",
  '**You report findings. You do not edit the plan, and you do not edit the code.**',
  'You run in one of **two modes**',
  '**Your return is parsed, not read.**',
  '| `story_path` |',
  '| `diff_base` |',
  '| `plan_path` |',
  'As `## Process` step 2 states,',
  'Also run `git diff <diff_base>...HEAD --shortstat',
  'Both modes share the return lines',
  'The upstream writer is re-dispatched with a **flat findings file**',
  '- **Sub-case (a)**',
  '- **Sub-case (b)**',
  'Run `mkdir -p <findings_folder>`, then `Write`',
  'The consumer is a **per-item fix loop**',
  '`findings_file:` is the flat',
  'You write to the paths the caller passes.',
];
const lineOf = (t, pre) => t.split('\n').find((l) => l.trimStart().startsWith(pre)) ?? null;
for (const pre of SHARED) {
  const a = lineOf(now(`plugin/agents/${FAMILY[0]}`), pre); const b = lineOf(now(`plugin/agents/${FAMILY[1]}`), pre);
  if (a !== null && b !== null && a.trim() === b.trim()) continue;
  if (FULL) bad(`SHARED ${pre}`); else console.log(`SHARED-PENDING ${pre}`);
}
// 5. Wire literals and cited anchors.
const COMMON = ['## Resolved values', '## Invocation contract', '### Implemented-solution mode (insertion point 2)', '## Read first', '## Process',
  '## Scope boundary (avoid overlap with the sibling reviewers)', '## Unsolicited dispatch guidance', '## Output contract', '### Clean review (both modes)',
  '### Implemented-solution mode FAIL (insertion point 2)', '### Return lines (both modes on FAIL)', '## Findings-folder / index-path convention',
  'story_path: <state_dir>/story_plans/<branch>_story_plan.md', 'task_files_dir: <state_dir>/task_plans/<branch>/', 'prompt_path: <prompt_path>', 'iteration: <iteration>',
  'story_path: <fix_plan_path>', 'task_files_dir: <fix_finding_dir>', 'prompt_path: <user_review_path>', 'diff_base: <default_branch>', 'plan_path: <story_path>', 'iteration: 0',
  '`verdict: PASS`', '`verdict: FAIL`', 'blocker:', '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`',
  "git diff <diff_base>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'",
  "git diff <diff_base>...HEAD --shortstat -- ':(top)<state_dir>/*<branch>*' ':(top)<state_dir>/docs_catalog/reviews/*'",
  '"N run-artifact files excluded from the reviewed diff."', 'git diff -U15 <diff_base>...HEAD -- <files>', '`## Rejected findings`', '`rebutted round <j> — call stands`',
  '**No plan asks for a test run.**', '## Phase 2 Readiness — Ordered Fix List', '`N. [ ] **Finding K** — <short title> _(layer: <one or more of <layer_names>>)_`',
  '<findings_folder>/review_{iteration}.md', 'mkdir -p <findings_folder>', '**Fix:**', 'verdict: PASS', 'verdict: FAIL', 'findings_file: <full_path>', 'must_fix_count: <N>',
  'those 3 lines', '(disregarded for verdict purposes)', 'Only **Must Fix** triggers another upstream iteration.',
  'use the value you are given, never a remembered default'];
const LIT = {
  'architecture-reviewer.md': [...COMMON, '### Plan-review mode (insertion points 1, 3 and 4)', '## What to check (the architecture checks)', '### Plan-review mode FAIL (insertion points 1, 3 and 4)',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md` → `### 3. Architecture review (plan-review mode)`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md` → step 8',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` → `### G.2 Write and review the test fix plan`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase A2` → `### A2.1 Generate the architecture review`',
    '`${CLAUDE_PLUGIN_ROOT}/agents/test-fix-plan-writer.md` → `## Process` → **Rewrite machine paths before quoting.**',
    '`${CLAUDE_PLUGIN_ROOT}/agents/business-parity-reviewer.md`', '`${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`', '`${CLAUDE_PLUGIN_ROOT}/agents/layer-reviewer.md`',
    'findings_folder: <state_dir>/architecture_reviews/<branch>/', 'iteration: <arch_review_index>', 'findings_folder: <state_dir>/architecture_user_review_reviews/<branch>/',
    'story_path: <test_fix_plan_path>', 'task_files_dir: <test_fix_findings_dir>', 'prompt_path: <test log path>', 'findings_folder: <test_fix_review_folder>', 'iteration: <test_fix_review_index>',
    'index_path: <arch_review_path>', 'findings_folder: <arch_review_findings_dir>',
    'Output: write the architecture-review index to <arch_review_path> and one self-contained finding_<N>.md per finding to <arch_review_findings_dir>, then report back with the index path.',
    '<state_dir>/lessons.md', '<home>/…', '**Plan-review mode, sub-case (c):**', '**(c) Insertion point 4 — test fix plan.**', '**Sub-case (c)**',
    '**Layer placement.**', '**Business-logic placement.**', '**Dependency direction.**', '**Wire surface and mapping placement.**', '**Closed value sets.**',
    '**New responsibility → new owner file.**', '**State placement.**', '**Accompanying-set placement.**', '**Logging placement.**', '**Must Fix with no exceptions**',
    "*replace with your project's rule*", '**Verify justifications — do NOT rubber-stamp a claimed exception.**', '<parity_vocabulary>',
    '# Architecture review — iteration {iteration}', '`→ [finding_3.md](<branch>_arch_review/finding_3.md)`',
    '<state_dir>/architecture_reviews/<branch>/review_{iteration}.md', '<state_dir>/architecture_branch_reviews/<branch>_arch_review.md',
    '<state_dir>/architecture_branch_reviews/<branch>_arch_review/finding_<N>.md', '<state_dir>/architecture_user_review_reviews/<branch>/review_{iteration}.md',
    '`<state_dir>/test_fix_plan_reviews/<branch>_<gate_key>_round_<gate_round>/`'],
  'business-parity-reviewer.md': [...COMMON, '### Plan-review mode (insertion points 1 and 3)', '## What to check (the parity checks)', '### Plan-review mode FAIL (insertion points 1 and 3)',
    '**Skip this phase unless `phases.parity` is `true` in `harness.config.json`.**',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md` → `### 2. Business-parity review (plan-review mode)`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` step 7',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase A1.5` → `### A1.5.1 Generate the parity review`',
    '`${CLAUDE_PLUGIN_ROOT}/agents/architecture-reviewer.md`', '`${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`', '`${CLAUDE_PLUGIN_ROOT}/agents/layer-reviewer.md`',
    'findings_folder: <state_dir>/business_parity_reviews/<branch>/', 'iteration: <parity_review_index>', 'findings_folder: <state_dir>/business_parity_user_review_reviews/<branch>/',
    'index_path: <parity_review_path>', 'findings_folder: <parity_review_findings_dir>',
    'Output: write the parity-review index to <parity_review_path> and one self-contained finding_<N>.md per finding to <parity_review_findings_dir>, then report back with the index path.',
    '`## Process` step 3', '**(a) External call name**', '**(b) External call payload**', '**(c) Stored-document and field names**', '**(d) Stored-data queries**',
    '**(e) Threshold constants / gating predicates**', '**(f) Strict-vs-loose inequality**', '**(g) Side-effect ordering**',
    '**(h) Source-of-truth and mirror ordering for application-level state**', '**(i) The whole business flow, not only scattered lines.**', '**(j) Missing whole behaviour.**',
    "*Replace with your project's parity surface*", '**Verify the exclusion basis — never accept the citation on its face.**',
    '`// TODO: @claude add a follow up task for this: …`', '**Obvious-reference-bug exception — verify before accepting, do NOT rubber-stamp the label.**',
    '**Leg 1 — the cited reference behaviour is wholly a bug, not partly intended.**', '**Leg 2 — no established precedent in this project already sets a different convention.**',
    '**Dead-code carve-out for check (j) (do NOT flag).**', '`<reference_impl>/<file>` (`<symbol>`)', '<impl_stack>', '<convention_symbols>',
    '# Business parity review — iteration {iteration}', '`→ [finding_3.md](<branch>_parity_review/finding_3.md)`',
    '<state_dir>/business_parity_reviews/<branch>/review_{iteration}.md', '<state_dir>/business_parity_branch_reviews/<branch>_parity_review.md',
    '<state_dir>/business_parity_branch_reviews/<branch>_parity_review/finding_<N>.md', '<state_dir>/business_parity_user_review_reviews/<branch>/review_{iteration}.md'],
};
for (const f of CHECK) for (const l of LIT[f]) if (!now(`plugin/agents/${f}`).includes(l)) bad(`LITERAL ${f}: ${l}`);
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
```

- [ ] Run `bash scripts/scratch-run.sh harness-runs/scratch/plan_diff_gates_family_check.mjs` as one plain foreground command, with no file argument, so that it checks both definitions and fails on any `SHARED` mismatch. Its last line is `PASS` or `FAIL <n>`, and its exit status matches.
- [ ] Fill the table from the probe's two `WORDS` lines.
  - Copy each `after=` figure into its row's `After — definition` cell and each `delta=` figure into `Δ`.
  - Check that each `before=` equals the row's `Before — definition`. A mismatch means the base tree moved: record it under the table.
  - On `FAIL`, keep the figures you recorded and write one line under the table saying the probe failed. Return a blocker quoting every `WORDS-NOT-LOWER`, `READS-CHANGED`, `OTHER-AGENT-CHANGED`, `FROZEN`, `LEAD`, `PAIR-LEAD`, `SHARED` and `LITERAL` line the probe printed. Do not edit `plugin/`.
- [ ] Re-run the story index's `## Scope register` derivation commands C1, C2, C3 and C3b verbatim. Every file or distinct path each prints must be a row of the register; read C3's and C3b's paths with their `6307573a:` prefix removed. Record any path with no row under the table and return a blocker naming it.
- [ ] Re-run the sample-pointer sweep `plugin/agents/README.txt` owns, `grep -rno 'samples/[A-Za-z0-9_<>/]*\.md' plugin/agents/`. Confirm that, as at `6307573a`, it prints no line for `plugin/agents/architecture-reviewer.md` or `plugin/agents/business-parity-reviewer.md`. Record any line for either file under the table and return a blocker.

**Verification:**

- The probe's last line is `PASS` and it exits `0`. Run with no argument, it printed no `SHARED` line at all.
- Every `After — definition` and `Δ` cell of `## Up-front word counts` is filled from that run, and every `Δ` is below `0`.
- `git diff --name-only` lists only the story index as changed by this task.
- `git diff -- harness-runs/story_plans/chore_thin_prose_family_plan_diff_gates_story_plan.md` changes only those cells, plus at most one line under the table.
