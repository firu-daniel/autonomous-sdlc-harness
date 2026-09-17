agents/ — genericized agent definitions
=======================================

This directory holds the harness's agent definitions: the per-layer implementers,
the plan writers and their plan reviewers, the per-unit and end-of-branch code
reviewers, the skeptic, the docs writer and reviewer, the committer, and the
interactive-test (QA) agent. Roadmap item 4 filled it. It also holds the pair the
setup command `/harness-analyze` dispatches — the conventions writer, which writes
one conventions document per dispatch, and the conventions reviewer, which works
on two axes: a document pass, dispatched once per document, reading that one
document and never re-reading it, and a corpus pass, dispatched at most twice per
run, reading the corpus against itself — the whole set on the first dispatch, a
set narrowed to what the first pass's fixes changed on the second. It returns
findings on both axes and emits a verdict on neither.

The interactive-test agent ships as THREE files keyed by the `qa.driver` config
value, but exposes ONE dispatchable name. Flows dispatch `qa-tester` by name, so a
dispatch always reaches `qa-tester.md` — the `web-playwright` variant, the only one
implemented in this release and the only file in this directory that drives a
browser. It opens with a driver gate: when `qa.driver` is not `web-playwright` it
reads no plan, drives nothing, writes no files and returns its blocked `error:`
line naming the configured driver. So a non-`web-playwright` configuration stops
loudly with a blocker instead of silently driving a browser at an application that
is not there. The other two files — `qa-tester-mobile-maestro.md` (device-runner
CLI) and `qa-tester-mobile-mcp.md` (device-automation MCP server) — are DECLARED
BUT NOT IMPLEMENTED in this release: each carries valid frontmatter, its own
allowlist, a statement of what it would drive, and a pointer to `qa-tester.md` for
the driver-neutral half of the operating contract, and each returns the same
blocked `error:` on every dispatch rather than running a test.

One convention survives packaging verbatim and belongs to this directory rather
than to any one file in it: every agent definition MUST declare a `tools:`
allowlist, and that allowlist MUST omit the browser-automation MCP tools for every
agent except the single QA agent, whose allowlist grants them explicitly. The
three-variant split does not widen that closure: `qa-tester.md` is the sole grant
in the directory, and the two mobile variants carry their own allowlists of
built-in tools only — no browser namespace now, and none when they are
implemented, since a device driver is reached through a CLI or its own separate
server namespace. This is enforced only by the per-agent allowlists — deliberately
NOT by a `permissions.deny` backstop. A global deny is evaluated before (and
overrides) any allow, and a subagent's `tools:` allowlist compiles into narrowing
deny rules in the same flattened pool rather than into overriding allow ones, so a
global deny on the browser namespaces would also revoke the QA agent's own grant.
An agent added without a `tools:` field inherits the full default tool set and
silently re-opens browser access; a review must reject it.

Why this file is README.txt and not README.md: component discovery loads every
`.md` file in this directory as an agent, so a `README.md` here is parsed as an
agent definition and fails `claude plugin validate --strict` with
"frontmatter: No frontmatter block found".


The docs-retrieval grant — one roster, one wire
-----------------------------------------------

The docs-retrieval search tool `mcp__harness-docs__search_docs` is granted to
exactly these ten agents:

  architecture-reviewer.md
  branch-reviewer.md
  business-parity-reviewer.md
  review-plan-reviewer.md
  skeptic-reviewer.md
  task-plan-reviewer.md
  task-plan-writer.md
  ui-tests-plan-reviewer.md
  ui-tests-plan-writer.md
  user-review-fix-plan-writer.md

The set is every plan writer, every plan reviewer and every end-of-branch
reviewer; the per-unit `layer-reviewer`, the implementers, the committer,
`docs-writer` and the interactive-test agents are excluded, as are
`docs-reviewer`, `statistics-plan-writer` (which writes a report, not a plan)
and the conventions pair `/harness-analyze` dispatches.

