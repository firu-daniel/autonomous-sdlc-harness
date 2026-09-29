### 1. Move the duplicated YAML-scalar unquote into one `cli/src/core/` owner

**Severity:** Must Fix. **Layer:** cli.

**Sites.**

- `cli/src/remote/githubActions.ts` → `renderedCliVersions`, the lines
  `const quote = value[0];` and `if ((quote === "'" || quote === '"') && value.length >= 2 && value.endsWith(quote)) value = value.slice(1, -1);` (around line 85).
- `cli/src/generators/githubWorkflows.ts` → `cronExpression`, the lines
  `const quote = value[0];` and `return (quote === "'" || quote === '"') && value.length >= 2 && value.endsWith(quote) ? value.slice(1, -1) : value;` (around line 107).

**Problem.** This branch adds the same behaviour twice: stripping one matching pair of single or double quotes from a YAML scalar value. It sits in two different `cli/src` areas, `remote/` and `generators/`, as two private copies with no shared owner. `.claude/context/conventions.md` → `## Shared code, and where it lives` states: *"The CLI's shared modules are `cli/src/core/` … A value or behaviour two `cli/src` areas need lives there, never duplicated into both."* `### Where a new responsibility goes` adds: *"Before adding a copy of anything, grep for it"*. It cites `cli/src/core/repoPaths.ts` as the worked cost of private copies that drifted. The two bodies are identical today, but nothing ties them together. If one is later taught to handle a YAML-escaped quote and the other is not, the cron that `--upgrade-workflows` carries and the pin that `doctor` reads would be parsed differently, and no compiler error or test would catch it.

**Fix.**

1. Add a new module `cli/src/core/yamlScalar.ts` (a small single-purpose `core/` module, like `cli/src/core/nameList.ts`). Open it with the module header `cli/src/` requires (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *A module under `cli/src/`*), stating that it owns reading a single-line YAML scalar's quoted value. Export one pure function:
   ```ts
   export function unquoteYamlScalar(value: string): string {
     const quote = value[0];
     return (quote === "'" || quote === '"') && value.length >= 2 && value.endsWith(quote) ? value.slice(1, -1) : value;
   }
   ```
2. In `cli/src/remote/githubActions.ts` → `renderedCliVersions`, replace the two inline lines with `const value = unquoteYamlScalar(match[1] ?? '');`, imported from `../core/yamlScalar.js`.
3. In `cli/src/generators/githubWorkflows.ts` → `cronExpression`, replace the body after `.trim()` with `return unquoteYamlScalar(line.replace(CRON_LINE, '').trim());`, imported from `../core/yamlScalar.js`.
4. The behaviour does not change, so the existing cases in `cli/test/init.test.mjs` (the cron carry) and `cli/test/doctor.test.mjs` (the pin read) still cover both callers. No new test file is required, and none needs to be run from this finding.
