### Task 11 — Measure the five definitions and their up-front reads, run the family check probe, and record the result in the story index

**Goal:** Fill the `After` and `Δ` cells of the story index's `## Up-front word counts` tables from the tree as Tasks 1–10 left it. Then prove mechanically, against `13a2ed4c`, that:
- each definition and each agent's up-front read shrank;
- no file outside the five definitions changed;
- no frozen text, bold lead, heading or frontmatter moved;
- every text the family shares across definitions is identical in each;
- every wire literal and cited anchor survived;
- the scope register still closes.

**Depends on:** Task 6 (the last edit to `ui-tests-plan-reviewer.md`), Task 9 (the last edit to `qa-tester.md`) and Task 10 (the stubs). Task 4 made the last edit to `ui-tests-plan-writer.md`, before Task 6. This is the catch-all (`general`) task. It ships last because it measures what the `plugin` tasks built.

**Where this task stops.** It edits only the story index `harness-runs/story_plans/chore_thin_prose_family_ui_tests_qa_story_plan.md`, the file this task is dispatched to fill.
- Within it, only the `After` and `Δ` cells of the two `## Up-front word counts` tables change, plus at most one line under the second table.
- No line of `## Context`, `## Phase 2 Readiness — Ordered Fix List` or `## Scope register` changes, and no readiness marker is touched.
- It edits no file under `plugin/`.

If a check fails, record the figures you have and return a blocker quoting every failing line; never edit an agent definition yourself. The story index is this task's only work file, so its commit stages the index alone and the committer's return carries a `staged: index-only` notice. That is expected here and is not a defect.

**What the figures mean.** Up-front words are an agent's definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents. The probe counts words as `wc -w` does: runs of non-whitespace characters.
- `qa-tester`, `qa-tester-mobile-maestro` and `qa-tester-mobile-mcp` read no plugin file up front, so each one's up-front figure is its definition (`WORDS` lines).
- `ui-tests-plan-writer` reads the configured driver's `qa-tester` variant. `ui-tests-plan-reviewer` reads the same variant and the writer. Their figures depend on the driver, so the probe prints one `UPFRONT` line per agent per driver.
  - **Before** (at `13a2ed4c`): each read is the whole file.
  - **After**: under `web-playwright`, `qa-tester.md`'s frontmatter plus its `## Which MCP to use (per-test selection rule — follow verbatim)` section; under a mobile driver, that stub whole. For the reviewer, add only the writer's `` ## Split output spec (mirror the `task-plan-writer` exactly) `` and `` ### Capability guidance (encode this in every test's `**Capability / MCP:**` line) `` sections. A section runs from its heading to the line before the next heading of the same or a higher level.

**What the probe checks**, run with no file argument:
- **Frozen text** (`FROZEN`): every run of words covered by a ten-word window (inside one paragraph) that a family definition shared at `13a2ed4c` with an agent definition outside the family, plus the words between two such runs in one sentence.
- **Bold leads** (`LEAD`): every bold lead an outside definition carries verbatim, or that two or more family definitions carry, stays in each file that had it.
- **Headings and frontmatter** (`HEADING`, `FRONTMATTER`): every heading line at `13a2ed4c` is still a line of its file, and each frontmatter block is byte-identical.
- **Shared text** (`SHARED`): each `SHARED` string is in every definition it lists. Run with no argument, a missing one is a failure, not `SHARED-PENDING`.
- **Literals** (`LITERAL`): each file's list of wire literals and cited anchors.
- **Unchanged files** (`OUTSIDE-CHANGED`): nothing outside the five definitions differs from `13a2ed4c`, `harness-runs/` excluded.
- **Counts** (`WORDS-NOT-LOWER`, `UPFRONT-NOT-LOWER`): every definition's words and every up-front figure fell.

### Targets

