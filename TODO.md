# User Group — remaining work

Phase 1 (title, access type, max sessions, CIDR, buildings/persons/locations/contractors) is done and committed. Left:

## 1. Menu permissions (`UserGroupMenus`)
- Biggest remaining piece: a UI to assign access level per system menu item, against the full `UserMenuCodeConstants` tree on the backend.
- Backend bug to fix before this is usable: `UserGroupMenuSaveModel.MenuCode` is typed `Guid` but `DtoUserGroupMenu.MenuCode` is actually `int`. Right now the AutoMapper map ignores `MenuCode` entirely (`.Ignore()` in `AutoMapperProfile.cs`) because of this mismatch — menus are never actually saved. This needs fixing in the backend model, not worked around in the frontend.

## 2. Cross-group visibility (`UserGroupAccesses`)
- Which other user groups a given group is allowed to see/manage. No frontend built yet.

## 3. Missing backend validation (found, not fixed — debug-only, no new feature)
- `AccountingStatusUserGroupPersonsMustHaveValueBecauseOfUserGroupRole` / `...BuildingsMustHaveValueBecauseOfUserGroupRole` exist in `OperationResultEnumeration` but are never thrown anywhere. Right now you can save a group with `AccessType = SomeBuildingsAndPersons` and zero buildings/persons — a group with no effective access, with no error telling you that.

## Reminder
Per the user's standing instruction: during UserGroup work we only **debug** the backend (fix what's already broken, like #1 and #3 above) — we do **not** add new backend endpoints or infrastructure.
