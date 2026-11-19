import { DAY, round2, utcDay } from "./date";

// пеня не може перевищувати цей відсоток від суми основного боргу
export const MAX_PENALTY_PERCENT = 30;

type PenaltyInput = {
  baseTotal: number; // сума рахунку без пені
  ratePerDay: number; // ставка, % за день
  dueDate: Date;
  asOf: Date; // на яку дату рахуємо
  payments: { amount: number; paidAt: Date }[];
};

export function calcPenalty(input: PenaltyInput) {
  const dueDay = utcDay(input.dueDate);
  const endDay = utcDay(input.asOf);

  if (endDay <= dueDay || input.baseTotal <= 0) {
    return { amount: 0, days: 0 };
  }

  const sorted = [...input.payments].sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime());

  // платежі до терміну оплати зменшують початковий борг
  let debt = input.baseTotal;
  const later: { day: number; amount: number }[] = [];

  for (const payment of sorted) {
    const day = utcDay(payment.paidAt);
    if (day <= dueDay) {
      debt -= payment.amount;
    } else if (day <= endDay) {
      later.push({ day, amount: payment.amount });
    }
  }

  // проходимо по періодах між платежами й рахуємо «гривні-дні» боргу
  let cursor = dueDay;
  let debtDays = 0;
  let penaltyDays = 0;

  for (const payment of later) {
    const span = (payment.day - cursor) / DAY;
    if (debt > 0) {
      debtDays += debt * span;
      penaltyDays += span;
    }
    debt -= payment.amount;
    cursor = payment.day;
  }

  const lastSpan = (endDay - cursor) / DAY;
  if (debt > 0) {
    debtDays += debt * lastSpan;
    penaltyDays += lastSpan;
  }

  const cap = (input.baseTotal * MAX_PENALTY_PERCENT) / 100;
  const amount = Math.min((debtDays * input.ratePerDay) / 100, cap);

  return { amount: round2(amount), days: Math.round(penaltyDays) };
}