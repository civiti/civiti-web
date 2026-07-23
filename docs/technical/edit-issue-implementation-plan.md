# Edit Issue — Frontend Implementation Plan

**Feature:** Let an issue's **creator** edit their own issue (all fields) from multiple entry points; on save the issue is re-sent to the admin for approval (status flips back to a pending state and an admin must approve it again).

**Scope:** Frontend (Angular 19 + NgRx + NG-ZORRO). One backend contract change is load-bearing — see the companion doc [`edit-issue-backend-requirements.md`](./edit-issue-backend-requirements.md).

**Status:** Approved direction — the three highest-stakes decisions (D1/D2, D3, D5) are **confirmed** (see §1). Remaining low-severity items keep recommended defaults.

**Method note:** This plan was produced by a multi-agent code analysis (6 subsystem readers → design → adversarial critique). The critique's corrections are folded in throughout and flagged as **[risk Rn]** / **[fix Cn]**.

---

## 0. TL;DR — this is a ~70% extension, not a greenfield build

An `edit-issue` component, its route (`edit-issue/:id`, `authGuard`), and the `PUT /user/issues/{id}` API path **already exist**. Three things block the requirements:

| Requirement | Current state | Gap |
|---|---|---|
| **All fields editable** | Only `title` / `description` / `photos`; location hard-coded read-only | `category`, `location`, `authorities`, `urgency`, `desiredOutcome`, `communityImpact` are not editable |
| **Edit from multiple places** | Only `my-issues`, only for **Rejected** | `issue-detail` computes `isOwner` (`issue-detail.component.ts:208`) but has **no button**; entry is status-gated to Rejected |
| **Re-approval on edit** | Works (`resubmit:true` → `Submitted`) | ✅ mechanism exists; broaden to more statuses; fix wrong "În verificare" copy |
| **Backend contract** | `EditUserIssueRequest = {title?, description?, photoUrls?, resubmit?}` | **Blocking backend change** — payload can't carry the other fields |

---

## 1. Decisions (confirmed) + defaults

The three highest-stakes decisions are **✅ confirmed**. The rest keep recommended defaults; changing one changes the build.

| # | Decision | Resolution | Why it matters |
|---|---|---|---|
| **D1** ✅ | Which statuses can the owner edit? | **CONFIRMED: `Rejected` + `Active` + `Submitted` + `UnderReview`.** (`Draft` only if the create flow can actually produce it — **verify**; today create appears to go straight to `Submitted`.) **Not** `Resolved`/`Cancelled`/`Unspecified`. | Determines which surfaces show the Edit button. |
| **D2** ✅ | Is a *pending* (`Submitted`/`UnderReview`) issue editable while pending? | **CONFIRMED: Yes — no re-review lock.** Editing a pending issue rewrites it in place; it's already in the queue, so status doesn't change. Guarded by optimistic concurrency (D6). | **[fix G1/G2/C1]** Avoids a dead-end "editable-but-blocked" CTA and unblocks fixing a typo right after submitting. |
| **D3** ✅ | Editing a **live `Active`** issue: public visibility during re-review? | **CONFIRMED: pull-from-public (v1).** Issue drops to `Submitted` → leaves `PUBLIC_VIEWABLE_STATUSES` until re-approved. Owner is warned first (§5.3). Shadow-revision model deferred to a later phase. | **[risk G3/G6]** A rejected *edit* of a healthy live issue leaves it `Rejected` with no rollback; indexed/shared/QR links 404 during re-review — hence the loud warning. |
| **D4** | `emailsSent` / `communityVotes` on edit | **Preserve** (server-owned counters). | Wiping them punishes a typo fix. Safe **because** of D5. |
| **D5** ✅ | Post-approval bait-and-switch guard | **CONFIRMED: all fields editable + admin sees a diff of what changed on re-review.** The admin **diff view is now an in-scope v1 requirement** (backend §5.3), not deferred. No reduced field set. | **[risk A1]** Preserved votes + full edit is only safe if the admin can see what was swapped before re-approving. |
| **D6** | Concurrent edit vs admin action | **Optimistic concurrency** on `updatedAt` → `409` on mismatch; client reloads and explains. | **[risk A6/C7]** Owner's stale save could clobber an admin approve/reject. |
| **D7** | Does every owner edit force re-approval (no silent save)? | **Yes.** Drop the `resubmit=false` draft-save path in v1; forbid it for publicly-viewable statuses server-side. | **[risk A2/C4]** `resubmit=false` on an `Active` issue = silent edit of live public content = moderation bypass. |

