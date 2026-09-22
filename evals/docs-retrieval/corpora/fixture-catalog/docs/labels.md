# Shipping labels

Every parcel Quillroute carries travels under one label, printed once by the shipper and never reprinted in the network. This document describes what is on that label and what happens when a depot cannot read it.

## Label anatomy

A label is a fixed 150 by 100 millimetre area with four zones in a fixed order top to bottom: the recipient block, the service block, the routing barcode, and the shipper's own reference area. The first three are laid out by Quillroute and may not be moved, resized or re-ordered; the reference area is the shipper's and may hold anything that fits, including a second barcode in the shipper's own symbology.

The service block prints the service level in words as well as its two-letter code, because a depot handler reading a damaged label needs a value that survives partial loss. The recipient block prints the destination postcode twice, once in the address and once in a large sort-friendly form at the top right.

## The routing barcode

The routing barcode encodes the shipment identifier and nothing else. It is deliberately not a container for the destination, the service level or the weight: those live in the shipment record, every depot scanner resolves the identifier against that record, and a barcode that carried a copy would let a relabelled parcel disagree with its own record.

The symbology is a linear code with a check digit, chosen so that a partially obscured label still scans from the surviving half. The identifier is twelve characters, the first two of which name the accepting depot, which lets a misrouted parcel be returned to its origin even when the record lookup is unavailable.

## Printing and label stock

Labels print at 203 dots per inch or better onto a thermal stock rated for the temperature range the network runs at. Ink-jet and laser output on plain paper is accepted at acceptance points but is refused for parcels planned onto a chilled lane, where condensation lifts the print inside a single leg.

A label must be applied flat to the largest face of the parcel, clear of seams, tape and the edge by at least ten millimetres. A label wrapped around a corner is the single most common cause of an unreadable barcode at inbound scanning.

## When a label is rejected

A depot rejects a label when the barcode does not scan after three attempts, when the check digit fails, or when the identifier resolves to a shipment that is already recorded as delivered. Each rejection writes an exception code against the parcel and diverts it to the manual handling bay.

A rejected label is not reprinted by the depot. The parcel is held, the shipper is notified through the shipment's webhook subscription, and the shipper either supplies a replacement label or authorises a return to sender. Holding rather than reprinting is deliberate: a depot-printed label would carry a new identifier and break the tracking stream the recipient is already watching.
