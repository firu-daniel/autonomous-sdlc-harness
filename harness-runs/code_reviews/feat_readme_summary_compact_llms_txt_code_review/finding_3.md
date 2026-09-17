### 3. The README's *Forge-agnostic* bullet mentions "the three allowed" values without listing them, and the *Design→code* bullet dropped the check's silence

**File:** `README.md`, `## Scope and limits` → `### The shape of the system`, the bullets opening "**Forge-agnostic, which means the last step is yours.**" and "**Design→code generation is out of scope.**"

On `dev`, both bullets named the key's three values and said that nothing reports an unset key. The *Forge-agnostic* bullet had `` A `forge` key (`"github"`, `"gitlab"`, `"none"`) `` and "the configuration check speaks only when the key is *present* and is not one of the three". The *Design→code* bullet had `` A `design.source` key (`"figma"`, `"penpot"`, `"none"`) `` and "and nothing reports it".

The compacted bullets lost both facts:

- *Forge-agnostic* now ends "the configuration check speaks only when it holds a value outside the three allowed". "The three allowed" refers to values the bullet no longer lists. "It" should refer to the key, but the nearest noun is "the configuration check".
- *Design→code* no longer says that an absent `design.source` goes unreported. That fact is not at the linked destination either: `docs/config.md` §5's `design.source` row says nothing reads the key, but not that the check is silent. So the task prompt's "No fact is lost" criterion (§2, item 2) fails for this sentence.

`cli/src/config/check.ts` confirms that both keys behave the same way. Each key is optional, and the check validates its value against `FORGE_KINDS` or `DESIGN_SOURCES` only when the key is present.

**Fix.** In `README.md`, make two sentence replacements.

- [ ] In the *Forge-agnostic* bullet, replace
  "A `forge` key is declared, but nothing reads it in this release ([`docs/config.md`](docs/config.md) §5), and the configuration check speaks only when it holds a value outside the three allowed."
  with
  "A `forge` key (`github`, `gitlab` or `none`) is declared, but nothing reads it in this release ([`docs/config.md`](docs/config.md) §5). The configuration check speaks only when the key is present and holds none of those three."

- [ ] In the *Design→code* bullet, replace
  "A `design.source` key is declared, but nothing reads it in this release ([`docs/config.md`](docs/config.md) §5)."
  with
  "A `design.source` key (`figma`, `penpot` or `none`) is declared, but nothing reads it in this release ([`docs/config.md`](docs/config.md) §5). The configuration check speaks only when the key is present and holds none of those three."

Keep both bullets' bold lead words exactly as they are. `ARCHITECTURE.md` cites them by name.
