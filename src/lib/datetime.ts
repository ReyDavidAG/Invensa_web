// Single source of truth for date/time formatting and day-boundary math.
// Invensa is single-store, single-timezone (es-MX, Mexico City) — every
// display must be pinned to that zone explicitly. `Intl.DateTimeFormat`
// without an explicit `timeZone` falls back to the RUNTIME's zone: for a
// client component that's the viewer's own device (different phone/laptop
// timezone settings render the exact same instant differently — this is
// the bug this file exists to prevent); for a server component it's
// whatever zone the Node process happens to run in (UTC on Vercel), which
// is silently wrong even though at least consistent across viewers.

export const STORE_TIME_ZONE = "America/Mexico_City";

type DateInput = string | number | Date;
const toDate = (input: DateInput) =>
  input instanceof Date ? input : new Date(input);

const dateShortFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeZone: STORE_TIME_ZONE,
});
const dateLongFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeZone: STORE_TIME_ZONE,
});
const dateTimeShortFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: STORE_TIME_ZONE,
});
const dateTimeLongFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: STORE_TIME_ZONE,
});
const timeFmt = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: STORE_TIME_ZONE,
});
const dayMonthFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  timeZone: STORE_TIME_ZONE,
});
const dayMonthTimeFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: STORE_TIME_ZONE,
});
const dayMonthYearFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: STORE_TIME_ZONE,
});
const longDateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: STORE_TIME_ZONE,
});
// en-CA gives a plain YYYY-MM-DD — used as an internal grouping/lookup key,
// never shown to the user directly.
const isoDateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: STORE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatDateShort = (input: DateInput) =>
  dateShortFmt.format(toDate(input));
export const formatDateLong = (input: DateInput) =>
  dateLongFmt.format(toDate(input));
export const formatDateTimeShort = (input: DateInput) =>
  dateTimeShortFmt.format(toDate(input));
export const formatDateTimeLong = (input: DateInput) =>
  dateTimeLongFmt.format(toDate(input));
export const formatTime = (input: DateInput) => timeFmt.format(toDate(input));
export const formatDayMonth = (input: DateInput) =>
  dayMonthFmt.format(toDate(input));
export const formatDayMonthTime = (input: DateInput) =>
  dayMonthTimeFmt.format(toDate(input));
export const formatDayMonthYear = (input: DateInput) =>
  dayMonthYearFmt.format(toDate(input));
export const formatLongDate = (input: DateInput) =>
  longDateFmt.format(toDate(input));

/** A given instant's civil date in Mexico City, as YYYY-MM-DD. Used as a
 *  grouping/lookup key (e.g. bucketing sales into daily chart series) —
 *  never for display. */
export const mexicoISODate = (input: DateInput) =>
  isoDateFmt.format(toDate(input));

/** Today's civil date in Mexico City, as YYYY-MM-DD. */
export const todayMexicoISODate = () => isoDateFmt.format(new Date());

// Mexico City is UTC-6 year-round for this store (no DST since the 2022
// reform) — the same fixed-offset convention already used across the cron
// routes, centralized here instead of re-derived per call site.
const MEXICO_UTC_OFFSET_HOURS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The UTC instant corresponding to 00:00 on the given Mexico City civil
 *  date (YYYY-MM-DD) — for range-querying a `timestamptz` column stored in
 *  UTC (e.g. `sales.date_at`). */
export function startOfMexicoDayUTC(mexicoDateStr: string): Date {
  return new Date(`${mexicoDateStr}T0${MEXICO_UTC_OFFSET_HOURS}:00:00Z`);
}

/** The UTC instant one civil day after `startOfMexicoDayUTC`. */
export function endOfMexicoDayUTC(mexicoDateStr: string): Date {
  return new Date(startOfMexicoDayUTC(mexicoDateStr).getTime() + DAY_MS);
}

/** Start of the Mexico City civil day `daysAgo` days before today, as a UTC
 *  instant — the day-boundary building block for "hoy" / "últimos N días"
 *  period filters. `mexicoDayStartUTC(0)` is the start of today. */
export function mexicoDayStartUTC(daysAgo = 0): Date {
  return new Date(
    startOfMexicoDayUTC(todayMexicoISODate()).getTime() - daysAgo * DAY_MS,
  );
}
