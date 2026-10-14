### Task 8 — Measure both agents' up-front words and check frozen text and anchors against `4cbe7f72`

**Goal:** Fill the `After` and `Δ` cells of the story index's `## Up-front word counts` table from the tree as Tasks 1–7 left it, and prove mechanically that no line or sentence shared with an agent outside this family changed and that every wire literal and cited anchor survived — so the plan's claims are measured, not estimated.

**Depends on:** Task 7, the last task that edits an agent definition; through it, Tasks 1–6. This is the catch-all (`general`) task and ships last because it measures what the `plugin` tasks built.

**Where this task stops.** It edits only the story index `harness-runs/story_plans/chore_thin_prose_family_task_plan_story_plan.md`, and only the four empty cells of each row of `## Up-front word counts`: no other line of the index changes, and no readiness marker is touched. It edits no file under `plugin/`. If the probe reports a failure it records the figures it has and returns a blocker naming every `FAIL` line rather than editing an agent itself. Because the story index is this task's only work file, its commit stages the index alone and the committer's return carries a `staged: index-only` notice; that is expected here.

**What the probe measures.** Up-front words = the definition + `plugin/instructions/unit_loop_core.md` → `## The test-run rule` + every sample read up front, counted as runs of non-whitespace characters. `Before` (at `4cbe7f72`) counts `sample_task_plan.md`, `sample_story_plan.md` and `sample_story/task_1–3_plan.md`; `After` counts the same without `sample_task_plan.md`, which Tasks 1 and 5 made an on-demand read. Frozen text = every line of 30 or more characters that occurs whole in a non-family `plugin/agents/*.md` at `4cbe7f72`, and every sentence of 50 or more characters that occurs in one, except the one exempt doctrine sentence the story index names.

### Targets

- `harness-runs/story_plans/chore_thin_prose_family_task_plan_story_plan.md` → `## Up-front word counts` (the `After — definition`, `After — up-front` and `Δ` cells).
- `harness-runs/scratch/task_plan_family_check.mjs` — a gitignored probe, written from the text below and never committed.

**Work:**

- [ ] Write `harness-runs/scratch/task_plan_family_check.mjs` with exactly this text:

