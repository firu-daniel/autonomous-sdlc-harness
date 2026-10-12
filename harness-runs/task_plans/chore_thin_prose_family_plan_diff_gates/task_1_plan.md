### Task 1 — Thin the `## Process` blocks both definitions share, identically in both, and write the family check probe

**Goal:** Cut the `## Process` steps 1–2 and the rejected-findings lead of `plugin/agents/architecture-reviewer.md` and `plugin/agents/business-parity-reviewer.md` to direct rules stated once, writing the shared lines identically into both. Then write and run the read-only family check probe that Tasks 2–6 use and Task 7 runs as the branch's authority.

**Where this task stops.** It changes only these parts, in both files:
- `## Process` step 1;
- the step 2 bullets for sub-cases (a) and (b) and for implemented-solution mode;
- the bold-lead sentence of the paragraph opening `**In plan-review mode, read the index's `## Rejected findings` section`.

It does not touch:
- `architecture-reviewer`'s sub-case (c) bullet (Task 4) or step 3;
- `business-parity-reviewer`'s step 3 (Task 5);
- anything above `## Process` (Task 2) or below the rejected-findings paragraph (Tasks 3–6).

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `6307573a` — sometimes only part of a line, leading spaces included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- in `architecture-reviewer`'s sub-case (a) bullet, the run `You are the coherence guardian — you read the whole`;
- in both implemented-solution bullets, the run `escalating to a targeted `Read` (offset/limit around a hunk) only where a hunk cannot be judged alone — do NOT read whole changed`;
- in `business-parity-reviewer`, the sentence `Draft each segment's finding candidates before moving to the next.`;
- the whole rejected-findings rule from `**A recorded rejection is an addressed finding only once you have tested it.**` to `raise it.`

These bold leads, which only the two family files carry, stay in both:
- `**Plan-review mode, sub-case (a):**`, `**Plan-review mode, sub-case (b):**` and `**Implemented-solution mode:**`;
- `**In plan-review mode, read the index's `## Rejected findings` section as well as its `## Context`**`.

### Targets

- `plugin/agents/architecture-reviewer.md` → `## Process` step 1, step 2's sub-case (a), sub-case (b) and implemented-solution bullets, and the rejected-findings paragraph's lead sentence.
- `plugin/agents/business-parity-reviewer.md` → the same parts.
- `harness-runs/scratch/plan_diff_gates_family_check.mjs` (new): a gitignored probe, never committed.

**Work:**

- [ ] **Step 1 and the plan-review bullets.** Apply R1–R6: step 1 loses its rationale clause, the sub-case (a) bullet loses its reader-slice rationale, and the sub-case (b) bullet becomes one identical line in both files.
- [ ] **The implemented-solution bullet.** Apply R7–R10.
  - The bullet gains `from `<repo_root>`,`, which Task 2 drops from `## Invocation contract`.
  - It loses `with generous context`, which `## Invocation contract` keeps in its bold form.
  - It loses the closing `Read `plan_path` for intent only, not to review it.`, which the `plan_path` key row keeps.
