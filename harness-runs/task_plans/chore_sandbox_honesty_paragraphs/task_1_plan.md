### Task 1 — Rewrite `scratch-run.sh`'s `WHAT THIS DOES NOT CONTAIN`, the scratch README's boundary paragraph and `commit-on-branch.sh`'s CS2 citation in the templates

**Goal:** The three shipped templates that tell a reader what an unattended run contains say what the sandbox now holds and what it still does not, and point at `docs/sandbox-record.md` for the rest: the scratch runner's own `# WHAT THIS DOES NOT CONTAIN.` paragraph, the scratch directory's README paragraph that cites it, and the CS2 clause of `commit-on-branch.sh`'s `# WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX.` paragraph (roadmap item 22's other site). Comments and prose only: no line of shell changes.

**Where this layer stops.** This task edits the three **templates** under `cli/templates/`. Their self-adopted copies — `scripts/scratch-run.sh`, `scripts/commit-on-branch.sh` and `harness-runs/scratch/README.md` — are **Task 5's**, which applies exactly the edits made here so each copy stays byte-identical to its template. Roadmap item 22's row in `docs/development.md` is **Task 11's**.

**What the record says, for these readers** (`docs/sandbox-record.md`; restate no more than this):

- §1: the sandbox holds every Bash command and every process it starts. A probe run through `scratch-run.sh` is such a process. The file tools, hooks, local MCP servers, plugin monitors, LSP servers, the status line and `apiKeyHelper` run outside it.
- §4, the `scratch` leg: SR1 and SR2 **pass** on macOS and in the Linux container — the runner runs the probe, and a write from inside the probe outside the sandbox's write roots (`$HOME`) was refused.
- §2: four excluded scripts run outside it, `commit-on-branch.sh` among them; CS2 (`<main>/.git` refused as a whole to a sandboxed command) is **pass**.
- The profile's `deny` floor, its `ask` list and the guard's `DENY_SCRIPT_BASENAMES` still bind only a command string; inside the sandbox's write roots a probe still reaches what they withhold. No row re-drives `docs/outer-loop-verification.md` §3's probe deletion under the sandbox.
- With `sandbox.optOut` taken, nothing is sandboxed. Supervised sessions are out of this branch's scope: say nothing about them.

### Targets

- `cli/templates/scripts/scratch-run.sh` — the comment paragraph headed `# WHAT THIS DOES NOT CONTAIN.`.
- `cli/templates/state-dir/scratch/README.md` — the paragraph opening *"Two boundaries an agent does not cross."*.
- `cli/templates/scripts/commit-on-branch.sh` — the comment paragraph headed `# WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX.`.

**Work:**

- [ ] **`scratch-run.sh` → `# WHAT THIS DOES NOT CONTAIN.`** Keep the heading line byte-identical (it is quoted by the scratch README, `docs/watcher.md` and `cli/test/outer-loop-scripts.test.mjs`) and keep its first claim: the runner fences **which file runs** and nothing the file does. Rewrite the rest, in a few comment lines, to state: under the unattended profile the file runs as a Bash process inside Claude Code's sandbox, so it is held to the sandbox's write roots, network allowlist and credential denies (a write outside the roots from a probe was refused: `docs/sandbox-record.md §4`, the `scratch` leg, SR2); inside those it still reaches everything the `deny` floor, the `ask` list and `DENY_SCRIPT_BASENAMES` withhold from a command string, which is why the file/string distinction is not a capability boundary; with `sandbox.optOut` taken the sandbox holds nothing; the `pre-push` hook remains the layer that holds for a push git performs, as the whiteboard's protected-branch bullet ranks it; the two narrower mitigations (the gitignored directory and the reverted mutation check) stay named as what they are. Close with the pointer: what the sandbox contains, leaves outside and was measured to hold is `docs/sandbox-record.md §1`, and its residuals `docs/sandbox-record.md §6`. Leave the later paragraph *"THE ONE EXTENSION THIS TABLE OMITS ON PURPOSE IS `.sh`"*, which cites this heading, unchanged.
- [ ] **`state-dir/scratch/README.md`, the *"Two boundaries an agent does not cross."* paragraph.** Keep the two boundaries (a probe lives here and nowhere else; a mutation check is reverted before the task's own verification runs) and their reasons word for word. Rewrite only its containment sentences — the opening *"They are rules for the agent rather than a containment claim …"* and the closing *"What a file run from here reaches follows from that fence: …"* — to say: the runner's fence is over which file runs; in an unattended run the file runs inside the sandbox, held to its write roots and network allowlist, and inside them reaches what the permission surfaces withhold from a command string; the `pre-push` hook still holds; and link the harness's `docs/sandbox-record.md` §1 beside the existing citation of `docs/outer-loop-verification.md` §3, *What that `allow` reaches*. The file carries no `{{…}}` token; add none.
- [ ] **`commit-on-branch.sh` → `# WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX.`** Replace *"the whole-`.git` deny itself is row CS2, owed"* with the verdict: *"the whole-`.git` deny itself is row CS2, pass"*, keeping the `docs/sandbox-verification.md -> CL4` citation form of the surrounding comment. Change no other byte of the paragraph.

**Verification:**

- `git diff -- cli/templates/scripts/scratch-run.sh cli/templates/scripts/commit-on-branch.sh` shows only lines beginning `#`: no shell statement changed.
- `git grep -n -F "# WHAT THIS DOES NOT CONTAIN." -- cli/templates/scripts/scratch-run.sh` still finds the heading, and `git grep -n -F "WHAT THIS DOES NOT CONTAIN" -- cli/templates/state-dir/scratch/README.md docs/watcher.md cli/test/outer-loop-scripts.test.mjs` still finds each quoting site unchanged.
- `git grep -n -F "docs/sandbox-record.md" -- cli/templates/scripts/scratch-run.sh cli/templates/state-dir/scratch/README.md` finds the new pointer in both files.
- `git grep -n -F "CS2, owed" -- cli/templates/scripts/commit-on-branch.sh` finds nothing.
- Re-run the story index's derivation entry A over these three files and confirm every hit is a register row.
- Re-read each verdict written (SR2, CS2) against its row in `docs/sandbox-verification.md`; none is stated more strongly than the row records.