Each of those allowlists names the tool whatever the configuration, and each
contract's `<docs_retrieval>` row and bullet tell the agent to ignore it unless
`phases.docs` and `docs.retrieval` are both true. Unlike the browser tools, no
`permissions.deny` entry is involved: the unattended profile allows the tool
only when retrieval is on (`cli/templates/claude/settings.autonomous.retrieval.json`).

The server name and the tool name are a wire owned by `cli/src/retrieval/server.ts`
(`DOCS_SERVER_NAME`, `SEARCH_TOOL_NAME`). Renaming either is an edit to the ten
agent files above, that module, and the two CLI templates that carry the server
name (`cli/templates/repo/mcp.retrieval.json`,
`cli/templates/claude/settings.autonomous.retrieval.json`). Re-derive the roster
with

  grep -rln --include='*.md' "mcp__harness-docs__search_docs" plugin/agents

whose output must be exactly the ten files listed above; the `--include` keeps
this file, which names the tool, out of the result.


Sample fixture pointers — never rewrite one to make it resolve
--------------------------------------------------------------

Several agents here dereference a worked fixture under `plugin/samples/`, always
in the settled `${CLAUDE_PLUGIN_ROOT}/samples/<file>` form. Every one of those
pointers resolves today. Treat the pointer as the contract in both directions: a
reference that does not resolve means the fixture is missing, and it must NOT be
rewritten, softened or deleted to make the mismatch go away. Regenerate the
demand and check it against what ships with

  grep -rno 'samples/[A-Za-z0-9_<>/]*\.md' plugin/agents/
  find plugin/samples -type f

A name on the first list that is missing from the second is a broken pointer; a
file on the second that is missing from the first is a fixture nothing reads.

One convention rides along with those pointers and, like the allowlist rule above,
belongs to this directory rather than to any one file in it: an agent that cannot
read a cited contract, sample or instruction file REPORTS it — through its own
`error:` / blocker return, naming the path and the refusal — and produces no
artifact. A substitution is a finding, not a fallback, so no definition here may
swap another document in for a cited one or fall back on a remembered format.

Port-time corrections
---------------------

Authorized scope exception to the rule that an extraction item does not amend an
earlier item's assets, granted for one defect: the item-3 corpus at
`plugin/instructions/plan_orchestration_instructions_core.md` dispatched both
implemented-solution reviewers with a hardcoded `diff_base: main`. That breaks
`git diff` for any adopter whose `defaultBranch` is not `main` — and
`defaultBranch` is a required config key that `init` explicitly prompts about,
so a non-`main` value is a schema-valid configuration. Because the two agents
pass the value through rather than dereference it (the mode selector keys on
the PRESENCE of `diff_base`, not its value), NO edit confined to item-4 files
can close it. So the two corpus literals were parameterized to
`<default_branch>` here by explicit exception, with the matching
`## Resolved values` row added to that file, and the quoted copies in
`architecture-reviewer.md` and `business-parity-reviewer.md` moved with them in
the SAME commit so each stays byte-identical to the dispatch block its caller
actually sends. The two agents' `diff_base` key rows already read "use the
value you are given, never a remembered default" and are unchanged.

Corrected against the source: the two plan-review-mode reviewers (architecture,
business-parity) inherited a stale fix-plan index name — `<branch>_user_review_fix_plan.md`
— from their `.claude/agents/` originals. The shipped writer and the whole
instruction corpus emit `<branch>_fix_plan.md`, so the ported files use that name;
the source definitions still carry the stale one. Also `committer`: its mode
switch scoped the standard procedure to "steps 1–5" while the push in that same
procedure is step 6, so an agent reading the range literally would stop before
the only step that pushes — the step the autonomous orchestrators request with
`push: true`. The ported file states the range as "steps 1–6" everywhere it
names one (`grep -n 'steps 1–' plugin/agents/committer.md`); step 6's own
`push == true` gate leaves every other caller's behaviour unchanged, and the
`ui_test_pass` lettered procedure (its own push at step h) is untouched. The
source `committer` definition has since been corrected to the same range, so
the two sides now agree.
