### 2. Other sibling run copies must keep their trio `Edit` protection, by exact path, once the base's glob `Edit` rules are dropped

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`run_profile_entries`) — "sib=\"${sib}${line}	entry	deny"
**Also:** `docs/cli.md` §6 → residual 12, **Linux placeholders: the interim position on a bubblewrap host**, its **What a run cannot rely on** bullets, and the per-run-profile bullet "on a bubblewrap host, the three trio entries taken out of the base, re-rooted at every other sibling clone by exact path"; `docs/watcher.md` → `### The per-run profile`, **What it adds.**, "their `Edit` rules kept", and the bullet "the last three as `Edit` rules alone on a bubblewrap host".

**What is wrong.** This was checked against the current tree. The base profile allows `Edit(//<work_root>/<project>-*/**)`. Today the base's glob `Edit` rules for the trio deny it at every sibling. Finding 1 removes those glob rules from the per-run copy on a bubblewrap host. Without an exact replacement, the file tools could then plant a `commondir` with content in **another** run's clone, a parked run's for example. The watcher would refuse that clone at its next resume. A person running git in that folder, from a terminal or an IDE, would still follow it, which is code execution through that repository's config.

The current code already emits the replacement. On a placeholder host, `run_profile_entries` prints `<sibling>/<p>	entry	deny` for each trio row at every other sibling whose `.git` is a real directory, the run copy excluded with `-ef`. `run_profile_render` gives each `entry deny` line both `Edit` forms. Session 1 measured the sibling's exact paths among the 18 rules. What is missing:
- a guarantee that Finding 1's drop never removes these rules;
- a test that pins them;
- the docs, which still describe the glob `Edit` rules as "kept" and the sibling `denyWrite` entries as mounting placeholders.

AP6 measured that the sibling's exact entries mount **no** placeholder, because the sibling sits outside every write root of the session.

**Fix.**

1. **Code.** Keep the sibling lines as `entry deny`. They come from the same pass and the same sibling set as the exact `denyWrite` entries: every other sibling directory whose `.git` is a real directory, the run copy excluded. Each line yields `Edit(/<sibling>/<p>)` and `Edit(/<sibling>/<p>/**)`.
   - Finding 1's `Edit`-drop step removes only base strings carrying a `*`. Confirm that no exact sibling rule can match it.
   - Restate the reason in `run_profile_entries`' header bullet for the sibling lines: the file tools' `Edit(//<work_root>/<project>-*/**)` allow, and what a person's git there would follow.
   - Keep the existing per-path condition that `<d>/<p>`'s parent directory exists. It is already a documented residual: a sibling with no `.git/objects/info` gets no line for `http-alternates`.
2. **Tests.** In `cli/test/watcher-run-profile.test.mjs`, alongside Finding 1's placeholder-host case, add a case where a second sibling clone exists. On a placeholder host, the rendered `permissions.deny` must carry both `Edit` forms for each of that sibling's three trio paths and no `Edit` rule for the run copy's own three. Off a placeholder host, the render must be today's. Run that file alone.
3. **The self-adopted copy.** If the watcher template changed in this finding, copy it onto `scripts/autonomous-watcher.sh` byte for byte and `cmp` the two.
4. **`docs/cli.md` §6.** Edit in the existing style, marking each claim *measured* or *derived*:
   - The per-run-profile bullet "on a bubblewrap host, the three trio entries taken out of the base…" and the bullet "on a clone, the six `.git` paths above at the clone's exact path (three of them on a bubblewrap host)" must say that on a bubblewrap host the run copy's own trio has neither a `denyWrite` entry nor an `Edit` rule. The base's glob `Edit` rules for the trio are also dropped. Each other sibling clone gets the trio as exact `denyWrite` entries **and** exact `Edit` rules, both forms. Cite Finding 1's control measurement: 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0, `docs/sandbox-verification.md` §5, the new control row.
   - Residual 12's **What a run cannot rely on**:
     - Restate the first bullet ("the sandbox refusing a write to the three run-copy trust files") so the run copy's file tools are included too: neither the sandbox nor the file tools refuse a write there on a bubblewrap host.
     - In the bullet "a sibling's absent trio paths staying absent during a sandboxed call: … a placeholder is mounted there", replace the derived placeholder claim with AP6's measurement: no placeholder appears at a sibling's paths, because a deny entry outside every write root gets none (session 1, 2026-10-30). Mark the general rule *derived* from that one measurement.
     - Keep the bullet on a sibling created after the spawn, and add the **cost** the user stated: on a bubblewrap host the one-run-per-repository cap means no run copy is cut mid-session, so a later sibling can only be one a person made.
     - Residual 9 ("every other `.git` file but the six protected paths stay sandbox-writable"): add that on a bubblewrap host, three of the six are writable from inside the sandbox and by the file tools in the run copy itself, and that the trust check and launch check are what stand there.
5. **`docs/watcher.md` → `### The per-run profile`.** Replace **What it adds.**'s "their `Edit` rules kept" and the clone bullet's "the last three as `Edit` rules alone on a bubblewrap host" with the new treatment. Extend the sibling bullet so it names both lists, and drop its "AP1–AP6 owed" wording in favour of the owed set Finding 6 records (AP1–AP7 plus the `dd` row).

To find any sentence these two lists miss, run `git grep -n -e 'Edit` rules kept' -e 'as `Edit` rules alone' -e 'their `Edit` rules stay' -- docs cli README.md ARCHITECTURE.md`. Every hit outside `docs/sandbox-verification.md`, which is Finding 6's, is this finding's or Finding 1's.
