### 5. `copyTemplate` rewrites the origin URL with a string replacement, so a `$` in the temp path would corrupt it after the exactly-once check has passed

**File:** `cli/test/helpers/fixture.mjs` (`copyTemplate`): "config.replace(template.origin, origin)". Line hint: 315.

**Problem.** `String.prototype.replace` with a **string** second argument expands replacement patterns: `$&`, `` $` ``, `$'`, `$$` and `$<n>`. `origin` is `${dir}-origin.git`, and `dir` comes from `realpath(mkdtemp(join(tmpdir(), …)))`. If `TMPDIR` holds a `$` sequence, the URL written into `.git/config` is not the one computed. The guard just above (`occurrences !== 1`) checks the **template's** path before the rewrite. Nothing checks the result, so choice 5's promise that a copy is refused rather than left pointing somewhere wrong would not hold. The trigger needs an unusual `TMPDIR`, so this is Nice to Have. The fix costs one token.

**Fix.** Use a replacer function, whose return value is inserted literally:

```js
await writeFile(configPath, config.replace(template.origin, () => origin), 'utf8');
```

**Verification:** `npm test` passes, including `cli/test/fixture-template.test.mjs` → "two copied fixtures never share an origin".