> **Scope consequence of D5:** editing an already-approved issue must **not** ship to production until the admin re-review screen shows a field-level diff. The owner-edit UI (this doc) and the admin diff (backend doc §5.3 + a small admin-UI addition) are a **coupled release** for the `Active`-edit path. Editing `Rejected`/pending issues has no accrued public engagement, so it can ship ahead of the diff if you want to stage.

> §9 lists the remaining lower-severity risks (photo GC, authority re-blast, notifications, etc.) with their mitigations.

---

## 2. Architecture decision

**Extend the existing `EditIssueComponent` into a full-field single-page editor**, and (P1) **extract three shared presentational sub-forms** consumed by BOTH the create wizard and the edit page.

Do **not** drop the create *wizard page* components into the edit page — `authority-selection` and `issue-details` are coupled to `sessionStorage` (`civica_*` keys, `issue-session.util.ts`) and `router.navigate`; they are not reusable as-is.

**Rationale**
- Readers confirmed **validator drift** between create and current edit: title (create `max150`, no min vs edit `min10/max200`), description (create `min10` vs edit `min30/max2000`), photos (create `8/10MB/isPrimary` vs edit `5/5MB/no-primary`). A second edit-only form entrenches a third divergent copy; shared components define validators once.
- Repo PR-budget rule favors extract-once over replicate-in-two-places.
- `LocationPickerModalComponent` (`src/app/components/shared/location-picker-modal/`) is already a clean shared modal — reuse verbatim.

### Shared components to extract (P1)

Under `src/app/components/issue-creation/shared/`:

| New component | Extracted from | Public API (signals) |
|---|---|---|
| `app-issue-details-form` | `issue-details.component` (description / desiredOutcome / communityImpact / urgency + AI-enhance) | `initialValue = input<…\|null>(null)`; `valueChange = output<…>()`; `validityChange = output<boolean>()` |
| `app-authority-picker` | `authority-selection.component` (debounced `getAuthorities`, grouping, `SelectedAuthority` signal, custom-email form, MIN 1/MAX 5) | `city = input.required<string>()`, `district = input<string\|null>(null)`, `initialSelected = input<SelectedAuthority[]>([])`; `selectionChange = output<…>()` |
| `app-photo-editor` | shared photo pipeline (`compressImage` opts + `StorageService.uploadPhotoWithRetry` + `isPrimary`) | `initialPhotos = input<PhotoData[]>([])`; `photosChange = output<…>()`; `maxPhotos = 8` |

Category = plain `nz-select` over `CategoryService.getCategoriesWithInfo()` (no component needed). Location = reuse `LocationPickerModalComponent`.

**Also create** `src/app/components/issue-creation/issue-field.constants.ts` holding the single source of truth: `ISSUE_TITLE_MAX = 150`, `DESCRIPTION_MIN = 10`, `TEXTAREA_MAX = 1000`, `DESCRIPTION_MAX = 2000`, `MIN_AUTHORITIES = 1`, `MAX_AUTHORITIES = 5`, `MAX_PHOTOS = 8`, `MAX_PHOTO_MB = 10`, and the editability sets (§5). Both flows import it. This ends the drift permanently.

**Phasing:** P0 ships full-field edit with logic **inline** in `EditIssueComponent` (importing the shared constants) so the load-bearing create wizard is untouched; the shared-component extraction is P1, reviewed against an already-green edit flow.

---

## 3. Field-by-field edit UI

