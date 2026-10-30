### Task 8 — Self-adopt the script under `scripts/` and record the root `.claude/` paste

**Goal:** This repository, which has adopted its own harness, carries the new script in its own `scripts/`, and the maintainer has an exact, render-checked paste for the two root `.claude/` files the template change reaches: item 4 of `.claude/CLAUDE.md` and `.claude/settings.json`.

**Depends on:** Task 1 — `cli/templates/scripts/task-offer-check.sh`, which `init` copies verbatim into `<scriptsDir>` with mode `0755`. Task 2 — the template's item 4, rendered with `{{taskOfferCheckCommand}}` = `bash <scriptsDir>/task-offer-check.sh` (`scripts` here). Task 3 — `init` merges `"permissions": { "allow": ["Bash(bash scripts/task-offer-check.sh)"] }` into an existing `.claude/settings.json` that has no `permissions`, after its existing keys.

**Why no `.claude/` write is attempted.** The tool layer refuses an agent's write under `.claude/**` ahead of any permission entry, and an attempted write there can park the run instead of failing it. So this task never edits, creates or runs a command that writes a file under `.claude/` — including `init` aimed at this repository, which would also regenerate the analyze-filled `.claude/CLAUDE.md` wholesale. The maintainer applies the paste recorded below (story index → **Manual setup required**). `.claude/harness-task-offer.md` needs no paste: its template is unchanged.

### Targets

- `scripts/task-offer-check.sh` (new; this repository's self-adopted copy)
- This file → a `## Paste record` section appended at its end

**Work:**

- [ ] **The script copy.** Write `scripts/task-offer-check.sh` byte-for-byte from `cli/templates/scripts/task-offer-check.sh` and give it mode `0755` — the verbatim copy `init` itself makes for an outer-loop script. Touch nothing else under `scripts/`.
- [ ] **The fresh fixture render.** Write a scratch script under `harness-runs/scratch/` and run it through `bash scripts/scratch-run.sh harness-runs/scratch/<name>.sh`. It makes a directory under the system temp root, `git init`s it with a fixture identity, runs the built CLI's `init --non-interactive --no-analyze --scripts-dir scripts` there (by the absolute path of this checkout's `cli/dist/cli.js`), prints that fixture's item **4. Opt-out.** line of `.claude/CLAUDE.md` and its `.claude/settings.json`, and removes the temporary directory on exit. If the call is refused or the CLI is not built, record that in the paste record as *render not checked* and carry the check into the Manual setup line rather than guessing.
- [ ] **The paste record.** Append `## Paste record` to this file with: (1) the replacement for the single line that is item 4 in this repository's `.claude/CLAUDE.md`, as a fenced block, byte-identical to the fixture's item 4 line (item 4 renders no `{{pluginName}}` and no `{{projectName}}`, so nothing in it differs between this repository and the fixture — say so, and say whether the fixture line and the template-derived line compared equal); (2) the whole intended `.claude/settings.json`, as a fenced block: this repository's two current keys unchanged, followed by the `permissions` key exactly as the fixture's file carries it; (3) one fenced command per line the maintainer runs afterwards to confirm the paste — a `git diff -- .claude/CLAUDE.md` that shows only item 4 changed, and a `grep -c -F 'Bash(bash scripts/task-offer-check.sh)' .claude/settings.json` that reports one occurrence.

**Verification:**

- `cmp cli/templates/scripts/task-offer-check.sh scripts/task-offer-check.sh` exits 0, and `test -x scripts/task-offer-check.sh` exits 0.
- `git diff --name-only <base> -- scripts` lists only `scripts/task-offer-check.sh` (`<base>` from a bare `git merge-base HEAD origin/dev`): no other self-adopted script, and not `scripts/lib/harness-run-lib.sh`, changed.
- `git status --short -- .claude` prints nothing: this task wrote nothing under `.claude/`.
- The paste record states for each span whether it was checked against the fixture render, and for every checked span that the two compared byte-identical.

**Deviations from plan:**

