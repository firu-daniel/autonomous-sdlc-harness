`ROADMAP.md` → `## Quality and testing` → the `Line-number citations never block` row is
the item this branch closes (*"Review findings anchor on symbols; a stale line number in a citation is no
longer a blocking finding."*). When the branch lands, flip that row to `Done` and take the entry out of
`## Index`, renumbering the rest.

> ⚠️ **Locate every anchor in this prompt by quoted text or heading, never by line number.** That is the
> subject of this branch, and none of the quotes below carry one on purpose.

> ⚠️ **This branch edits the definitions its own reviewers load.** Agent definitions load at session start,
> so this run's reviewers still obey the old contract. Write the rules; let the next run be the first to obey
> them.

---

## Why the item is only half done

The item has been built in three steps. The first two landed before this repository was split out of the
product repo it was developed in, so `git log` here does not show them (it starts at `Initial commit`). What
follows was checked against the current tree.

### Done — step 1: the docs catalog is symbol-anchored

A durable document may no longer carry a line number in any form.

- `plugin/agents/docs-writer.md` → rule 5 *"Never invent"* requires a symbol anchor, `path` (`symbolName`),
  and survey mode no longer treats *"a coordinate refresh"* as a reason to touch a document.
- `plugin/agents/docs-reviewer.md` → check 2 *"No exact line numbers"* lists the evasion forms, and check 1
  *"Every cited anchor resolves — both halves"* checks that the path exists **and** that the symbol is in it.
- `plugin/agents/conventions-writer.md` (*"An exact line number must never be written into the document"*)
  and `plugin/agents/conventions-reviewer.md` (check 8 *"No line coordinate anywhere in the document"*) apply
  the same rule to conventions documents.
- `.claude/context/plugin.md` states it for this repository's own plugin corpus (*"A symbol anchor, a heading
  or a short quoted substring — never an exact line number, in any shape."*).

### Done — step 2: the severity split and a lifetime rule for citations

- `branch-reviewer`, `skeptic-reviewer` and `layer-reviewer` each carry the same two severity clauses and a
  `**Guard carve-out.**`:
  - **Should Fix:** *"a line coordinate written into a durable artifact — anything read after the round that
    produced it — stale or not, repaired by replacing it with a symbol anchor."*
  - **Nice to Have:** *"a stale line coordinate whose cited file exists, in a point-in-time artifact (a review,
    a plan, a QA report — consumed within its own round)."*
  - **Carve-out:** *"Pointer resolution binds a pointer whose target does not exist; a stale line coordinate
    in a point-in-time artifact is gradable however it is enumerated, including where it is enumerated as a
    `<state_dir>/lessons.md` entry."* So a dead pointer is still Must Fix, and a shifted line is not.
- `plugin/agents/layer-implementer.md` → the paragraph starting *"New citations you write name a symbol,
  heading or quoted substring, never a line number"* sets the line by how long an artifact lives. Durable
  artifacts (instructions, agent definitions, catalog documents, standing tracked artifacts, **code comments**)
  carry no coordinate. A point-in-time artifact *"keeps the `<file>:<line>` its own contract requires"*.
- `plugin/agents/task-plan-reviewer.md` → the `## Scope register` bullet *"a row's `Site` cell cites a path
  plus symbol or quoted anchor, never a line coordinate"* makes a breach Should Fix, not Must Fix.

### Left — step 3: the finding contracts still *require* a line number, and not every reviewer has the carve-out

Step 2 treated a review finding as point-in-time: read once, in its own round. **The fix loop proves that
wrong.** Later runs recorded it twice after step 2 shipped:

- **Group C ledger-truth fix run:** all seven code-review findings and one skeptic finding targeted the same
  instruction file and cited it by `:NNN`. Each fix that landed shifted the lines the next finding cited. Five
  of the ten fix dispatches carried an orchestrator note that existed only to correct coordinates, and the
  implementers ended up working from headings and quoted text anyway.
- **Interactive task-offer run:** one fix turned a comment line into two, and two findings still open in the
  same loop now pointed at the wrong lines. Both were later resolved by symbol. The observation says it
  plainly: *"review findings are equally durable for the length of the loop and are not covered."*

The contracts still work against the goal. On the unactionable-finding-deadlock run, a meta-reviewer raised
the Should Fix *"Finding 1's file reference carries no line coordinate"* — it asked a finding to **add** the
very coordinate this item is removing. The product repo's suggestions ledger still has the parent entry open:
*"Stale `file:NNN` anchors in plan, review and finding artifacts and in code comments … extend the
symbol-anchor convention to them."*

---

## What to deliver

**A per-finding file, a fix-plan finding and a reviewer's findings file anchor on a symbol, a heading or a
quoted substring. No reviewer's verdict turns on a line number being right.** A line number may still appear
next to an anchor as a navigation hint, but nothing may depend on it being current.

### 1. Rewrite the contracts that require `<file>:<line>`

Find them with a grep, not from this list. The known sites are:

- the per-finding shape `[<file>:<line>](<file>#L<line>)`, required in `branch-reviewer.md`,
  `skeptic-reviewer.md`, `architecture-reviewer.md`, `business-parity-reviewer.md` and
  `user-review-fix-plan-writer.md`, and in `layer-reviewer.md`'s findings template
  (`1. **<title>** — [`<file>:<line>`](<file>#L<line>)`);
- `review-plan-reviewer.md` → the per-finding check: *"a finding file that only restates the title or omits
  the file-and-line reference or the fix is a Must Fix"*. This is the check that currently **blocks** a
  finding for having no line number;