`EditIssueComponent` becomes one reactive `FormGroup` plus signal-held sub-state for photos/authorities/location. **All values pre-fill from the `IssueDetailResponse` already fetched in `loadIssue()`** (`edit-issue.component.ts:115`) — no second fetch; the detail payload carries every field (`civica-api.types.ts:376-397`).

| Field | Widget | Pre-fill | Validators (mirror create) |
|---|---|---|---|
| **title** | `<input nz-input maxlength="150">` in `nz-input-group` | `issue.title` | `[required, maxLength(150)]` — **drop** current `minLength(10)/maxLength(200)` (`edit-issue.component.ts:84`) |
| **description** | `<textarea rows="4" maxlength="2000">` + counter | `issue.description` | `[required, minLength(10)]` — **drop** current `minLength(30)` (`:85`) |
| **category** | `<nz-select>` from `getCategoriesWithInfo()` (`category.service.ts:104`) with icon+label | `issue.category` (enum === `CategoryInfo.id`) | `[required]` |
| **urgency** | `<nz-select>` over `URGENCY_OPTIONS` (`civica-api.types.ts:813`) | `normalizeUrgency(issue.urgency)` (copy from `issue-details.component.ts:262`) | none; default `'medium'` |
| **desiredOutcome** | `<textarea rows="3" maxlength="1000">` + counter | `issue.desiredOutcome` | `[required, minLength(10)]` |
| **communityImpact** | `<textarea rows="3" maxlength="1000">` + counter | `issue.communityImpact` | `[required, minLength(10)]` |
| **location** | Read-only address text + **"Schimbă locația"** button → `LocationPickerModalComponent` | `issue.address/district/latitude/longitude` seed `nzData.config` | required (always present on an existing issue) — **[risk G7]** if `issue.district` is null on a legacy issue, don't hard-require it; see §9 |
| **photos** | `app-photo-editor` (P1) / current pipeline extended to 8/10MB + `isPrimary` (P0) | `issue.photos[]` → `PhotoData` incl. `isPrimary` | ≥1; ≤8; ≤10MB each; `image/*` |
| **authorities** | `app-authority-picker` (P1) / inline replica (P0) | `issue.authorities[]` → `SelectedAuthority` | 1–5 |

**`whenOccurred`:** UI-only, never persisted (`issue-review.component.ts:195-208` omits it). **Not in the edit form.**

**Location wiring** — copy `issue-type-selection.component.ts:209-250`. `NzModalService` is already injected (`edit-issue.component.ts:59`):

```ts
const modalRef = this.modal.create<LocationPickerModalComponent, LocationData>({
  nzTitle: 'Selectează Locația',
  nzContent: LocationPickerModalComponent,
  nzWidth: window.innerWidth < 576 ? '95vw' : 700,
  nzMaskClosable: false,
  nzData: { config: {
    initialLocation: { lat: this.issue!.latitude, lng: this.issue!.longitude },
    initialAddress:  this.issue!.address,
    initialCity:     DEFAULT_CITY,               // or stored city if available
    initialDistrict: this.issue!.district ?? null,
  }},
  nzFooter: null,
});
modalRef.afterClose
  .pipe(takeUntilDestroyed(this._destroyRef))
  .subscribe((r: LocationData | null) => { if (r) this.location.set(r); });
```

Config pre-fill keeps the modal's confirm enabled without re-geocoding (`location-picker-modal.component.ts` `ngAfterViewInit` seeds `selectedLocation`).

**Authorities pre-fill / submit mapping:**
- Rehydrate `IssueAuthorityResponse` → `SelectedAuthority`: `{ authorityId: a.authorityId, email: a.email, name: a.name, isCustom: !a.isPredefined }`.
- On save `SelectedAuthority` → `IssueAuthorityInput`: `s.isCustom ? { customName: s.name, customEmail: s.email } : { authorityId: s.authorityId }` (copy `issue-review.component.ts:176-187`).
- Pass the (possibly newly-picked) `city`/`district` into `app-authority-picker` so `getAuthorities({city,district})` (`api.service.ts:178`) filters correctly.

