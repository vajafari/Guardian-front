# Guardian frontend — remaining work

## fin module (financial/accounting) — started, QuickSetup wizard done and verified

First screen in the brand-new `fin` namespace (full investigation + phased plan in `FIN_MODULE_PLAN.md` at the repo root). `FinSetup.QuickSetup` bootstraps an `AccountingEntity` + `FiscalYear` (+12 `FiscalPeriod` rows) + bank `CashAccount` + `ChargePlan` + default `ChargeComponent`(s) + 4 default `ServiceBillingType` rows in one transactional call — the correct starting point since all system-seeded reference data it depends on (chart of accounts, posting-rule templates, system funds, default cost category) already existed in the dev DB.

**No backend bugs found** — confirmed by deep research across all ~38 `fin` controllers (3 parallel research passes): every `SaveModel→Dto` AutoMapper map exists, every `UpdateAsync` looks up by `Ids = [entity.Id]` correctly. This module is noticeably more carefully written than Core was before our fixes.

**Verified in the browser (Edge via Playwright):**
- Ran the wizard with a real Location-linked `Building`, realistic charge-plan values (DueDay 10, GraceDays 5, LateFeeMode=PercentPerMonth 2%, monthly charge 500,000, no reserve) — success panel rendered the returned IDs; confirmed via SQL that `fin.AccountingEntity`, `fin.AccountingEntityBuilding`, `fin.FiscalYear` (+ exactly 12 `fin.FiscalPeriod` rows), `fin.CashAccount`, `fin.ChargePlan`, one `fin.ChargeComponent`, and 4 `fin.ServiceBillingType` rows were all created and linked correctly.
- Re-ran against the same building — correct mapped message ("already belongs to another accounting entity", 38101) rendered; confirmed via SQL the row count stayed at 1 (no duplicate created).
- Submitted with no buildings selected — client-side validation caught it before any network call, generic 38100-style message shown.
- Left the two test `AccountingEntity` rows (one succeeded, one attempt rejected) in the dev DB from this run — not cleaned up, ask if you want them removed.

**Environment note (not a bug in this code):** during this session the dev Vite server was briefly bound to IPv6-loopback only (`[::1]:5173`) instead of IPv4, and the backend (`Guardian.Api.exe`) was intermittently slow/unresponsive for 10–20s stretches a couple of times (recovered on its own both times — possibly a debugger breakpoint pause, never confirmed). Neither affected the actual verification results once the server was reachable.

### Not yet done
- `ResidentUsers` (bulk-create resident logins) and `MenuBundleApply` (grant a UserGroup a finance menu-permission bundle) — the two natural follow-ups to `QuickSetup`, deliberately deferred to keep this pass scoped to the wizard itself.
- Everything else in `fin` — see `FIN_MODULE_PLAN.md` for the full phased plan (charges/billing cycle, cash/bank/cheques, expenses, reporting).

## CabinetRoom + Cabinet + CabinetPerson — done and verified end-to-end against a live backend

Same aggregate shape as Elevator: `Cabinet` rows are managed entirely as a nested collection inside `CabinetRoom`'s save (`CabinetRoomController.Save/{editMode}`), exactly like `ElevatorFloor` under `Elevator` — `CabinetController` itself is read-only and isn't called by the frontend. Initially misdiagnosed as a backend gap (because `CabinetController` has no Add/Update/Delete) before reading `CabinetRoomComponent` closely — it's fully buildable with zero new backend surface.

**No backend bugs found** — both AutoMapper maps (`CabinetSaveModel→DtoCabinet`, `CabinetRoomSaveModel→DtoCabinetRoom`) already existed, and `CabinetRoomRepository`'s transactional insert/update/delete correctly cascades to `Cabinet`/`CabinetPerson` rows in application code (no DB-level FK cascade, but handled manually in one transaction — verified, no raw-FK-violation risk).

Built the cabinet-centric person-assignment direction only (`SaveCabinetPersons`, manage persons from the Cabinet Room detail page) — same scope-cut as Elevator. The person-centric direction (`SavePersonCabinets`) is available on the backend but would need a new section on `PersonDetailPage`; deferred, not started.

**Verified in the browser (Edge via Playwright):**
- Created a CabinetRoom (Capacity 3, IsShared=false, IsAuto=false) with 2 cabinets against an existing Location; confirmed both `core.CabinetRoom`/`core.Cabinet` rows via SQL.
- Reopened for edit — both cabinets came back pre-filled; added a 3rd, removed one, saved — confirmed the exact resulting set via SQL (aggregate round-trip works correctly).
- Opened "Manage people" on a cabinet, assigned 1 person — confirmed the `core.CabinetPerson` row via SQL.
- Deliberately tried assigning a 2nd person to the same (non-shared) cabinet — correct mapped message ("This cabinet isn't shared — only one person can be assigned to it", 33709) rendered; confirmed via SQL the second assignment was rejected (still only 1 row).
- Deleted the room — confirmed via SQL that `CabinetRoom`, `Cabinet`, and `CabinetPerson` rows all cascaded away in the same transaction.

