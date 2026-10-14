### 1. The writer's `### Test data` now makes every account precondition name an account index, which pins tests the qa-tester would run on any free account

**File:** `plugin/agents/ui-tests-plan-writer.md` → `### Test data — the QA accounts (use this when wording account preconditions)`, the paragraph before the bullets — "A precondition names the account by that index"

**Problem.** At base `13a2ed4c`, this subsection opened with two paragraphs. The first was conditional: *"When a precondition involves more than one QA account, sign in as the right one through the `<auth_provider>` route"*. The second described the credentials-file shape and ended *"State that shape in a precondition; never restate a key's value."* Neither paragraph told the writer to pin a specific account on every precondition. Task 3 (R5) merged them into one paragraph, and in doing so dropped the multi-account condition and replaced "state that shape" with an unconditional instruction:

> A precondition names the account by that index, and the account signs in through the `<auth_provider>` route; never restate a key's value.

That changes what the consumer does. `plugin/agents/qa-tester.md` → `## How it tests` → **Which account.** says that a test that **names** an account "dictates its account", and that any other test takes the **agnostic default** (any available account, which `reserve-qa-user.sh` with no argument parks as the first free slot). Under the new writer text, every auth-gated test's precondition names an index, so every test becomes account-dictated. Plain "is a signed-in user" tests count too. Two things follow:
- the qa-tester reserves that specific slot instead of the first free one;
- when a parallel QA session holds it (`reserve-qa-user.sh` exit `3`), the named account is the only one that satisfies the test, so the qa-tester returns `error: blocked — test <T>: …`. Under the agnostic default the same test would have run.

The story index says *"Behaviour does not change"*, and its scope register (row 1, Task 3) treats this subsection as thinning only. This edit is a behaviour change, so it is a Must Fix.

**Fix.** In `plugin/agents/ui-tests-plan-writer.md`, replace exactly this sentence (it ends the paragraph that opens with "The gitignored file at `<repo_root>/<qa_creds_path>` holds this project's test accounts"):

```text
A precondition names the account by that index, and the account signs in through the `<auth_provider>` route; never restate a key's value.
```

with:

```text
A multi-account precondition names each account by that index and signs each in through the `<auth_provider>` route; never restate a key's value.
```

The replacement restores the base condition: only a precondition that involves more than one QA account names accounts. A single-account precondition stays agnostic, and the qa-tester keeps its first-free reservation. Both sentences are 22 whitespace-separated words, so the definition's word count does not rise. Leave the rest of the paragraph, the italic note above it and the bullets below it unchanged.