**Photos pre-fill / submit:**
- Rehydrate response photo **objects** → `PhotoData` carrying `url` + `isPrimary`.
- On save, sort primary-first and map to `photoUrls: string[]` (`issue-review.component.ts:190-206`). Extend `beforeUpload` from 5/5MB to **8/10MB** (`edit-issue.component.ts:166,177`) and add `isPrimary` selection.
- **[risk A5/C8]** `photoUrls: string[]` loses per-photo `id`/`description` and reduces primary to "index 0". If primary/description must survive robustly, the backend contract needs a richer photo input object (`{url, isPrimary?, description?}`) — see backend §4. Otherwise accept the positional-primary limitation explicitly.

---

## 4. Entry points

Single shared predicate so no surface drifts. In `issue-field.constants.ts`:

```ts
export const EDITABLE_BY_OWNER_STATUSES: IssueStatus[] =
  ['Rejected', 'Active', 'Submitted', 'UnderReview']; // + 'Draft' iff reachable (verify)
export const isOwnerEditableStatus = (s: IssueStatus): boolean =>
  EDITABLE_BY_OWNER_STATUSES.includes(s);
```

**[fix G1/C1]** There is now **one** editable set and **no** separate re-review-lock set. A pending issue is editable; it just doesn't change status on save. Expose the predicate as an `IsOwnerEditablePipe` in `status.pipe.ts` (alongside `IsRejectedPipe` at `:99`).

### 4a. `issue-detail` — highest priority (canonical/shared-link page; today a dead end for owners)

`_currentUserId` is cached from `selectAuthUser` (`issue-detail.component.ts:148-152`) and already compared to `issue.user.id` in `cannotVote()` (`:404`). Add:

```ts
isOwner(issue: IssueDetailResponse): boolean {
  return !!this._currentUserId && issue.user.id === this._currentUserId;
}
editIssue(issue: IssueDetailResponse): void {
  this.router.navigate(['/edit-issue', issue.id]);
}
```

**Button** — top of the right-hand action column (`issue-detail.component.html` ~line 185). **Must** wrap icon+text per the hydration rule (this route may hydrate):

```html
@if (isOwner(issue) && (issue.status | isOwnerEditable)) {
  <button nz-button nzType="default" nzBlock (click)="editIssue(issue)">
    <span nz-icon nzType="edit" nzTheme="outline"></span><span>Editează problema</span>
  </button>
}
```

**Rejected-issue banner CTA** (proposed extra affordance): for `Rejected` issues the viewer owns, add an `nz-alert nzType="warning"` at the top of the left column (~`:49`) with a primary *"Editează și retrimite"* button. Showing the rejection reason requires a backend field (`rejectionReason`/`adminNotes` live only on `AdminIssueDetailResponse`, `civica-api.types.ts:570-571`, **not** on `IssueDetailResponse`) — ship the banner without the reason in P0, note the gap (§9).

### 4b. `my-issues` — explicitly required

Today `Editează` shows only for `Rejected` (`my-issues.component.html:66-73`). Broaden the gate to `isOwnerEditable`; `editIssue()` navigation already exists (`my-issues.component.ts:115-118`). Keep `Rezolvă`/`Anulează` for `Active`; add `Editează` alongside them (`nzType="default"`). Note `IsActivePipe` matches only `'active'` (`status.pipe.ts:75`), so `Submitted`/`UnderReview` cards currently get **no** buttons — the new gate fixes that.

```html
@if (issue.status | isOwnerEditable) {
  <button nz-button nzType="default" (click)="editIssue(issue)">
    <span nz-icon nzType="edit"></span><span>Editează</span>
  </button>
}
```

### 4c. `dashboard` "Problemele Mele" mini-cards — recommended extra surface

These are the viewer's own issues (`dashboard.component.ts:126`, `recentUserIssues$`) → ownership implicit. Add a compact `nzSize="small"` `Editează` gated by `isOwnerEditable`, routing to `/edit-issue/:id` (`dashboard.component.html:150-170`).

