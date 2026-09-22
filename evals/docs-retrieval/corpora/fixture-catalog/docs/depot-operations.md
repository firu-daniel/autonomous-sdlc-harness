# Depot operations

What a depot does with a parcel between the vehicle that brought it and the vehicle that takes it away. The route the parcel is following was decided at acceptance and is described in `routing.md`; nothing in this document changes it.

## Inbound scanning

Every parcel is scanned at the door, before it reaches the sorter. The inbound scan resolves the routing barcode against the shipment record, confirms that this depot is on the planned chain, and writes a `T`-family event. A parcel that scans but is not on the planned chain is a missort and is diverted to the manual handling bay with an exception code rather than being put back on the sorter.

A parcel that does not scan after three attempts is a label rejection and follows the handling in `labels.md`. Damage visible at the door is recorded at this point and not later, because a parcel photographed at inbound is the only evidence that separates damage in transit from damage before acceptance.

## Sort plans

A sort plan maps a destination postcode to an outbound bay, and is issued per depot per shift from the day's zone graph. It is not derived at the sorter from the parcel's route: the plan is the same for every parcel in the shift, which is what makes a mis-set chute a detectable pattern rather than a scatter of unrelated missorts.

A plan is reissued mid-shift when a lane is cancelled. Parcels already sorted to the cancelled lane's bay are pulled, rescanned and re-sorted under the new plan, and each one takes a reroute event.

## Handover to a courier

The final leg is handed to a courier as a manifest: a list of shipment identifiers, the sequence they were loaded in, and the bay they were loaded from. The courier scans each parcel onto the vehicle, and a parcel on the manifest that does not scan is left behind and reported before the vehicle departs rather than after it.

Handover transfers responsibility. Every event after the loading scan is raised by the courier's device rather than by the depot, and a parcel that needs to come back to the depot returns as a new inbound scan rather than by reversing the handover.

## Bay numbering

Bays are numbered clockwise from the inbound door. Numbering is per depot and is not comparable between depots.
