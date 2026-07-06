/**
 * Teachers Workspace — Categorical Color Palette
 *
 * A 12-color palette for data visualisation, designed following Spectrum's
 * categorical palette methodology and anchored in the Teachers Workspace brand.
 *
 * Usage rules (Spectrum-aligned):
 * - Use colors IN ORDER — Color 1 first, Color 2 second, etc.
 * - Use up to 6 colors for most charts; beyond 6 becomes hard to distinguish
 * - Use only for CATEGORICAL (non-numeric) data — not for sequential/ordinal scales
 * - Keep colors consistent across charts on the same page
 *
 * Colors 1–6: Primary set — maximally distinct, suitable for everyday charts
 * Colors 7–12: Extension set — use only when >6 categories are unavoidable
 *
 * Do NOT use for:
 * - Attendance severity (red/orange/yellow scale — reserved semantic colors)
 * - "Present" ring indicators (#12b886 — reserved)
 * - Grade diverging scales (A1→D7 — separate semantic scale)
 */
/**
 * Teachers Workspace — 6-Color Categorical Palette (IBM-inspired, Spectrum-muted)
 *
 * Hues taken from the IBM Carbon categorical family (blue → violet → pink → teal →
 * orange → amber), anchored to TW blue-500's hue angle (217°), then muted to
 * Spectrum's saturation range (~58–62%) and adjusted lightness (~43–57%) so no
 * colour shouts louder than the others.
 *
 * Each hex is the direct HSL calculation of the TW-500 hue at S=60%, L=50–57%
 * (yellows/ambers pull slightly darker to compensate for their higher perceived
 * brightness).
 *
 * Contrast on #fcfcfd (app background): all ≥ 3.5:1
 *
 * Ordering for multi-series charts:
 *   Cool → warm progression; teal acts as neutral bridge.
 *   Use Blue/Violet for early/primary series, Orange/Amber for high-stakes,
 *   Pink for categorical contrast, Teal for summary metrics.
 *
 * | # | Name   | Hex       | Hue angle | S   | L   | Use case example          |
 * |---|--------|-----------|-----------|-----|-----|---------------------------|
 * | 1 | Blue   | #457cd3   | 217°      | 62% | 55% | T1 / primary series       |
 * | 2 | Violet | #7852d1   | 258°      | 58% | 57% | T2 / second series        |
 * | 3 | Pink   | #cc4287   | 330°      | 58% | 53% | T3 / categorical contrast |
 * | 4 | Teal   | #35a699   | 173°      | 52% | 43% | T4 / neutral bridge       |
 * | 5 | Orange | #cf7330   | 25°       | 62% | 50% | T5 / high-stakes / warm   |
 * | 6 | Amber  | #d0a639   | 43°       | 62% | 52% | T6 / lightest / end       |
 */

/**
 * ===========================================================================
 * Chart chrome — neutral, non-data ink (Phase 013 centralization)
 * ===========================================================================
 *
 * Gridlines, axes, tick text, tooltip borders/surfaces, and neutral bar
 * labels. These are NOT data-viz hues — they are the recessive scaffolding a
 * chart is drawn on. Unlike the reserved series colors below, chrome MUST
 * dark-flip, so each is a Radix `var(--color-slate-N)` reference (the slate
 * scale swaps under `.dark`). Recharts SVG props take a raw string, so these
 * resolve to the CSS variable at paint time.
 *
 * Role → step mapping (matches plan 013 §Strategy bucket A):
 *   grid      → slate-4  (subtle, recedes behind data)
 *   axis      → slate-6  (axis/tooltip border weight)
 *   tick      → slate-11 (low-contrast axis label text)
 *   label     → slate-12 (high-contrast on-bar / total value text)
 *   surface   → slate-2  (tooltip/popover chart surface fill)
 *
 * Replaces the scattered grays: #e9ecef / #e5e7eb (grid), #dee2e6 (tooltip
 * border), #868e96 (ticks), #495057 (bar labels/totals), #fff/#ffffff
 * (tooltip surface + white on-bar text), #adb5bd/#d0d5dd (see notes below).
 */
