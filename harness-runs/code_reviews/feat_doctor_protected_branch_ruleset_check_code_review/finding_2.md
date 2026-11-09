### 2. Every unreadable classic read is blamed on admin access, timeouts and network failures included

**File:** `cli/src/doctor/checks.ts` (`BRANCH_PROTECTION_CHECK`) — "(reading branch protection needs admin access)"

The final `else` of the classic read gives the same reason for every answer that is neither `answered` nor a `Branch not protected` / `Branch not found` refusal:

```ts
classic = {
  kind: 'unreadable',
  why: `\`gh api ${classicPath}\` gave no answer, because ${classicAnswer.why} (reading branch protection needs admin access)`,
};
```

That arm is reached by `classifyGh`'s `unknown` kind too — a call stopped by the bound (`it was stopped before it answered (timed out)`) and a call that could not reach GitHub (`it could not reach GitHub (…)`). For those the line now reads, for example, `… gave no answer, because it was stopped before it answered (timed out) (reading branch protection needs admin access)`. The admin-access note points the adopter at a permission problem they do not have, which works against decision 2 of the story plan (the line says which question went unanswered *and why*). The note is right only for a refusal (`kind: 'refused'`), such as GitHub's 403 or 404 for a token without admin access.

**Fix:** append the note only to a refusal:

```ts
} else {
  const adminNote = classicAnswer.kind === 'refused' ? ' (reading branch protection needs admin access)' : '';
  classic = {
    kind: 'unreadable',
    why: `\`gh api ${classicPath}\` gave no answer, because ${classicAnswer.why}${adminNote}`,
  };
}
```

Then, in `cli/test/doctor-branch-protection.test.mjs`, add a case beside `a timed-out rules read warns cannot tell`: answer `AUTH` with `AUTH_OK`, `rulesCall(branch)` with `RULES_NONE`, and `classicCall(branch)` with `{ kill: true }`. Assert the warn line includes `` `${branch}`: cannot tell `` and `timed out`, and does **not** include `admin access`. In the existing case `refused rules and refused classic reads warn cannot tell, never missing`, add `assert.ok(warn.includes('admin access'), warn);`, so the refusal keeps its note.

That test file is the one this fix edits, so it is the only test the fix runs: `npm test --workspace cli -- test/doctor-branch-protection.test.mjs`.
