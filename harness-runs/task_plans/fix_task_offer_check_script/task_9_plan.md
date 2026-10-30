### Task 9 — Record the worked example's `.claude/` paste and update its README's re-render record

**Goal:** `examples/notes-app/` is owed the rendered artifacts of every token-carrying template this branch changed (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*): item 4 of its `.claude/CLAUDE.md`, its `.claude/settings.json`, and its `.claude/settings.autonomous.json`, whose write protection gains the new script. This task records the exact paste for those three files, checked against a fresh fixture render, and brings the README's record of that profile's re-renders and `/workspace` counts up to the post-paste state.

**Depends on:** Task 1 — the outer-loop row for `task-offer-check.sh` (top-level, `agentInvocable: false`), which makes `cli/src/generators/writeProtection.ts` → `protectedPaths` emit, for the main checkout's `<scriptsDir>/task-offer-check.sh`, a `file`-kind entry with the reason *"the run watcher, the remote job or a person runs the main checkout's task-offer-check.sh outside the sandbox"*, placed after the `remote-run.sh` entry and before `<scriptsDir>/lib`; so the profile gains one `sandbox.filesystem.denyWrite` entry, one `Edit(/<path>)` deny rule and one clause in the write-protection `_README` line, and no allow entry. Task 2 — item 4 renders `bash scripts/task-offer-check.sh` for this example's `scriptsDir` `scripts`. Task 3 — `.claude/settings.json` gains `"permissions": { "allow": ["Bash(bash scripts/task-offer-check.sh)"] }` after its two existing keys.

**Why no `.claude/` write is attempted.** As for every `.claude/**` path: the tool layer refuses the write ahead of any permission entry and an attempt can park the run. This task writes nothing under `examples/notes-app/.claude/`; the maintainer applies the paste (story index → **Manual setup required**). The example's outer-loop scripts are an omitted family (its README's keep rule), so no `scripts/task-offer-check.sh` is added there, and its `.claude/harness-task-offer.md` needs nothing: that template is unchanged. The frozen capture's prose is not edited: item 4 is init-rendered template text, not analyze-written prose, and only item 4 changes, as #214 did.

### Targets

- `examples/notes-app/README.md` → the paragraph *"**The one edit the kept artifacts carry, and where it landed.**"*: its *"A later re-render of …"* sentences and the `/workspace` counts after them
- This file → a `## Paste record` section appended at its end

**Work:**

- [ ] **The fresh fixture render.** Through `bash scripts/scratch-run.sh harness-runs/scratch/<name>.sh`, render a fixture under the system temp root as Task 2 and Task 3 have made `init` render it: `git init` with a fixture identity, then the built CLI's `init --non-interactive --no-analyze --qa --scripts-dir scripts` by this checkout's absolute `cli/dist/cli.js`; print item **4. Opt-out.**, `.claude/settings.json`, and from `.claude/settings.autonomous.json` the `denyWrite` and `permissions.deny` entries naming `task-offer-check.sh` with their neighbours on each side and the write-protection `_README` line; remove the temporary directory on exit. If the call is refused or the CLI is not built, record *render not checked* for each span and carry the check into the Manual setup line.
- [ ] **The paste record.** Append `## Paste record` to this file, each span in a fenced block, with the three substitution clauses of the example's README applied to every fixture path (the fixture root → `/workspace/notes-app`, its parent → `/workspace`): (1) the replacement for the item-4 line of `examples/notes-app/.claude/CLAUDE.md`; (2) the whole intended `examples/notes-app/.claude/settings.json` — its two current keys unchanged, then `permissions`; (3) for `examples/notes-app/.claude/settings.autonomous.json`, the new `denyWrite` entry and the new `Edit(//workspace/notes-app/scripts/task-offer-check.sh)` deny rule, each with the existing line it goes after (the `remote-run.sh` one), and the new `_README` clause with the clause it goes after. State, per span, whether it compared byte-identical to the fixture after substitution.
- [ ] **The README.** Copy `examples/notes-app/.claude/settings.autonomous.json` to `harness-runs/scratch/`, apply span (3) to the copy, and run the README's own count commands on it (`grep -o '/workspace' <copy> | wc -l`, `grep -c '/workspace' <copy>`, and the three breakdown greps the paragraph names). Then extend the paragraph's chain with one sentence in its form — *A later re-render of the write-protection entries, through the same three clauses, added the main checkout's `scripts/task-offer-check.sh` to `denyWrite`, the `Edit` deny rules and the write-protection `_README` line, and changed no other entry* — and replace each figure that follows with the copy's measured value. Add a fenced block holding the count commands, one per line, so the maintainer can re-run them on the real file after the paste.

**Verification:**

- `git status --short -- examples/notes-app/.claude` prints nothing: this task wrote nothing under `.claude/`.
- Every figure in the edited README paragraph equals what the stated command printed on the scratch copy with span (3) applied, and the paste record says so.
- `git diff --name-only <base> -- examples` lists only `examples/notes-app/README.md` (`<base>` from a bare `git merge-base HEAD origin/dev`).

- **Deviations from plan:** The render probe is `harness-runs/scratch/task9-fixture-render.mjs`, not a `.sh`: `scripts/scratch-run.sh` refuses the `.sh` extension. It ran `git init` with a fixture identity and `node <checkout>/cli/dist/cli.js init --non-interactive --no-analyze --qa --scripts-dir scripts` in `<tmpdir>/task9-fixture-XXXX/notes-app` (basename `notes-app`, so the derived project name and sibling glob match the example), and removed the temporary directory on exit. `cli/dist` was newer than every `cli/src` and `cli/templates` file (`find … -newer cli/dist/cli.js` printed nothing).

