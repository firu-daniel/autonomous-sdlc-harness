# Quillroute documentation

Quillroute is an invented parcel-routing service, and this is the index of its documentation catalog. It is the only navigation surface the index-first arm of the docs-retrieval eval is given, so a document missing from the list below is a document that arm cannot reach.

- [Route planning](routing.md) — how a parcel's chain of depots is chosen at acceptance, the zone graph it is chosen from, cut-off times, and when a parcel is rerouted in flight.
- [Shipping labels](labels.md) — the four zones of a label, what the routing barcode encodes, label stock and placement, and what a depot does with a label it cannot read.
- [Rates and charges](rates.md) — rate cards and weight bands, the fuel and remote-area surcharges, and how volumetric weight sets the billable weight.
- [Tracking](tracking.md) — the append-only event stream, the four-character status codes, how a consumer orders events and suppresses duplicates, and the estimated delivery window.
- [Webhooks](webhooks.md) — subscribing an endpoint to status-code families, the retry schedule, signature verification, and replaying undelivered events.
- [API authentication](api-auth.md) — API keys, the token exchange and its rate limit, the scope names, and how a key is rotated or revoked.
- [Delivery exceptions](exceptions.md) — the exception codes, redelivery attempts, returns to sender, and claims for a lost parcel.
- [Depot operations](depot-operations.md) — inbound scanning, sort plans and how they are reissued, handover to a courier, and bay numbering.
