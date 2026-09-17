### Task 3 — Qualify the analyze command in `detect/presets.ts` and update `stack-presets.test.mjs`

**Goal:** Change the preset warnings that send an adopter to the analyze command, and the preset comments that name it, to spell it `/autonomous-sdlc-harness:harness-analyze`. Update the suite that counts those warnings in the same change.

**Where this task stops.** `signals.ts`'s `flat` fallback warning is Task 2's, because `init.test.mjs` pins it. This task changes only the spelling in `presets.ts`: no preset, row or warning condition moves.

### Targets

- `cli/src/detect/presets.ts`
- `cli/test/stack-presets.test.mjs`

**Work:**

- [ ] `presets.ts`, output strings: qualify the analyze command in the "is what refines it" warning and in the per-package / per-module layers warning (*"… are `/harness-analyze`'s to propose"*). Do not type a second literal of the plugin name. Import `PLUGIN_NAME` from `../generators/projectSettings.js`, or reuse a constant the module already has, so that `projectSettings.ts` stays the single owner of the plugin name.
- [ ] `presets.ts`, comments: qualify every doc and inline comment that names `/harness-analyze` (*"a judgement call and therefore `/harness-analyze`'s"* and its siblings). They are prose a person reads.
- [ ] `stack-presets.test.mjs`: respell the two ``"`/harness-analyze`'s to propose"`` expectation keys and the header comment that names the command.

**Verification:**

- `bash scripts/test.sh` exits 0, including the stack cases whose expected-warning maps carry the respelled key.
- `grep -n '/harness-analyze' cli/src/detect/presets.ts cli/test/stack-presets.test.mjs` prints nothing. The qualified form does not contain that substring, so any line it prints is a site this task missed.
