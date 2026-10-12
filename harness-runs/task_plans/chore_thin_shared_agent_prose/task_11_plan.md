### Task 11 — Measure every agent's up-front words after the thinning, and record the result in the story index

**Goal:** Fill the `After` and `Δ` columns of the story index's `## Up-front word counts` table and the `After` columns of its `## Repeated lines — before and after` table from the tree as Tasks 1–10 left it, so the plan shows — measured, not estimated — that no agent's up-front figure rose and that every thinned block still matches across its copies at a shorter length.

**Depends on:** Task 10, the last task that edits an agent definition; through it, Tasks 1–9. This is the catch-all (`general`) task and ships last because it measures what the `plugin` tasks built.

**Where this task stops.** It edits the story index `harness-runs/story_plans/chore_thin_shared_agent_prose_story_plan.md` — the file this task is dispatched to fill, which licenses the edit — and only the two tables named above: no line of `## Phase 2 Readiness — Ordered Fix List`, `## Context`, `## Scope register` or any other section changes, and no readiness marker is touched. It edits no file under `plugin/`. If a figure shows a rise, it records the figure and returns a blocker rather than thinning anything itself. Because the story index is this task's only work file, its commit stages the index alone and the committer's return carries a `staged: index-only` notice; that is expected here and is not a defect.

**What "up-front words" means here.** An agent's definition plus every plugin file or section it reads on every dispatch, counted as runs of characters other than ASCII whitespace. A dispatch-site back-pointer ("dispatched from …", "walked downstream by …") is not a read, and neither is a read conditioned on a mode, a sub-case, a phase flag, a selected driver or an event such as a sample fixture changing; `ui-tests-plan-writer` and `ui-tests-plan-reviewer` are counted with the `web-playwright` driver's `qa-tester.md`. `CLAUDE.md` and the adopter's conventions documents are excluded, as the task prompt directs. The read set per agent is the `READS` table in the script below.

### Targets