## Paste record

Reader: the maintainer applying the paste under `examples/notes-app/.claude/` (story index → **Manual setup required**). Every span below is the fresh fixture render after the README's three clauses (fixture root → `/workspace/notes-app`, its parent → `/workspace`, home directory → `/workspace`; the account name did not occur: the probe's leftover-user count was 0 for both files).

### (1) `examples/notes-app/.claude/CLAUDE.md` — replace the line starting `4. **Opt-out.**` with

```markdown
4. **Opt-out.** `.claude/harness-no-offer` does not exist at the **main checkout's** root — the checkout you are running in may be a linked worktree or a run copy (a clone) of it, and the marker is written once for all of them. Run `bash scripts/task-offer-check.sh` — bare, with no argument, from the root of the checkout you are running in — rather than reading anything. It prints the main checkout and exits 0 **only** when it found one and found no marker there, and that is the one outcome on which the offer proceeds; any other outcome is silence — a non-zero exit, no output, the command declined, or the script not there. Presence-only: never read, parse or act on anything inside it — a read of a path outside this session's own root can raise a permission prompt mid-fence, while the test's non-zero exit is a clean answer. The file is normally absent, and absent means only *not opted out*; a check you cannot make — the command declined, the repository not a git one, no output — is silence too, never a remark to the user about a file they never created.
```

Compared: byte-identical to the fixture's item-4 line (it is that line; the fixture carries exactly one). The example's current item-4 line differs from it, as expected before the paste.

### (2) `examples/notes-app/.claude/settings.json` — the whole intended file

```json
{
  "enabledPlugins": {
    "autonomous-sdlc-harness@autonomous-sdlc-harness": true
  },
  "extraKnownMarketplaces": {
    "autonomous-sdlc-harness": {
      "source": {
        "source": "github",
        "repo": "firu-daniel/autonomous-sdlc-harness"
      }
    }
  },
  "permissions": {
    "allow": [
      "Bash(bash scripts/task-offer-check.sh)"
    ]
  }
}
```

Compared: the example's two current keys unchanged, then the fixture's `permissions`, serialised with two-space indent and a trailing newline — byte-identical to the fixture's whole `.claude/settings.json` after substitution (probe: `span2 === fixture settings.json after subst: true`).

### (3) `examples/notes-app/.claude/settings.autonomous.json` — three insertions

`sandbox.filesystem.denyWrite`, after the existing line `"/workspace/notes-app/scripts/remote-run.sh",` insert:

```json
        "/workspace/notes-app/scripts/task-offer-check.sh",
```

`permissions.deny`, after the existing line `"Edit(//workspace/notes-app/scripts/remote-run.sh)",` insert:

```json
      "Edit(//workspace/notes-app/scripts/task-offer-check.sh)",
```

In the `_README` line starting `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT:`, after the clause `/workspace/notes-app/scripts/remote-run.sh - the run watcher, the remote job or a person runs the main checkout's remote-run.sh outside the sandbox;` insert, followed by one space:

```text
/workspace/notes-app/scripts/task-offer-check.sh - the run watcher, the remote job or a person runs the main checkout's task-offer-check.sh outside the sandbox;
```

Compared: each inserted entry and clause is byte-identical to the fixture's after substitution, and in the fixture each sits directly after the same `remote-run.sh` neighbour and directly before the `scripts/lib` one (`/workspace/notes-app/scripts/lib`, `Edit(//workspace/notes-app/scripts/lib/**)`, the `scripts/lib - the unsandboxed wrappers source their run library from it` clause). Each anchor occurs exactly once in the example (probe: `anchor hits in example: denyWrite=1 deny=1`; README anchor clause found). The fixture adds no `allow` entry naming the script (probe: `allow entries naming task-offer-check: 0`). The patched copy `harness-runs/scratch/task9-settings.autonomous.json` parses (`jq .` exit 0) and differs from the example by exactly these three lines (`git diff --no-index --stat`: 3 insertions, 1 deletion — the `_README` line rewritten).

The whole patched copy is **not** byte-identical to the whole fixture profile, for two differences outside this branch's spans, recorded and not pasted: the fixture lists `scripts/run-analytics.sh` in `denyWrite` and `Edit` deny and its `_README` clause, which the example lacks (the entry predates this branch: `git log -S run-analytics.sh` on `cli/src/generators/outerLoopScripts.ts` → `c573db24 feat: run analytics (#176)`); and the example carries six `typecheck.sh` / `test.sh` / `start-dev-server.sh` `Bash` allow rows the fixture lacks, because the fixture has no configured commands.

### README counts — measured on the patched copy

| Command (on `harness-runs/scratch/task9-settings.autonomous.json`) | Printed | Before the paste (current example) |
|---|---|---|
| `grep -o '/workspace' <copy> \| wc -l` | 166 | 163 (measured) |
| `grep -c '/workspace' <copy>` | 126 | 124 (README's prior figure) |
| `grep -o '/workspace/notes-app' <copy> \| wc -l` | 135 | 132 (README's prior figure) |
| `grep -o '/workspace/notes-app-\*' <copy> \| wc -l` | 36 | 36 |
| `grep -o '/workspace/\.' <copy> \| wc -l` | 30 | 30 |
| `grep -o '/workspace\($\|[^/]\)' <copy> \| wc -l` | 1 | 1 |

Every figure in the edited `examples/notes-app/README.md` paragraph is the "Printed" column. The six commands are in a fenced block in that paragraph, phrased against `.claude/settings.autonomous.json`, for the maintainer to re-run after the paste; until the paste lands, the README states the post-paste counts.
