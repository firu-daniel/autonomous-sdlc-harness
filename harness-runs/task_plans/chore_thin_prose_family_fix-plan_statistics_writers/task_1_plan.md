### Task 1 — Thin `user-review-fix-plan-writer`'s intro, `## Invocation contract` and `## Read on demand`, and write the family check probe

**Goal:** Cut the intro, `## Invocation contract` and `## Read on demand` of `plugin/agents/user-review-fix-plan-writer.md` to direct rules stated once. Then write and run the read-only family check probe that Tasks 2–5 use and Task 6 runs as the branch's authority.

**Where this task stops.** It changes only the text between the frontmatter and `## Resolved values` (the intro), and the text from `## Invocation contract` down to the end of `## Read on demand (no auto-loaded context)`, the paragraph before `## Process`. It does not touch:
- the frontmatter or `## Resolved values` (frozen; no task edits them);
- `## Process`, `## Output contract` or `## Revision mode` (Task 2);
- any other file under `plugin/`.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the four fenced prompt blocks, byte for byte (the core's `## Flow` steps 5, 7, 8 and 11 send them);
- in the `**How the caller consumes your return.**` paragraph, the run from `A `## Questions` section stops the loop` to `## Output contract` states both parts.`;
- the whole docs-retrieval tool bullet, from `When an observation's subject is hard to locate` to `fall back to your own reading of the code.`;
- the sentence `Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.`;
- the whole paragraph opening `**A cited path you cannot read is a finding, not a fallback.**`.

These bold leads stay, worded as they are: `**User-Review Fix Plan Writer**`, `**Initial write**`, `**Revision — business-parity findings**`, `**Revision — architecture findings**`, `**Revision — user feedback**`, `**How the caller consumes your return.**`, `**The conventions document for the layer the observation touches**` and `**A cited path you cannot read is a finding, not a fallback.**`. Every heading line stays.

### Targets

- `plugin/agents/user-review-fix-plan-writer.md` → the intro, `## Invocation contract` and `## Read on demand (no auto-loaded context)`.
- `harness-runs/scratch/fix_plan_statistics_family_check.mjs` (new): a gitignored probe, never committed.

**Work:**

- [ ] **The intro and `## Invocation contract`.** Apply U1–U7.
  - The role sentence loses its exhortation (U1).
  - The paragraph distinguishing the agent from `branch-reviewer` and `layer-reviewer` goes (U2). The frontmatter `description:` already says it, and the agent acts on neither.
  - The revision-mode lead, the per-finding-folder sentence and the parity-gate label lose their rationale (U3–U5).
  - The *"In every revision prompt …"* paragraph goes (U6). `## Revision mode` carries the same rule, and Task 2's U26 adds its *"the findings or feedback the prompt names"* half there.
  - The caller-return sentence drops *"and carries them into its hand-off"* (U7).
- [ ] **`## Read on demand`.** Apply U8–U10.
  - The lead and the conventions-document bullet lose their rationale and the template residue *"replace with your project's triggers"* (U8, U9). `<impl_stack>` and `<parity_vocabulary>` keep a use in the body, because `## Resolved values` declares both.
  - The three citation bullets (story index, code-review index, prior fix plan) collapse into one pointer at `## Process` step 2, which states each lookup in full (U10). Their one detail step 2 lacks, *"the marker may already be `[x]`"*, moves into step 2 in Task 2 (U12).
  - The lessons bullet keeps *"always, before step 6"* and points at step 6 for the grep-and-append rule (U10).
- [ ] **Write and run the probe.** Write `harness-runs/scratch/fix_plan_statistics_family_check.mjs` with exactly the text under `### Probe` below. Then run `bash scripts/scratch-run.sh harness-runs/scratch/fix_plan_statistics_family_check.mjs plugin/agents/user-review-fix-plan-writer.md` as one plain foreground command. Leave the file in place; it is gitignored, and later tasks run it.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - The four prompts and their `## Flow` step labels, the parity prompt's *"only when `phases.parity` is `true`"*, and all three revisions handled by `## Revision mode`.
  - `<fix_plan_path>` is the index path, and the per-finding folder is derived from it by mirroring its round suffix (`## Process` step 4).
  - The caller reads back `fix_plan_file`, `fix_plan_dir` and the four counts without opening the files; `## Questions` goes to the user verbatim.
  - Only what each observation references is read. A conventions document is read only for a layer an observation reaches, never all of them up front, and the catch-all layer's document carries the cross-layer rules.
  - A cited story-index task, code-review finding or prior fix-plan finding is read only when cited; the lessons ledger always, before step 6.
  - The docs-retrieval tool rules, the definition-wins sentence and the unreadable-path `blocker:` rule, all unchanged.

### Replacements

**U1** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
You are the **User-Review Fix Plan Writer**. You consume a hand-written, freeform user-review file (numbered observations the user wrote after their hands-on review of the branch) and produce a structured fix plan. The fix plan is the spec the implementer team will execute end-to-end — get it right, complete, and faithful to the user's intent the first time.
```

with

```text
You are the **User-Review Fix Plan Writer**. You turn the user's freeform review file — numbered observations from their hands-on review of the branch — into a structured fix plan the implementer team executes end-to-end, faithful to the user's intent.
```

**U2** — `plugin/agents/user-review-fix-plan-writer.md`: delete this paragraph, together with the one blank line after it

```text
You are distinct from `branch-reviewer` (`${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`), which reviews the end-of-branch diff, and from the per-unit `layer-reviewer` (`${CLAUDE_PLUGIN_ROOT}/agents/layer-reviewer.md`). Your input is the user's freeform observations, not a diff scan.
```

**U3** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
with one of **four** prompts — one initial write and three revisions. All three revisions are the same mode (see `## Revision mode`); only the authority they carry differs.
```

with

```text
with one of **four** prompts: one initial write and three revisions, all three handled by `## Revision mode`.
```

**U4** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
`<fix_plan_path>` is the **index** path. The caller passes only that: you derive the per-finding folder from it by mirroring its round suffix (`## Process` step 4).
```

with

```text
`<fix_plan_path>` is the **index** path; derive the per-finding folder from it by mirroring its round suffix (`## Process` step 4).
```

**U5** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
(`## Flow` step 7; dispatched **only** when `phases.parity` is `true`, since that gate does not run otherwise):
```

with

```text
(`## Flow` step 7; **only** when `phases.parity` is `true`):
```

**U6** — `plugin/agents/user-review-fix-plan-writer.md`: delete this paragraph, together with the one blank line after it

```text
In every revision prompt, read the existing plan AND the findings/feedback it names; apply only the requested changes; preserve everything else. Do NOT re-verify observations the caller did not reopen.
```

**U7** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
It reads back `fix_plan_file`, `fix_plan_dir` and the four counts, and carries them into its hand-off without opening the fix-plan files.
```

with

```text
It reads back `fix_plan_file`, `fix_plan_dir` and the four counts without opening the fix-plan files.
```

**U8** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
You do NOT preload the full context set — each observation touches a narrow slice of the codebase. Read only what each numbered observation actually references:
```

with

```text
Read only what each numbered observation references:
```

**U9** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
- **The conventions document for the layer the observation touches** — the document `init` generates at a configured `layers[].conventions` path (conventionally under `.claude/context/`). Take the pairing from `<layer_path_map>`: read the document of the layer whose `layers[].path` scope holds the code the observation is about, and read it **only** when an observation actually reaches that layer. Which subjects route to which layer is the adopter's to state — *replace with your project's triggers*, read off those same documents: typically one layer owns the wire and storage shapes, another the surfaces and the state container (`<impl_stack>`), and the catch-all layer's document carries the cross-layer rules (layering, testing, and — when `phases.parity` is `true` — `<parity_vocabulary>` parity). Never read all of them up front; that is the waste this section exists to avoid.
```

with

```text
- **The conventions document for the layer the observation touches** — paired through `<layer_path_map>`: the document of the layer whose `layers[].path` scope holds the code the observation is about. Read it **only** when an observation reaches that layer, never all of them up front. Those documents state which subjects route to which layer, in the project's own `<impl_stack>` vocabulary; the catch-all layer's document carries the cross-layer rules (layering, testing, and — when `phases.parity` is `true` — `<parity_vocabulary>` parity).
```

**U10** — `plugin/agents/user-review-fix-plan-writer.md`: replace

```text
- `<state_dir>/story_plans/<branch>_story_plan.md` (the story index) — only when an observation cites a task number. The index carries no task bodies and no per-task links: tasks appear only as readiness entries `N. [ ] **Task K** — <short title>` under `## Phase 2 Readiness — Ordered Fix List` (match on `**Task K**`; the marker may already be `[x]`). Locate the entry, then read the per-task file at `<state_dir>/task_plans/<branch>/task_<K>_plan.md`, whose own `### Task K — <title>` heading confirms the match, for the task's full spec.
- `<state_dir>/code_reviews/<branch>_code_review*.md` (the code-review index) — only when an observation cites a code-review finding number (pick the latest review by suffix). The index lists each finding as `### K. <title>` with a pointer to its detail file; read the matching per-finding file at `<state_dir>/code_reviews/<branch>_code_review*/finding_<K>.md` for the finding's full body.
- `<state_dir>/user_reviews/<branch>_fix_plan*.md` (a prior fix-plan index) — only when an observation cites a previous-round fix-plan finding number (pick the round number the user cited; default to the most recent prior round). The index lists each finding as `### K. <title>` with a pointer to its detail file; read the matching per-finding file at `<state_dir>/user_reviews/<branch>_fix_plan*/finding_<K>.md` for the finding's full body.
- `<state_dir>/lessons.md` — always, before step 6: the recurring-escape ledger you append new lessons to (grep it first so you extend existing entries instead of duplicating) — see step 6.
```

with

```text
- The story index and per-task file, the code-review index and per-finding file, or the prior-round fix-plan index and per-finding file — only when an observation cites a task, a code-review finding or a prior fix-plan finding, located as `## Process` step 2 states.
- `<state_dir>/lessons.md` — always, before step 6, which owns how it is grepped and appended to.
```

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

- The probe run above prints a `WORDS user-review-fix-plan-writer.md` line with a negative `delta`, and its last line is `PASS`. It prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e 'agents/layer-reviewer.md' -e 'actually references' -e 'replace with your project' -- plugin/agents/user-review-fix-plan-writer.md` prints nothing.
- `git grep -n -F -e 'located as `## Process` step 2 states' -- plugin/agents/user-review-fix-plan-writer.md` prints the new citation bullet under `## Read on demand` and no other line.
- `git diff -- plugin/agents/user-review-fix-plan-writer.md` shows hunks only above the `## Process` heading, and none inside `## Resolved values`.
