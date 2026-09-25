### 2. `REPROMPT_LIMIT`'s doc comment says a default is taken, which is false for the push-destination re-ask it now also bounds

**File:** `cli/src/core/prompt.ts` (`REPROMPT_LIMIT`) — "How many times an unrecognised answer is re-asked before the default is taken"

This branch exported `REPROMPT_LIMIT` so that `init`'s new `askPushDestination` loop could reuse it. It also widened the doc comment to cover both loops. The comment's first sentence still describes only `askYesNo`: when `askYesNo` runs out of re-asks, it takes `defaultAnswer`. `askPushDestination` (`cli/src/commands/init.ts`, "return answer;" after the loop) does something different. It returns the **last unrecognised answer**, not a default. That answer then reaches `writeNotifications`, which warns on stderr that nothing was written. `resolveNotifications`' own doc comment and `docs/cli.md` §2 both state this outcome (*"if it is still unrecognised nothing is written and a warning goes to stderr"*).

Picture a maintainer who trusts this comment and "fixes" `askPushDestination` so that it takes the default when the re-asks run out. The default is `undefined`, so the run goes to the guided-setup note (*"no destination was given"*) and not to the unrecognised-destination warning. The adopter is then told they gave nothing when they actually gave something wrong three times. The branch's own docs describe the second, correct outcome.

**Fix:** reword the comment so each loop's end state is stated, and keep the declaration unchanged:

```ts
/**
 * How many times an unrecognised answer is re-asked before asking stops. `askYesNo` then takes
 * its default; `init`'s push-destination re-ask, which loops over {@link askLine} with this same
 * bound so the two loops cannot drift apart, hands the last answer on for its generator to refuse.
 */
export const REPROMPT_LIMIT = 2;
```

The `askYesNo` doc comment (`cli/src/core/prompt.ts`, "{@link REPROMPT_LIMIT} times, then the default") is about `askYesNo` only and is still true. Leave it as it is.
