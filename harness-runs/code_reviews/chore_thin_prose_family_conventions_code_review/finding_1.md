### 1. Four thinned paragraphs in `harness-analyze.md` were left unwrapped against the file's hard-wrapped prose

**File:** `plugin/commands/harness-analyze.md` — four paragraphs, each located by a quoted substring:

1. `(4d.0)`: "with the exact literal `Layer-writer divergence — `** — the discriminator the writer's own `## Invocation contract` names. **Fix-only:**"
2. `(4d)`, the iteration-2 paragraph: "or when every finding was declined so no member changed: the narrowed set is empty. **There is no third iteration and no verdict gates either one.**"
3. Step 5, the accepted-proposal paragraph: "re-derives the set, (4a) classifies that path `action: write` because no skeleton exists at it, and step 4 sends it in the same waves, with the same argument"
4. Step 5, the `proposed-and-refused` paragraph: "having landed. And on the refused arm the `rationale`" through "check (`cli/src/doctor/checks.ts` → `LAYER_PROFILE_CHECK`) reproduces the rationale verbatim as its evidence. This call shells the CLI out of the"

The command's numbered steps are hard-wrapped prose with lines of about 110–115 columns. Tasks 6 and 7 deleted text from these four paragraphs but did not re-flow what was left. As a result, one line in each paragraph now runs to 150–205 columns, and the `proposed-and-refused` paragraph also has a short fragment line ("having landed. And on the refused arm the `rationale`") just before the long one. No rule changes and no reader is misled. This is a ragged edit in a durable file, and a later diff of these paragraphs will be noisier because of it.

**Fix:** re-flow each of the four paragraphs to match the lines around it. Use the paragraph's existing three-space indent, keep every line at 115 columns or fewer, and break only between words. Change whitespace and line breaks only. Do not add, remove, reorder or re-spell any word, backtick span or `**…**` span. The branch's frozen-text and literal checks compare text with whitespace collapsed, so re-flowing leaves every frozen run, cited anchor and wire literal intact. Leave every other paragraph alone. Re-flow each paragraph as a whole, from its first line to its last. Paragraph 3 is step 5's opening paragraph, so its first line keeps the `5. ` list marker. Do not merge any paragraph into the paragraph or list item next to it. This fix is whitespace-only and edits no test file, so it runs no test.
