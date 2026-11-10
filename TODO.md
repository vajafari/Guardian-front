# Guardian frontend — remaining work

## Camera — done and verified end-to-end against a live backend

Standalone hardware-registry module, structurally almost identical to Device (flat entity: Title/IP/Port/Location/ModuleId-flags/IoType/IsActive, plus UserName/Password/CameraProducer/CameraTask/RtspString/ApiBasicAuth* fields). No child/aggregate collection, so no detail page — flat GridView page + dialog, same shape as `PersonGroupsPage`/`BuildingSpacesPage`.

**No backend bugs found this time** — `CreateMap<CameraSaveModel, DtoCamera>()` already existed and `CameraComponent`'s add/update/delete logic is clean.

**Verified in the browser (Edge via Playwright):**
- Added a camera (Hikvision/FaceRecognition, Elevator + Base module flags) against an existing Location; confirmed the `core.Camera` row via direct SQL, including `CameraSettingsInJson` landing as `'{}'` (NOT NULL column, same trap as `Device.DeviceSettingInJson` — this form doesn't expose per-vendor settings either, so always sends `{}`).
- Edited it (title + IoType) — fields came back correctly pre-filled, and the change round-tripped (confirmed via SQL).
- Deliberately submitted an invalid IP address (`"not-an-ip"`) — correct mapped message ("IP address is not valid", 13602) rendered in the dialog.
- Deleted it — confirmed the row is gone via SQL.

### Not yet done
- `DeviceDoorBase`'s `ReaderCameraId` field is still out of scope for this pass (the Device module's door form doesn't expose a camera picker) — could be revisited now that a Camera module exists, but wasn't requested.

## PersonGroup — done and verified end-to-end against a live backend

Logical groupings of persons for bulk access grants elsewhere. Simplest aggregate shape so far: no nested child table, just a flat `personIds` full-replacement list bundled directly into the same `Add`/`Save` call (`PersonGroupController.Add`/`Save` call `PersonGroupComponent` then `PersonComponent.GroupPersonsUpdateAsync` in sequence, same full-replacement pattern as `ElevatorFloorPerson`).

**Two real backend bugs found and fixed (both in `Guardian-back`, one commit) — PersonGroup add/update had never worked on this backend before this session:**
1. `PersonGroupSaveModel.Id` was typed `int` with `[LocalizedRequired]`, while `DtoPersonGroup.Id` (and every other entity's id) is `Guid` — client-generated ids were being silently discarded/rejected.
2. `CreateMap<PersonGroupSaveModel, DtoPersonGroup>()` didn't exist at all in `AutoMapperProfile.cs` (not even commented out) — `mapper.Map<DtoPersonGroup>(model)` always threw, surfaced as a generic 500.

**Verified in the browser (Edge via Playwright) after both fixes:**
- Added a group with 2 persons selected via the `MultiSelectDropdown`; confirmed `core.PersonGroup` (1 row) and `core.PersonGroupPerson` (2 rows) via direct SQL.
- Reopened the group for edit — the person picker correctly pre-filled ("2 selected"), confirming the full-replacement round-trip.
- Deliberately reused an existing group's title on Add — correct mapped message ("This title is already used by another group", 35000) rendered in the dialog.

### Not yet done
- `PersonGroupLocation` has a `CreateMap` and DTOs on the backend but **no controller action anywhere** exposes it — same "business/mapping ready, no exposed endpoint" gap as Attendance. Out of scope for this pass.

## Elevator + ElevatorFloor + ElevatorFloorPerson — done and verified end-to-end against a live backend

Aggregate pattern like Contract: `Elevator`'s own save bundles its `ElevatorFloors` in one call (`ElevatorFloorController` has no standalone Add/Update/Delete at all — floors are never managed except through the elevator). Floor↔person access is a separate full-replacement many-to-many in both directions; only the floor-centric direction (`SaveElevatorFloorPersons`, manage persons from the elevator's detail page) is built — person-centric (`SavePersonElevatorFloors`, would live on `PersonDetailPage`) is deferred, not started.

**Attendance was considered first and deferred**: `AttendanceController` has zero endpoints for listing/searching attendance records (only Hook-reset and Delete actions), even though `AttendanceComponent`'s `AttendanceGridSearchAsync`/`GetCountAsync` (and the `InvalidAttendance`/`ParkingAttendance` equivalents) are fully implemented and ready — nothing in any controller calls them. Building a report page would require adding a new GridView controller action (not a bug fix, new backend surface) — user chose to skip for now rather than decide on that tradeoff immediately.

**Verified in the browser (Edge via Playwright):**
- Created an elevator (3 floors: Ground/First/Second) against the existing test building/location; confirmed all rows in `core.Elevator`/`core.ElevatorFloor` match what was entered.
- Detail page shows floor count, building/location (resolved via local lookup — `GetById`/`Search` don't join those titles, only the GridView row does), valid-floors list, and the floors table with live `PersonCount`.
- Opened "Manage people" on a floor, assigned a person via the full-replacement endpoint, confirmed the floor's `PersonCount` updated from 0 → 1 on reload.
- Reopened the elevator for edit — all 3 existing floors came back pre-filled (titles + numbers), confirming the aggregate round-trip.
- Deliberately added a 4th floor reusing an existing `ActualFloorNumber` — correct mapped message ("A floor's actual or hardware number is already used on this elevator", 33505) shown.
- Backend quirk handled: unlike every other aggregate module built so far (Contract), `ElevatorComponent.ElevatorUpdateAsync` classifies a floor as "new" by checking `Id == Guid.Empty` specifically, not just "not found in the existing set" — so newly-added floor rows are sent with the all-zeros GUID, not a client-generated `crypto.randomUUID()`.

### Not yet done
- Person-centric floor assignment (`SavePersonElevatorFloors`) — would need a new section on `PersonDetailPage`/`EditPersonPage`; deferred, not started.
- `ValidFloorsInJsonFormat`'s exact product meaning wasn't fully clear from the backend alone (no logical validation touches its contents) — exposed as a plain comma-separated number input; revisit if it turns out to mean something more specific.

## Device + DeviceDoorBase — done and verified end-to-end against a live backend

Hardware configuration layer: what physical access-control device sits at a Location, and which doors/readers it exposes. Scope deliberately excludes vendor/SDK internals (`ProducerEnumeration`-specific settings, `DeviceSettingInJson`'s per-type config) and `ReaderCameraId` (no `Camera` module exists yet) — same spirit as earlier modules' scope cuts.

**Two real backend bugs found and fixed (both in `Guardian-back`, separate commits) — Device add/update had never worked on this backend before this session:**
1. `DeviceComponent.AddDeviceAsync` looked up `DeviceType` by `entity.Id` (the new device's own fresh id) instead of `entity.DeviceTypeId` — always threw "device type not found".
2. `CreateMap<DeviceSaveModel, DtoDevice>()` was commented out in `AutoMapperProfile.cs` — `mapper.Map<DtoDevice>(model)` always threw, surfaced as a generic 500.

**One frontend bug found and fixed (my own mistake):** `core.Device.DeviceSettingInJson` is `NOT NULL` in the database, but the save payload omitted it entirely (defaulting to `null`), so every insert failed at the SQL layer — looked like a hang from the browser (the dialog just sat on "Saving..."). Fixed by always sending `deviceSettingInJson: '{}'` (the UI doesn't expose per-vendor settings, so an empty JSON object is the correct "no settings" value — `DtoDeviceSettings`'s fields all default safely).

**Verified in the browser (Edge via Playwright) after both fixes:**
- Added two devices (`ZK Standard Device` seeded manually into `core.DeviceType` — see below — plus a `Location` created through the existing Locations UI) with `ModuleId` flags (checkbox multi-select on a bitmask) round-tripping correctly.
- Opened a device's detail page, added a door with a reader-device picker (the other device), confirmed it lists with the joined reader title.
- Deliberately triggered the duplicate-door-number validation (4539) — correct mapped message shown.
- `/devices` GridView list renders correctly with Title/Device #/Device type/Location/Connection mode/Active columns.

**Dev-database gaps uncovered (not bugs, just empty reference data that nothing had surfaced before since every prior field needing them was optional):**
- `core.Location` had zero rows — Contract/BuildingSpace's Location pickers are optional so this was never visible before. Added two rows through the existing Locations UI during testing.
- `core.DeviceType` had zero rows and **has no CRUD UI anywhere in the app** (backend is read-only catalog, `DeviceTypeController.GetAllDeviceTypes` only) — seeded one row directly via SQL (`DeviceTypeNumber 9001, "ZK Standard Device", Producer=Zk`) so the picker had something to select. Real device types presumably need to come from a proper seed script or admin tooling that doesn't exist yet.
- Also noticed `DeviceRepository.GetFirstUnusedDeviceNumberAsync`'s gap-finding SQL query returns no rows (hence `ExecuteScalar`'s CLR default, `0`) when `core.Device` is completely empty — the prefilled "Device #" was `0` on the very first add, not `1`. Minor, easily overridden in the editable field (did so in testing); not fixed since it's a narrow edge case, flagging here rather than spending another round-trip on it.

### Not yet done
- Camera-backed doors (`ReaderCameraId`) — no `Camera` module in the frontend yet.
- Per-vendor `DeviceSettingInJson`/`DeviceSpecificDoorSettingInJson` configuration — out of scope for this pass, same as other modules' JSON-blob fields.

## BuildingSpace + Contract — done and verified end-to-end against a live backend

Built per the approved plan (`playful-wondering-fountain.md`): `tsc -b && vite build` and `npm run lint` are clean, and verified with a real login + browser run (Edge via Playwright) against the running `Guardian.Api` + dev SQL Server:
- Created an Exclusive parking space and a Shared hall; GridView list, live column filter, and sort all confirmed working against the real `BuildingSpace/GridView` endpoint.
- Created a Contract against a `BuildingUnit`, added a `ContractPerson` (Principal) and a `ContractPaymentDetail` (Deposit/Monthly); re-opened it for edit and confirmed both children round-tripped through `AggregateSave` → `GetById` correctly, and that `ShareUnit` renders read-only in edit mode as designed.
- Deliberately triggered the duplicate-space-number (4514) and duplicate-contract-number (4603) backend validations — both surfaced the correct mapped message in the dialog.
- Confirmed `/floors/:id` loads cleanly (Units section only, no crash) now that the dead nested fields are gone.
- Left ~10 test rows (`Test Parking/Hall/Contract ...`) in the dev database from this run — not cleaned up, ask if you want them removed.

### 1. BuildingSpace — replaces the dead ParkingSpot/StorageRoom modules
- Discovered `BuildingParkingSpotController`/`BuildingStorageRoomController` no longer exist on the backend (replaced by a unified `BuildingSpaceController`/`core.BuildingSpace` table, governed by `SpaceNature`: Exclusive/Shared). The frontend's old `buildingParkingSpotService.ts`/`buildingStorageRoomService.ts` and their `FloorDetailPage` sections were calling dead endpoints (404) and `BuildingFloorFullInfo.parkingSpotsFullInfo`/`.storageRoomsFullInfo` didn't even exist on the real response anymore (crashed on `.length` of `undefined`).
- Deleted both dead modules entirely (types, services, form dialogs, config endpoints, i18n blocks) and the two sections from `FloorDetailPage.tsx` (Units section untouched).
- Added `BuildingSpace` as its own top-level GridView page (`/building-spaces`, sidebar entry) — same treatment as `Contractor`/`UserGroup`, since the backend exposes a full `Search`/`GridView`/`GridViewExcel` surface for it (this was a judgment call, flagged to and approved by the user, not something they explicitly specified).
- Added `searchBuildingUnitsByBuilding` to `buildingUnitService.ts` (new — units were previously only ever loaded nested under a floor); used for the space's Owner-Unit picker and reused by Contract's Unit-target picker.

### 2. Contract — ownership/rental contracts on a unit or exclusive space
- New top-level GridView page (`/contracts`, sidebar entry). Uses the backend's `AggregateSave`/`AggregateUpdate`/`AggregateDelete` (bundles `ContractPersons`/`ContractPaymentDetails` children in one POST), not per-child endpoints — same pattern as `UserGroupFormDialog`'s relation arrays.
- `ContractFormDialog` is the biggest new piece: Building → target-type radio (Unit/Space) → Unit or exclusive-Space picker scoped to that building; `ContractType`-driven `ShareUnit` visibility (ownership only, locked read-only once set per `ContractStatusContractShareUnitCanNotBeChanged`); local mini-tables for `ContractPersons` (person/role/share) and `ContractPaymentDetails` (type/period/day/amount), bundled into the aggregate payload on submit.
- Edit flow fetches `GetById` (always returns full `ContractPersons`/`PaymentDetails`) and merges it with the grid row's joined building/target titles, since neither response alone has both.
- All 22 `ContractStatus*` + 13 `BuildingStatusBuildingSpace*` backend error codes are mapped to per-code i18n messages in all three locales (fa/en/ar).

### Not yet done
- `SettingsInJson` (BuildingSpace's per-type advanced JSON config) is intentionally left out of the form — out of scope for this pass.
- Only the "unit" target path and the "purchase" contract type were exercised in the browser; the "space" target and usage-type (Rent/OwnerUse) paths, plus the usage-period-overlap (4620) and share-amount (4614-4617) validations, are implemented per the backend's rules but not individually click-tested.

## Open questions

### "User services" module — not started, scope unclear
The user listed "user services" alongside Person/Building/Contractor/Location/UserGroup/Users/change-password
as something that should be developed, but it doesn't map to any existing page, route, or a backend
controller of that name. `AccountController` (backend) has several pieces beyond basic user CRUD that
could be what this means — needs clarifying with the user before starting:
- OTP/2FA admin management: `GetAppOtpStatus`, `UpdateAppOtpCode`, `ClearAppOtpSecretKey` — no UI yet.
- Bulk user operations: `CreateBulk`, `AssignUserGroupBulk` — no UI yet.
- Something else not yet identified.

## User Group — remaining work

Phase 1 (title, access type, max sessions, CIDR, buildings/persons/locations/contractors) is done and committed.

Phase 2 (menu permissions + cross-group access) is done and committed:

### 1. Menu permissions (`UserGroupMenus`) — done
- Backend bug fixed: `UserGroupMenuSaveModel.MenuCode` was typed `Guid` but `DtoUserGroupMenu.MenuCode` is actually `int`, so AutoMapper had `.Ignore()`'d it and menus were never saved. Fixed the model's type and removed the `.Ignore()`.
- Frontend: a per-menu `<select>` (None/View/Edit) against the full 126-entry `UserMenuCodeConstants` tree, grouped by section (`src/data/userGroupMenus.ts`).

### 2. Cross-group visibility (`UserGroupAccesses`) — done
- Multi-select of other user groups a given group can see, via `MultiSelectDropdown`.

### 3. Admin access type — discovered, handled in frontend
- The backend (`ProcessValueOfUserGroup` in `AccountComponent.cs`) silently wipes **all six** relation types (buildings, persons, locations, contractors, menus, accesses) whenever `AccessType = Admin` — Admin groups get unrestricted access, so per-relation grants are meaningless. This is intentional backend behavior, not a bug.
- Frontend previously didn't account for this: the dialog let you set Locations/Contractors/Menus/Accesses on an Admin group, and the backend would silently discard them on save with no error. Fixed by hiding those four sections (and sending `[]` for them) whenever `AccessType = Admin`, with an explanatory note shown instead. Buildings/Persons were already correctly hidden for every non-`SomeBuildingsAndPersons` type from Phase 1.

### 4. Delete-guard error handling — found and fixed (pre-existing bug, not introduced this phase)
- `UserGroupsPage.confirmDelete` caught *any* delete failure — including the expected "can't delete, has related data" guard error — and mapped it to the page's generic list-load-error state (`hasError`), which replaced the whole list with "Couldn't load user groups" while leaving the confirm dialog stuck open. Never surfaced before because the delete guard was never actually exercised with blocking data until Menu/Access relations made it easy to trigger.
- Fixed: `deleteUserGroup` errors now map to `has-users` (1061) / `has-related-data` (1062) codes, shown inline in the `ConfirmDialog` itself (new optional `error` prop) instead of corrupting the page.

### 5. Missing backend validation (found, not fixed — debug-only, no new feature)
- `AccountingStatusUserGroupPersonsMustHaveValueBecauseOfUserGroupRole` / `...BuildingsMustHaveValueBecauseOfUserGroupRole` exist in `OperationResultEnumeration` but are never thrown anywhere. Right now you can save a group with `AccessType = SomeBuildingsAndPersons` and zero buildings/persons — a group with no effective access, with no error telling you that.

### 6. Known gap, intentionally left alone (debug-only constraint)
- `UserGroupAccessSearchAsync` (used by the delete guard) only checks the owner side (`WHERE UserGroupId IN @ids`), not the reverse `AccessibleUserGroupId` side. Deleting a group that another group references via `UserGroupAccesses` would still hit a raw unhandled FK violation instead of the clean 1062 error. Not fixed — would require a new repository method, which is out of scope for "debug only, don't add."

### Reminder
Per the user's standing instruction: during UserGroup work we only **debug** the backend (fix what's already broken) — we do **not** add new backend endpoints or infrastructure.
