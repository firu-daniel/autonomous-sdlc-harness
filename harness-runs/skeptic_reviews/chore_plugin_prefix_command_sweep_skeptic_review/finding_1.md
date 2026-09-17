### 1. `docs/development.md` §6 points to the headless-leg record as sitting "on `ANALYZE_COMMAND` in `cli/src/commands/init.ts`", but that paragraph is on `ANALYZE_INVOCATION`

**File:** `docs/development.md` (`## 6. The roadmap this tree defers to`, the paragraph opening "**A third debt belongs to no row at all, and it is paid:**") — "paragraph on `ANALYZE_COMMAND` in `cli/src/commands/init.ts`"

**Problem.** This §6 paragraph is the record of what this branch measured. It says where its headless-leg measurement came from: "**The headless leg**, from the `Headless first-message leg, re-measured:` paragraph on `ANALYZE_COMMAND` in `cli/src/commands/init.ts`".

That symbol anchor was true when Task 11 wrote it, and it stopped being true later in the branch. The architecture review's Finding 1 moved `ANALYZE_COMMAND` out of `init.ts` into `cli/src/core/pluginIdentity.ts`. The measurement paragraph stayed in `init.ts`, and it now sits in the doc comment on `ANALYZE_INVOCATION`. In `init.ts` today:

- `ANALYZE_COMMAND` appears only as an import: `import { ANALYZE_COMMAND } from '../core/pluginIdentity.js';`.
- The doc comment that holds `Headless first-message leg, re-measured:` sits directly above `const ANALYZE_INVOCATION = \`${AGENT_CLI} "${ANALYZE_COMMAND}"\`;`.
- The doc comment on `ANALYZE_COMMAND` in `cli/src/core/pluginIdentity.ts` holds no measurement. It says only "The analyze command as every line addressing the adopter names it, plugin-qualified", plus a pointer to gate 6.

The code review's Finding 2 fixed the same stale pointer in the two `init.ts` comments, which now cite `{@link ANALYZE_INVOCATION}`. It did not touch this `docs/development.md` citation, so this finding is new. `git grep -n 'on \`ANALYZE_COMMAND\`'` outside `harness-runs/` matches only this line.

**Who gets it wrong.** Picture a maintainer who wants to re-check the measurement when a new Claude Code version ships. This paragraph tells them where the evidence is recorded. They open the definition of `ANALYZE_COMMAND`, which is in `cli/src/core/pluginIdentity.ts` because `init.ts` only imports it, and they find no measurement there. From that they could wrongly decide the record was lost in the refactor. Or they re-measure and write the new record onto `ANALYZE_COMMAND` in `pluginIdentity.ts`. That leaves two records, and gate 6d's exemption table still points at the one in `init.ts` (`'cli/src/commands/init.ts|contains|claude -p "/harness-analyze" --permission-mode plan'`).

**Grade.** Should Fix. The quoted opening `Headless first-message leg, re-measured:` and the path `cli/src/commands/init.ts` both still resolve, so a reader who greps the quote finds the record. Only the symbol qualifier is wrong.

**Fix.** Edit one line of `docs/development.md`, inside the §6 paragraph opening "**A third debt belongs to no row at all, and it is paid:**". Replace

> from the `Headless first-message leg, re-measured:` paragraph on `ANALYZE_COMMAND` in `cli/src/commands/init.ts`

with

> from the `Headless first-message leg, re-measured:` paragraph on `ANALYZE_INVOCATION` in `cli/src/commands/init.ts`

Change nothing else on that line. The line opens with "**A third debt belongs to no row at all, and it is paid:**", which is the text gate 6d's `contains` exemption for `docs/development.md` matches, so that opening must stay as it is. The replacement adds no slash spelling.

- [ ] Apply the replacement above.
- [ ] Run `bash scripts/check-command-spelling.sh`. It must exit 0 with no output.
