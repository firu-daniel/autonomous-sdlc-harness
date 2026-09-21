### 2. `init`'s "not established" claims cite `ANALYZE_COMMAND`, whose doc comment no longer holds that evidence

**File:** `cli/src/commands/init.ts` — two sites:
- the doc comment on `reportNextSteps` — "succeeds is not established ({@link ANALYZE_COMMAND}), so the line an adopter acts on"
- the line comment above `pasteUnconfirmed` inside `reportNextSteps` — "so the outcome is named as intended ({@link ANALYZE_COMMAND}, `docs/analyze.md` §9)."

Before this branch, both parentheticals pointed at `ANALYZE_COMMAND_QUALIFIED`. That constant's doc comment in `init.ts` carried the argument itself: the prefixed first-message form was not shown to work, and the interactive form waited on the hand-run gate. The branch deleted that constant. The Finding 1 fix of the architecture review then moved the spelling to `cli/src/core/pluginIdentity.ts`, and both citations were renamed to `{@link ANALYZE_COMMAND}`.

That link now leads to `cli/src/core/pluginIdentity.ts` → `ANALYZE_COMMAND`. Its whole doc comment says only that this is "The analyze command as every line addressing the adopter names it, plugin-qualified", plus a pointer to the spelling rule. Nothing there says the first-message form is unconfirmed. The argument now lives in the doc comment on `ANALYZE_INVOCATION`, in the same file as the two citations: "The interactive first-message form waits on the hand-run gate — if that comes back negative the printed line is dropped rather than respelled (`docs/analyze.md` §9)", followed by the `Headless first-message leg, re-measured:` record.

Who gets it wrong: a reviewer of this module checks a change against its header (`.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"*). They follow the link to find why the paste line is worded as intended. They land on a constant that says nothing about it, and conclude the "not established" wording has no support left and can be dropped. Dropping it would make the printed line claim a first-message form nobody has measured interactively.

**Fix:** repoint both citations to the constant whose doc comment holds the evidence.

- [ ] In the `reportNextSteps` doc comment, change `succeeds is not established ({@link ANALYZE_COMMAND}), so the line an adopter acts on` to `succeeds is not established ({@link ANALYZE_INVOCATION}), so the line an adopter acts on`.
- [ ] In the line comment above `const pasteUnconfirmed =`, change `// so the outcome is named as intended ({@link ANALYZE_COMMAND}, \`docs/analyze.md\` §9).` to `// so the outcome is named as intended ({@link ANALYZE_INVOCATION}, \`docs/analyze.md\` §9).`

These are comment-only changes. No output string moves, and no test asserts on these comments. Run `bash scripts/typecheck.sh` to confirm the build is unchanged.