- [ ] **The rejected-findings lead.** Apply R11–R12. The sub-case enumeration goes, because the bold lead already scopes the rule to plan-review mode.
- [ ] **Write and run the probe.** Write `harness-runs/scratch/plan_diff_gates_family_check.mjs` with exactly the text under `### Probe` below. Then run `bash scripts/scratch-run.sh harness-runs/scratch/plan_diff_gates_family_check.mjs plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` as one plain foreground command. Leave the file in place; it is gitignored, and later tasks use it.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - Read the rule sources before judging anything.
  - Sub-case (a): the index's `## Context` plus every `task_<N>_plan.md`; you read the whole set.
  - Sub-case (b): the same read over the fix-plan index and every `finding_<N>.md`.
  - Implemented-solution mode:
    - from `<repo_root>`, the `--stat` diff with both exclusions;
    - feature-area segments, each judged from its hunks with `git diff -U15`;
    - a targeted `Read` only where a hunk cannot be judged alone, and never whole changed files (*project* files in `business-parity-reviewer`, whose full read is the reference side's, step 3);
    - candidates drafted per segment;
    - in `architecture-reviewer`, the final cross-segment pass and its three concerns.
  - The rejected-findings section is read in plan-review mode, every sub-case.

### Replacements

**R1** — `plugin/agents/architecture-reviewer.md`: replace

```text
1. Read the rule-source files above, so you load the layering rules before you judge anything against them.
```

with

```text
1. Read the rule-source files above before you judge anything.
```

**R2** — `plugin/agents/business-parity-reviewer.md`: replace

```text
1. Read the rule-source files above, so you load the parity rules before you judge anything against them.
```

with

```text
1. Read the rule-source files above before you judge anything.
```

**R3** — `plugin/agents/architecture-reviewer.md`: replace

```text
You are the coherence guardian — you read the whole set even though each downstream consumer reads only one slice.
```

with

```text
You are the coherence guardian — you read the whole set.
```

**R4** — `plugin/agents/business-parity-reviewer.md`: replace

```text
You are the parity coherence guardian — you read the whole set even though each downstream consumer reads only one slice.
```

with

```text
You are the parity coherence guardian — you read the whole set.
```

**R5** — `plugin/agents/architecture-reviewer.md`: replace

```text
   - **Plan-review mode, sub-case (b):** read the fix-plan index (`story_path`) plus **every** `finding_<N>.md` in `task_files_dir`. Same coherence-guardian read, over the whole drafted fix plan.
```

with

```text
   - **Plan-review mode, sub-case (b):** the same read over the fix-plan index (`story_path`) and **every** `finding_<N>.md` in `task_files_dir`.
```

**R6** — `plugin/agents/business-parity-reviewer.md`: replace

```text
   - **Plan-review mode, sub-case (b):** read the fix-plan index (`story_path`) plus **every** `finding_<N>.md` in `task_files_dir`. Same coherence-guardian read: you review the planned parity of the whole drafted fix plan.
```

with

```text
   - **Plan-review mode, sub-case (b):** the same read over the fix-plan index (`story_path`) and **every** `finding_<N>.md` in `task_files_dir`.
```

**R7** — `plugin/agents/architecture-reviewer.md`: replace

```text
   - **Implemented-solution mode:** run `git diff <diff_base>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'`, group the changed files into feature-area segments, and review each segment from its diff hunks with generous context (`git diff -U15 <diff_base>...HEAD -- <files>`), escalating
```

with

```text
   - **Implemented-solution mode:** from `<repo_root>`, run `git diff <diff_base>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'`, group the changed files into feature-area segments, and review each segment from its diff hunks (`git diff -U15 <diff_base>...HEAD -- <files>`), escalating
```

**R8** — `plugin/agents/architecture-reviewer.md`: replace (the Old block opens with one space)

```text
 (dependency direction across segments, duplicated responsibilities, orphaned files). Read `plan_path` for intent only, not to review it.
```

with

```text
 (dependency direction across segments, duplicated responsibilities, orphaned files).
```

**R9** — `plugin/agents/business-parity-reviewer.md`: replace

```text
   - **Implemented-solution mode:** run `git diff <diff_base>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'`, group the changed files into feature-area segments, and review each segment from its diff hunks with generous context (`git diff -U15 <diff_base>...HEAD -- <files>`), escalating
```

with

```text
   - **Implemented-solution mode:** from `<repo_root>`, run `git diff <diff_base>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'`, group the changed files into feature-area segments, and review each segment from its diff hunks (`git diff -U15 <diff_base>...HEAD -- <files>`), escalating
```

**R10** — `plugin/agents/business-parity-reviewer.md`: replace

```text
Draft each segment's finding candidates before moving to the next. Read `plan_path` for intent only, not to review it.
```

with

```text
Draft each segment's finding candidates before moving to the next.
```

**R11** — `plugin/agents/architecture-reviewer.md`: replace

```text
`## Context`** — in all three sub-cases, story index, fix-plan index and test fix plan index alike. **A recorded
```

with

```text
`## Context`**. **A recorded
```

**R12** — `plugin/agents/business-parity-reviewer.md`: replace

```text
`## Context`** — in both sub-cases, story index and fix-plan index alike. **A recorded
```

with

```text
`## Context`**. **A recorded
```

### Probe

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

**Verification:**

- The probe run above prints two `WORDS` lines, each with a negative `delta`, and its last line is `PASS`.
  - It may also print `SHARED-PENDING` lines for lines Tasks 2 and 3 have not written yet. Those are informational.
  - It prints none of `FROZEN`, `LEAD`, `PAIR-LEAD`, `LITERAL`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
  - It prints no `SHARED-PENDING` line for `1. Read the rule-source files above before you judge anything.`, `- **Plan-review mode, sub-case (b):**` or `**In plan-review mode, read the index's `## Rejected findings` section`.
- Each new shared line is in both files and in no third:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` once per string below. Each run lists exactly `plugin/agents/architecture-reviewer.md` and `plugin/agents/business-parity-reviewer.md`.
  - The strings: `1. Read the rule-source files above before you judge anything.`, `the same read over the fix-plan index`, `` `## Context`**. **A recorded rejection ``.
- The cross-family texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `6307573a` (`git grep -l -F -e '<string>' 6307573a -- plugin/agents`). Compare the two lists with the `6307573a:` prefix removed; they must match.
  - Do this for each string: `You are the coherence guardian — you read the whole`, `only where a hunk cannot be judged alone — do NOT read whole changed`, `**A recorded rejection is an addressed finding only once you have tested it.**`.
- `git diff -- plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` shows hunks only inside `## Process` and the rejected-findings paragraph's lead sentence.