### 4d. Explicitly OUT of scope

`issues-list` and `city-hub` bind `IssueItem`, which has **no user id** (only `submitterName?`, `civica-api.types.ts:346`) and default to public `Active`/`Resolved` only. Ownership is undeterminable there — no edit affordance.

**Ranked recommendation:** (1) `issue-detail` owner action + rejected banner — the canonical page the user reaches from a shared link; (2) `my-issues` — the management hub; (3) `dashboard` mini-cards — convenience. All three reuse the one predicate.

---

## 5. Status / editability model + re-approval UX

### 5.1 Editability & transition (resolves the earlier contradiction)

- **Editable set** = D1. One predicate (`isOwnerEditableStatus`) drives every button and the load guard — no second lock set.
- **Transition on save:**
  - from `Rejected` or `Active` → `resubmit:true` → **`Submitted`** (re-enters the admin queue).
  - from `Submitted`/`UnderReview` (already pending) → content updated **in place, status stays pending** (no dead-end, no churn beyond the concurrency guard).
- **Landing status is `Submitted`** (not `UnderReview`). This matches the type comment (`civica-api.types.ts:255`) and the create flow's initial status. The current modal copy *"În verificare"* (UnderReview) is **wrong** and is fixed below.
- **Optimistic concurrency (D6):** send the loaded `updatedAt` (as `If-Match` or `expectedUpdatedAt`); on `409` reload the issue and tell the owner it changed (e.g. an admin acted) — do not blind-overwrite.

### 5.2 Load & gating (`edit-issue.component.ts`)

- **Route unchanged:** `edit-issue/:id`, `authGuard`, `RenderMode.Client` (`app.routes.server.ts:32`) — browser-only APIs (image compression worker, Supabase upload, Maps) are safe; no SSR timeout guard needed.
- **Ownership gate (keep):** `issue.user.id !== currentUserId` (`edit-issue.component.ts:122`) → defense-in-depth; backend independently enforces from JWT `sub` (`auth.interceptor.ts` only attaches the token, does not authorize).
- **Status gate (change):** replace hard-coded `status !== 'rejected'` (`:128`) with `!isOwnerEditableStatus(issue.status)` → *"Această problemă nu mai poate fi editată."*
- **[risk G4/C9] Owner read of non-public issues:** the form loads via `getIssueById` → `GET /issues/{id}`, which is auth-optional. After an edit an `Active` issue becomes `Submitted` (non-public). The backend **must** return a non-public issue to its owner (and only owner/admin) — stated as a contract in backend §9. Verify before relying on it.

### 5.3 Confirmation copy (Romanian) — replace the rejected-only text at `edit-issue.component.ts:202-208`

- **From `Rejected` (or `Draft`):**
  > **Retrimite problema** — Modificările vor fi trimise spre aprobare. Un administrator le va verifica înainte ca problema să devină publică. · *[Da, retrimite] [Anulează]*
- **From `Active` (live, public) — extra warning [risk G3/G6]:**
  > **Retrimite problema pentru aprobare** — Problema ta este momentan **publică**. Dacă o modifici, va fi **retrasă temporar** din listă și retrimisă spre aprobare. Va redeveni publică după ce un administrator o aprobă. Voturile și emailurile trimise se păstrează. · *[Da, modifică și retrimite] [Anulează]*
- **From `Submitted`/`UnderReview` (already pending):**
  > **Salvează modificările** — Problema este deja în așteptarea aprobării. Modificările vor fi verificate de un administrator. · *[Salvează] [Anulează]*
- **Success toast:** `this.message.success('Problema a fost retrimisă spre aprobare.')`.
- Replace the hard-coded rejection banner (`edit-issue.component.html:28-34`) with status-aware text.

### 5.4 What the owner sees after resubmit

