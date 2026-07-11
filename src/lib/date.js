const shortDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const longDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function formatShortDate(value) {
  return shortDate.format(new Date(value));
}

export function formatDate(value) {
  return longDate.format(new Date(value));
}

export function isPast(value) {
  return new Date(value).getTime() < Date.now();
}

const UNITS = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

export function timeAgo(value) {
  const diff = new Date(value).getTime() - Date.now();
  const abs = Math.abs(diff);

  for (const [unit, ms] of UNITS) {
    if (abs >= ms) return relative.format(Math.round(diff / ms), unit);
  }
  return relative.format(Math.round(diff / 1000), "second");
}

export function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateInputValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