- `plugin/instructions/unit_loop_core.md` → substitution row `UR-A` (*"self-contained: file:line, the full
  problem description and the concrete fix"*);
- `plugin/instructions/user_review_fixes_instructions.md` and `…_core.md` (*"cites file:line"*);
- `plugin/instructions/plan_orchestration_instructions.md` (*"include relevant line numbers if known"*);
- `plugin/agents/task-plan-writer.md` → step 2, which asks for `<reference_impl>` citations with line ranges
  (*"`<reference_impl>/<path/to/source_file>:142-178`"*), and `task-plan-reviewer.md` → step 3 (*"the line
  range supports the claim"*). The reference tree does not change during a run, so decide whether this site
  is in scope and record the call either way.

`user-review-fix-plan-writer.md`'s **reading** side (*"File and line (e.g., "`<file>:<line>` ...") → read the
file directly"*) is the user's own input format. A user may still type a line number. Keep that input
accepted, and make sure the writer turns it into an anchor before a finding file stores it.

### 2. Give every grading reviewer the carve-out

Only three reviewers have it today. Check every agent that grades or returns `verdict: FAIL`:
`architecture-reviewer`, `business-parity-reviewer`, `review-plan-reviewer`, `task-plan-reviewer`,
`ui-tests-plan-reviewer`, `docs-reviewer`, `conventions-reviewer`. For each one, find out whether a stale or
missing line coordinate can reach Must Fix or FAIL through any clause — a *"does not resolve"* trigger, a
*"not downgradable"* guard, a *"required field missing"* format check, or a `lessons.md` entry. Close each
route you find. Some reviewers may have no route at all; report that as a finding for that reviewer. Do not
add a clause it does not need.

`docs-reviewer` is **binary** (`PASS` / `FAIL`, with no severity bands). Its check 2 bans line numbers in a
durable document, and that ban stays. Decide how the ban meets "never blocks": is a coordinate left in a
catalog document a `FAIL`, or a correction that does not fail the review? Record the call in the plan.

### 3. Settle how long a finding lives

Step 2's wording, *"point-in-time artifact (a review, a plan, a QA report — consumed within its own round)"*,
is what the two observations above disprove. After this branch, the three severity clauses and the
`layer-implementer` lifetime paragraph must agree on where a per-finding file sits. The plan must choose
one of these:

- move findings into the durable class;
- keep the two classes and add a rule that nothing in either may depend on a line number;
- collapse the split.

Whichever it chooses, say what happens to *"keeps the `<file>:<line>` its own contract requires"* in
`layer-implementer.md`, which currently names this very contract.

## Binding constraints

- **A dead pointer still blocks.** A cited path that does not exist, a symbol that no longer resolves in the
  cited file, a routing row naming an absent agent, a readiness entry with no `finding_<K>.md` — each stays
  Must Fix. Show one example of each against the new wording.
- **The fix loop's self-containment holds.** A per-finding file stays self-contained: an implementer who reads
  only that file can still find the site and apply the fix. An anchor must be precise enough for that. A
  bare path to a large file is not. Define what counts as enough, such as a symbol plus a quoted substring
  when the symbol is long.
- **Wire strings are edited everywhere they are quoted.** The phrase `file-and-line reference` and the
  `**File:**` / `**Where:**` line labels may be quoted by callers, samples, `plugin/agents/README.txt` and
  tests. Grep for every quoter before renaming one, per `CLAUDE.md` on literals carried across files.
- **The house rule on prose volume binds.** One declarative clause beats a paragraph, and a reason belongs in
  the plan rather than the definition. Where the same clause is carried by several reviewers, it is
  byte-identical in each.

## Ripple to establish, not to assume

- `plugin/samples/sample_code_review/finding_*.md` and each sample's header note, which currently explains
  that *"in a real code review it is the markdown link form `[<file>:<line>](<file>#L<line>)`"*. The same goes
  for any other sample that shows a finding shape (user-review fix plan, architecture review).
- `examples/notes-app/sdlc-harness/` finding files, which use `**Where:** [src/…:NN](…#LNN)`.
  `examples/notes-app/README.md` says what is a captured run and what may be edited. A captured run is
  evidence, so decide whether it is left as recorded, and state the decision.
- `docs/`, `README.md` and `ARCHITECTURE.md`, anywhere they describe a finding's shape.
- `plugin/instructions/improvement_observations_instructions.md` → the `convention` category example
  (*"line-number coordinates in a maintained doc … (the case that prompted this channel)"*). It may still be
  accurate. Check it.
- `cli/templates/` and `cli/test/`: whether any template or test pins the old shape. *"No change there"* is a
  legitimate finding, but state it as one.

## Out of scope

- **A mechanical anchor-resolvability check** — a script or gate that greps every cited `path` (`symbol`) and
  fails when one stops resolving. That is roadmap item `Citation groundedness gate`, a separate branch. This
  branch changes what the contracts require and how reviewers grade. It adds no detector.
- The wider question of whether the reviewers' "not downgradable" guards are too blunt in general. Close the
  coordinate routes and nothing else.

## Acceptance

1. `grep -rn '<file>:<line>\|file:line\|#L<line>' plugin` finds no site that *requires* a coordinate. Each
   surviving hit is a user-input format, a navigation hint explicitly marked non-binding, or a ban, and the
   plan lists every one of them with its justification.
2. For each grading reviewer in §2, the plan quotes the clause that stops a stale or missing coordinate from
   reaching Must Fix or FAIL, or states that the reviewer had no such route.
3. The dead-pointer examples under **Binding constraints** each still grade Must Fix.
4. `claude plugin validate --strict plugin` and `claude plugin validate --strict .` print `✔ Validation
   passed`. Judge on the printed text, not the exit status.
5. If any `cli/` file changes, `npm run build` and `npm test` pass from the repository root.
6. `ROADMAP.md`: the row reads `Done`, and the index no longer lists the item.