- Navigates back to `/my-issues`; the `nz-tag` flips green `ACTIVĂ` → amber `TRIMISĂ` — `StatusTextPipe`/`StatusColorPipe` already render `Submitted`/`UnderReview` (`status.pipe.ts`); no new pipe.
- On the owner's own `issue-detail`, keep it visible to the owner with a re-review banner *"Modificările tale sunt în curs de verificare."* Non-owners hitting a now-non-public issue get the normal not-found path.
- **[risk G5]** There is no re-approval-complete notification today; the owner must poll `my-issues`. Push infra exists in the server/mobile repos — a "your edit was approved/rejected" notification is recommended follow-up (out of frontend scope here).
- Note `getDisplayStatus()` (`civica-api.types.ts:46`) collapses `Submitted`/`UnderReview`/`Active` to "Activ" for coarse public displays, but `my-issues` uses fine-grained `StatusTextPipe`, so the owner sees the real amber state.

---

## 6. `api.service.ts` + `civica-api.types.ts` — DEPENDS ON BACKEND

> Inert until the .NET `PUT /api/user/issues/{id}` handler accepts and persists the new fields. Ship order: backend handler → frontend type widening → UI.

**`civica-api.types.ts:251-256`** — **[fix C2/C3]** Do **not** type this as `Partial<CreateIssueRequest>` — all-optional invites silent-null wipes under PUT-replace semantics. Define an explicit full-field resubmit shape with the fields the edit form actually sends, `resubmit` required:

```ts
/** Request to edit user's own issue. Full replacement (PUT). */
export interface EditUserIssueRequest {
  title: string;
  description: string;
  category: IssueCategory;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  urgency?: UrgencyLevel;
  desiredOutcome?: string;
  communityImpact?: string;
  photoUrls?: string[];              // or richer photo objects — see backend §4
  authorities?: IssueAuthorityInput[];
  resubmit: boolean;                 // always true in v1 (D7)
  expectedUpdatedAt?: string;        // optimistic concurrency (D6)
}
```

**`api.service.ts:237-239`** — no signature change: `editUserIssue(issueId, data): Observable<IssueDetailResponse>` already returns the full detail. The 401 refresh/retry/signOut cascade already covers this auth-required PUT.

---

## 7. NgRx changes

Today edit is a **direct component API call** whose only store side effect is `refreshUserIssues()` + navigate (`edit-issue.component.ts:320-323`). Two slices hold issues: `store/issues` (`issueAdapter` entities + `selectedIssueDetail`) and `store/user-issues`. Neither is invalidated on edit, so an edited `Active` issue can leave `PUBLIC_VIEWABLE_STATUSES` yet linger as a stale "Activ" card/detail.

### Proper NgRx surface (P1; P0 keeps the direct call + `refreshUserIssues`)

- **`store/issues/issue.actions.ts`** — add `editIssue`, `editIssueSuccess({ issue })`, `editIssueFailure`.
- **`store/issues/issue.effects.ts`** — effect calls `apiService.editUserIssue(...)`; on success dispatch `editIssueSuccess` **and** `UserIssuesActions.refreshUserIssues()` (already wired to a full `setAll` refetch, `user-issues.effects.ts:18-37`).
- **`store/issues/issue.reducer.ts`** — `on(editIssueSuccess)` using the existing dual-update pattern (`trackEmailSentSuccess` `:68-96`, `voteForIssueSuccess` `:118-146`):
  - Always replace `selectedIssueDetail` with the returned issue (**[fix C6]** server status is authoritative — never keep the old status).
  - Public list entities: **if `isPubliclyViewableStatus(issue.status)` is false**, `issueAdapter.removeOne(id)`; else `issueAdapter.updateOne(...)`. Prevents the stale public "Activ" card.
- **`store/user-issues/user-issues.reducer.ts`** — optional optimistic `updateOne` to `Submitted` (mirror `markIssueAsSolvedSuccess`/`cancelIssueSuccess` `:31-44`); `refreshUserIssues` already refetches, so this is polish.
- **Detail refresh:** prefer feeding the resubmit response straight into `editIssueSuccess` (equivalent to `loadIssueSuccess`) — no extra GET.
- **Activity feed:** `ActivityType` (`civica-api.types.ts:895`) has no edit/resubmit type. Do **not** log client-side; the frontend renders only what the API emits. An auditable resubmit trail is a backend addition (backend §8).

