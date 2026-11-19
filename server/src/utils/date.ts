export const DAY = 86400000;

// початок доби за UTC у мілісекундах
export function utcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function utcDate(year: number, month0: number, day: number) {
  return new Date(Date.UTC(year, month0, day));
}

export function daysInMonth(year: number, month0: number) {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}