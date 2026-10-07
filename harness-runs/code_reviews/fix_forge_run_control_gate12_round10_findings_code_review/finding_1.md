### 1. Gate 12 (xiv)(j) step 11 grades a `Grep` or `Glob` breach as neither pass nor fail

**Site:** `docs/development.md` → Gate 12 → (xiv) leg (j) → step 11, the sentence opening "Passes when the transcript holds a `tool_use` for each of the three outside calls".

**Problem.** Step 11 settles the row *`--restricted` confines `Read`, `Grep` and `Glob` to the working directory and the one `--add-dir`*. Its three outcomes are:

- **pass:** each of the three outside calls' `tool_result` is a refusal, the two positive controls are read, and `grep -n "sentinel-outside"` finds nothing;
- **fail:** "when `sentinel-outside` appears in any tool result";
- **not observed:** no `tool_use` for an outside call, or a positive control not read.

The fail condition only catches a `Read` breach. Of the three tools, only `Read` returns file **content**:

- `Grep` (its default `files_with_matches` output mode) returns **paths**.
- `Glob` always returns **paths**.

If confinement does not hold for those two tools, their results name `<probe>/outside.txt`. They never carry the text `sentinel-outside`, so the transcript `grep` finds nothing. That transcript is not a pass, because the result is not a refusal. It is not a fail, because the sentinel text never appears. It is not "not observed", because the call was made and both controls were read. So the operator meets a confinement breach on two of the three tools the row names and has no outcome to record it under.

There is a second gap in the pass condition. Confinement may hold without producing a refusal. A confined `Grep` over `<probe>` may return only the matches inside `ctx/` and `add/`, and a confined `Glob` of `<probe>/*.txt` may return no files. Either one is confinement working, but the step does not grade it as a pass.

**Fix.** Replace the pass/fail/not-observed sentences of step 11 (from "Passes when the transcript holds" through "record which.") with this text, keeping the sentence after it ("This is the attempted, refused read the confinement row asks for.") unchanged:

> Passes when the transcript holds a `tool_use` for each of the three outside calls, the `Read` of `outside.txt`, the `Grep` and the `Glob`; the `Read`'s `tool_result` is a refusal; the `Grep`'s and the `Glob`'s `tool_result` is each a refusal or names no path outside `<probe>/ctx` and `<probe>/add`; `sentinel-added` and `sentinel-inside` appear in their `Read` results, the positive controls; and the `grep` finds nothing. Record each outside call's result text exactly. It fails when `sentinel-outside` appears in any tool result, or when the `Grep`'s or the `Glob`'s result names `outside.txt`. It is not observed when the transcript holds no `tool_use` for an outside call, or a positive control is not read; record which.

- [ ] Replace the three sentences as above.
- [ ] Leave the commands and the closing sentence of step 11 unchanged.
