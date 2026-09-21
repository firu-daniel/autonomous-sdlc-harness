### 5. `--docs-retrieval` is spelled as a literal at three sites in `init.ts`

**File:** `cli/src/commands/init.ts` (`INIT_OPTIONS`) — `flag: '--docs-retrieval',`; (`parseInitFlags`) — `init: --docs-retrieval needs --docs`; (`askRetrieval`) — `flag: '--docs-retrieval',`

The neighbouring interactive decision does this the other way round, and does it deliberately: `const QA_DRIVER_FLAG = '--qa-driver';` is declared beside `ANALYZE_FLAG` and `NO_ANALYZE_FLAG` and is then read at its `INIT_OPTIONS` row, in its refusal message and in `askQaDriver`'s prompt descriptor — exactly the three site classes this flag now spells by hand. `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` states the rule (*"a value is imported from its owner rather than retyped"*), and `.claude/context/cli.md` → `## How a module in this layer is written` states its layer consequence as **One string, one producer**.

What the duplication costs is small and specific: a rename that misses the prompt descriptor leaves `askYesNo`'s no-terminal line telling an adopter to pass a flag the parser no longer accepts, and nothing in the suite compares the two spellings.

**Fix:** declare the constant beside `QA_DRIVER_FLAG` and read it at all three sites.

```ts
/** The flag that answers the docs-retrieval question, read by its option row, its refusal and its prompt. */
const DOCS_RETRIEVAL_FLAG = '--docs-retrieval';
```

- [ ] `INIT_OPTIONS` row: `flag: DOCS_RETRIEVAL_FLAG,`
- [ ] `parseInitFlags`'s refusal, as a template literal with the same rendered text:

  ```ts
      throw new HarnessError(
        `init: ${DOCS_RETRIEVAL_FLAG} needs --docs: retrieval searches the documentation corpus the docs phase maintains, so it is legal only with that phase on`,
      );
  ```

  `--docs` stays a literal: that flag has no constant of its own today, and giving it one is not this finding's subject.
- [ ] `askRetrieval`'s descriptor: `flag: DOCS_RETRIEVAL_FLAG,`

The rendered strings are unchanged, so `cli/test/init.test.mjs`'s `--docs-retrieval` case, which asserts the refusal text, stays green.
