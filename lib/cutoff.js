// The single shared function for "which weekend can a customer order
// for right now, and when does that window close." Used by the public
// menu's status banner today, and will also drive order-submission
// validation (Phase 5) and the custom-message lead-time setting
// (Phase 8) — so this logic only ever lives in one place.
//
// IMPORTANT: this does real timezone math, not naive Date arithmetic.
// A server (e.g. a Vercel serverless function) usually runs in UTC,
// not Manitoba time — so treating "8:00 PM" as the server's local
// time would be wrong by 5-6 hours. Every calculation here is anchored
// to BAKERY_TIMEZONE explicitly, using the same technique either way:
// build a UTC guess, ask Intl what that guess actually reads as in the
// target zone, and correct for the difference. This correctly handles
// Daylight Saving Time without needing an extra date-math library.

const BAKERY_TIMEZONE = "America/Winnipeg";
const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function getWallClockParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: parts.weekday,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // Intl can format midnight as "24" instead of "00" in some engines.
    hour: parts.hour === "24" ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

// Adds `days` to a plain calendar date — pure calendar math, no
// timezone involved (adding a day is the same everywhere).
function addCalendarDays({ year, month, day }, days) {
  const ms = Date.UTC(year, month - 1, day) + days * 86_400_000;
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

// Converts a wall-clock date/time IN A SPECIFIC TIME ZONE into the
// correct UTC instant, correctly accounting for that zone's offset
// (including DST) at that specific moment.
function zonedWallTimeToUtcMs({ year, month, day, hour, minute, second = 0 }, timeZone) {
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const readBack = getWallClockParts(new Date(guessUtcMs), timeZone);
  const readBackUtcMs = Date.UTC(
    readBack.year, readBack.month - 1, readBack.day,
    readBack.hour, readBack.minute, readBack.second
  );
  const offsetMs = guessUtcMs - readBackUtcMs;
  return guessUtcMs + offsetMs;
}

/**
 * @param {Date} now - the authoritative current time. MUST come from
 *   the server's clock (see app/api/cutoff-status/route.js), never a
 *   customer's device clock — the project spec calls this out
 *   explicitly, since a device clock can't be trusted.
 * @param {string} cutoffDay - e.g. "Friday" (from the settings table)
 * @param {string} cutoffTime - "HH:MM" or "HH:MM:SS", 24-hour, in the
 *   bakery's own timezone (Postgres `time` columns come back as
 *   "HH:MM:SS" — the trailing seconds are simply ignored below)
 * @returns {{ cutoffAt: Date, weekendStart: {year,month,day} }}
 *   cutoffAt is a precise UTC instant (safe to compare against
 *   Date.now() for a countdown). weekendStart is a plain calendar
 *   date — the Saturday of the orderable weekend — with no timezone
 *   conversion needed to use it (e.g. for a `weekend_date` DB column).
 */
export function getOrderableWeekend(now, cutoffDay = "Friday", cutoffTime = "20:00") {
  const [cutoffHour, cutoffMinute] = cutoffTime.split(":").map(Number);
  const targetWeekdayIndex = WEEKDAY_NAMES.indexOf(cutoffDay);
  const cutoffWeekday = targetWeekdayIndex === -1 ? 5 : targetWeekdayIndex; // default Friday if misconfigured

  const nowParts = getWallClockParts(now, BAKERY_TIMEZONE);
  const nowWeekdayIndex = WEEKDAY_NAMES.indexOf(nowParts.weekday);

  const daysUntilCutoff = (cutoffWeekday - nowWeekdayIndex + 7) % 7;
  let cutoffDate = addCalendarDays(nowParts, daysUntilCutoff);
  let cutoffMs = zonedWallTimeToUtcMs(
    { ...cutoffDate, hour: cutoffHour, minute: cutoffMinute },
    BAKERY_TIMEZONE
  );

  if (now.getTime() >= cutoffMs) {
    // This cycle's cutoff has already passed (either it was earlier
    // today, or daysUntilCutoff was 0 and we're now past that moment)
    // — roll forward to next week's cutoff.
    cutoffDate = addCalendarDays(cutoffDate, 7);
    cutoffMs = zonedWallTimeToUtcMs(
      { ...cutoffDate, hour: cutoffHour, minute: cutoffMinute },
      BAKERY_TIMEZONE
    );
  }

  // The orderable weekend starts the day after the cutoff day (the
  // Saturday right after a Friday cutoff).
  const weekendStart = addCalendarDays(cutoffDate, 1);

  return { cutoffAt: new Date(cutoffMs), weekendStart };
}
