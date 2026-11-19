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