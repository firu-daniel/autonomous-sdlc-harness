### 5. `deliver`'s comment spells GitHub's pull-request setting and its path a second time, with different arrows from the owner

**Severity:** Should Fix

**Site:** `cli/templates/scripts/remote-run.sh` → `verb_deliver`, the `forbidden` text: `Turn on Settings → Actions → General → Workflow permissions → *Allow GitHub Actions to create and approve pull requests*, or set the \`HARNESS_GIT_TOKEN\` secret, for the next run.`

**Problem.** The architecture review's Finding 2 gave this setting one owner. `cli/src/remote/githubActions.ts` now exports `PR_CREATE_SETTING` and `PR_CREATE_SETTING_PATH` (`'Settings -> Actions -> General -> Workflow permissions'`, ASCII arrows). `init` and `doctor` both import them.

`remote-run.sh` spells the same setting and path a third time, with Unicode arrows `→`. An adopter now reads `Settings -> Actions -> …` from `init` and `doctor`, and `Settings → Actions → …` in the pull-request comment. That is the drift Finding 2 was raised to end.

The module's header rule is *"every remote-execution name has one owner, and a copy anywhere else in `cli/src` imports it"*. It also states that each shell mirror *"declares the mirror in its own header"*. `remote-run.sh`'s `DECLARED MIRRORS` list declares neither name. `doctor`'s `ARTIFACT_RETENTION_ENDPOINT` comment states the test for staying local: *"no shell or YAML file spells this endpoint"*. This setting fails that test, because `remote-run.sh` spells it. (`.claude/context/conventions.md` → `## Configuration is the source of truth…`: *"a value is imported from its owner rather than retyped"*.)

The comment still reads correctly, so this is a Should Fix and not a Must Fix.

**Fix.**
- [ ] In `cli/templates/scripts/remote-run.sh`, after the line `RUN_STATES='running parked paused done failed stopped'`, add:
  ```bash
  PR_CREATE_SETTING='Allow GitHub Actions to create and approve pull requests'
  PR_CREATE_SETTING_PATH='Settings -> Actions -> General -> Workflow permissions'
  ```
- [ ] In the header's mirror list, after the line `#   RUN_STATES                   mirrors  RUN_STATES, space-separated, same order`, add the two lines `#   PR_CREATE_SETTING            mirrors  PR_CREATE_SETTING` and `#   PR_CREATE_SETTING_PATH       mirrors  PR_CREATE_SETTING_PATH`, in the same column layout.
- [ ] In `verb_deliver`'s `forbidden` text, replace `Turn on Settings → Actions → General → Workflow permissions → *Allow GitHub Actions to create and approve pull requests*, or set` with `Turn on *$PR_CREATE_SETTING* under $PR_CREATE_SETTING_PATH, or set`. Leave the rest of the sentence byte-identical.
- [ ] In `cli/test/remote-names.test.mjs`, import `PR_CREATE_SETTING` and `PR_CREATE_SETTING_PATH` from `../dist/remote/githubActions.js`. Add `` `PR_CREATE_SETTING='${PR_CREATE_SETTING}'` `` and `` `PR_CREATE_SETTING_PATH='${PR_CREATE_SETTING_PATH}'` `` to the `mirrors` array of `remote-run.sh mirrors the run-control names byte for byte`. Run that one file from `cli/` with `npm test -- test/remote-names.test.mjs`. `cli/test/remote-deliver.test.mjs` asserts only the setting's name, which is unchanged, so it needs no edit.
