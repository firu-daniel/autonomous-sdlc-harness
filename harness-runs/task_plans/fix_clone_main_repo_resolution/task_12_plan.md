### Task 12 — Re-render the worked example's fence, task offer and profile `_README` line

**Goal:** Keep the live worked example's rendered files identical to what `init` now renders from the templates this branch changed, with the example's own values in place. The example's `.claude/CLAUDE.md` fence section, `.claude/harness-task-offer.md` and `.claude/settings.autonomous.json` are renders of token-carrying `cli/templates/` files. A change to such a template owes this directory the rendered artifact (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*; `.claude/context/conventions.md` → `## Documents of record`).

**Depends on:**

- **Task 1**, which changes `cli/templates/claude/CLAUDE.md` → `## Where a change request runs`, item **4. Opt-out.**, and `cli/templates/claude/harness-task-offer.md`: the phrase *"at the main worktree's root"* and the `## Answer 4 — write the marker, then do the work` bullets. Both carry the `{{pluginName}}` token.
- **Task 5**, which rewords the `_README` line beginning `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE:`. `cli/src/generators/permissionProfile.ts` appends that line to every rendered profile.

Nothing else in those templates changed.

**Where this task stops.** This repository's own root `.claude/CLAUDE.md` and `.claude/harness-task-offer.md` are re-rendered by the maintainer (story index → `Manual setup required`), not here. In `examples/notes-app/.claude/CLAUDE.md`, only the `## Where a change request runs` section is the template's rendered text. Every other section there is the frozen capture and stays byte-identical.

### Targets

- `examples/notes-app/.claude/CLAUDE.md` — the `## Where a change request runs` section, item 4 only.
- `examples/notes-app/.claude/harness-task-offer.md` — the phrase *"at the main worktree's root"* and the answer-4 bullets.

`examples/notes-app/README.md` is **not** a target. See **Check the README's counts** below: a recount that differs stops the task.
- `examples/notes-app/.claude/settings.autonomous.json` — the one `_README` line beginning `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE:`.

**Work:**

- [ ] **Render the expected text instead of retyping it.**
  - Build the CLI (`npm run build`).
  - Run the compiled CLI's `init` against a throwaway fixture repository under the system temp directory. Shape the fixture like the example: the same `harness.config.json` keys `phases`, `qa`, `scriptsDir`, `stateDir` and `projectName` as `examples/notes-app/harness.config.json`.
  - From the fixture's rendered `.claude/CLAUDE.md`, `.claude/harness-task-offer.md` and `.claude/settings.autonomous.json`, take the new item 4, the offer's replacement for *"at the main worktree's root"* and its answer-4 bullets, and the new `_README` line.
- [ ] **Apply exactly those parts to the example.** In `settings.autonomous.json`, substitute the fixture's root with `/workspace/notes-app` wherever the line names a path. The anchor line names none, so it should transfer verbatim. Leave every other line of all three files byte-identical.
- [ ] **Check the README's counts; never edit the README.** `examples/notes-app/README.md` states `/workspace` occurrence and line counts for the profile (`grep -n '/workspace' examples/notes-app/README.md`). Recount after the re-render. The changed line names no path, so no figure should move. If a recount differs from what the README states, **stop**: revert nothing, edit no README, and return a `blocker:` naming the figure, the README's stated value and the recounted value, so the plan can add the README as a target.

**Verification:**

- `jq -e . examples/notes-app/.claude/settings.autonomous.json > /dev/null` exits 0.
- `grep -n -F 'git worktree list | head -1' examples/notes-app/.claude/CLAUDE.md examples/notes-app/.claude/harness-task-offer.md` finds nothing.
- `grep -c -F "at the main worktree's root" examples/notes-app/.claude/harness-task-offer.md` prints `0`.
- `git diff examples/notes-app/` touches only item 4 of the fence, the *"at the main worktree's root"* phrase and answer 4 of the offer, and the one `_README` line, and does not touch `examples/notes-app/README.md`. Read it to confirm that no captured section of `CLAUDE.md` moved.
- `grep -rn '/Users/\|/home/' examples/notes-app/.claude` finds nothing (`.claude/context/conventions.md` → `## The testing bar`, the self-containment gate).

## Disposition