---

## 8. SSR / hydration + Google Maps billing

- Route is `RenderMode.Client` — no server render, no SSR timeout guard, no browser-API risk on this route.
- **Hydration rule:** every new `nz-button` with icon+text (`issue-detail`/`my-issues`/`dashboard`) **must** wrap the text in an explicit `<span>` (`issue-detail` hydrates → risk of `NG0500` loop otherwise). Markup in §4 complies.
- **Maps billing (memory: map intent-gating, ~$280/mo at 50k views if always-on):** the location picker is a **modal** instantiated only on click. **Never** render a live inline `<google-map>` on the edit route. Show read-only address text + "Schimbă locația" opening the modal. Ensure the Maps script is present before opening (via `GoogleMapsConfigService`, as create does — the modal only polls `window.google`, it does not load the script).

---

## 9. Known risks & required mitigations (from adversarial review)

| Ref | Risk | Mitigation in this plan |
|---|---|---|
| **A1** | **Bait-and-switch:** preserve counters + no admin diff ⇒ accrue support on benign content, then swap it | D5 — require an admin diff view before allowing full post-approval edits; else reduced editable set post-approval |
| **A2/C4** | `resubmit=false` on `Active` = silent live-content edit (moderation bypass) | D7 — drop `resubmit=false` from v1; forbid for public statuses |
| **A3** | Authority full-replace fights "only email newly-added" (delete+recreate makes *all* links new → re-blast) | Backend must match already-emailed authorities by **email address** across the replace and never re-blast — backend §7 |
| **A4** | Removed-photo blobs orphan in Supabase storage (cost + leak); failed PUT after upload orphans new blobs | Backend GC of unlinked blobs; client uploads only on save — backend §6 |
| **A5/C8** | `photoUrls: string[]` loses `isPrimary`/`description`/stable ids | Accept positional-primary, or richer photo input object — backend §4 |
| **A6/C7** | Concurrent owner-save vs admin action | D6 — optimistic concurrency → `409` → reload + explain |
| **A7** | Repeated edits flood the moderation queue / bump for attention | Optional rate-limit/cooldown (backend) — note as follow-up |
| **A8** | Silent field mutation on save (`normalizeUrgency('unspecified')→'medium'`; București-only location rejects legacy out-of-area) | Only send fields the user actually changed where feasible; surface any coercion; don't fail-save silently |
| **G3/G6** | Rejected edit destroys a healthy live issue (no rollback); indexed/shared/QR links 404 during re-review | Loud warning before editing `Active` (§5.3); shadow-revision model deferred |
| **G5** | No re-approval-complete notification | Follow-up: push notification via server/mobile repos |
| **G7** | `district` required on edit but optional on response ⇒ legacy null-district issue can't save | Don't hard-require `district` if the loaded issue's is null; treat as "keep as-is" |
| **G10** | `Draft` may be a phantom state | Verify create can produce `Draft`; include in editable set only if reachable |
| **C5** | Resubmit landing status must actually enter the admin queue | Acceptance criterion — confirm `GET /admin/pending-issues` includes `Submitted` (backend §5.2) |

---

## 10. Edge cases & validation

- **All photos removed:** block save if 0 photos. Preserve the existing-vs-new split (`edit-issue.component.ts:220-224`) and the `merge()+toArray()+catchError(of(null))` partial-failure pattern (`:260-280`) that avoids orphaned uploads.
- **Category change:** authorities are location-filtered, not category-filtered — a category change doesn't invalidate them; don't force re-selection.
- **Location changed to a new district:** re-run `getAuthorities` with the new `city/district`; keep previously-selected predefined authorities selected but tolerate backend rejection defensively.
- **Terminal statuses** (`Resolved`/`Cancelled`): not editable; gate hides the button and the load-guard rejects.
- **Validator parity:** the edit form must accept everything create accepted (title `max150`/no-min, description `min10`) — do not carry over the stricter old edit validators.

