# Rates and charges

What a shipment costs is the rate-card price for its billable weight and zone pair, plus every surcharge that applies to it. This document covers the arithmetic; the exception charges raised after a failed delivery are in `exceptions.md`.

## Rate cards

A rate card maps a zone pair and a weight band to a price, per service level. Every account is on exactly one card at a time, and a card has an effective date: a shipment is priced against the card in force at acceptance, not at invoicing, so a card change never re-prices work already accepted.

Weight bands are half-kilogram steps to five kilograms and one-kilogram steps above that. The band is chosen by the billable weight, which is the greater of the scale weight and the volumetric weight. A shipment whose scale weight sits exactly on a band boundary takes the lower band.

## Surcharges

### Fuel surcharge

The fuel surcharge is a percentage of the rate-card price, published monthly and applied to every shipment accepted in the month it covers. It is computed on the base price alone and never on other surcharges, so surcharges do not compound.

The published percentage lags the index it tracks by one month. That lag is intentional and is stated on the invoice, because an account reconciling an invoice against this month's index will otherwise find a difference it cannot explain.

### Remote area surcharge

A flat charge applies when either the origin or the destination postcode is on the remote area list. The list is published quarterly and both ends are tested, so a shipment between two remote postcodes is charged the surcharge once rather than twice.

A postcode entering the list mid-quarter does not attract the surcharge until the next publication. A postcode leaving it stops attracting the surcharge immediately, which is the one asymmetry in the charging rules and exists so that a correction is never charged for.

## Volumetric weight

Volumetric weight is the parcel's length, width and height in centimetres multiplied together and divided by the divisor on the account's rate card. The default divisor is 5000; accounts shipping consistently dense goods are moved to 6000 on request, and the divisor is a property of the card rather than of the shipment.

Dimensions are taken from the shipment record at acceptance and re-measured at the first depot that has a dimensioning scanner. A re-measurement that moves the billable weight into a higher band raises an adjustment against the invoice and writes a tracking event, so a shipper can see the change against the parcel rather than only on the bill.
