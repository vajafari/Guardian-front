# User Group — remaining work

Phase 1 (title, access type, max sessions, CIDR, buildings/persons/locations/contractors) is done and committed.

Phase 2 (menu permissions + cross-group access) is done, not yet committed:

## 1. Menu permissions (`UserGroupMenus`) — done
- Backend bug fixed: `UserGroupMenuSaveModel.MenuCode` was typed `Guid` but `DtoUserGroupMenu.MenuCode` is actually `int`, so AutoMapper had `.Ignore()`'d it and menus were never saved. Fixed the model's type and removed the `.Ignore()`.
- Frontend: a per-menu `<select>` (None/View/Edit) against the full 126-entry `UserMenuCodeConstants` tree, grouped by section (`src/data/userGroupMenus.ts`).

## 2. Cross-group visibility (`UserGroupAccesses`) — done
- Multi-select of other user groups a given group can see, via `MultiSelectDropdown`.

## 3. Admin access type — discovered, handled in frontend
- The backend (`ProcessValueOfUserGroup` in `AccountComponent.cs`) silently wipes **all six** relation types (buildings, persons, locations, contractors, menus, accesses) whenever `AccessType = Admin` — Admin groups get unrestricted access, so per-relation grants are meaningless. This is intentional backend behavior, not a bug.
- Frontend previously didn't account for this: the dialog let you set Locations/Contractors/Menus/Accesses on an Admin group, and the backend would silently discard them on save with no error. Fixed by hiding those four sections (and sending `[]` for them) whenever `AccessType = Admin`, with an explanatory note shown instead. Buildings/Persons were already correctly hidden for every non-`SomeBuildingsAndPersons` type from Phase 1.

## 4. Delete-guard error handling — found and fixed (pre-existing bug, not introduced this phase)
- `UserGroupsPage.confirmDelete` caught *any* delete failure — including the expected "can't delete, has related data" guard error — and mapped it to the page's generic list-load-error state (`hasError`), which replaced the whole list with "Couldn't load user groups" while leaving the confirm dialog stuck open. Never surfaced before because the delete guard was never actually exercised with blocking data until Menu/Access relations made it easy to trigger.
- Fixed: `deleteUserGroup` errors now map to `has-users` (1061) / `has-related-data` (1062) codes, shown inline in the `ConfirmDialog` itself (new optional `error` prop) instead of corrupting the page.

## 5. Missing backend validation (found, not fixed — debug-only, no new feature)
- `AccountingStatusUserGroupPersonsMustHaveValueBecauseOfUserGroupRole` / `...BuildingsMustHaveValueBecauseOfUserGroupRole` exist in `OperationResultEnumeration` but are never thrown anywhere. Right now you can save a group with `AccessType = SomeBuildingsAndPersons` and zero buildings/persons — a group with no effective access, with no error telling you that.

## 6. Known gap, intentionally left alone (debug-only constraint)
- `UserGroupAccessSearchAsync` (used by the delete guard) only checks the owner side (`WHERE UserGroupId IN @ids`), not the reverse `AccessibleUserGroupId` side. Deleting a group that another group references via `UserGroupAccesses` would still hit a raw unhandled FK violation instead of the clean 1062 error. Not fixed — would require a new repository method, which is out of scope for "debug only, don't add."

## Reminder
Per the user's standing instruction: during UserGroup work we only **debug** the backend (fix what's already broken) — we do **not** add new backend endpoints or infrastructure.
