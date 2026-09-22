### 4. A third `${HARNESS_AGENT_CLI:-claude}` read site, outside the inventory's derivation scope

**Severity: Should Fix — non-blocking.** Recorded because it is a coupling-inventory gap, not because
anything ships wrong.

**Site.** `evals/docs-retrieval/arm-a/run-arm-a.sh`, the header block paragraph headed *"THE AGENT BINARY
IS REACHED THROUGH `${HARNESS_AGENT_CLI:-claude}`"* and the assignment `AGENT_CLI="${HARNESS_AGENT_CLI:-claude}"`
in the body.

**What the inventory claims.** `ARCHITECTURE.md` → `## 4. Two axes: which runtime, and which model` states
the variable is *"resolved once per script and read in **two shipped scripts**"* — `autonomous-watcher.sh`
and `restart-watcher.sh` — and `## 5. Where the engine is reached — the launch path` states a covering
property over its own derivation command: *"every site it reaches is a row below, or is named here as owned
by another section. If it reaches a site no row covers, the table is wrong and takes a new row; narrowing
the command until it matches the table is the failure this invariant exists to catch."*

**Why this is not a Must Fix.** The script's own citation verifies: §4 does record the variable as the place
the engine binary is chosen, and §5 does inventory its read sites, so the header's claim is true. §4's
count is qualified as *shipped* scripts, and `run-arm-a.sh` is not shipped — `cli/package.json`'s `files`
field is `["dist","scripts","templates","README.md","LICENSE","NOTICE"]`, and nothing under `evals/`
reaches a published tarball or an adopting repository. And §5's derivation command is explicitly scoped to
`cli/templates/scripts/ cli/src/`, which this file sits outside. So no sentence in `ARCHITECTURE.md` is
falsified by the new file. This was also raised in plan review and recorded as rejected in the story index
(*"Should Fix 3 … the reviewer's own round-3 verification narrowed the exposure to a re-derivation blind
spot with `ARCHITECTURE.md` §4 staying literally true"*); this entry re-records the narrowed exposure
against the landed code rather than re-litigating it.

**The residual exposure.** A maintainer re-deriving the engine coupling will now get a different answer
depending on whether they run §5's scoped command or grep the tree: the tree has three read sites and the
scoped command reaches two. §5's covering property protects the table against sites *the command reaches*;
it says nothing about a site the command's scope excludes, which is the blind spot.

**The fix, if the orchestrator schedules it.** One sentence, in `ARCHITECTURE.md` → `## 5`, in the same
place that already disposes of two files by sentence rather than by row — *"Two of the files it reaches are
dispositioned in this sentence rather than given rows"* — naming `evals/docs-retrieval/arm-a/run-arm-a.sh`
as a hand-run eval harness outside the scoped derivation, not a shipped script, and therefore outside the
table by scope rather than by oversight. No row, no schema change, no code change. Alternatively, the same
disposition may be recorded in `evals/docs-retrieval/README.md`'s `arm-a/run-arm-a.sh` row; the
`ARCHITECTURE.md` placement is preferred, because that is where a reader re-deriving the coupling is
standing.