---

## 11. Phased rollout

- **P0 (ships value; depends on backend PUT change):** widen `EditUserIssueRequest`; extend `EditIssueComponent` to full-field edit with **inline** logic (category `nz-select`, urgency/outcome/impact controls, location modal reuse, authorities inline replica, photos 8/10MB+`isPrimary`), importing shared constants; broaden status gate; add optimistic concurrency; wire entry points into `issue-detail` + `my-issues`; fix modal/success copy; keep the direct API call + `refreshUserIssues`.
  - **Required companion for the `Active`-edit path (D5):** the admin re-review screen must show a **field-level diff** of what changed vs the last-approved version (backend §5.3 supplies the data; small addition to `admin-issue-detail`/`approval-interface`). Editing `Rejected`/pending issues can ship before the diff; editing **`Active`** issues must **not** go to production until the diff is live.
- **P1 (dedup + correctness):** extract `app-issue-details-form` / `app-authority-picker` / `app-photo-editor`; refactor create wizard + edit to consume them; add the NgRx `editIssue` action/effect/reducer with `isPubliclyViewableStatus`-driven `removeOne`/`updateOne`; add dashboard mini-card edit.
- **P2 (polish / backend-coordinated):** expose `rejectionReason` to owner + rejected banner content; resubmit audit entry + `issueResubmitted` activity type; re-approval push notification; optional edit rate-limit; (later) shadow-revision model so live-issue edits stop pulling from public.

---

## 12. Test checklist

- Owner sees "Editează problema" on `issue-detail` for each editable status; non-owner never sees it; absent for `Resolved`/`Cancelled`.
- `my-issues`: Edit shows for `Rejected`/`Submitted`/`UnderReview`/`Active`; `Rezolvă`/`Anulează` still show for `Active`.
- Full pre-fill: every field (incl. photos `isPrimary`, custom authorities) round-trips from `IssueDetailResponse` into the form.
- Location modal opens with coords pre-seeded, confirm enabled without re-geocode; returns new `LocationData`; **no inline map** on route load.
- Authority mapping: predefined ↔ `authorityId`, custom ↔ `customName/customEmail`; MIN 1/MAX 5 enforced.
- Save payload matches widened `EditUserIssueRequest`; `resubmit:true` sent; photos sorted primary-first; `expectedUpdatedAt` sent.
- After save: `Active` issue disappears from public list/detail (`removeOne`); `my-issues` tag flips green→amber; toast accurate.
- Concurrency: admin moves the issue while the form is open → save returns `409` → client reloads and explains (no clobber).
- Pending-edit: editing a `Submitted`/`UnderReview` issue updates content, status stays pending, no dead-end.
- Ownership bypass: `/edit-issue/:id` for someone else's issue → permission error (and backend 403).
- Owner read: owner can load the edit form for their own now-`Submitted`/`Rejected` issue (non-public read works).
- Hydration: no `NG0500` loop on `issue-detail` after adding the icon+text edit button.
- Validator parity: a title/description create accepted is not rejected by edit.
- Partial photo-upload failure: successful uploads still submit; warning shown; no orphaned files.

---

**Key files touched:** `src/app/components/user/edit-issue/edit-issue.component.{ts,html,scss}`, `src/app/components/issue-detail/issue-detail.component.{ts,html}`, `src/app/components/user/my-issues/my-issues.component.html`, `src/app/components/user/dashboard/dashboard.component.html`, `src/app/pipes/status.pipe.ts`, `src/app/types/civica-api.types.ts`, `src/app/store/issues/{issue.actions,issue.effects,issue.reducer}.ts`, and (P1) new `src/app/components/issue-creation/shared/{issue-details-form,authority-picker,photo-editor}/` + `issue-field.constants.ts`. **Reused as-is:** `shared/location-picker-modal/`, `services/category.service.ts`, `services/storage.service.ts`, `services/google-maps-config.service.ts`.
