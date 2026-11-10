# Retire the Ideas Comments module

Ideas Comments shipped as an experiment last spring. Usage has stayed under one percent of active users for two quarters, and product has decided to retire it so the team can focus on the new Ideas Review flow.

- Delete the Ideas Comments module: its screens, its store slice, its API client and their tests.
- Remove its entries from the route registry and the navigation menu.
- Remove its localization keys from every locale file.
- Keep the database table for now; a separate migration will drop it after the data export is confirmed.

Every remaining test must still pass.