- The fixture render ran as `harness-runs/scratch/task8-fixture-render.mjs` (Node) rather than a `.sh` file: `scripts/scratch-run.sh` takes its interpreter from the extension and the implementer contract never runs a `.sh` through it. Run as `bash scripts/scratch-run.sh harness-runs/scratch/task8-fixture-render.mjs`, against `cli/dist/cli.js` (which already carried `taskOfferCheckCommand` in `generators/claudeContext.js` and `generators/projectSettings.js`; `bash scripts/typecheck.sh` rebuilt it afterwards and printed `PASS: typecheck`).
- **Evidence downgrade — mode `0755` not applied.** `chmod 755 scripts/task-offer-check.sh` and `cp` were both refused by the session's permission layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The copy was written with the file tools; `cmp cli/templates/scripts/task-offer-check.sh scripts/task-offer-check.sh` exited 0, but `ls -l` shows `-rw-r--r--`, so the **`test -x` verification bullet is not met** (a bare `test -x` call printed nothing, contradicting `ls -l`; the mode from `ls -l` is what this note rests on). Every other self-adopted script is tracked `100755` (`git ls-files -s scripts/scratch-run.sh scripts/typecheck.sh scripts/refresh-branch.sh`). Remedy: `chmod 755 scripts/task-offer-check.sh` before the commit stages the file.
- `git diff --name-only ef7e35be8f98893cdd72d715dd8018009b121fb5 -- scripts` printed nothing because the new file is untracked; `git status --short -- .claude scripts` printed only `?? scripts/task-offer-check.sh`, and `git diff --stat -- .claude` printed nothing.

## Paste record

**Consumer:** the maintainer applying the two root `.claude/` edits this branch cannot write (story index → **Manual setup required**); each span says whether it was checked against a fresh fixture render.

Evidence: `bash scripts/scratch-run.sh harness-runs/scratch/task8-fixture-render.mjs` — a `mkdtemp` fixture under the system temp root, `git init` with a fixture identity, `node <checkout>/cli/dist/cli.js init --non-interactive --no-analyze --scripts-dir scripts` (exit 0), then the fixture's item-4 line and `.claude/settings.json` printed and the directory removed.

### 1. Item 4 of `.claude/CLAUDE.md` — **checked, byte-identical**

Replace the single line beginning `4. **Opt-out.**` under `## Where a change request runs` with:

```
4. **Opt-out.** `.claude/harness-no-offer` does not exist at the **main checkout's** root — the checkout you are running in may be a linked worktree or a run copy (a clone) of it, and the marker is written once for all of them. Run `bash scripts/task-offer-check.sh` — bare, with no argument, from the root of the checkout you are running in — rather than reading anything. It prints the main checkout and exits 0 **only** when it found one and found no marker there, and that is the one outcome on which the offer proceeds; any other outcome is silence — a non-zero exit, no output, the command declined, or the script not there. Presence-only: never read, parse or act on anything inside it — a read of a path outside this session's own root can raise a permission prompt mid-fence, while the test's non-zero exit is a clean answer. The file is normally absent, and absent means only *not opted out*; a check you cannot make — the command declined, the repository not a git one, no output — is silence too, never a remark to the user about a file they never created.
```

Item 4 renders no `{{pluginName}}` and no `{{projectName}}`, so nothing in it differs between this repository and the fixture. The probe printed `fixture line === template-derived line: true` — the fixture's line and `cli/templates/claude/CLAUDE.md`'s item 4 with `{{taskOfferCheckCommand}}` replaced by `bash scripts/task-offer-check.sh` compared equal, with no `{{` token left.

### 2. `.claude/settings.json` — **checked, byte-identical**

Replace the whole file with (this repository's two current keys unchanged, then `permissions` exactly as the fixture carries it):

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

The probe built this text as this repository's parsed `.claude/settings.json` plus the fixture's `permissions` value, serialised with two-space indent and a trailing newline, and printed `intended text === fixture file text: true`. The fixture's file was written fresh by `init`, not merged into an existing one, so Task 3's merge path is not what produced it.

### 3. Confirm the paste

```
git diff -- .claude/CLAUDE.md
```

Expect one changed line: item 4.

```
grep -c -F 'Bash(bash scripts/task-offer-check.sh)' .claude/settings.json
```

Expect `1`.
