### Task 1 — Thin the blocks `branch-reviewer` and `skeptic-reviewer` share, identically in both, and write the family check probe

**Goal:** Rewrite once, and write identically into `plugin/agents/branch-reviewer.md` and `plugin/agents/skeptic-reviewer.md`, the five blocks only these two definitions carry. Then write the read-only family check probe the later tasks and Task 10 rely on.

**Where this task stops.** It changes exactly the five blocks below, in both files, and nothing else in either file. Every other paragraph belongs to a later task: Tasks 2–4 own the rest of `branch-reviewer`, Tasks 5–6 the rest of `skeptic-reviewer`. In each block it replaces only the sentences named. If an "old" text below is not found exactly in a file, change nothing in that file and return a blocker naming the file and the block.

**Frozen text next to these blocks** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the bold lead `**You report findings. You do not implement fixes.**`;
- the run from `Your `tools:` allowlist carries no `Edit`` through `Do not treat it as an oversight to work around. The only`;
- the bold leads `**Re-dispatch on a failed meta-review.**`, `**Every finding must be implementable as written, by an implementer that makes no decision of its own.**` and `**Checkbox discipline.**`;
- in `branch-reviewer`'s checkbox paragraph, the run `inside the index's `## Phase 2 Readiness — Ordered Fix`;
- in both checkbox paragraphs, the sentence opening `Binding on you as the author: you write every entry at`, to its end;
- in `skeptic-reviewer`'s checkbox paragraph, `(informational; the committer ignores them).`;
- the phrase `Finding *headings* do NOT carry `[ ]` / `[x]` markers`, which `review-plan-reviewer` shares with `branch-reviewer`.

The replacement texts below keep every item.

### Targets

- `plugin/agents/branch-reviewer.md` → the intro paragraph opening `**You report findings. You do not implement fixes.**`, the `**Re-dispatch on a failed meta-review.**` paragraph in `## Invocation contract`, and in `## Findings format` the lead sentence, the `**Every finding must be implementable as written…**` paragraph and the `**Checkbox discipline.**` paragraph.
- `plugin/agents/skeptic-reviewer.md` → the same five blocks.
- `harness-runs/scratch/branch_review_family_check.mjs` (new): a gitignored probe, never committed.

**Work:**

- [ ] **Intro sentence and `## Findings format` lead sentence, both files.**
  - In the intro paragraph, delete the second sentence: `Fixing is delegated separately, item by item, by the orchestrator's per-item fix loop.` in `branch-reviewer`, and `Fix implementation is delegated separately, item by item, by the orchestrator's per-item fix loop.` in `skeptic-reviewer`.
  - In `## Findings format`, replace the paragraph directly under the heading in each file with:
    `Emit the review as a **thin index file** plus **one self-contained per-finding file per fixable finding**.`
    The paragraph being replaced opens `You emit the code review as a **thin index file**` in `branch-reviewer` and `Emit the review as a **thin index file**` in `skeptic-reviewer`.
- [ ] **`**Re-dispatch on a failed meta-review.**`, both files.** Replace the whole paragraph.
  - In `branch-reviewer`: ``**Re-dispatch on a failed meta-review.** After `review-plan-reviewer` returns `FAIL`, the `## Phase B` loop re-dispatches you with `Adjust the code-review index at <code_review_path> and the per-finding files in <code_review_findings_dir> per findings at <findings_file>.` Adjust only the files the findings name: never regenerate the review, and never renumber a finding the findings file does not ask you to change.``
  - In `skeptic-reviewer`: ``**Re-dispatch on a failed meta-review.** After `review-plan-reviewer` returns `FAIL`, the `## Phase C2` loop re-dispatches you with `Adjust the skeptic-review index at <skeptic_review_path> and the per-finding files in <skeptic_review_findings_dir> per findings at <findings_file>.` Adjust only the files the findings name: never regenerate the review, and never renumber a finding the findings file does not ask you to change.``
  - The skeptic's false-positive rationale and its meta-review folder path go. The confidence rule lives in its own `## Confidence bar` section, and the folder is the caller's.
- [ ] **The implementability paragraph, both files.** Replace the whole paragraph opening `**Every finding must be implementable as written` with:
  ``**Every finding must be implementable as written, by an implementer that makes no decision of its own.** Before you file a finding, test its fix: if acting on it needs a choice between options, or an answer nobody in the loop has, it is not a finding. Put it in a `## Questions` section of your return, where a `## Unsolicited dispatch guidance` section sits, naming the decision owed and who owes it; write no per-finding file and no readiness entry for it, and add no return field. A partly decidable item splits: the implementable part is a finding with a concrete fix, the decision a question beside it.``
  - Each file's `## Output contract` already states that the section changes nothing else in the return. The caller's handling of it is the caller's to state.
- [ ] **`**Checkbox discipline.**`, both files.** Replace the whole paragraph with:
  ``**Checkbox discipline.** Finding *headings* do NOT carry `[ ]` / `[x]` markers; the committer flips checkboxes only inside the index's `## Phase 2 Readiness — Ordered Fix List`, the single source of truth for the fix loop. Sub-step `- [ ]` bullets inside a per-finding body are allowed (informational; the committer ignores them). Binding on you as the author: you write every entry at `[ ]` and never flip one to `[x]` — that transition belongs to the committing role — and you never edit the readiness section of an index a run is iterating that you did not author.``
- [ ] **Write and run the probe.** Write `harness-runs/scratch/branch_review_family_check.mjs` with exactly the text below. Then run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/branch-reviewer.md plugin/agents/skeptic-reviewer.md` as one plain foreground command. Leave the file in place; it is gitignored, and later tasks may use it.

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

**Verification:**

- The probe run above prints two `WORDS` lines, each with a negative `delta`, and its last line is `PASS`. The run checks both files you edited, so `PASS` means none of these lines is printed for either file: `FROZEN`, `LEAD`, `LITERAL`, `SHARED-BLOCK`, `READS-CHANGED` or `WORDS-NOT-LOWER`.
- Each new shared block is in both files and in no third:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` once per string below. Each run lists exactly `plugin/agents/branch-reviewer.md` and `plugin/agents/skeptic-reviewer.md`.
  - The strings: `Adjust only the files the findings name: never regenerate the review`, `Before you file a finding, test its fix:`, `the committer flips checkboxes only inside the index`, `Emit the review as a **thin index file** plus **one self-contained per-finding file per fixable finding**.`
- The cross-family texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `**You report findings. You do not implement fixes.**`, `and that omission is deliberate: it makes the read-only guarantee a tool-level one rather than a prose request`, `Binding on you as the author: you write every entry at`.
- `git diff -- plugin/agents/branch-reviewer.md plugin/agents/skeptic-reviewer.md` shows hunks only inside the five blocks named under `### Targets`.
