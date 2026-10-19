### 1. The clone allow-list pins `core.repositoryformatversion` to `0` and has no `extensions.objectformat`, so a SHA-256 main checkout can never get a clone

**File:** `cli/templates/scripts/lib/harness-run-lib.sh`. Three sites:
- `hr_clone_config_spec`, the substring `core.repositoryformatversion =0 \`;
- `hr_clone_config_check_var`, the required-key loop `for req in core.repositoryformatversion core.bare remote.origin.fetch remote.origin.url; do`;
- `hr_clone_create_var`, the key-write loop `for key in core.repositoryformatversion core.bare remote.origin.fetch remote.origin.url \`.

**Problem.** `git clone --shared` of a SHA-256 repository writes `core.repositoryformatversion = 1` and `extensions.objectformat = sha256` into the clone's `.git/config`. `hr_clone_create_var` then empties that file and rewrites it from `hr_clone_config_spec`. The spec has no `extensions.objectformat` line and pins the version to `=0`, so the rewritten clone is read as a SHA-1 repository. Its very next git call fails: `hr_clone_git … for-each-ref` (step "listing the refs of <dir>"). Creation rolls back and refuses, every time.

`hr_clone_config_check_var` would refuse such a clone anyway, because `extensions.objectformat` is off the list and the version must be `0`. So the "one contract" between the check and the creator cannot describe a SHA-256 clone at all.

The rest of the library does treat SHA-256 as in scope:
- the new `hr_copy_sync_in_var` accepts a 64-character object id (`[ "${#oid}" -ne 40 ] && [ "${#oid}" -ne 64 ]`);
- the pre-existing `hr_run_trusted_base_var` does the same;
- `hr_commit_paths_var` builds its null id from the tip's length (`null=${tip_c//?/0}`).

The worktree arm works on a SHA-256 repository. So once the layout switch makes creation the only way a run gets a copy, every run in a SHA-256 adopter fails at launch.

**Proof.** A fixture was built under the system temp directory: a main checkout with `harness.config.json`, a bare origin and the registry directory, in the same shape as `cli/test/clone-create-remove.test.mjs`'s `fixture`. With the library sourced, `hr_clone_create_var "$main" feat_c trunk` gave:
- with `git init --object-format=sha1`: `status=0`;
- with `git init --object-format=sha256` (git 2.50.1): `status=1`, and `HR_CLONE_REFUSAL` read `cannot create a clone for branch 'feat_c': listing the refs of <root>/main-feat_c failed, and everything this call created was rolled back`.

The same fixture run against a scratch copy of the library carrying the fix below gave `status=0` for both formats, including the trust check `hr_clone_create_var` runs last.

**Fix.** In `cli/templates/scripts/lib/harness-run-lib.sh`:

1. In `hr_clone_config_spec`, add `fmt` to the `local` list (`local main="${1-}" top="${2-}" rel url fmt nl`). Replace the lines from `url=$(…)` through the first `printf` argument line with:

```bash
  url=$(git -C / config --file "$main/.git/config" --get remote.origin.url 2>/dev/null) || url=""
  fmt=$(git -C / config --file "$main/.git/config" --get extensions.objectformat 2>/dev/null) || fmt=""
  case "$top/$rel$url$fmt" in *"$nl"*) return 1 ;; esac
  if [ -n "$fmt" ]; then
    printf 'core.repositoryformatversion\t=1\nextensions.objectformat\t=%s\n' "$fmt"
  else
    printf 'core.repositoryformatversion\t=0\n'
  fi
  printf '%s\t%s\n' \
```

   The remaining `printf '%s\t%s\n' \` argument list then starts at `core.bare =false \`. Delete its old first pair, `core.repositoryformatversion =0 \`.

2. In the header above `hr_clone_config_spec`, change `Required keys: \`core.repositoryformatversion\`, \`core.bare\`, \`remote.origin.fetch\`, and \`remote.origin.url\` whenever the spec lists it.` to `Required keys: \`core.repositoryformatversion\`, \`core.bare\`, \`remote.origin.fetch\`, and \`remote.origin.url\` and \`extensions.objectformat\` whenever the spec lists them.` After the sentence ending `only when it names one;`, add: `\`extensions.objectformat\` is listed, with the main checkout's value and \`core.repositoryformatversion\` \`=1\`, only when the main checkout's \`.git/config\` names one, and the version is \`=0\` otherwise;`.

3. In `hr_clone_config_check_var`, replace the required-key loop's first two lines:

```bash
  for req in core.repositoryformatversion extensions.objectformat core.bare remote.origin.fetch remote.origin.url; do
    if [ "$req" = remote.origin.url ] || [ "$req" = extensions.objectformat ]; then
```

4. In `hr_clone_create_var`, change the key-write loop's first line to `for key in core.repositoryformatversion extensions.objectformat core.bare remote.origin.fetch remote.origin.url \`. Its existing `hr_clone_spec_rule_var "$spec" "$key" || continue` already skips the key when the spec does not list it.

5. In `cli/test/clone-create-remove.test.mjs`:
   - Give `fixture(t)` an optional second parameter, `{ objectFormat } = {}`. When it is set, pass `--object-format=<objectFormat>` to both `init` calls (the bare origin's and the main checkout's).
   - Add a case: `(sha256) A SHA-256 main checkout gets a clone the trust check accepts`. It first runs `git init --bare --object-format=sha256` in a throwaway directory and calls `t.skip()` if that fails, because git older than 2.29 has no such option. It then builds `fixture(t, { objectFormat: 'sha256' })`, calls `f.create()`, and asserts:
     - `status` is `'0'`;
     - `f.check(dir).kind` is `'clone'`;
     - the clone's `.git/config` (read with `git -C / config --file <dir>/.git/config --get extensions.objectformat`) is `sha256`.

   That is the one test file this fix edits, so it is the only test the fix runs: `npm test --workspace cli -- test/clone-create-remove.test.mjs`.
