### 1. The machine-path check spells its needles and file path unquoted, so a path with a space turns the check into a status-2 "could not run" and the file is committed unchecked

**File:** `plugin/instructions/improvement_observations_instructions.md` → `## Commit mechanics` → **Machine-path check — before every wrapper call.** — the fenced block "grep -nF -e <home directory> -e <checkout root> -e <checkout root> <absolute path of the intake file>"

The paragraph tells the orchestrator to run one `grep` with "every needle and the intake file's absolute path spelled out as literals", and the fenced template shows each needle and the path **bare**. Nothing says to quote them. The needles are a home directory (`jq -nr env.HOME`) and every checkout root (`worktree ` lines of `git worktree list --porcelain`), and either may contain a space: a checkout under a directory such as `~/Work/tech articles/`, or a home directory with a space in it. The orchestrator follows the template as written, and one of those values then splits into two words:

- `-e /Users/Jane Doe/…` gives the needle `/Users/Jane`, and `Doe/…` becomes a positional argument. With the patterns supplied by `-e`, every positional argument is a **file**, so `grep` tries to open `Doe/…`, cannot, and exits **2** — even when it has already printed hits from the real intake file.
- A space in the intake file's own absolute path (the run's checkout root) breaks the file argument the same way, so `grep` exits 2.

The paragraph maps status `2` to *"the check could not run: log it and go on to the wrapper"*. So in exactly the layout where a leak is most likely to go unnoticed, the check reports "could not run", the wrapper commits the file with the machine path still in it, and the branch ships the defect it exists to prevent. The unattended profile allows `grep` through `Bash(grep:*)` (`cli/templates/claude/settings.autonomous.json` → `permissions.allow`), which is a prefix match, so single quotes cost nothing: the command stays one statement with no `$`, no substitution, no pipe and no redirect.

**Fix:**

- [ ] Replace the fenced block with:

```zsh
grep -nF -e '<home directory>' -e '<checkout root>' -e '<checkout root>' '<absolute path of the intake file>'
```

- [ ] Directly after the fenced block, before the sentence that begins "It carries no `$`", insert this sentence:

  "Single-quote every needle and the file path: a home directory or checkout root may contain a space, and an unquoted one splits into a word `grep` opens as a file, which yields status `2` with the hits already printed. A needle that itself contains a single quote is dropped like an empty one, and its source is logged; if the intake file's own path contains one, the check could not run."

- [ ] Do not change `cli/templates/state-dir/improvement_observations/README.md` or `harness-runs/improvement_observations/README.md`. They do not show the command.
