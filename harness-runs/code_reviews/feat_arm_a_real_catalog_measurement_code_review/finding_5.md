### 5. `results.mjs` spells the machine-half fence twice: as literals in `machineSection` and as constants in `readCorpusMachineHalf`

**File:** `evals/docs-retrieval/results.mjs`, in `machineSection` (`return ['```json', JSON.stringify(payload, null, 2), '```'].join('\n');`) and in the constants above `readCorpusMachineHalf` (`const JSON_FENCE_OPEN = '```json\n';` and `const JSON_FENCE_CLOSE = '\n```';`).

**Problem.** `readCorpusMachineHalf` was added so that "the marker spelling and the block layout stay this module's alone". It declares the fence it parses as `JSON_FENCE_OPEN` / `JSON_FENCE_CLOSE`. `machineSection`, the one writer of that fence, still builds it from its own inline literals. The two spellings produce the same bytes today, but nothing ties them together. An edit to one, such as a language tag or a trailing newline, makes the reader refuse every block the writer produces. `calibrate.mjs` → `readPerQuery` and the threshold record both depend on that reader.

**Fix.** Make the writer use the reader's constants. The rendered bytes stay identical, so no generated block needs regenerating.

- [ ] Move the two declarations, with their doc comment `/** The opening and closing fence lines {@link machineSection} wraps its payload in. */`, from above `readCorpusMachineHalf` to just above `machineSection`.
- [ ] In `machineSection`, replace
  `return ['```json', JSON.stringify(payload, null, 2), '```'].join('\n');`
  with
  `return `${JSON_FENCE_OPEN}${JSON.stringify(payload, null, 2)}${JSON_FENCE_CLOSE}`;`
  (`'```json\n' + body + '\n```'` is byte-identical to the `join('\n')` of the three parts).
- [ ] Confirm that nothing in the output changed. Run `bash scripts/test.sh` without a pipe; gate 11 re-scores `fixture-catalog` through this module. Do not re-run the eval with `--out`.
