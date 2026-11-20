// дати з сервера зберігаються як північ за UTC, тому форматуємо теж за UTC
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("uk-UA", { timeZone: "UTC" });
}

export function formatMoney(value: number) {
  return `${value.toLocaleString("uk-UA")} грн`;
}

// скільки днів лишилось до дати (від'ємне, якщо вже минула)
export function daysLeft(value: string) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

export function addMonths(value: string, months: number) {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate()));
}

// "2026-11-01T00:00:00Z" -> "Листопад 2026"
export function monthLabel(value: string) {
  const text = new Date(value)
    .toLocaleDateString("uk-UA", { month: "long", year: "numeric", timeZone: "UTC" })
    .replace(" р.", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

// список місяців для вибору: 2 наперед і 11 назад, найновіші зверху
export function monthOptions(back = 11, forward = 2) {
  const now = new Date();
  const result: { value: string; label: string }[] = [];

  for (let i = forward; i >= -back; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    result.push({ value: d.toISOString().slice(0, 7), label: monthLabel(d.toISOString()) });
  }

  return result;
}

// сьогоднішня дата у форматі РРРР-ММ-ДД за місцевим часом
export function todayString() {
  return new Date().toLocaleDateString("sv-SE");
}