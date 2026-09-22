# Delivery exceptions

An exception is anything that stops a parcel completing its planned route. Each one writes an `X`-family status code into the event stream described in `tracking.md` and, where the shipper must act, notifies the shipper's webhook subscription.

## Exception codes

The `X` family names the case rather than the remedy: an unreadable label, a refused delivery, an address that does not exist, a parcel over the dimensional limit of the lane it was planned onto, a missort found downstream, damage found at inbound scanning. The remedy is a separate decision and is recorded as its own event when it is taken.

A parcel may carry several exceptions in its history and at most one open one. A second exception raised while one is open replaces it and is recorded as a replacement, because a parcel held for two reasons is released by resolving the later one.

## Redelivery attempts

A delivery that fails at the door is retried on the next working day, twice, and the parcel then goes to the holding depot. Each attempt writes a `D`-family event carrying the attempt number, and the exception is opened only after the third failure — the first two attempts are ordinary delivery events and deliberately do not notify.

A recipient may cut the attempts short from the tracking link, either by nominating a collection point or by authorising a safe place. Both are recorded against the parcel and both close the delivery without a further attempt.

## Returns to sender

A parcel returns to sender when its open exception is unresolved after ten working days at the holding depot, when the shipper authorises a return, or when the recipient refuses it. A return is planned as a fresh route from the holding depot to the shipment's origin address and is charged as a new shipment at the account's rate card.

The returned parcel keeps its original shipment identifier and its original label. Its events continue in the same stream with the `R` family, so a shipper reading the stream sees the outbound and the return as one history rather than two shipments.

## Claims for a lost parcel

A parcel with no scan for seven working days is declared lost, which opens a claim automatically. A claim may also be opened by the shipper at any point after the promise window has passed, and either way the claim is settled against the declared value on the shipment record, capped at the service level's liability limit.

A claim settled and then followed by a scan is not reversed. The parcel is delivered or returned as normal and the settlement stands, because reversing a settlement would make the claim outcome depend on a scan that may arrive years later.