export const CHART_GRID = 'var(--color-slate-4)' // gridlines (#e9ecef, #e5e7eb)
export const CHART_TICK = 'var(--color-slate-11)' // axis tick text (#868e96)
export const CHART_TOOLTIP_BORDER = 'var(--color-slate-6)' // tooltip border (#dee2e6)
export const CHART_LABEL = 'var(--color-slate-12)' // on-bar / total value labels (#495057, #ffffff, var(--slate-12))
export const CHART_SURFACE = 'var(--color-slate-2)' // tooltip / chart card surface fill (#fff)

/**
 * ===========================================================================
 * Reserved semantic series — theme-STABLE data-viz hues
 * ===========================================================================
 *
 * The palette header (above) reserves these as intentional, exact hues that
 * are NOT drawn from the categorical set and must read the same in light and
 * dark. Per plan 013 §bucket B, they are moved here verbatim as named exports
 * — the exact hex is preserved; Radix-ifying them is a deferred design call.
 * This is the single place to retune attendance / present / grade hues later.
 */

/**
 * Attendance severity scale — reserved reds/oranges for absence types.
 * Keyed by the semantic level used across the attendance charts.
 * Reds escalate with severity; oranges/yellows are lower-severity.
 */
export const ATTENDANCE_SEVERITY = {
  pendingReason: '#fa5252', // red — pending-reason bar top (#fa5252)
  pendingReasonStrong: '#e03131', // stronger red — absence-details "Pending reason" dot (#e03131)
  nonVRAbsence: '#fd7e14', // orange — non-VR absence bar / ring LTA (#fd7e14)
  nonVRAbsenceStrong: '#f76707', // stronger orange — absence-details "without valid reason" (#f76707)
  late: '#fac53e', // yellow — latecoming bar (#fac53e)
  absentExcl: '#ffa94d', // light orange — absent excl pending-reason ring segment (#ffa94d)
} as const

/**
 * "Present" ring indicator — reserved success teal-green.
 * The attendance ring / "% present" success hue. Documented reserved (#12b886).
 */
export const PRESENT_RING = '#12b886' // teal-green — present/success ring (#12b886)

/**
 * Series blue — the brand data-series blue used in bar/line/ring charts.
 * Distinct from the categorical set; the "primary series" hue.
 */
export const SERIES_BLUE = '#228be6' // brand blue — primary series / ring / box-plot stroke (#228be6)
export const SERIES_BLUE_COBALT = '#4d79e0' // cobalt blue H=222° — valid-reason(official), Term 1 WA (#4d79e0)
export const SERIES_BLUE_LIGHT = '#74c0fc' // light blue — Term 3 WA / MC bar / grade A2 (#74c0fc)

/**
 * Grade diverging fill scale (A1 → VR) — reserved semantic scale, NOT
 * categorical. Blues for high grades → teal → orange/red for low, neutral for
 * VR. Values match academic-analytics `GRADE_FILL` verbatim.
 */
export const GRADE_FILL: Record<string, string> = {
  A1: '#228be6', // blue
  A2: '#74c0fc', // light blue
  B3: '#12b886', // teal-green
  B4: '#63e6be', // light teal
  C5: '#fd7e14', // orange
  C6: '#ffa94d', // light orange
  D7: '#fa5252', // red
  VR: '#adb5bd', // neutral gray (voided result)
}

/**
 * Report core-values radar strokes — reserved report accent hues.
 * `green` is the present/success teal; `pink` is actually report ORANGE
 * (coral, #f26c47), NOT pink → crimson (plan 010 decision BRAND / PINK). The
 * exact coral is a design-flagged brand hue kept verbatim; fills are the same
 * hue at ~15% alpha via color-mix so they dark-flip cleanly.
 */
export const RADAR_STROKE = {
  green: PRESENT_RING, // #12b886 — present/success
  pink: '#f26c47', // coral report-orange — flagged brand hue (#f26c47)
} as const

export const RADAR_FILL = {
  green: 'color-mix(in srgb, #12b886 15%, transparent)', // was rgba(18,184,134,0.15)
  pink: 'color-mix(in srgb, #f26c47 15%, transparent)', // was rgba(242,108,71,0.15)
} as const