### Not yet done
- Person-centric cabinet assignment (`SavePersonCabinets`) — would need a new section on `PersonDetailPage`/`EditPersonPage`; deferred, not started (same as Elevator's `SavePersonElevatorFloors`).
- `IsMultiple`/`IsAuto` business rules tied to the person-centric direction (33708, 33710) aren't exercised by this pass since only the cabinet-centric direction was built.

## FieldOfStudy + Position — done and verified end-to-end against a live backend

Two tiny reference-data catalogs, previously only consumed read-only (`GetAll`) by `EditPersonPage`'s dropdowns — now have their own admin GridView pages. Both flat, no child collections, both `Add`/`Update` take the DTO directly (no SaveModel, no AutoMapper involved — no mapping-trap risk like Device/PersonGroup had).

**One real backend bug found and fixed (`Guardian-back`, separate commit) — editing a Position's number had never worked on this backend:**
- `PositionComponent.UpdateAsync` looked up the existing row by `PositionNumbers = [entity.PositionNumber]` (the *new* number being saved) instead of `Ids = [entity.Id]`. Changing a position's number on edit would search for a row with that brand-new number, find nothing, and throw a wrong "not found" (3003) — blocking any edit that changes the number. Fixed to look up by `Ids`.

**Verified in the browser (Edge via Playwright) after the fix:**
- FieldOfStudy: added, edited the title, deleted — all three confirmed via direct SQL.
- Position: added (`PositionNumber` 100); deliberately reused the same number on a second Add — correct mapped message ("This position # is already used by another position", 3000) rendered. Edited the existing row and **changed its PositionNumber from 100 to 101** (the exact case the bug blocked) — succeeded, confirmed via SQL the same row now has the new number. Deleted it, confirmed via SQL.
- Noted but not fixed (same spirit as `PositionNumber`'s empty-table quirk already logged for Device's `DeviceNumber`): `GetFirstUnusedNumber` returns `0` when `core.Position` is completely empty (first-ever Add), since the gap-finding query returns no rows. Minor, easily overridden in the editable field.

### Not yet done (known gap, not fixed — out of scope for this pass)
- Unlike `AddAsync`, `PositionComponent.UpdateAsync` has no duplicate-number check if you edit a position's number to one already used by a *different* row — would hit a raw SQL unique-constraint violation instead of a clean 3000 error. Same spirit as the UserGroup delete-guard gap above — flagging, not fixing.

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

## MapSchematic + MapSchematicDetail + MapSchematicUserGroup — deferred, not started

Investigated and found this is a genuinely different kind of feature from every other module built so far: an interactive drag-and-drop canvas editor, not a form+GridView. `MapSchematic` is the canvas (Title/Width/Height/Zoom + bundled `MapSchematicUserGroups` access list — read-only on its own controller, confirmed by the backend's own XML doc comment). `MapSchematicDetail` is each positioned widget on the canvas: X/Y/Z coordinates, size, shape (circle or not), background color, text + rotation, font size, and either a binding to a `Device`/`DeviceDoor`/`Camera` (to show where that hardware is on the map) or a custom uploaded image (`ImageFileData varbinary`, served via `GetImage`/`SaveImage`). Both single (`Save/{editMode}`) and full-batch (`SaveBatch`, "save the whole canvas layout at once") save paths exist.

Building this properly needs a canvas/drag-drop library (e.g. react-konva) and a widget property panel — a different UI paradigm than anything else in this app. User chose to defer and pick a different module rather than decide on scope (full drag-and-drop canvas vs. a simplified non-canvas form+list) right now.

## ParkPlaceGroup — deferred, not started

Looked more complete than it is: `ParkPlaceGroupController` itself has full CRUD, but `DtoParkPlaceGroup.ParkingId` is required and validated against `core.Parking` (throws `ParkingStatusParkingNotFoundInDatabase` otherwise) — and **no `ParkingController` exists at all**, even though `ParkingComponent.ParkingAddAsync/UpdateAsync/DeleteAsync/Search` is fully implemented. Same gap on the `CarParkPlaceGroups` many-to-many side: managed through `CarComponent`, but **no `CarController` exists either**. `core.Parking`/`core.Car`/`core.ParkPlaceGroup` are all empty, unseeded. Building this module for real would mean adding two new backend controllers (Parking, Car), not just a frontend pass — user chose to skip for now rather than decide on that scope immediately (same call as Attendance).

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
