# Guardian frontend — remaining work

## UserGroup menu-permission catalog: added the missing 13 `fin` codes — done and verified end-to-end

Prompted by the user asking to check whether menu access control existed and whether it was actually scoped correctly. Investigation (via a research fork, confirmed directly against backend source) found a real, non-cosmetic gap: `src/data/userGroupMenus.ts` (the catalog `UserGroupFormDialog.tsx` uses to let an admin grant/revoke per-menu access on a `UserGroup`) mirrors the backend's 126 Core menu codes but was **missing all 13 of the backend's `fin` module codes** (8000–8012, the `#region 8000 حسابداری` block in `Guardian.Api.Assets.Auth.UserMenuCodeConstants`).

**Confirmed this is a hard security boundary, not a cosmetic gap**: traced the full chain — `AuthController` turns every granted `core.UserGroupMenu` row into a `K_{menuCode}_{accessType}` role claim at login (`RoleNames.GetName`), and every single `fin` controller's `[AuthorizeRoles(...)]` checks exactly those role names (e.g. `FinChargeManagementRead` literally is `"K_8007_1"`). For any non-admin `UserGroup`, `fin` API access is controlled **exclusively** by these 13 codes — there's no other path. (This is also why the gap never surfaced during all our testing this session: the `Admin` test user holds the blanket `AdminSystem` claim that bypasses per-menu checks entirely.)

Before this fix, the only way to grant a non-admin group *any* fin access at all was the all-or-nothing `FinSetup.MenuBundleApply` bundle shortcut — there was no way to fine-tune individual fin permissions (e.g. "can view Receipts but not post PartyPayments") through the UserGroup edit screen, because the screen's own catalog didn't know these codes existed.

**Fix**: added all 13 codes (`FinAccountingEntityManagement` through `FinMyStatement`) to `USER_GROUP_MENU_CATALOG`, titled directly from the backend's own Persian doc-comments (no Angular-legacy equivalent exists for these, unlike the Core codes), grouped under a new "8000 حسابداری" section matching the backend's own region name.

**Verified in the browser (Edge via Playwright)**: the new section renders correctly in `UserGroupFormDialog`'s menu-permissions list (13 new rows, each with the usual None/OnlyView/ViewAndEdit dropdown). Created a test group, granted `FinChargeManagement` → `ViewAndEdit`, saved — confirmed via SQL (`core.UserGroupMenu`: `MenuCode=8007, AccessType=2`) that it round-trips correctly to the real table.

### Not yet done (scoped out, by the user's explicit choice)
- **Frontend enforcement**: `SideMenu.tsx` still shows every menu item to every logged-in user unconditionally, and `ProtectedRoute.tsx` only checks authentication — neither filters based on the user's actual granted menu codes. A user in a restricted group would still see (and could still navigate to) menu items that the backend will correctly 403 on click. Closing this requires decoding the JWT's role claims client-side (nothing currently does this — `AuthUser`/`AuthContext` only store `userId`/`entityTitle`) and mapping every route to its required `menuCode` + minimum `AccessType`. Deferred — the user asked for the catalog fix only, not full nav/route gating, for now.
- Left a test `UserGroup` ("Fin Menu Test Group") in the dev DB from verification — not cleaned up, ask if you want it removed.

## SideMenu: grouped into collapsible submenus — done and verified end-to-end

The sidebar had grown to 28 flat items (the `fin` module alone added 11). Reorganized `src/components/SideMenu.tsx` into 5 collapsible groups using the UI kit's existing (previously unused) `Menu.MenuCollapse` primitive — no new component needed:
- **Personnel**: Persons, Groups, Fields of study, Positions
- **Property**: Buildings, Building spaces, Contracts, Contractors
- **Hardware & access**: Devices, Cameras, Cabinet rooms, Elevators, Locations
- **Financial**: all 11 `fin` items
- **Access management**: User groups, Users
- Dashboard/Reports/Settings stay top-level, ungrouped.

The active route's group auto-expands and highlights on load/reload (`Menu`'s `defaultExpandedKeys`/`defaultCollapseActiveKeys`, computed from the current path), and more than one group can be open at once.