- **(a) Attempted.** Built the CLI (`npm run build --workspace cli`, exit 0), ran `node cli/dist/cli.js init --non-interactive --no-analyze --quiet` in a throwaway fixture at `$TMPDIR/t12fx/notes-app` carrying a copy of `examples/notes-app/harness.config.json` and `package.json`, diffed the three rendered files against the example, then attempted six `Edit` calls applying exactly the plan's parts to `examples/notes-app/.claude/CLAUDE.md` (item 4), `examples/notes-app/.claude/harness-task-offer.md` (four spans) and `examples/notes-app/.claude/settings.autonomous.json` (the one `_README` line). No target file changed.
- **(b) Refusal, quoted** (identical on every one of the six calls, and on a second attempt at the same `harness-task-offer.md` edit): `Permission to use Edit has been denied because Claude Code is running in don't ask mode.`
- **(c) Why no permission entry lifts it.** Every target lies under a `.claude/` directory, the tool layer's write guard on `.claude/**`, which is evaluated ahead of the permission profile. The run's in-repo profile was read: `.claude/settings.json` has no `permissions` key (`jq '.permissions'` printed `null`), and no `.claude/settings.local.json` exists in this checkout. The out-of-checkout run profile under `~/.local/state/autonomous-sdlc-harness/run-profiles/` could not be read (Read refused), so its contents are not reported. Writes outside `.claude/` in this same session succeed (this record is one).
- **(d) Remedy for the operator — one paste, from the checkout root, in a session that may write `examples/notes-app/.claude/`:**

  ```
  python3 - <<'PY'
  import pathlib
  r = pathlib.Path('examples/notes-app/.claude')
  def sub(p, old, new):
      t = (r / p).read_text()
      assert t.count(old) == 1, (p, old[:40])
      (r / p).write_text(t.replace(old, new))
  sub('CLAUDE.md',
      "4. **Opt-out.** `.claude/harness-no-offer` does not exist at the **main worktree's** root — the checkout you are running in may be a worktree of it, and the marker is written once for all of them. Test it with the shell rather than by reading anything: `test -e \"$(git worktree list | head -1 | awk '{print $1}')/.claude/harness-no-offer\"`, whose first line is always the main worktree and which is the same path in an ordinary single-checkout repository; the checkout-root rule's",
      "4. **Opt-out.** `.claude/harness-no-offer` does not exist at the **main checkout's** root — the checkout you are running in may be a linked worktree or a run copy (a clone) of it, and the marker is written once for all of them. Test it with the shell rather than by reading anything: `t=$(git rev-parse --show-toplevel) && f=$t/.git/objects/info/alternates && if [ ! -e \"$f\" ]; then m=$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -n 1); else [ \"$(sed -n '$=' \"$f\")\" = 1 ] && a=$(cat \"$f\") && case \"$a\" in /*/.git/objects) m=${a%/.git/objects} ;; *) false ;; esac && [ \"$m\" != \"$t\" ] && [ -d \"$m/.git\" ] && [ ! -e \"$m/.git/commondir\" ] && b=$(git rev-parse --abbrev-ref HEAD) && [ \"$b\" != HEAD ] && command -v jq >/dev/null && c=$m/harness.config.json && s=$(jq -r '.stateDir // \"sdlc-harness\"' \"$c\") && s=${s%/} && n=$(jq -r '.projectName // empty' \"$c\") && [ \"$t\" = \"${m%/*}/${n:-${m##*/}}-$(printf '%s' \"$b\" | tr / -)\" ] && jq -e --arg b \"$b\" --arg t \"$t\" '.runs[$b].copy_kind == \"clone\" and .runs[$b].worktree == $t' \"$m/$s/autonomous_logs/registry.json\" >/dev/null; fi && [ -n \"$m\" ] && [ ! -e \"$m/.claude/harness-no-offer\" ] && printf '%s\\n' \"$m\"`. It prints that main checkout and exits 0 **only** when it found one and found no marker there, and that exit is the one outcome on which the offer proceeds. Any other outcome is silence — a non-zero exit, no output, or the command declined — including a clone the main checkout's run registry does not record, and a run copy on a host without `jq`; a main checkout or a linked worktree never reaches `jq` and needs none. The checkout-root rule's")
  o = 'harness-task-offer.md'
  sub(o, "marker at the main worktree's root;", "marker at the main checkout's root;")
  sub(o, "- Create `.claude/harness-no-offer` at the **main worktree's** root — `git worktree list | head -1 | awk '{print $1}'` resolves it from any worktree, and it is the checkout itself in an ordinary single-checkout repository. Create",
         "- Create `.claude/harness-no-offer` under the **path the fence's opt-out command printed** — the main checkout, never a run copy. Create")
  sub(o, "without an error. If the file is not there at that resolved main-worktree path afterwards,",
         "without an error. Confirm with `test -e \"<that path>/.claude/harness-no-offer\"`. If the file is not there afterwards,")
  sub(o, "every worktree of this checkout included, since they all resolve to the same main worktree",
         "every worktree and run copy of this checkout included, since they all resolve to the same main checkout")
  sub('settings.autonomous.json',
      "it launches, and fall back to the first git worktree list entry when it prints nothing, so",
      "it launches, and when it prints nothing fall back to the main checkout a run clone's alternates file names and its run registry confirms, or else to the first git worktree list entry, so")
  PY
  ```

  Then run this task's `**Verification:**` bullets, and `diff` the new item 4 against a fresh fixture render's `.claude/CLAUDE.md` item 4 to confirm the transcription. The replacement text above was taken from the fixture render's `diff` output in this session; the `printf '%s\n'` in item 4 is written `\\n` inside the Python literal so the file receives a backslash-n.
