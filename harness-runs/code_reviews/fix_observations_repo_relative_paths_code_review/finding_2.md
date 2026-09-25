### 2. "A re-entry that appends nothing yields exit 3" is no longer true once the check rewrites a path in an earlier block

**File:** `plugin/instructions/improvement_observations_instructions.md`. Three sites:

- `## Ledger / resume`: "A re-entry that appends nothing — the normal case, the freely-observed class being unrecallable and the trip-wire class already present — writes no file change and yields wrapper **exit 3**"
- `## Where it is written` → **A resumed run is not a later round, and it does not re-observe.**: "A write that adds nothing leaves the file byte-unchanged and yields wrapper **exit 3**"
- `## Surfacing it in the Done summary`: "**Exit 3 means this session appended nothing** (any append changes the file and commits at exit 0)"

This branch adds the **Machine-path check — before every wrapper call.** paragraph. It checks the **whole** file and rewrites a hit "in an earlier block too". It also amends **A later round of the same branch appends — it never overwrites.** to sanction that touch. So a re-entry, or a later round, that appends nothing can still change the file. An earlier block may hold a machine path because it was committed before this rule existed, or because an earlier round's check could not run and that round went on to the wrapper, as the check allows. The wrapper then commits at **exit 0**. The three sentences above still say the file is byte-unchanged and exit 3 follows, and the Surfacing parenthetical invites the converse, "exit 0 means this session appended". An orchestrator reading these sentences expects exit 3 and gets 0. It can then take the commit as new observations and emit the `📋 <N> improvement observation(s) logged` bullet for a session that logged none. The bullet is keyed on what was written, so the text as a whole can still be followed correctly. The three claims are wrong, though, and this branch made them wrong.

**Fix:**

- [ ] In `## Ledger / resume`, directly after the sentence ending "…yields wrapper **exit 3** (nothing to commit, and the unconditional push is then a harmless no-op); a re-entry that appends a genuinely new observation commits normally at exit 0.", insert:

  "The one exception is a re-entry whose machine-path check rewrote a path in an earlier block (`## Commit mechanics` → **Machine-path check — before every wrapper call.**): the file changed, so the wrapper commits at exit 0, and that commit carries no observation of this session's."

- [ ] In `## Where it is written` → **A resumed run is not a later round, and it does not re-observe.**, change "A write that adds nothing leaves the file byte-unchanged and yields wrapper **exit 3** (see `## Commit mechanics`) — a normal outcome, not an error." to:

  "A write that adds nothing leaves the file byte-unchanged and yields wrapper **exit 3** (see `## Commit mechanics`) — a normal outcome, not an error — unless the machine-path check rewrote an earlier block, which commits at exit 0 (`## Ledger / resume`)."

- [ ] In `## Surfacing it in the Done summary`, change "(any append changes the file and commits at exit 0)" to:

  "(any append changes the file and commits at exit 0 — but exit 0 alone does not mean this session appended, because a machine-path rewrite of an earlier block commits at exit 0 too; the bullet counts what this session appended, never the exit code)"
