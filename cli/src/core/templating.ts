/**
 * `{{token}}` substitution, for every template the CLI renders.
 *
 * **The rule this module exists to enforce: the token syntax has one definition and the
 * "every token has a value" check runs once, here.** Six modules had grown their own copy of the
 * pattern and their own four-line render loop — the wrapper scripts, the context stubs, the
 * repository-root files, the pre-push hook, the permission profile and the daemon units. Six copies
 * of a regular expression is six chances for one of them to admit a character the others do not, and
 * the failure that produces is a token left unsubstituted in a file that then ships: a permission
 * entry matching nothing, a hook that does not parse, a unit installed half-rendered.
 *
 * ## The check runs before substitution, not after
 *
 * {@link renderTemplate} names an unsatisfied token by scanning the **template**, not the output.
 * That is both stricter and more useful than scanning afterwards:
 *
 * - it names the offending token even where a later one would have masked it, and
 * - a *value* that legitimately contains `{{…}}` cannot be mistaken for an unresolved token. That
 *   case is real: a wrapper script's body is an adopter's own command line, and an adopter's command
 *   line is allowed to contain braces.
 *
 * ## `assertNoneSurvive` is opt-in, and both settings are deliberate
 *
 * The post-substitution backstop catches the one case the pre-check cannot see — a substituted
 * *value* that carried a token of its own, which would write a half-rendered file. Callers whose
 * values are paths, labels and generated markup ask for it. The wrapper-script generator deliberately
 * does **not**: its substituted value is the adopter's raw command line, so a `{{…}}` in the output
 * is content rather than a fault, and failing on it would refuse a legal command.
 *
 * Every failure here is a fault in this CLI or in its shipped assets rather than in the adopting
 * repository — a template and the module that renders it disagreeing about the token set is a
 * packaging fault — so every throw goes through {@link internal} and exits {@link EXIT.INTERNAL}.
 */

import { internal } from './errors.js';

/**
 * A `{{token}}` in a template, and the whole of what one may be named.
 *
 * Global, because both users of it consume every match: `matchAll` for the pre-check and `replace`
 * for the substitution. Neither advances `lastIndex` on this object — `matchAll` iterates a clone and
 * `replace` resets it — but `test` and `exec` would, which is why {@link containsToken} keeps its own
 * non-global copy rather than reusing this one.
 */
const TOKEN_PATTERN = /\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g;

/** {@link TOKEN_PATTERN} without the `g` flag, so a one-shot test carries no `lastIndex` between calls. */
const TOKEN_PRESENT = /\{\{[A-Za-z][A-Za-z0-9_]*\}\}/;

/**
 * Does this text still carry a token?
 *
 * For a caller checking an already-rendered string it did not render itself — the permission
 * profile's runnability check, which asks it of every generated entry, because an entry carrying a
 * leftover token matches neither `allow` nor `deny` and stalls an unattended run.
 */
export function containsToken(text: string): boolean {
  return TOKEN_PRESENT.test(text);
}

/** How {@link renderTemplate} is asked for the two behaviours that differ between its callers. */
export interface RenderTemplateOptions {
  /**
   * How a failure message names what was being rendered — a noun phrase, e.g.
   * `the wrapper template test.sh`. It is the caller's own words because the caller is the only one
   * that knows whether its text came from a template file, a shipped asset or a parsed document.
   */
  readonly describe: string;
  /**
   * Fail when a token survives substitution, i.e. when a substituted **value** carried one.
   *
   * Off by default: a caller whose values may legitimately contain braces — a wrapper script's body
   * is an adopter's raw command line — must not refuse them. On for every caller whose values are
   * paths, labels or generated markup, where a surviving token means a half-rendered file.
   */
  readonly assertNoneSurvive?: boolean;
  /**
   * The whole token set this caller can ever supply, when that is wider than the keys of `values`.
   *
   * Only the permission profile needs it: it renders one string at a time out of a parsed document,
   * where a token may be legal in the file yet have no value *in this position* — a per-wrapper row
   * token appearing outside a wrapper row. Separating the two cases is what lets the two failures
   * carry different messages, since they have different causes and different fixes. Defaults to the
   * keys of `values`, which collapses the two into one for every other caller.
   */
  readonly known?: ReadonlySet<string>;
}

/**
 * Substitute every `{{token}}` in `text`, having first checked that each one has a value.
 *
 * Returns the rendered text. Throws {@link EXIT.INTERNAL} when the text uses a token this caller
 * supplies no value for, and — under {@link RenderTemplateOptions.assertNoneSurvive} — when one
 * survived into the output.
 *
 * It takes the text rather than a path on purpose: its callers read their templates from three
 * different places (the packaged `templates/` tree, the packaged `scripts/` tree, and a JSON
 * document already parsed in memory), and a renderer that also resolved the file would have to know
 * about all three.
 */
export function renderTemplate(
  text: string,
  values: Readonly<Record<string, string>>,
  { describe, assertNoneSurvive = false, known }: RenderTemplateOptions,
): string {
  const admissible = known ?? new Set(Object.keys(values));

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const token = match[1] as string;
    if (!admissible.has(token)) {
      throw internal(
        `${describe} uses the token {{${token}}}, which this generator supplies no value for, so the template and the generator disagree about the token set`,
      );
    }
    if (!Object.hasOwn(values, token)) {
      throw internal(
        `${describe} uses the token {{${token}}} in a position this generator has no value for it in, so a half-rendered entry would have been written`,
      );
    }
  }

  const rendered = text.replace(TOKEN_PATTERN, (_whole, token: string) => values[token] as string);

  if (assertNoneSurvive) {
    const unresolved = rendered.match(TOKEN_PATTERN);
    if (unresolved !== null) {
      throw internal(
        `${describe} still contains ${unresolved[0]} after substitution, so a half-rendered file would have been written: one of the substituted values carries a token of its own`,
      );
    }
  }

  return rendered;
}
