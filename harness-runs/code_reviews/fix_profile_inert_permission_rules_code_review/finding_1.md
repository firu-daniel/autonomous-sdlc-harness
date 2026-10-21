### 1. The owed W7 row cannot tell a working run-copy twin from a broken one, because the guard already grants every call it lists

**File:** `docs/sandbox-verification.md` (`## 4. The profile's denials`, the owed rows after *"W6–W8 are owed measurements, not results"*) — "| W7 | A watcher-launched session per"

W7 is the only real-session check this branch owes for the new per-run wrapper twins (`Bash(bash <copy>/<scripts_dir>/<x>.sh:*)`, appended by `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_render`). It calls `bash <clone>/scripts/typecheck.sh` and `bash <clone>/scripts/test.sh` by absolute path, with no argument and with one, from a session whose cwd is `<clone>`, and expects *"each runs with no permission denial"*.

The plugin's `autonomous-script-allowlist-guard.sh` grants every one of those calls on its own. The session's cwd is `<clone>`, so the guard judges `<clone>` as its `<top>` and allows any wrapper under `<clone>/<scriptsDir>`. This branch's own record says so: `docs/guard-verification.md` → *"Four keeper controls hold `allow` in both columns"* lists the sibling's own wrapper with `payload.cwd` at that sibling as `allow`. A hook `allow` permits the call before the profile's `allow` list is consulted. So W7 passes whether the twin rule matches or not, including a twin built from a prefix that does not byte-match the base's rows, which is the story's first `Top risks:` entry. W8 catches a rule spelled with a glob, but not an exact twin that names the wrong path. The person filling the row would record the twin as confirmed when the guard granted the call.

To isolate the twin, W7 needs a call the guard declines to grant but the twin's trailing `:*` still matches. The guard's whole-string construct scan withholds its permit from any command containing `<` (`plugin/hooks/README.md` → the `autonomous-script-allowlist-guard.sh` row, class (ii): *"a commit subject naming a placeholder in angle brackets … is silenced"*). A single-quoted argument carrying `<` therefore leaves the per-run copy's twin as the only possible grant.

**Fix:** in `docs/sandbox-verification.md`, replace the W7 row's **Check** and **Expected** cells, and leave the Observed and Verdict cells as they are:

- **Check:** `A watcher-launched session per \`### The clone layout (owed)\`'s launch line, cwd = \`<clone>\`, calling \`bash <clone>/scripts/typecheck.sh\` and \`bash <clone>/scripts/test.sh\` by absolute path three times each: with no argument, with one plain argument, and with the single argument \`'<probe>'\`. The script-allowlist guard grants the first two calls of each on its own, because it judges \`<clone>\` as its own checkout (\`docs/guard-verification.md\` → *"Four keeper controls hold \`allow\` in both columns"*), so those calls cannot show whether the twin works. The \`<\` in the third call makes the guard withhold its permit, so that call is granted by the per-run copy's \`Bash(bash <clone>/scripts/<x>.sh:*)\` twin or by nothing`
- **Expected:** `each of the six calls runs with no permission denial; a denial on a \`'<probe>'\` call alone means the twin does not match`

The change is to a `.md` file, so the fix runs no test.