```js
// Task-plan family check: up-front words, frozen cross-family text, and wire literals.
// Base commit: 4cbe7f72. Read-only: reads the tree and `git show` output, writes nothing.
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const BASE = '4cbe7f72';
const root = process.argv[2] ?? fileURLToPath(new URL('../..', import.meta.url));
const FAMILY = ['task-plan-writer.md', 'task-plan-reviewer.md'];
const EXEMPT = ['This rule is harness doctrine and is stated here in full rather than cited; where the adopter\'s own rules document restates it (the file `layers[].conventions` names), nothing here depends on that restatement.'];
const now = (p) => readFileSync(join(root, p), 'utf8');
const then = (p) => execFileSync('git', ['-C', root, 'show', `${BASE}:${p}`], { encoding: 'utf8' });
const words = (t) => (t.match(/[^ \t\n\r\f\v]+/g) ?? []).length;
const section = (t, heading) => {
  const lines = t.split('\n'); const s = lines.indexOf(heading);
  if (s < 0) throw new Error(`heading not found: ${heading}`);
  let e = lines.length; for (let i = s + 1; i < lines.length; i++) if (lines[i].startsWith('## ')) { e = i; break; }
  return lines.slice(s, e).join('\n');
};
let fail = 0;
// 1. Up-front words: definition + `## The test-run rule` + the samples read up front.
const TRR = (get) => words(section(get('plugin/instructions/unit_loop_core.md'), '## The test-run rule'));
const SAMPLES_BEFORE = ['sample_task_plan.md', 'sample_story_plan.md', 'sample_story/task_1_plan.md', 'sample_story/task_2_plan.md', 'sample_story/task_3_plan.md'];
const SAMPLES_AFTER = SAMPLES_BEFORE.slice(1);
console.log('| Agent | Before — definition | Before — up-front | After — definition | After — up-front | Δ |');
console.log('|---|---|---|---|---|---|');
for (const f of FAMILY) {
  const p = `plugin/agents/${f}`;
  const db = words(then(p)), da = words(now(p));
  const ub = db + TRR(then) + SAMPLES_BEFORE.reduce((n, s) => n + words(then(`plugin/samples/${s}`)), 0);
  const ua = da + TRR(now) + SAMPLES_AFTER.reduce((n, s) => n + words(now(`plugin/samples/${s}`)), 0);
  console.log(`| ${f.replace('.md', '')} | ${db} | ${ub} | ${da} | ${ua} | ${ua - ub} |`);
  if (ua > ub || da >= db) { fail++; console.log(`FAIL words: ${f}`); }
}
// 2. Frozen text: a line or sentence shared with an agent outside the family at BASE survives byte-for-byte.
const agents = then('plugin/agents/').split('\n').filter((n) => n.endsWith('.md') && !FAMILY.includes(n));
const others = agents.map((n) => then(`plugin/agents/${n}`));
const otherLines = new Set(others.flatMap((t) => t.split('\n')));
for (const f of FAMILY) {
  const p = `plugin/agents/${f}`; const cur = now(p); const curLines = new Set(cur.split('\n'));
  for (const line of then(p).split('\n')) {
    if (line.length < 30) continue;
    if (otherLines.has(line)) { if (!curLines.has(line)) { fail++; console.log(`FROZEN LINE missing in ${f}: ${line.slice(0, 100)}`); } continue; }
    for (const s of line.split(/(?<=[.:;])\s+(?=[A-Z*`(\-])/)) {
      if (s.length < 50 || EXEMPT.includes(s) || !others.some((t) => t.includes(s))) continue;
      if (!cur.includes(s)) { fail++; console.log(`FROZEN SENTENCE missing in ${f}: ${s.slice(0, 100)}`); }
    }
  }
}
// 3. Wire literals and cited anchors.
const LIT = {
  'task-plan-writer.md': ['## Resolved values', '## Invocation contract', '## Read first', '## Process', '## Clarification questions', '## Revision mode', '## Output contract',
    'Write the task plan.', 'Task prompt: <state_dir>/task_prompts/<branch>_task_prompt.md', 'Outputs: story index at <state_dir>/story_plans/<branch>_story_plan.md and per-task files at <state_dir>/task_plans/<branch>/task_<N>_plan.md',
    'Revise the task plan per findings at <findings_file>.', 'Per-task files: <state_dir>/task_plans/<branch>/', 'blocker:', 'TODO: @claude add a follow up task for this:',
    '**A missing permission entry is not a human step:**', '**Scope closure:**', '**Conventions-document prohibition:**', '## Scope register', '## Phase 2 Readiness — Ordered Fix List',
    '## Rejected findings', 'call stands', '# Story:', 'Top risks:', 'Manual setup required:', '## Tasks', 'N. [ ] **Task K** — <short title> _(layer: <one of <layer_names>>)_ _(points: <N>)_',
    '### Task N — <title>', '**Depends on:**', '### Sources of truth', '### Targets', '**Source:**', '**Work:**', '**Verification:**',
    '`# | Site (path + symbol or quoted anchor, or standing-artifact row id) | Copy | Evidence | Disposition | Owning task or reason`',
    '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`', '${CLAUDE_PLUGIN_ROOT}/samples/sample_task_plan.md', '${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md', '${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_<N>_plan.md',
    'story_file: <full_path>', 'task_files_dir: <state_dir>/task_plans/<branch>/', 'tasks_count: <N>', 'story_points_total: <N>',
    '## Questions', '## Parity exclusions / deferrals', '## Corpus staleness', 'stale-rule', 'undescribed-layer', '## Manual setup required',
    'deploy.sh', 'autonomous-watcher.sh', 'restart-watcher.sh', 'cleanup-merged-worktrees.sh', 'remote-run.sh', '/autonomous-sdlc-harness:harness-analyze', 'npx autonomous-sdlc-harness config set layers', 'layer-drift'],
  'task-plan-reviewer.md': ['## Resolved values', '## Invocation contract', '## Read first', '## Process', '## What to check', '## Unsolicited dispatch guidance', '## Output contract',
    'story_path: <state_dir>/story_plans/<branch>_story_plan.md', 'task_files_dir: <state_dir>/task_plans/<branch>/', 'prompt_path: <prompt_path>', 'findings_folder: <state_dir>/task_plan_reviews/<branch>/', 'iteration: <iteration>',
    'verdict: PASS', 'verdict: FAIL', 'findings_file: <full_path>', 'must_fix_count: <N>', '# Task plan review — iteration {iteration}', '## Must Fix', '## Should Fix', '## Nice to Have', 'blocker:', '(disregarded for verdict purposes)',
    '## Phase 2 Readiness — Ordered Fix List', '## Scope register', '## Rejected findings', 'rebutted round <j> — call stands', 'TODO: @claude add a follow up task for this:', '## Corpus staleness', 'stale-rule', 'undescribed-layer',
    '### Architecture', '### Granularity & tags', '### Per-task-file structure', '`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`', '${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md',
    '${CLAUDE_PLUGIN_ROOT}/samples/sample_task_plan.md', '${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md', '${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_<N>_plan.md'],
};
for (const [f, lits] of Object.entries(LIT)) for (const l of lits) if (!now(`plugin/agents/${f}`).includes(l)) { fail++; console.log(`LITERAL missing in ${f}: ${l}`); }
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
```

- [ ] Run `bash scripts/scratch-run.sh harness-runs/scratch/task_plan_family_check.mjs` as one plain foreground command. Its last line is `PASS` or `FAIL <n>`, and its exit status matches.
- [ ] Copy the probe's `After — definition`, `After — up-front` and `Δ` figures for each agent into the matching cells of the story index's `## Up-front word counts`. Check that its `Before` figures equal the ones already in the table; a mismatch means the base tree moved — record it in your return.
- [ ] On `FAIL`, keep the figures you recorded and return a blocker quoting every `FAIL`, `FROZEN …` and `LITERAL …` line the probe printed; do not edit `plugin/`. Delete the probe file once its output is recorded.

**Verification:**

- The probe's last line is `PASS` and it exits `0`.
- Every `After` and `Δ` cell of `## Up-front word counts` is filled from that run, no `Δ` is above `0`, and each `After — definition` is below its `Before — definition`.
- `git diff --name-only` lists only the story index as changed by this task, and `git diff -- harness-runs/story_plans/chore_thin_prose_family_task_plan_story_plan.md` changes only the cells of that one table.
- Re-run the story index's three `## Scope register` derivation commands: every path each prints is a row of the register.
