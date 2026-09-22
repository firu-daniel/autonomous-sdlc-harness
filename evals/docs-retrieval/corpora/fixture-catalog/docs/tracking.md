# Tracking

Everything that happens to a parcel is recorded as an event against its shipment identifier. This document describes the event stream a shipper reads; the push delivery of the same events is in `webhooks.md`.

## Tracking events

An event is a status code, a timestamp, the depot or courier that raised it, and an optional free-text detail line. Events are immutable once written. A correction is a new event carrying the corrected value, never an edit of the event it corrects, so the stream is an append-only history rather than a current-state document.

The stream is the only place a parcel's history is recorded. A reroute, an address-correction refusal, a re-measurement that changed the billable weight and a label rejection all appear here, each as its own event with its own code.

## Status codes

Status codes are four characters: a letter naming the family and three digits naming the case. The families are `A` for acceptance, `T` for transit, `D` for delivery, `X` for exception and `R` for return. A consumer that does not recognise a code is expected to fall back to the family letter, which is why the family is the first character rather than a separate field.

The codes in the `X` family are shared with the exception handling described in `exceptions.md`, and a code is never reused across families. A code retired from the published list stays valid in historical events for seven years.

## Event ordering and duplicates

Events carry the timestamp of the scan that raised them, not the time they were received, and depot clocks drift. A consumer must therefore sort by timestamp and must not assume that the order events arrive in is the order they occurred in. Two events sharing a timestamp are ordered by the sequence number the stream assigns on write.

A duplicate is an event with the same code, depot and timestamp as one already in the stream. Duplicates are suppressed on write when they arrive within the deduplication window and are otherwise recorded, because a genuine second scan at the same depot is meaningful — an outbound scan after an inbound one on the same lane is the usual case.

## Estimated delivery window

The estimated delivery window is derived from the planned route and the service level's promise, and is recalculated whenever an event changes the remaining route. It is a window rather than a time, and the window narrows as the parcel moves: at acceptance it spans a day, after the final sort it spans a few hours.

The window is an estimate and is not the promise the service level carries. The promise is fixed at acceptance and does not move when the estimate does, which is the distinction to preserve when surfacing both to a recipient.