- `harness-runs/story_plans/chore_thin_shared_agent_prose_story_plan.md` → `## Up-front word counts` and `## Repeated lines — before and after` (the two tables' `After` and `Δ` cells only, plus one line under the second table).
- `harness-runs/scratch/measure_upfront.mjs` and `harness-runs/scratch/repeated_lines.mjs` — gitignored probes, recreated from the text below if absent; never committed.

**Work:**

- [ ] If either probe is missing under `harness-runs/scratch/`, write it with exactly the text below (the planning run left both there; `harness-runs/scratch/` is gitignored, so a fresh checkout has neither).

  `harness-runs/scratch/measure_upfront.mjs`:

```js
// Up-front words per agent: its definition plus every plugin file or section it reads on every dispatch.
// Words are runs of characters other than ASCII whitespace. A section runs from its `## ` heading
// to the line before the next `## ` heading (or end of file).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
const words = (t) => (t.match(/[^ \t\n\r\f\v]+/g) ?? []).length;
const file = (p) => readFileSync(join(root, 'plugin', p), 'utf8');
const section = (p, heading) => {
  const lines = file(p).split('\n');
  const start = lines.findIndex((l) => l === heading);
  if (start < 0) throw new Error(`heading not found: ${p} -> ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (lines[i].startsWith('## ')) { end = i; break; }
  return lines.slice(start, end).join('\n');
};
const TRR = ['instructions/unit_loop_core.md', '## The test-run rule'];
const SUB = ['instructions/unit_loop_core.md', '## Substitution table'];
const CR = ['samples/sample_code_review.md', 'samples/sample_code_review/finding_1.md'];
const TP = ['samples/sample_task_plan.md', 'samples/sample_story_plan.md', 'samples/sample_story/task_1_plan.md', 'samples/sample_story/task_2_plan.md', 'samples/sample_story/task_3_plan.md'];
const UR = ['samples/sample_user_review_fix_plan.md', 'samples/sample_user_review_fix_plan/finding_1.md'];
const READS = {
  'architecture-reviewer': [TRR],
  'branch-reviewer': [TRR, ...CR],
  'business-parity-reviewer': [TRR],
  'committer': [],
  'conventions-reviewer': ['agents/conventions-writer.md'],
  'conventions-writer': [],
  'docs-reviewer': ['agents/docs-writer.md'],
  'docs-writer': [],
  'layer-implementer': [TRR, SUB],
  'layer-reviewer': [TRR],
  'qa-tester': [],
  'qa-tester-mobile-maestro': [],
  'qa-tester-mobile-mcp': [],
  'review-plan-reviewer': [TRR, ...CR],
  'skeptic-reviewer': [TRR, ...CR],
  'statistics-plan-writer': ['samples/sample_statistics.md'],
  'task-plan-reviewer': [TRR, ...TP],
  'task-plan-writer': [TRR, ...TP],
  'test-fix-plan-writer': [TRR, ...UR],
  'ui-tests-plan-reviewer': ['agents/ui-tests-plan-writer.md', 'agents/qa-tester.md'],
  'ui-tests-plan-writer': ['agents/qa-tester.md'],
  'user-review-fix-plan-writer': [TRR, ...UR],
};
console.log('| Agent | Definition | Reads | Up-front |');
console.log('|---|---|---|---|');
for (const [agent, reads] of Object.entries(READS)) {
  const def = words(file(`agents/${agent}.md`));
  const extra = reads.reduce((n, r) => n + words(Array.isArray(r) ? section(...r) : file(r)), 0);
  console.log(`| ${agent} | ${def} | ${extra} | ${def + extra} |`);
}
```

  `harness-runs/scratch/repeated_lines.mjs`:

```js
// The task prompt's line-repetition check, as one file: every line longer than 80 characters that
// occurs (deduplicated per file) in three or more of plugin/agents/*.md, with its copy count, its
// word count and the agents that carry it. Mirrors:
//   for f in plugin/agents/*.md; do awk 'length>80' "$f" | sort -u; done | sort | uniq -c | awk '$1>=3' | sort -rn
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = join(fileURLToPath(new URL('../..', import.meta.url)), 'plugin', 'agents');
const seen = new Map();
for (const f of readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
  for (const line of new Set(readFileSync(join(dir, f), 'utf8').split('\n').filter((l) => [...l].length > 80))) {
    if (!seen.has(line)) seen.set(line, []);
    seen.get(line).push(f.replace(/\.md$/, ''));
  }
}
const words = (t) => (t.match(/[^ \t\n\r\f\v]+/g) ?? []).length;
const rows = [...seen].filter(([, fs]) => fs.length >= 3).sort((a, b) => b[1].length - a[1].length || words(b[0]) - words(a[0]));
for (const [line, fs] of rows) console.log(`${fs.length}\t${words(line)}w\t${line.slice(0, 90)}\t[${fs.join(' ')}]`);
```

- [ ] Run `bash scripts/scratch-run.sh harness-runs/scratch/measure_upfront.mjs` as one plain foreground command and copy each agent's `Up-front` figure into the `After` cell of its row in `## Up-front word counts`; write `Δ` as `After − Before` (a negative number or `0`). Any row whose `Δ` is above `0` is a blocker: record the figures, then return a blocker naming the agent and both figures.
- [ ] Run `bash scripts/scratch-run.sh harness-runs/scratch/repeated_lines.mjs` the same way. For each row of `## Repeated lines — before and after`, find the thinned block's new line in the output and fill its `After copies` and `After words` cells; a block whose new text is 80 characters or shorter no longer appears in the output — write `≤80 chars` in both cells for it. A thinned block that appears with **fewer** copies than its `Before copies` (and is not `≤80 chars`) means one copy drifted from the others: record it and return a blocker naming the block.
- [ ] Add one line under the second table recording any repeated line the output shows that the `Before` list did not have — expected: the read-list precedence sentence Task 10 added to ten agents, and lines that became identical once their shared sentences were thinned — naming each and its copy count, so a new repeat is on the record rather than mistaken for drift.

**Verification:**

- Every `After` and `Δ` cell of `## Up-front word counts` is filled, and no `Δ` is above `0`.
- Every row of `## Repeated lines — before and after` has its `After` cells filled, and no thinned block shows fewer copies than before unless it is `≤80 chars`.
- `git diff -- harness-runs/story_plans/chore_thin_shared_agent_prose_story_plan.md` changes only cells of those two tables and the one added line, and `git diff --name-only` lists no file under `plugin/` changed by this task.
