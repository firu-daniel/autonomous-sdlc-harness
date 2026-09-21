# Route planning

Quillroute decides, for every parcel it accepts, which chain of depots the parcel travels through and which courier hands it over at the end. This document covers the decision itself; the physical scanning that records each leg is in `depot-operations.md`.

## How a route is chosen

A route is chosen once, at acceptance, from the parcel's origin postcode, its destination postcode, the service level on the shipment, and the cut-off time in force at the origin depot. The planner scores every candidate chain in the zone graph and keeps the cheapest chain that still arrives inside the service level's promise window. Cost is the sum of the leg costs; a leg's cost is not the distance but the marginal cost of adding one more parcel to a vehicle that is already scheduled, which is why a longer chain through two busy depots is routinely cheaper than a short chain through a quiet one.

Two inputs are deliberately not consulted: the parcel's declared value, and whether the recipient has asked for a delivery window. Neither changes which vehicles exist, so letting them change the route would produce a plan the network cannot run.

## Zone graph

The zone graph is the set of depots and the scheduled vehicle legs between them. A node is a depot; an edge is a departure that runs on a stated pattern of days with a stated capacity in cage-equivalents. The graph is rebuilt nightly from the published vehicle schedule and is immutable for the day it covers, so two parcels accepted an hour apart are planned against exactly the same graph and a route can be replayed from the shipment record alone.

Edges carry a reliability weight derived from the last twenty-eight days of arrival scans. An edge whose weight falls below the floor is still traversable but is scored as though it cost half a leg more, which pushes the planner off a degrading lane without taking it out of service.

## Cut-off times

Every depot publishes a cut-off time per outbound lane. A parcel accepted before the cut-off is planned onto that day's departure; a parcel accepted after it is planned onto the next one, and the promise window shifts with it rather than the route changing. Cut-offs are local to the depot and are not adjusted for the origin of the shipment, so a consignment handed in at one depot ten minutes before its cut-off and an identical one handed in at a neighbouring depot ten minutes after its own cut-off will arrive a day apart.

Cut-offs move on published non-working days. The planner reads the calendar rather than the weekday, so a lane that normally runs six days a week simply has no edge on a day the calendar excludes.

## Rerouting a parcel in flight

A parcel already moving is rerouted only when a leg it depends on is cancelled, or when an exception code recorded at a depot makes the planned chain impossible — a missorted parcel found two depots past its branch point is the usual case. Rerouting re-plans from the parcel's current depot with the original destination and service level, against the graph of the current day rather than the graph the original route was planned on.

A reroute never changes the destination address. An address correction is a different operation, is rejected once the parcel has passed its final sort, and is recorded as its own event in the tracking stream.