- `harness-runs/story_plans/chore_thin_prose_family_ui_tests_qa_story_plan.md` → `## Up-front word counts`: the `After` and `Δ` cells, and at most one line under the second table.
- `harness-runs/scratch/ui_tests_qa_family_check.mjs`: a gitignored probe, written from the text below and never committed. Task 1 wrote the same text; overwrite it.

**Work:**

- [ ] Write `harness-runs/scratch/ui_tests_qa_family_check.mjs` with exactly the text under `### Probe` below.
- [ ] Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs` with **no** file argument, as one plain foreground command. Keep its whole output.
- [ ] Fill the story index's two tables from that output:
  - each definition's `After — definition` and `Δ` from its `WORDS` line;
  - each `UPFRONT` row's `After` and `Δ` from the matching `UPFRONT` line.
  If a figure is not below its `Before`, write it anyway and return a blocker.
- [ ] Re-run the scope register's command entries C1, C2, C3 and C3b exactly as the story index states them, from the repository root. Confirm every path each prints is a row of `## Scope register`. A path with no row is a blocker naming it; never add the row yourself.

### Probe

```js
// UI-tests/QA family check: frozen cross-family text, bold leads, headings, frontmatter,
// in-family shared text, wire literals, untouched files, word counts and up-front reads.
// Base commit 13a2ed4c. Read-only: reads the tree and `git show` / `git diff` output, writes nothing.
// Usage: node ui_tests_qa_family_check.mjs [plugin/agents/<name>.md ...]
// With no argument it checks all five definitions, fails on any SHARED text still missing,
// and fails on any up-front count that did not fall.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const BASE = '13a2ed4c';
const root = fileURLToPath(new URL('../..', import.meta.url));
const W = 'ui-tests-plan-writer.md', R = 'ui-tests-plan-reviewer.md', Q = 'qa-tester.md', MA = 'qa-tester-mobile-maestro.md', MC = 'qa-tester-mobile-mcp.md';
const FAMILY = [W, R, Q, MA, MC];
const args = process.argv.slice(2).map((a) => a.replace(/^.*\//, ''));
for (const a of args) if (!FAMILY.includes(a)) { console.log(`NOT-FAMILY ${a}`); process.exit(2); }
const CHECK = args.length ? args : FAMILY;
const FULL = args.length === 0;
const now = (p) => readFileSync(join(root, p), 'utf8');
const then = (p) => execFileSync('git', ['-C', root, 'show', `${BASE}:${p}`], { encoding: 'utf8' });
const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();
const A = (f) => `plugin/agents/${f}`;
const toks = (t) => t.match(/\S+/g) ?? [];
const words = (t) => toks(t).length;
const paras = (t) => t.split(/\n[ \t]*\n/).map(toks).filter((p) => p.length);
const N = 10;
let fail = 0;
const bad = (m) => { fail++; console.log(m); };
// Section reads: a heading line through the line before the next heading of the same or a higher level.
const frontmatter = (t) => { const L = t.split('\n'); const e = L.indexOf('---', 1); return L.slice(0, e + 1).join('\n'); };
const section = (t, heading) => {
  const L = t.split('\n'); const s = L.indexOf(heading);
  if (s < 0) { bad(`SECTION-MISSING ${heading}`); return ''; }
  const lvl = heading.match(/^#+/)[0].length; let e = s + 1;
  while (e < L.length && !(/^#+ /.test(L[e]) && L[e].match(/^#+/)[0].length <= lvl)) e++;
  return L.slice(s, e).join('\n');
};
// 1. Words, and the files that must not change: everything outside the five definitions.
for (const f of CHECK) {
  const b = words(then(A(f))); const a = words(now(A(f)));
  console.log(`WORDS ${f} before=${b} after=${a} delta=${a - b}`);
  if (a >= b) bad(`WORDS-NOT-LOWER ${f}`);
}
const changed = git('diff', '--name-only', BASE, '--', '.', ':(exclude)harness-runs').split('\n').filter(Boolean);
const outsideChanged = changed.filter((n) => !FAMILY.map(A).includes(n));
if (outsideChanged.length) bad(`OUTSIDE-CHANGED ${outsideChanged.join(' ')}`);
// 2. Up-front words per dispatch: the definition plus every plugin file or section it reads up front.
const MCP = '## Which MCP to use (per-test selection rule — follow verbatim)';
const SPEC = '## Split output spec (mirror the `task-plan-writer` exactly)';
const CAP = "### Capability guidance (encode this in every test's `**Capability / MCP:**` line)";
const qaBefore = { 'web-playwright': () => words(then(A(Q))), 'mobile-maestro': () => words(then(A(MA))), 'mobile-mcp': () => words(then(A(MC))) };
const qaAfter = { 'web-playwright': () => words(frontmatter(now(A(Q)))) + words(section(now(A(Q)), MCP)), 'mobile-maestro': () => words(now(A(MA))), 'mobile-mcp': () => words(now(A(MC))) };
for (const d of Object.keys(qaBefore)) {
  const wb = words(then(A(W))) + qaBefore[d](); const wa = words(now(A(W))) + qaAfter[d]();
  console.log(`UPFRONT ui-tests-plan-writer ${d} before=${wb} after=${wa} delta=${wa - wb}`);
  const rb = words(then(A(R))) + words(then(A(W))) + qaBefore[d]();
  const ra = words(now(A(R))) + words(section(now(A(W)), SPEC)) + words(section(now(A(W)), CAP)) + qaAfter[d]();
  console.log(`UPFRONT ui-tests-plan-reviewer ${d} before=${rb} after=${ra} delta=${ra - rb}`);
  if (FULL && (wa >= wb || ra >= rb)) bad(`UPFRONT-NOT-LOWER ${d}`);
}
// 3. Frozen text: a 10-word window (inside one paragraph) shared at BASE with an agent
//    definition outside the family, plus the words between two such runs in one sentence.
const listing = then('plugin/agents/').split('\n').filter((n) => n.endsWith('.md'));
const outside = listing.filter((n) => !FAMILY.includes(n));
const winSet = new Set();
for (const n of outside) for (const p of paras(then(A(n)))) for (let i = 0; i + N <= p.length; i++) winSet.add(p.slice(i, i + N).join(' '));
const endsSentence = (w, nx) => /[.?!](\*\*|\*|`|\)|")*$/.test(w) && nx !== undefined && /^[A-Z*`(\-|]/.test(nx);
for (const f of CHECK) {
  const cur = ' ' + toks(now(A(f))).join(' ') + ' ';
  for (const p of paras(then(A(f)))) {
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
// 4. Bold leads: one an outside definition carries verbatim stays, and so does one that two or
//    more family definitions carry. Heading lines and the frontmatter block stay byte for byte.
const allText = Object.fromEntries(listing.map((n) => [n, then(A(n))]));
const leadRe = /^\s*(?:(?:[-*]|\d+\.)\s+)?(?:\|[^|]*\|[^|]*\|\s*)?(\*\*[^*]+\*\*)/;
for (const f of CHECK) {
  const cur = now(A(f)); const curLines = new Set(cur.split('\n'));
  for (const line of allText[f].split('\n')) {
    if (/^#+ /.test(line) && !curLines.has(line)) bad(`HEADING ${f}: ${line}`);
    const m = line.match(leadRe); if (!m) continue;
    const kept = outside.some((n) => allText[n].includes(m[1])) || FAMILY.filter((n) => n !== f && allText[n].includes(m[1])).length > 0;
    if (kept && !cur.includes(m[1])) bad(`LEAD ${f}: ${m[1]}`);
  }
  if (frontmatter(cur) !== frontmatter(allText[f])) bad(`FRONTMATTER ${f}`);
}
// 5. Text the family writes identically into more than one definition once every task has landed.
const SHARED = [
  [[W, Q, MA, MC], '**Skip this phase unless `phases.qa` is `true` in `harness.config.json`.** With the phase off the project runs no interactive tests. A dispatch that arrives anyway is a caller bug, not a licence to improvise — read nothing,'],
  [[W, R], 'Read these; no other layer\'s conventions document is needed:'],
  [[W, R], 'Resolve the file from the driver: `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, read only its frontmatter and its `## Which MCP to use (per-test selection rule — follow verbatim)` section; `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md` and `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`, each read whole.'],
  [[W, R], 'A cited section you cannot find is an unreadable path.'],
  [[W, R], 'The two mobile variants are declared but not implemented in this release and state no capability set: do not fall back to the browser variant\'s set.'],
  [[MA, MC], '**Read `<qa_driver>` before anything else.** If it is not'],
  [[MA, MC], 'Even when `<qa_driver>` **is**'],
  [[MA, MC], '`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract` → "4. The run cannot proceed"; for its own driver the line is exactly:'],
  [[MA, MC], 'no browser and **no `base_url`**. Its dispatch handle is a device/emulator target and an installed build, and pinning that key is part of implementing this file.'],
  [[MA, MC], '- It would assert on the project\'s own test-attribute family, read off the conventions documents the configuration names, as the implemented variant does.'],
  [[MA, MC], '- **Never install, launch, restart or tear down the application, the device or the emulator.** The caller owns that lifecycle; an unreachable target is an `error:`, not a cue to provision one.'],
  [[MA, MC], 'An implementation of this variant inherits everything driver-neutral from `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` rather than restating it:'],
  [[MA, MC], 'That pointer runs one way: it does **not** make `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` runnable under this driver. An implementation adds only the driver-specific half:'],
];
for (const [files, text] of SHARED) {
  const missing = files.filter((f) => !now(A(f)).includes(text));
  if (!missing.length) continue;
  if (FULL) bad(`SHARED ${missing.join(',')}: ${text.slice(0, 120)}`); else console.log(`SHARED-PENDING ${missing.join(',')}: ${text.slice(0, 120)}`);
}
// 6. Wire literals and cited anchors.
const LIT = {};
LIT[W] = [
  "declared but not implemented in this release",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md`",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`",
  "Write the UI-test plan.\nBranch: <branch>\nInputs: task prompt <state_dir>/task_prompts/<branch>_task_prompt.md, story index <state_dir>/story_plans/<branch>_story_plan.md, per-task files <state_dir>/task_plans/<branch>/\nOutputs: index <state_dir>/ui_test_plans/<branch>_ui_test_plan.md and per-test files <state_dir>/ui_test_plans/<branch>/ui_test_<N>.md",
  "Augment the UI-test plan. Branch: <branch>. Additional input: user-review fix plan <fix_plan_path> (+ its finding_<K>.md files under <fix_finding_dir>). Index: <ui_test_index>. Per-test files: <ui_test_files_dir>.",
  "Revise the UI-test plan per findings at <findings_file>.\nIndex: <state_dir>/ui_test_plans/<branch>_ui_test_plan.md\nPer-test files: <state_dir>/ui_test_plans/<branch>/",
  "**Initial write**",
  "**Augment after user-review fixes**",
  "**Revision (per reviewer findings)**",
  "`${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md` → `## UI-test-plan write loop` step 1",
  "`${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md` → `## Flow` step 1",
  "`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_core.md` → `### QA.0`",
  "`${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md` → `### 1.` step 3",
  "This block is the single source of the augment prompt: both callers quote it verbatim.",
  "`<K>` stays literal.",
  "Same shape as the `task-plan-writer`'s revision mode.",
  "**byte-identical**",
  "`tests_count: <unchanged count>`",
  "## Rejected findings",
  "rebutted round <j> — call stands",
  "**`call stands` is unavailable for a Must Fix:**",
  "ui_test_index: <full_path>\nui_test_files_dir: <state_dir>/ui_test_plans/<branch>/\ntests_count: <N>",
  "no_ui: true\nreason: <one line — what the branch delivers instead of interactively-testable UI, or that the interactive-test phase is disabled>\ntests_count: 0",
  "**`no_ui: true` is a routing signal, not an error**",
  "`n/a (<qa_driver> variant declares no capability set)`",
  "`chrome-devtools (performance / Core Web Vitals)`",
  "**`Playwright (interaction + network + console`** [`+ request mocking` if the test stubs a response]`)`",
  "**Every other test is `Playwright`**",
  "`## Phase 2 Readiness — Ordered Fix List`",
  "`N. [ ] **Test K** — <short title> _(layer: <one or more of <layer_names>>)_`",
  "`<state_dir>/ui_test_plans/<branch>/ui_test_<K>.md`",
  "`# UI Test Plan: <branch>`",
  "`### Test N — <title>`",
  "**`**Goal:**`**",
  "**`**Depends on:**`**",
  "**`**Preconditions:**`**",
  "**`**Capability / MCP:**`**",
  "**`**Steps:**`**",
  "**`**Expected:**`**",
  "**`**On failure → fix target:**`**",
  "`<state_dir>/ui_test_plans/<branch>_ui_test_plan.md`",
  "`.claude/qa_test_scenarios.md`",
  "`<repo_root>/<qa_creds_path>`",
  "`<state_dir>/lessons.md`",
  "`<convention_symbols>`",
  "`<auth_provider>`",
  "`## Questions`",
  "**Your per-test files are outside the reach of any prose-minimisation rule**",
  "`data-qa-id`",
];
LIT[R] = [
  "declared but not implemented in this release",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md`",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`",
  "ui_test_index: <state_dir>/ui_test_plans/<branch>_ui_test_plan.md\nui_test_files_dir: <state_dir>/ui_test_plans/<branch>/\nprompt_path: <prompt_path>\nfindings_folder: <state_dir>/ui_test_plan_reviews/<branch>/\niteration: <iteration>",
  "`${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md` → `## UI-test-plan write loop` → `### 2. Spawn ui-tests-plan-reviewer`",
  "`${CLAUDE_PLUGIN_ROOT}/agents/ui-tests-plan-writer.md`",
  "| `ui_test_index` |",
  "| `ui_test_files_dir` |",
  "| `prompt_path` |",
  "| `findings_folder` |",
  "| `iteration` |",
  "`<state_dir>/task_prompts/<branch>_task_prompt.md`",
  "`<findings_folder>/review_{iteration}.md`",
  "do NOT `mkdir -p` here",
  "`Revise the UI-test plan per findings at <findings_file>.`",
  "`iteration >= 5`",
  "`verdict: PASS`",
  "`verdict: FAIL`",
  "verdict: PASS\n```\n\nNothing else. Do not save a file when PASS.",
  "verdict: FAIL\nfindings_file: <full_path>\nmust_fix_count: <N>",
  "# UI-test plan review — iteration {iteration}",
  "run `mkdir -p <findings_folder>`",
  "**Fix:**",
  "Keep the return message to those 3 lines.",
  "Only **Must Fix** triggers another writer iteration.",
  "(disregarded for verdict purposes)",
  "`n/a (<qa_driver> variant declares no capability set)`",
  "`chrome-devtools (performance / Core Web Vitals)`",
  "`## Phase 2 Readiness — Ordered Fix List`",
  "`N. [ ] **Test K** — <short title> _(layer: <one or more of <layer_names>>)_`",
  "`rebutted round <j> — call stands`",
  "`## Rejected findings`",
  "`data-qa-id` / `data-qa-value` / `data-qa-status`",
  "`**Goal:**`, `**Preconditions:**`, `**Capability / MCP:**`, `**Steps:**`, `**Expected:**`, and `**On failure → fix target:**`",
  "`**Depends on:**`",
  "`### Test N — <title>`",
  "`# UI Test Plan:`",
  "`<state_dir>/lessons.md`",
  "blocker:",
  "`## Process` step 0",
  "`## Process` step 3",
];
LIT[Q] = [
  "declared but not implemented in this release",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md`",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`",
  "ui_test_index: <state_dir>/ui_test_plans/<branch>_ui_test_plan.md\nui_test_files_dir: <state_dir>/ui_test_plans/<branch>/\ntest_ids: <N>\nbase_url: <base_url>\nfindings_folder: <state_dir>/qa_reviews/<branch>_qa_review/\niteration: <iteration>\n# test_credentials — optional; normally omitted (you self-read the credentials file).",
  "`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` (`### E.1 Run QA`)",
  "`${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md` (`### 3.`)",
  "`error: blocked — test <T>: <one-line cause>`",
  "error: blocked — test <T>: <one-line cause>\n```",
  "`error: <one-line reason>`",
  "error: <one-line reason>\n```",
  "`error: application not reachable at <base_url>`",
  "`error: blocked — `",
  "`error: blocked — tests <ids>: <causes>`",
  "verdict: PASS\n```",
  "verdict: FAIL\nfindings_file: <full path to the index you wrote>\nmust_fix_count: <N>",
  "error: qa.driver is mobile-maestro; this file is the web-playwright variant and drives a browser — the mobile-maestro variant is declared but not implemented in this release",
  "**Per-single-test invocation.**",
  "\"Per-single-test invocation\"",
  "`finding_t<T>_<N>.md`",
  "`qa_review_<iteration>_t<T>.md`",
  "`qa_review_<iteration>.md`",
  "`finding_<N>.md`",
  "`qa_review_0_t3.md`",
  "`finding_t3_1.md`",
  "`<state_dir>/qa_artifacts/<branch>/qa_<test-id>.png`",
  "`mkdir -p <state_dir>/qa_artifacts/<branch>`",
  "`mkdir -p <findings_folder>`",
  "`bash ${CLAUDE_PLUGIN_ROOT}/scripts/reserve-qa-user.sh <slot>`",
  "`bash ${CLAUDE_PLUGIN_ROOT}/scripts/reserve-qa-user.sh`",
  "`bash ${CLAUDE_PLUGIN_ROOT}/scripts/release-qa-user.sh <slot>`",
  "**`0`**",
  "**`3` (busy)**",
  "**`2` (bad request)**",
  "**`1` (no credentials / no accounts)**",
  "**Park the account you drive (so parallel QA sessions never collide on one account).**",
  "**Release every slot you reserved before you return**",
  "`() => { localStorage.clear(); sessionStorage.clear(); }`",
  "\"Running `browser_evaluate` safely\"",
  "**Running `browser_evaluate` safely:**",
  "`Promise.race`",
  "`cli/templates/claude/settings.autonomous.qa.json` `_README`",
  "`.claude/settings.autonomous.json`",
  "`git worktree list --porcelain`",
  "`<repo_root>/.claude/settings.autonomous.json`",
  "`permissions.allow`",
  "`## Output contract` → `### 3. A test blocked`",
  "`## Output contract` → `### 4. The run cannot proceed`",
  "`### 2. Some tests fail`",
  "`must_fix_count: 0`",
  "**`**Depends on:**`**",
  "**`**Preconditions:**`**",
  "`.claude/qa_test_scenarios.md`",
  "\"Logging out\"",
  "(\"QA techniques\")",
  "`<repo_root>/<qa_creds_path>`",
  "\"Authentication\"",
  "\"Asserting\"",
  "\"Priority\"",
  "`## Phase 2 Readiness — Ordered Fix List`",
  "`N. [ ] **Finding K** — short description. _(layer: <one or more of <layer_names>>)_`",
  "`→ [finding_3.md](<branch>_qa_review/finding_3.md)`",
  "`→ [finding_t3_1.md](<branch>_qa_review/finding_t3_1.md)`",
  "**Two boundaries the caller depends on. Both are absolute.**",
  "**Driver gate — this file is the `web-playwright` variant.**",
  "**Read `<qa_driver>` before anything else.**",
  "`mcp__playwright__browser_route`",
  "`mcp__chrome-devtools__navigate_page`",
  "`mcp__chrome-devtools__performance_start_trace`",
  "`mcp__chrome-devtools__performance_stop_trace`",
  "`mcp__chrome-devtools__performance_analyze_insight`",
  "`reload: true`",
  "`mcp__chrome-devtools__take_snapshot`",
  "`mcp__chrome-devtools__fill`",
  "`mcp__chrome-devtools__fill_form`",
  "`mcp__chrome-devtools__click`",
  "`mcp__chrome-devtools__wait_for`",
  "`mcp__playwright__browser_snapshot`",
  "`mcp__playwright__browser_click`",
  "`mcp__playwright__browser_type`",
  "`mcp__playwright__browser_navigate`",
  "`mcp__playwright__browser_select_option`",
  "`mcp__playwright__browser_wait_for`",
  "`mcp__playwright__browser_network_requests`",
  "`mcp__playwright__browser_network_request`",
  "`mcp__playwright__browser_console_messages`",
  "`mcp__playwright__browser_take_screenshot`",
  "`mcp__playwright__browser_evaluate`",
  "`<app_root>`",
  "`<qa_port_seed>`",
  "`<dev_server_cmd>`",
  "`<impl_stack>`",
  "`<convention_symbols>`",
  "`<auth_provider>`",
  "`<reference_impl>`",
  "**Do not switch MCPs on your own initiative.**",
];
LIT[MA] = [
  "declared but not implemented in this release",
  "error: qa.driver is mobile-maestro; the mobile-maestro variant of the interactive-test agent is declared but not implemented in this release — no test was executed",
  "This file is a **declaration**: it reserves the dispatch name, fixes the tool closure, and records what this variant would drive and which contract it would follow.",
  "Stopping loudly is the point. A silent success here would report \"nothing observed\" from an application nothing ever reached, and the caller cannot tell that apart from a clean run.",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract` → \"4. The run cannot proceed\"",
  "**Driver gate — this file is the `mobile-maestro` variant.**",
  "**Read `<qa_driver>` before anything else.**",
  "`web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` (implemented)",
  "`mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md` (declared, not implemented)",
  "**This file declares the `mobile-maestro` value and no other**",
  "**no `base_url`**",
  "`Read`",
];
LIT[MC] = [
  "declared but not implemented in this release",
  "error: qa.driver is mobile-mcp; the mobile-mcp variant of the interactive-test agent is declared but not implemented in this release — no test was executed",
  "This file is a **declaration**: it reserves the dispatch name, fixes the tool closure, and records what this variant would drive and which contract it would follow.",
  "Stopping loudly is the point. A silent success here would report \"nothing observed\" from an application nothing ever reached, and the caller cannot tell that apart from a clean run.",
  "`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract` → \"4. The run cannot proceed\"",
  "**Driver gate — this file is the `mobile-mcp` variant.**",
  "**Read `<qa_driver>` before anything else.**",
  "`web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` (implemented)",
  "`mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md` (declared, not implemented)",
  "**This file declares the `mobile-mcp` value and no other**",
  "**no `base_url`**",
  "`Read`",
];
for (const f of CHECK) for (const l of LIT[f]) if (!now(A(f)).includes(l)) bad(`LITERAL ${f}: ${l.slice(0, 160)}`);
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
```

**Verification:**

- The probe's last line is `PASS` and it exits `0`. Run with no argument, it printed no `SHARED` line, no `SHARED-PENDING` line and no `UPFRONT-NOT-LOWER` line.
- Every `After` and `Δ` cell of `## Up-front word counts` is filled from that run, and every `Δ` is below `0`.
- Every path C1, C2, C3 and C3b print appears as a row of `## Scope register`.
- `git diff --name-only` lists only the story index as changed by this task.
- `git diff -- harness-runs/story_plans/chore_thin_prose_family_ui_tests_qa_story_plan.md` changes only those cells, plus at most one line under the second table.
