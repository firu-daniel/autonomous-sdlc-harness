# QA test scenarios

_Written once by `autonomous-sdlc-harness init`, and yours from there on: a checked-in file like any
other — edit it, review it, and a re-run keeps your copy. The harness keeps no private copy of it and
reads nothing in its place, so what you write here is what the agents that plan and run the
interactive test phase act on._

The single source of truth for this project's **test-scenario rules**: the techniques a test uses to
reach a state the seed data does not hold, plus whatever this project's own rules say a test account
may see. Fill in the banner sections; the techniques are already written — keep the ones
this project's account model supports and delete the rest.

This file holds the **rules**; the **account-specific values** live in `{{credentialsPath}}`. Keep that
split — a fact true of one account belongs there, a rule true of every account belongs here — or the
two drift and a test believes the stale one.

## Cross-account visibility rules, if this project has any

> _Optional — delete this section in a project where one account's view of another is not gated, or
> which has one account._ Describe your project's own rule in the product's own wording, so a test and
> the product cannot disagree about what "gated" means: what must be true of one account for another
> account's gated surfaces to open to it, which surfaces those are, and which stay open to everyone
> regardless. Then give **one line per state a gated surface can be in** in this product — however
> many that is — saying how the surface is expected to read in each.

Those state lines let a test tell an **expected gated or empty state** apart from a **real defect** on its own: an
unwritten state is one a test reports rather than guesses at, so a state left out costs false findings,
not silence.

## QA techniques — work around single-session and sparse-seed limits

A test session drives **one** account at a time — where this project has accounts at all — and starts
from whatever data is already there. **Neither limit is, by itself, a reason to skip a test, raise a
clarification, or report `blocked`.** Most scenarios that *look* untestable are reachable by creating
the data through the interface first, or — in a project with more than one account — by sequencing
actions across them. The techniques below are doctrine wherever they apply: the planner designs tests
around them and the test agent executes the resulting steps — signing in as a peer and creating setup
data are **expected execution**, not improvisation — so reach for them **before** falling back to a
clarification (planner) or a `blocked` outcome (tester). The ones marked **multi-account** presuppose
more than one account: delete them in a project that has a single account or none, exactly as you
delete the visibility section above.

### Logging out (how to switch users) — multi-account

> _Optional — delete this technique in a project with a single account, or none._

Any test that must act as more than one account signs the current one out before signing the next one
in. Where that control lives is product-specific — describe your own path to it once, here, so every
test takes the same route to it rather than each rediscovering one.

To confirm which account a session is signed in as, compare against `{{credentialsPath}}`, whose keys are
grouped one block per account: the identifying value is read from that account's block at run time.
Never restate a key name or a value here — a copy is a second source of truth for something that
already has one.

### Sequential peer verification (instead of two live sessions) — multi-account

> _Optional — delete this technique in a project with a single account, or none._

Two accounts cannot be driven **simultaneously**, but a cross-account effect is still verifiable: act
as the first account, then sign out and sign in as the peer. The live-update part of the assertion is
observed in the **acting** account's own session; the peer sign-in confirms only that the write
**persisted** and is **visible to the other account**. Choose the acting/peer pair so the acting
account can actually reach the peer's surface under whatever visibility rules this project states
above.

### Bootstrap missing test data through the UI

When a scenario needs more data than the seed provides **and that data is creatable through the
product by a test account**, create it as a setup step and then exercise the behaviour — do **not**
call the test untestable. This is the rule for any threshold-crossing behaviour: bring the state past
the threshold through ordinary product actions first, then assert.

**Seeding a peer's or gated surface — act as an account that can write it (multi-account only — skip
this paragraph in a project with a single account, or none).** A surface the account under test
cannot yet write to is still seedable: sign in as an account that **can** write it, create the data,
sign out, and run the actual test as the intended account. Do not fall back to a weakened
assertion about an empty surface when the surface can simply be seeded. The same freedom runs in
reverse for a test that needs an **empty** state: remove the data as the account that owns it. Setup
writes go to the same backend any test submission does — acceptable for testing, and not something to
clean up afterwards.

### Failure / error paths that need a real backend call to fail are not automatable — report `blocked`

Some behaviour only appears when a backend operation **fails** — an optimistic entry rolling back, an
error state on a rejected submission. If your environment offers no reliable way to force that failure,
the behaviour is **not automatable**: the test agent reports it **`blocked`** (a documented assumption,
not a park — no fix loop), and the planner does **not** author such a test, noting the coverage gap
instead. This is an environment limitation, not a defect in the work under test.

Fall back to `blocked` (tester) or a clarification (planner) only when the state is **genuinely not
reachable** through the product — it needs an account that does not exist, a privilege the test
accounts do not have, or backend state no test action can produce. **Sparse but creatable** seed data
is not such a case.

## Per-user facts

> _Optional — delete this section in a project with a single account, or none._
>
> _Describe here which per-account facts your tests depend on_ — the relationships between the test
> accounts, which account holds which rights or limits, and anything else true of one account and
> not the others. Then keep the **values** for them in `{{credentialsPath}}`, single-sourced next to the
> account they belong to, and name them here only as the kinds of fact a test may rely on.

## Scope

Covers the visibility rules above and the single-session / sparse-seed techniques, and nothing else: it
is not a seed-data specification, and it does not describe how a test signs in, which is the test
agent's own contract. Note here anything you deliberately leave out, so a later reader can tell an
intentional gap from a missing one.
