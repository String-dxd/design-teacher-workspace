# Reports Page — Design Spec

Date: 2026-06-29

## Overview

A new page at `/reports` (under Manage, gated by the `reports` feature flag) that lets teachers export two types of class-level reports. Admins get an additional school-wide mode with a class picker and whole-school export option.

## Route & File

- Layout: `src/routes/reports.tsx` (already exists, renders `<Outlet />`)
- Index: `src/routes/reports.index.tsx` (replace skeleton with full implementation)
- No sub-routes needed.

## Roles

- `IS_ADMIN = true` (hardcoded prototype constant, same as Posts/Groups)
- Normal teacher: sees their own fixed class label, no scope toggle
- Admin: sees the school-wide toggle button and a class picker when active

## Page Structure

### Header (matches Groups pattern exactly)

```
border-b px-6 py-4
  h1 "Reports"  +  <span> "Concept" badge (blue-100 / blue-900)
  p  subtitle text
```

Subtitle differs by mode:

- My class: "Export reports for your class."
- School-wide (admin): "Export reports for any class or the whole school."

### Toolbar row (matches Posts/announcements.index.tsx pattern)

```
px-6 py-3 flex items-center gap-2 border-b
  [Segmented pill]  SegmentedTab × 2
  |  (thin separator, 1px bg-border h-5)     ← admin only
  [School-wide toggle button]                 ← admin only
```

Segmented pill tabs: **Onboarding** | **Travel Declaration**

School-wide toggle styling (active state = bg-foreground text-background):

```tsx
className={cn(
  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
  isSchoolWide
    ? 'border-foreground/20 bg-foreground text-background'
    : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground',
)}
```

### Banner (admin school-wide only — matches Posts banner exactly)

```
mx-6 mt-4 flex items-center rounded-lg border border-border bg-muted/50 px-4 py-2.5
  p text-sm text-muted-foreground
  "Viewing school-wide. Select a class below or choose All classes to export."
```

### Class selector (admin school-wide only)

Placed below banner, `px-6 mt-4`. Uses the existing `ClassSelector` component from `@/components/students/class-selector` with an additional "All classes" option prepended.

State: `selectedClass` — defaults to `'all'` when school-wide is activated.

```tsx
<ClassSelector value={selectedClass} onValueChange={setSelectedClass} />
```

The "All classes (school-wide)" option is the first item. When selected, export button label becomes "Export all classes to Excel".

### "Generating report for" label (my-class mode)

Small label + bold class name, same layout as the reference screenshots but using app typography:

```tsx
<p className="text-sm text-muted-foreground">Generating report for</p>
<p className="text-base font-semibold">3A</p>
```

This is hardcoded to `'3A'` (mock form class) when not in school-wide mode.

## Report Type: Onboarding

Content area (`px-6 py-6`):

- Description paragraph (text-sm text-muted-foreground)
- Export button (always enabled)
- Export simulated via `toast.success('Exporting onboarding report...')`

Description text:

> "Form and Co-Form teachers can export custodian onboarding status reports for their form class. To allow or remove PG access for custodians, please do so in School Cockpit. Updates will be reflected within 24 hours."

Admin school-wide: same content, button label changes based on `selectedClass`:

- `'all'` → "Export all classes to Excel"
- specific class → "Export [class] to Excel"

## Report Type: Travel Declaration

Content area (`px-6 py-6`):

- Description paragraph
- **Report Filters** section (bordered divider above, small uppercase label "REPORT FILTERS")
- Declaration status radio group
- Date range inputs
- Export button (disabled unless both status and date range are filled)

Description:

> "Form and Co-Form teachers can generate travel declaration reports for their form class."

### Declaration status radio group

Two full-width radio options in styled bordered boxes (not native radio UI — visually styled boxes):

```
[○] Did Not Declare (No declarations made)
[○] Declared (Include travelling and not travelling)
```

Selected state: border-primary bg-primary/5, radio dot filled with primary colour.
Unselected: border-border bg-background.

### Date range inputs

```
[Start date input]  →  [End date input]
```

Both are `<Input type="date" />` using the app's Input component. Helper text below:

> "E.g. For the June 2025 School Holidays, enter Start Date (30 May) and End Date (28 June)."

### Export button state

- Disabled: `declarationStatus === null || !startDate || !endDate`
- Enabled: all three filled
- Button uses standard `<Button>` component, `variant="default"` when enabled, disabled prop when not
- Export simulated via `toast.success('Exporting travel declaration report...')`

## Search Params

```ts
validateSearch: (search) => ({
  tab: (search.tab as ReportTab) ?? 'onboarding',
  scope: (search.scope as 'my' | 'school') ?? 'my',
})
```

`ReportTab = 'onboarding' | 'travel-declaration'`

Tab and scope are URL-driven via `useNavigate` (same pattern as Posts).

## State

All local React state (not persisted to URL):

- `declarationStatus: 'not-declared' | 'declared' | null` — null initially
- `startDate: string` — empty initially
- `endDate: string` — empty initially

These reset when switching tabs (clear on tab change).

## Mock data / constants

```ts
const IS_ADMIN = true
const MY_CLASS = '3A'
```

No new mock data files needed — exports are simulated with toast.

## Design tokens / component reuse

| Element            | Component                                                           |
| ------------------ | ------------------------------------------------------------------- |
| Tab pill           | Inline `SegmentedTab` (copy pattern from `announcements.index.tsx`) |
| School-wide toggle | Inline button with same className logic as Posts                    |
| Banner             | Inline div matching Posts banner                                    |
| Class selector     | `ClassSelector` from `@/components/students/class-selector`         |
| Export button      | `Button` from `@/components/ui/button`                              |
| Date inputs        | `Input` from `@/components/ui/input`                                |
| Toast              | `toast` from `sonner`                                               |
| Breadcrumbs        | `useSetBreadcrumbs` from `@/hooks/use-breadcrumbs`                  |

## Out of scope

- Actual Excel file generation
- Persistent filter state across page navigations
- Multiple form classes per teacher
- Date picker calendar UI (plain date input is sufficient for prototype)
