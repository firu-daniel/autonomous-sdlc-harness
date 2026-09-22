# API authentication

Every call to the Quillroute shipping API is authenticated. This document covers the credentials themselves; the per-delivery signature a webhook receiver verifies is a different mechanism and is described in `webhooks.md`.

## API keys

An API key is issued against one account and is the only credential that may be created by hand. A key is shown once at creation and is stored as a digest afterwards, so a lost key is replaced rather than recovered. Keys carry an optional expiry; a key created without one never expires and is reported as such on the account's credential list.

A key is not sent on shipping calls directly. It is exchanged for a short-lived token, which is what the calls carry — the exchange is what lets a compromised call log expose at most one token's lifetime rather than the key itself.

## Token exchange

A token is obtained by presenting the API key to the exchange endpoint and is valid for one hour. The response carries the token, its expiry as an absolute timestamp, and the scopes it was granted. A client should exchange when the token has less than five minutes left rather than after a call has already failed.

The exchange endpoint is rate-limited far more tightly than the shipping endpoints, because a client exchanging on every call rather than caching the token is the failure mode that takes the exchange down. A client that hits the limit receives a retry-after value and must honour it.

## Scopes

A scope names a family of operations: `shipments:write` to accept shipments, `shipments:read` to read a shipment record, `tracking:read` to read the event stream, `webhooks:admin` to manage subscriptions, and `rates:read` to price a shipment without accepting it. A token holds the intersection of the scopes its key was granted and the scopes the exchange request asked for.

Scopes are never widened at exchange. A request asking for a scope the key does not hold succeeds with the narrower set rather than failing, so a client must read the granted scopes off the response rather than assuming it received what it asked for.

## Rotating a key

Rotation creates a second key on the account and leaves the first one working. The client moves to the new key, the account confirms that no token has been exchanged against the old key for a full day, and the old key is then revoked. Revocation is immediate for the exchange endpoint and does not invalidate tokens already issued, which is why the day of observation comes before it rather than after.

A key believed to be compromised is revoked immediately instead, and every token issued against it is invalidated with it. That is the one operation that can fail an in-flight call, and it is deliberately separate from an ordinary rotation so that the two are never confused.
