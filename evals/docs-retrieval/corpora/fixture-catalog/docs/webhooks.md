# Webhooks

A webhook subscription pushes tracking events to an endpoint the shipper runs, so that a shipper does not have to poll the event stream described in `tracking.md`. The events are the same events; only the delivery differs.

## Subscribing to events

A subscription names an endpoint, the status-code families it wants, and the account whose shipments it covers. Families are subscribed rather than individual codes, so a code added to a family later is delivered without a subscription change. An endpoint may hold several subscriptions; each is delivered independently and a parcel matching two of them produces two deliveries.

An endpoint must answer a subscription's confirmation request before any event is delivered to it. The confirmation is repeated whenever the endpoint changes, which prevents a mistyped endpoint from receiving another account's events.

## Delivery and retries

A delivery is a single POST carrying one event. Any 2xx response is a success; anything else, including a timeout, is a failure and is retried. Retries back off — one minute, then five, then thirty, then two hours, then six — and stop after the fifth, at which point the event is marked undelivered and stays available for replay.

An endpoint that fails every delivery for an hour is suspended, and the suspension is reported against the subscription rather than against any one parcel. A suspended subscription delivers nothing and accrues undelivered events until it is resumed; nothing is discarded while it is suspended.

## Signature verification

Every delivery carries a signature header holding a hex digest over the raw request body and the delivery timestamp, keyed by the subscription's signing secret. A receiver must verify over the raw bytes, before any JSON parsing, because a re-serialised body does not reproduce the digest.

A receiver must also reject a delivery whose timestamp is outside a five-minute window, which is what makes a captured delivery non-replayable by a third party. The signing secret is rotated from the subscription, and both the old and the new secret verify for twenty-four hours after a rotation so that a receiver can roll over without dropping deliveries.

## Replaying missed events

Undelivered events are replayable for thirty days from the subscription. A replay re-sends the original event body with a fresh timestamp and a fresh signature; the event identifier is unchanged, which is how a receiver distinguishes a replay from a genuine second event.

A replay is delivered to the subscription's current endpoint, not to the endpoint that was configured when the event was raised. A receiver that has moved endpoints therefore receives its backlog at the new one, and a receiver that must not see the backlog resumes the subscription with a replay cut-off instead.
