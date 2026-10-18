### Task 3 — Restate the excluded spelling in the profile template's `_README` and record the `GIT_SSH_COMMAND` answer in both wrapper headers

**Goal:** Two template changes, each reaching a future adopter.

- The profile's `_README` line on the two excluded commands names the spelling the generator now writes, and why the `Bash(…)` rule form is not used there.
- The `push-branch.sh` and `refresh-branch.sh` headers record the decision on `GIT_SSH_COMMAND` with its measured basis (task prompt goal 3): **keep it**.

**Depends on:** Task 1, which makes the generator write each excluded entry as `bash <main checkout>/<scriptsDir>/<wrapper>.sh:*`, with no `Bash(…)` wrapper, through `sandboxExcludedCommand`. This task restates that spelling in prose and changes no generated entry.

**The `GIT_SSH_COMMAND` answer to record, with its evidence.** Measured on Claude Code 2.1.299, macOS, headless, in `docs/sandbox-verification.md` → row P1a, which used the corrected `bash <s>:*` entry:

- a sandboxed command carries `GIT_SSH_COMMAND=ssh … -o ProxyCommand='nc -X 5 -x localhost:<port> %h %p'`;
- an excluded command inherits none of the sandbox's proxy variables.

So an excluded call never receives the sandbox's value, only the agent runner's own, which an operator may rely on for the SSH push. A call that does receive the proxy value is running sandboxed, where SSH has no route except that proxy, so dropping it would make no push succeed. **Decision: keep it.** A fresh confirmation on the regenerated profile is a manual step in the story index. The header names `docs/sandbox-verification.md` as the place that result lands.

### Targets

- `cli/templates/claude/settings.autonomous.json`: the `_README` line beginning `TWO COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING:` (scope register row 4).
- `cli/templates/scripts/push-branch.sh`: the header paragraph beginning `# THE INHERITED GIT ENVIRONMENT IS DROPPED.`, at its sentence *"It keeps `GIT_SSH_COMMAND`: …"*.
- `cli/templates/scripts/refresh-branch.sh`: the header paragraph of the same name, which points at `push-branch.sh`'s for its reasoning.

**Work:**

- [ ] `settings.autonomous.json`, the `TWO COMMANDS RUN OUTSIDE THE SANDBOX` line. After *"names the main checkout's own `push-branch.sh` and `refresh-branch.sh` under {{scriptsDirAbs}}"*, state the spelling: each entry is the bare command pattern `bash {{scriptsDirAbs}}/push-branch.sh:*` (and the same for `refresh-branch.sh`), not a `Bash(…)` rule. Say that a `Bash(…)` entry in this list matches no command, so the wrapper runs sandboxed, measured on Claude Code 2.1.299 on macOS (docs/sandbox-verification.md, rows P1a and P2). Keep every other sentence of the line. *"The excluded rule's `:*` accepts any argument"* stays true. Add no new token: `{{scriptsDirAbs}}` is already substituted on this line. Use backticks for inline code, as the line's neighbours do, and put no unescaped `"` inside the JSON string.
- [ ] `push-branch.sh` header, the `GIT_SSH_COMMAND` sentence. Keep *"It keeps `GIT_SSH_COMMAND`"*, then record the measured answer above in three to five comment lines: what the sandbox sets, that an excluded call inherits none of it (`docs/sandbox-verification.md` → P1a), and why keeping it costs nothing on a sandboxed call. Comment text only. No executable line changes. The in-code marker `# THE INHERITED GIT ENVIRONMENT IS DROPPED (header). GIT_SSH_COMMAND is kept.` stays byte-identical.
- [ ] `refresh-branch.sh` header: extend the existing pointer (*"the list and the reasoning: `push-branch.sh` → the paragraph of the same name"*) so it says that paragraph also carries the measured `GIT_SSH_COMMAND` answer. Comment text only.

**Verification:**

- `jq empty cli/templates/claude/settings.autonomous.json` exits 0. The template is still valid JSON, because every `{{…}}` token sits inside a string.
- `bash -n cli/templates/scripts/push-branch.sh` and `bash -n cli/templates/scripts/refresh-branch.sh` each exit 0.
- `git diff --stat` for the two `.sh` templates shows only comment lines changed. Read the diff and confirm that every changed line starts with `#`.
- `grep -n 'Bash(bash' cli/templates/claude/settings.autonomous.json` has no hit on the `TWO COMMANDS` line, except where the line names the `Bash(…)` form as the one not to use.
