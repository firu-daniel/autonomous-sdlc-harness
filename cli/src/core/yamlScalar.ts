/**
 * Reading a single-line YAML scalar's value with its one matching pair of quotes removed.
 *
 * The rule this module exists to enforce: the pin `doctor` reads from `harness-run.yml`
 * (`remote/githubActions.ts` → `renderedCliVersions`) and the schedule `--upgrade-workflows` carries
 * into `harness-resume.yml` (`generators/githubWorkflows.ts` → `cronExpression`) are unquoted by one
 * definition, so the two cannot come to parse the same quoting differently.
 */

/** `value` without one matching pair of surrounding `'` or `"`; unchanged when it has none. */
export function unquoteYamlScalar(value: string): string {
  const quote = value[0];
  return (quote === "'" || quote === '"') && value.length >= 2 && value.endsWith(quote) ? value.slice(1, -1) : value;
}