**One real layout bug found and fixed along the way**: `MenuItem` (the UI kit's leaf-row primitive) renders at a fixed height with no text wrapping — any label long enough to need two lines gets its icon and text clipped/overflowing instead of wrapping, which only became visible now that nested indentation leaves less horizontal room. Rather than touch the shared primitive (used everywhere), shortened the handful of labels that were long enough to trigger it, in all three locales (e.g. English "Service billing types"→"Billing types", Persian "صورت‌حساب‌های خدمات"→"صدور خدمات", Arabic "مجموعات المستخدمين"→"المجموعات"). Verified clean (icon + single-line label on every item) in English, Persian (RTL), and Arabic.

## fin: PartyPayment (pay a vendor/payee) — done and verified end-to-end against a live backend

The mirror image of `Receipt`: money going out to a payee `Party` instead of coming in from a resident. Also the piece that finally unlocks the `Issued`-direction `Cheque`/`ChequeFate` lifecycle, stuck at `Pending` forever since every fate kind needs a posted source document and none existed for Issued cheques before this. Built all three `PaymentMethod`s (`CashAccount`/`IssuedCheque`/`EndorsedCheque`); `Settlements`/`AutoSettle` left always empty/false this pass (confirmed directly in `ExpenseComponent.cs` that this is explicitly legal — a pure advance payment, not an error — so `ExpenseInvoice` is not a blocker, just a deferred piece for when it lands).

Also extended `PartyPickerField` (used by `ServiceBilling`/`Receipt`/`Cheque`/`ChequeFate` too) with a third mode, "new vendor" — a quick-create for a plain Title-only `Party`, since vendors are essentially never Person-linked the way residents are.

**No backend bugs found** — all three AutoMapper maps (`PartyPaymentSaveModel→DtoPartyPayment`, `IssuedChequeSaveModel→DtoCheque`, `PaymentSettlementSaveModel→DtoPaymentSettlement`) already existed.

**One real frontend bug found and fixed during this pass**: the `EndorsedCheque` picker was filtering the party's own Pending Received cheques by `cheque.partyId === partyId` (the payee being paid) — but endorsement means handing a cheque *received from one party* to pay *a different party*, and the backend's own validation (confirmed by reading `ExpenseComponent.cs` directly) scopes `EndorsedChequeIds` only by `AccountingEntity`+`ChequeDirection=Received`+`Status=Pending`, with no party restriction at all. Fixed by showing all eligible pending cheques entity-wide, with an "Originally from" column so the user can see whose cheque they're spending. Verified the fix with a genuine cross-party test (endorsed a cheque received from one party to pay a different one).

**Verified in the browser (Edge via Playwright), reusing the `QuickSetup` test `AccountingEntity`:**
- Quick-created a Title-only vendor `Party` via the new `PartyPickerField` mode — confirmed via SQL (`PartyType=Legal`, no Person/Contractor link).
- Paid that vendor via `CashAccount` method — confirmed via SQL (`fin.PartyPayment`, real `fin.JournalEntry`, full `Amount` as `UnsettledAmount` since no settlements).
- Paid via `IssuedCheque` method — confirmed via SQL (new `fin.Cheque` at `ChequeDirection=Issued, Status=Pending`).
- **The unlocking moment**: ran `ChequeFate=Cleared` on that issued cheque — confirmed it no longer 37769s now that a real `PartyPayment` source document exists; `Cheque.Status`→Cleared, new `JournalEntry`.
- `EndorsedCheque` method, cross-party (after the fix above) — confirmed via SQL (`Cheque.Status`→Endorsed, `EndorsedToPartyId` correctly set to the new payee, distinct from the cheque's original `PartyId`).
- Opened the detail page, confirmed fields + cheques table render. Cancelled the cash-method payment — confirmed via SQL (`Status`→Cancelled, reversing `JournalEntry`). Tried cancelling the issued-cheque payment after its cheque already cleared — correctly rejected (37727), message rendered correctly.

### Not yet done
- `Settlements`/`AutoSettle` (settling against an `ExpenseInvoice` or `OpeningBalance` line) — deferred until `ExpenseInvoice` exists; every payment this pass is a pure advance/credit.
- `SettledAccountId` is fixed to the system `PayableToParties` (2110) account only — 2130/2140 are advanced-mode + `Payroll`-dependent, not usable yet.

## fin: Cheque + ChequeFate (+ ReceivedCheque wired into Receipt) — done and verified end-to-end against a live backend

Closes the gap deliberately left open in the `Receipt` pass: `ReceivedCheque` was deferred because a cheque entered that way would sit at `Status=Pending` forever with no UI to ever move it. Built standalone `Cheque` CRUD (both `Received`/`Issued` directions, flat list+dialog page mirroring `CashAccountsPage.tsx`), `ChequeFate` (posted form — Deposited/Cleared/Bounced/Returned — mirroring `LateFeeRun`'s list+detail+cancel shape), and wired `PaymentMethod=ReceivedCheque` into `ReceiptFormDialog` so the whole received-cheque lifecycle (Receipt → Cheque Pending → Deposited → Cleared/Bounced) is now actually exercisable end to end.

**Scoping note, not a bug**: a `Cleared`/`Bounced`/`Returned` fate requires the cheque to trace back to a real posted source document (`Receipt` for Received, `PartyPayment` for Issued — not built yet). So standalone-created `Issued` cheques can only ever sit at `Pending` until `PartyPayment` exists; confirmed this renders the correct "not linked to any posted receipt or payment" message (37769) rather than failing silently.

**No backend bugs found** — all four AutoMapper maps (`ChequeSaveModel→DtoCheque`, `ReceivedChequeSaveModel→DtoCheque`, `ChequeFateSaveModel→DtoChequeFate`, `ChequeFateItemSaveModel→DtoChequeFateItem`) already existed.

**Verified in the browser (Edge via Playwright), reusing the `QuickSetup` test `AccountingEntity`:**
- Added a standalone `Received` cheque (quick-created a `Party` via "link a person", same `PartyPickerField` reuse) — confirmed via SQL, `Status=Pending`.
- Added a standalone `Issued` cheque — the bank-account-required rule is enforced client-side (field only shown+required for `Issued`), confirmed success once a `CashAccount` was picked.
- Added a `Receipt` with `PaymentMethod=ReceivedCheque` (one cheque line, amount matching the receipt) — confirmed via SQL: `fin.Receipt`, a new `fin.Cheque` at `Status=Pending`, and the matching `fin.ReceivableSettlement`.
- `ChequeFate=Deposited` on that cheque — confirmed via SQL (`Status`→Deposited, `DepositedCashAccountId` set, **no** `JournalEntry` for this kind, as documented).
- `ChequeFate=Cleared` on the same cheque — confirmed via SQL (`Status`→Cleared, a real `JournalEntry` this time).
- A second Receipt-sourced cheque, then `ChequeFate=Bounced` on it — confirmed via SQL the original settlement was reversed and the receivable reopened to its full amount (a second, offsetting `ReceivableSettlement` row), new `JournalEntry`.
- Tried `Cleared` on the standalone `Issued` cheque (no `PartyPayment` exists) — correctly rejected (37769), the documented-limitation message rendered correctly.
- Opened a `ChequeFate` detail page — fields + cheques table render correctly. Cancelled it — confirmed via SQL (`Status`→Cancelled, and the cheque's own `Status` correctly reverted to what it was *before* that fate, not all the way back to Pending — matches the "per-cheque previous status" design, not a blanket reset).

### Not yet done
- `ChequeFateItemFullInfo` has no joined `PartyDisplayName` on the item row itself (only `ChequePartyId`) — minor display gap, not worth a client-side join this pass.
- Didn't exercise partial-clear (`ClearedAmount` < cheque amount) — the field exists in the UI but wasn't driven through a full partial-clear scenario this pass.
- `PartyPayment` (needed to ever move an `Issued` cheque past `Pending`) is still not built — tracked as the next natural piece.

## fin: Receipt (Collection — resident pays, settles receivables) — done and verified end-to-end against a live backend

The piece that actually closes the loop: `ChargeIssue`/`ServiceBilling`/`LateFeeRun` all generate open `Receivable`s, but nothing could settle them until now. Built `ReceiptKind = Collection` with Cash/Card/Transfer payment methods only this pass — `ReceivedCheque` is deferred (the backend can create the `Cheque` row inline with no dependency, but it'd sit at `Status=Pending` forever with no `ChequeFate` UI to ever move it yet); `DepositIdentification`/`OtherIncome` kinds deferred too (need `UnidentifiedDeposit`/an `Account` picker, neither built).

**No backend bugs found** — all three AutoMapper maps (`ReceiptSaveModel→DtoReceipt`, `ReceivedChequeSaveModel→DtoCheque`, `ReceivableSettlementSaveModel→DtoReceivableSettlement`) already existed.

**Two real frontend bugs found and fixed during this pass** (both in the new `searchOpenReceivablesByParty` helper, not backend):
1. The manual-allocation receivables picker didn't exclude `Overpayment`-kind credit rows (negative `OpenAmount`) — a user could pick that row and the browser's own `min=0`/`max={negative}` constraint on the amount input would silently block form submission with no visible error. Fixed by filtering to `receivableKinds: [Charge, Rent, LateFee, ServiceBilling, Opening]` (excluding `Overpayment`), matching the backend's own `ReceivableBuildAllocationsAsync` scope.
2. `ReceivableFilter.OnlyOpen` does **not** implicitly filter by `Status` (confirmed by reading `ReceivableRepository.cs`'s own WHERE-clause builder) — a cancelled receivable with no settlements still shows a nonzero computed `OpenAmount` and was incorrectly appearing as allocatable. Fixed by also passing `statuses: [Active]` explicitly, matching how the backend's own internal allocation engine combines these two filters.

**Verified in the browser (Edge via Playwright), reusing a test `Party` with real open receivables from earlier `ChargeIssue`/`ServiceBilling`/`LateFeeRun` passes:**
- Auto-allocate a receipt for less than the total open amount — confirmed via SQL (`fin.Receipt`, `fin.ReceivableSettlement`, correct `fin.Receivable` open-amount reduction, new `fin.JournalEntry`).
- A second receipt for more than the remaining open amount — confirmed the overflow correctly created a negative `Overpayment`-kind `Receivable`, falling back to the last allocated receivable's own unit (no `OverpaymentBuildingUnitId` needed in the common case).
- Confirmed the documented overpayment-carry-forward behavior live: a subsequent `ServiceBilling` for that same party automatically netted against the sitting credit, with no frontend logic needed.
- Manual allocation (uncheck auto-allocate, pick a specific open receivable, enter an amount) — confirmed the exact `ReceivableSettlement` row matched what was picked, after the two bug fixes above.
- Opened the detail page — all fields and the allocations table rendered correctly (`ReceivableTitle` is already human-readable server-side, no client-side title-resolution join needed this time, unlike `ChargeDiscount`).
- Cancelled a receipt with a reason — confirmed via SQL (`Status`→Cancelled, its own settlement reversed, the receivable's open amount restored, a reversing `fin.JournalEntry` appeared).

### Not yet done
- `ReceivedCheque` payment method, `DepositIdentification`/`OtherIncome` receipt kinds — deferred, see above.
- Didn't exercise the `overpayment-target-required` (37904) error path — never actually triggered since the fallback (last allocated receivable's own unit/space) always resolved in testing.

## fin: CashAccount editing — done and verified end-to-end against a live backend

Last item from the original "what's left in Phase 2" list: `QuickSetup` creates one `CashAccount` (type=Bank) per entity, but there was no screen to edit it, add more (petty cash/cash box), or delete one. Simple standalone master-data CRUD, built as a single list+dialog page (`CashAccountsPage.tsx`) mirroring `ServiceBillingTypesPage.tsx`'s exact shape.

**No backend bugs found** — `CashAccountSaveModel→DtoCashAccount` AutoMapper map already existed.

**Verified in the browser (Edge via Playwright), reusing the `QuickSetup` test `AccountingEntity` and its one Bank `CashAccount`:**
- Edited the existing Bank account's `Title` and `Sheba` — confirmed via SQL.
- Added a new `PettyCash` account with a custodian via "link a person" mode (reusing the `PartyPickerField` built for `ServiceBilling`) — confirmed via SQL the correct `Party` was reused (same person already had one from earlier testing, no duplicate created).
- Tried an invalid `Sheba` (wrong prefix/length) on a Bank account — correctly rejected (37303), "IBAN must start with IR followed by 24 digits" rendered correctly; confirmed via SQL no stray row was created.
- Deleted the unused `PettyCash` account — confirmed via SQL.

### Not yet done
- Didn't exercise the `bank-fields-not-allowed` (37306) path — the UI design itself makes it unreachable (bank-only fields are hidden entirely when `CashAccountType != Bank`), so there was nothing to test.
- Didn't exercise the `in-use`/can't-delete (37004) path — none of this session's test postings (`ChargeIssue`/`ServiceBilling`/`LateFeeRun`) actually reference a `CashAccount` directly (they post through `Fund`s, not `CashAccount`s; `CashAccountId` only appears on `Receipt`/`Payment` journal lines, which haven't been built yet) — same for the disabled-type-select-when-used behavior, not directly exercised.

With this, every item from the original Phase 2 list (ChargePlan/ChargeComponent/ChargeCoefficient/ChargeDiscount editing, ChargeIssue, ServiceBilling, LateFeeRun, CashAccount editing) is done.

## fin: LateFeeRun (standalone late-fee calculation) — done and verified end-to-end against a live backend

Closes the last Phase-2 item: `ChargeIssue.Add` can run late fees inline via its `RunLateFee` checkbox, but there was no way to run late-fee calculation on its own, at any time. `LateFeeRun` is architecturally almost identical to `ChargeIssue` — scoped to one `AccountingEntity`, mandatory Preview-before-Add, `Cancel` via the same `FinFormCancelModel` shape — so `LateFeeRunFormDialog`/`LateFeeRunCancelDialog`/`LateFeeRunsPage`/`LateFeeRunDetailPage` directly mirror `ChargeIssue`'s own files, simplified (no FiscalYear/FiscalPeriod picker needed, since it isn't period-scoped).

**No backend bugs found** — `LateFeeRunSaveModel→DtoLateFeeRun` AutoMapper map already existed. Confirmed (via direct controller read + a fork research pass) that this reuses the exact same `ChargeIssuingComponent` calculation logic as `ChargeIssue`'s inline `RunLateFee` — no divergence between the two paths to worry about.

**Verified in the browser (Edge via Playwright), reusing the `QuickSetup` test `AccountingEntity`:**
- Issued a fresh `ChargeIssue` for an earlier fiscal period (600,000, due 2025-04-04) to have a real overdue receivable to test against (the plan's `GraceDays`=5, `LateFeeRate`=2%/month).
- Ran a `LateFeeRun` with `DocumentDate`=2025-05-01 — Preview showed "1 late fee(s) totaling 9,000"; confirmed via SQL the fee's `FeeFromDate`/`FeeToDate` (2025-04-10 → 2025-05-01) exactly matches end-of-grace-days through the calculation date.
- **Idempotency**: ran a second `LateFeeRun` with `DocumentDate`=2025-06-01 against the same overdue receivable — confirmed via SQL it only charged the *incremental* period (`FeeFromDate`=2025-05-02, the day after the first run's `FeeToDate`, amount 12,000), never re-charging the already-covered days. Proves running this repeatedly is safe.
- **Cancel-order constraint**: tried cancelling the older run while a newer one still existed — correctly rejected (37844), "Only the most recent late fee run for this accounting entity can be cancelled" rendered correctly. Cancelled in the correct order (newest first, then the older one) — both confirmed via SQL (`Status`→Cancelled, both fee `Receivable`s cancelled, reversing `JournalEntry` rows for each).
- Opened the detail page — all fields and the late-fees lines table rendered correctly (unit title, party name, amount, fee period, open amount).

### Not yet done
- `ExcludedReceivableIds` (excluding specific overdue receivables from a run) — not exposed in this pass's UI, same scope-cut as other deferred fields elsewhere in `fin`.
- Didn't exercise the `late-fee-off`/`nothing-to-calculate` (37841/37842) error paths directly — the generic error-code-mapping pipeline is already proven correct across many other codes in this and prior passes, so this was judged low-value to spend more time on.

## fin: ServiceBilling (ad-hoc service charges) — done and verified end-to-end against a live backend

Closes the last big functional gap in `fin`: `ServiceBillingType` (the catalog) has had full CRUD for a while, but nothing could actually issue a charge against it. `ServiceBilling` is that missing piece — a single ad-hoc charge against one `Party` for one `BuildingUnit`/`BuildingSpace`, posted immediately (no Preview step, unlike `ChargeIssue`) through the same generic posting engine. Added `ServiceBillingsPage` (GridView list + "New service billing"), `ServiceBillingFormDialog`, `ServiceBillingDetailPage`, and `ServiceBillingCancelDialog` (same `FinFormCancelModel` shape as `ChargeIssue`'s, but narrower — blocked once a real Receipt has settled it, not just its own auto-applied overpayment credit).

**Net-new dependency: `Party`.** `ServiceBilling.PartyId` must reference an already-existing, active `Party` — unlike `ChargeIssue`, there's no auto-create, and nothing in the frontend touched `Party` before this pass. Built a minimal `PartyPickerField` with two modes: pick an existing `Party` from a dropdown, or "link a person" (search persons, and either reuse that person's existing `Party` if one already exists or quick-create one via `PartyType=Natural`).

**No backend bugs found** — both `ServiceBillingSaveModel→DtoServiceBilling` and `PartySaveModel→DtoParty` AutoMapper maps already existed.

**Verified in the browser (Edge via Playwright), reusing the `QuickSetup` test `AccountingEntity` and its `ServiceBillingType` rows:**
- Picked a type — confirmed `Title`/`Fund` prefill from the type (this type's `DefaultAmount`/`CostCategoryId` are null, so those stayed blank, correctly).
- "Link a person" mode with a person who had no `Party` yet — confirmed a brand-new `fin.Party` row was quick-created via SQL (count 2 → 3), note rendered ("A new party was created for this person").
- Submitted against the plan's `BuildingUnit` — confirmed via SQL: `fin.ServiceBilling` (Status=Posted, correct `Amount`/`PartyId`/`BuildingUnitId`), `fin.Receivable` (active, same amount), `fin.JournalEntry` (new row).
- Re-opened the form and picked the **same** person again — confirmed the existing `Party` was reused ("this person already has a party — reusing it"), `Party` count stayed at 3 (no duplicate).
- Picked an existing `Party` directly from the "Existing party" dropdown (a Title-only party, no Person link) — worked correctly.
- Submitted with `DueDate` before `DocumentDate` — correctly rejected (38211), generic "check the required fields" message rendered; confirmed via SQL no stray row was created.
- Opened the detail page — all `FullInfo` fields rendered correctly (`PartyDisplayName`, titles, open amount, etc).
- Cancelled with a reason — confirmed via SQL: `Status` → Cancelled, `CancelReason` stored, reversing `JournalEntry` row appeared, `Receivable` flipped to Cancelled.

**Environment note (not a bug):** the dev DB's one seeded `FiscalYear` only covers 2025-03-21 to 2026-03-20 — today's date in this environment (2026-11-11) falls outside it, so a `DocumentDate` of "today" correctly triggers 37509 (`FinStatusJournalEntryDateIsOutsideFiscalYear`). Not a defect; just picked a `DocumentDate` inside the seeded fiscal year for testing.

## fin: ChargeCoefficient + ChargeDiscount — done and verified end-to-end against a live backend

Closes the gap flagged in the previous `ChargePlan`/`ChargeComponent` pass: `ChargeCoefficient` (per-unit-type or per-floor multipliers within one `Units`-targeted component — 0 means exemption) and `ChargeDiscount` (a per-unit/space discount coefficient on a whole `ChargePlan`, with a validity window). Both standalone CRUD controllers (no `GetById`, list-only via `Search`), nested under `ChargePlanDetailPage.tsx` rather than getting their own list pages.

**No backend bugs found** — both `SaveModel→Dto` AutoMapper maps already existed.

**Verified in the browser (Edge via Playwright), reusing the `ChargePlan`/`ChargeComponent` from the earlier passes:**
- Opened "Coefficients" on the Units-targeted "Elevator fee" component; added a UnitType coefficient (Commercial, 0 = exemption) and a Floor coefficient (Floor 3, 1.2) — both confirmed via SQL (`fin.ChargeCoefficient`) with the exact `CoefficientKind`/`UnitType`/`FloorActualNumber`/`Coefficient` values.
- Tried adding a duplicate UnitType coefficient on the same component — correctly rejected (37821), generic "invalid" message rendered; confirmed via SQL the row count stayed at 2 (no duplicate created).
- Added a `ChargeDiscount` on the plan's one `BuildingUnit` (0.8, with a reason) — confirmed via SQL (`fin.ChargeDiscount`), and that the detail page's Discounts table resolves and shows the unit's real title ("2") via a client-side id→title map (no `FullInfo` variant exists server-side for this one).
- Tried adding a second discount on the same unit with an overlapping date range — correctly rejected (37827), "This unit/space already has a discount with an overlapping date range" rendered correctly.
- Deleted the discount and one of the two coefficients — both confirmed via SQL (`DiscountCount` → 0, `CoefficientCount` → 1, with the remaining row matching the un-deleted one).

## fin module (financial/accounting) — started, QuickSetup wizard done and verified

First screen in the brand-new `fin` namespace (full investigation + phased plan in `FIN_MODULE_PLAN.md` at the repo root). `FinSetup.QuickSetup` bootstraps an `AccountingEntity` + `FiscalYear` (+12 `FiscalPeriod` rows) + bank `CashAccount` + `ChargePlan` + default `ChargeComponent`(s) + 4 default `ServiceBillingType` rows in one transactional call — the correct starting point since all system-seeded reference data it depends on (chart of accounts, posting-rule templates, system funds, default cost category) already existed in the dev DB.

**No backend bugs found** — confirmed by deep research across all ~38 `fin` controllers (3 parallel research passes): every `SaveModel→Dto` AutoMapper map exists, every `UpdateAsync` looks up by `Ids = [entity.Id]` correctly. This module is noticeably more carefully written than Core was before our fixes.

**Verified in the browser (Edge via Playwright):**
- Ran the wizard with a real Location-linked `Building`, realistic charge-plan values (DueDay 10, GraceDays 5, LateFeeMode=PercentPerMonth 2%, monthly charge 500,000, no reserve) — success panel rendered the returned IDs; confirmed via SQL that `fin.AccountingEntity`, `fin.AccountingEntityBuilding`, `fin.FiscalYear` (+ exactly 12 `fin.FiscalPeriod` rows), `fin.CashAccount`, `fin.ChargePlan`, one `fin.ChargeComponent`, and 4 `fin.ServiceBillingType` rows were all created and linked correctly.
- Re-ran against the same building — correct mapped message ("already belongs to another accounting entity", 38101) rendered; confirmed via SQL the row count stayed at 1 (no duplicate created).
- Submitted with no buildings selected — client-side validation caught it before any network call, generic 38100-style message shown.
- Left the two test `AccountingEntity` rows (one succeeded, one attempt rejected) in the dev DB from this run — not cleaned up, ask if you want them removed.

**Environment note (not a bug in this code):** during this session the dev Vite server was briefly bound to IPv6-loopback only (`[::1]:5173`) instead of IPv4, and the backend (`Guardian.Api.exe`) was intermittently slow/unresponsive for 10–20s stretches a couple of times (recovered on its own both times — possibly a debugger breakpoint pause, never confirmed). Neither affected the actual verification results once the server was reachable.

## fin: ChargePlan + ChargeComponent + ServiceBillingType editing — done and verified end-to-end against a live backend

Fills the gap flagged in `FIN_MODULE_PLAN.md`: `QuickSetup` creates these once, but there was no screen to edit them afterward. Added `ChargePlansPage` (list) + `ChargePlanDetailPage` (plan settings + nested Components table, Add/Edit/Delete each via its own endpoint — not an aggregate save), and a standalone `ServiceBillingTypesPage`.

**One frontend bug found and fixed (my own mistake, not a backend bug):** the `ChargeComponent`/`ServiceBillingType` forms' Cost Category picker listed every `CostCategory` row flat, including parent/non-leaf nodes — but the backend requires a **leaf** category (`FinStatusCostCategoryIsNotLeaf`, 37227) for both. Fixed by computing leaf categories client-side (a category with no other category pointing at it via `parentCostCategoryId`) and only offering those in both pickers.

**No backend bugs found.**

**Verified in the browser (Edge via Playwright), reusing the `ChargePlan`/`ChargeComponent` from `QuickSetup`:**
- Edited the plan's `DueDay` (10 → 15) — confirmed via SQL, and that `LateFeeFundTitle`/`RentIncomeFundTitle` resolve correctly on the detail page.
- Edited the existing component's `Amount` (500,000 → 600,000) — confirmed via SQL.
- Added a new component ("Elevator fee", fixed-per-unit split) — failed first with 37227 due to the picker bug above; after the fix, succeeded and confirmed via SQL.
- Tried deleting the plan — correctly rejected (37803, "has charge issues/components/discounts") since we'd already issued a charge against it in the previous pass; confirmed via SQL the row still exists.
- On `ServiceBillingTypesPage`: edited one of the 4 `QuickSetup`-created types (title, `DefaultAmount`, toggled `IsActive` off) — confirmed via SQL. Added a new type, then deleted it — confirmed via SQL both ways.

### Not yet done
- `ChargeCoefficient`/`ChargeDiscount` — now done, see the section above.
- `ActualCostSpaceId` on `ChargeComponent` (a narrow filter only relevant to the `ActualCost` calculation model) — not exposed in the form.

## fin: ChargeIssue (monthly charge issuance) — done and verified end-to-end against a live backend

The operational heart of `fin`: turns a `ChargePlan` into actual `Receivable`s. Added `ChargeIssuesPage` (GridView list + "New issue"), `ChargeIssueFormDialog` (cascading AccountingEntity→FiscalYear→FiscalPeriod pickers, mandatory Preview-before-Issue step), `ChargeIssueDetailPage` (Components + Lines tables), and `ChargeIssueCancelDialog` (reason + optional reversal date — this `FinFormCancelModel` shape will be reused by every other posted-form `fin` entity going forward).

**One frontend bug found and fixed (my own mistake, not a backend bug):** assumed `DtoChargeIssueLineFullInfo` carried joined `buildingUnitTitle`/`buildingSpaceTitle` directly — it doesn't; those titles only exist on `itemsFullInfo` (`DtoChargeIssueItemFullInfo`), joined via `linesFullInfo[].chargeIssueItemId`. Fixed by looking up the matching item per line instead of expecting the title inline.

**No backend bugs found.**

**Verified in the browser (Edge via Playwright), reusing the `QuickSetup` test `AccountingEntity`:**
- Created a real test `Contract` (via the existing Contracts UI) with a Principal on the one `BuildingUnit` in that test building, so there was an actual payer to issue a charge to.
- Preview against a building/period with no eligible contracts correctly showed "0 receivables totaling 0" (confirms the zero-result path renders sanely, not just the happy path) — confirmed via SQL that `fin.ChargeIssue` stayed empty (Preview never writes).
- After adding the test contract, re-ran Preview — showed "1 receivable(s) totaling 500,000" with the correct component breakdown.
- Clicked Issue — confirmed via SQL that `fin.ChargeIssue` (1 row, auto-numbered `C-04-0001`, Status=Posted), `fin.ChargeIssueComponent`/`Item`/`Line` (1 each), `fin.Receivable` (1, correct amount, Party auto-created), and `fin.JournalEntry` (1 row) were all created — confirms the generic posting-request/posting-rule engine fires correctly end to end.
- Opened the detail page — Lines table correctly rendered the real unit title ("2") and payer display name after the bug fix above.
- Cancelled the issue with a reason — confirmed via SQL that the `ChargeIssue` flipped to Cancelled, the `Receivable` flipped to Cancelled, and a second (reversing) `fin.JournalEntry` row appeared.

### Not yet done
- `ComponentOverrides` (per-component one-month tweaks) and `LateFeeExcludedReceivableIds` — not exposed in this pass's UI.
- `LateFeeRun` as its own standalone screen (the `RunLateFee` checkbox on `ChargeIssue` covers the common case of running it alongside the monthly issue, but a separate "run late fees for all overdue, anytime" screen isn't built yet).
- Left one test `Contract`/`ChargeIssue` (now cancelled) in the dev DB from this run — not cleaned up, ask if you want them removed.

## fin: ResidentUsers + MenuBundleApply — done and verified end-to-end against a live backend

The two `QuickSetup` follow-ups, added as two more always-visible cards on the same `/fin-setup` page (not gated behind a fresh wizard run — both are standalone, idempotent actions).

**Verified in the browser (Edge via Playwright):**
- `ResidentUsers` against the building from the earlier `QuickSetup` test run — result summary rendered correctly ("1 active resident(s) found — 1 already had a login, 0 new login(s) created"), matching the one existing contract principal who already had a login.
- `MenuBundleApply` with the `BuildingManager` bundle — success message rendered; confirmed via SQL exactly 10 `core.UserGroupMenu` rows landed on the target group: the 9 finance form menus at `AccessType=2` (ViewAndEdit) plus the chart-of-accounts menu at `AccessType=1` (OnlyView), matching `FinMenuBundles.GetMenus(BuildingManager)` precisely.
- `MenuBundleApply` with the `Accountant` bundle also succeeded — confirms this dev environment's `AccountingMode` is set to `Advanced` (the 37000 "advanced-mode-only" error path exists and is mapped, but wasn't actually triggered since the environment is already in advanced mode).

### Not yet done
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
