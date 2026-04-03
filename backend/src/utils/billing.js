function getDaysInMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function createSafeDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, Math.min(day, getDaysInMonth(year, monthIndex))));
}

export function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (formatDateOnly(date) !== value) return null;
  return date;
}

function startOfToday(referenceDate = new Date()) {
  return new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
}

function getBillDayOfMonth(bill) {
  if (bill.due_day) return Number(bill.due_day);
  const parsed = parseDateOnly(bill.next_due_date);
  return parsed ? parsed.getUTCDate() : null;
}

export function getNextDueDate(bill, referenceDate = new Date()) {
  const today = startOfToday(referenceDate);
  const parsedNextDueDate = parseDateOnly(bill.next_due_date);

  if (bill.recurrence === 'yearly') {
    if (!parsedNextDueDate) return null;
    let candidate = createSafeDate(today.getUTCFullYear(), parsedNextDueDate.getUTCMonth(), parsedNextDueDate.getUTCDate());
    if (candidate < today) {
      candidate = createSafeDate(today.getUTCFullYear() + 1, parsedNextDueDate.getUTCMonth(), parsedNextDueDate.getUTCDate());
    }
    return formatDateOnly(candidate);
  }

  if (bill.recurrence === 'monthly') {
    const dueDay = getBillDayOfMonth(bill);
    if (!dueDay) return null;

    let candidate = createSafeDate(today.getUTCFullYear(), today.getUTCMonth(), dueDay);
    if (candidate < today) {
      const nextMonth = today.getUTCMonth() === 11 ? 0 : today.getUTCMonth() + 1;
      const nextYear = today.getUTCMonth() === 11 ? today.getUTCFullYear() + 1 : today.getUTCFullYear();
      candidate = createSafeDate(nextYear, nextMonth, dueDay);
    }
    return formatDateOnly(candidate);
  }

  return bill.next_due_date || null;
}

export function getDaysUntilDue(dateValue, referenceDate = new Date()) {
  const date = parseDateOnly(dateValue);
  if (!date) return null;
  const today = startOfToday(referenceDate);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export function getMonthlyAmount(amountRsd, recurrence) {
  const amount = Number(amountRsd || 0);
  return recurrence === 'yearly' ? amount / 12 : amount;
}

export function serializeBill(bill, referenceDate = new Date()) {
  const computedNextDueDate = getNextDueDate(bill, referenceDate);
  const storedDaysUntilDue = getDaysUntilDue(bill.next_due_date, referenceDate);
  return {
    ...bill,
    computed_next_due_date: computedNextDueDate,
    days_until_due: getDaysUntilDue(computedNextDueDate, referenceDate),
    is_overdue: storedDaysUntilDue != null && storedDaysUntilDue < 0,
    monthly_amount_rsd: Number(getMonthlyAmount(bill.amount_rsd, bill.recurrence).toFixed(2)),
  };
}

export function buildOverview(bills, referenceDate = new Date()) {
  const serializedBills = bills.map((bill) => serializeBill(bill, referenceDate));
  const totalMonthlyRsd = Number(
    serializedBills.reduce((sum, bill) => sum + Number(bill.monthly_amount_rsd || 0), 0).toFixed(2)
  );
  const overdueBillsCount = serializedBills.filter((bill) => bill.is_overdue).length;
  const upcomingBills = serializedBills
    .filter((bill) => bill.computed_next_due_date && !bill.is_overdue)
    .sort((left, right) => {
      if (left.days_until_due !== right.days_until_due) {
        return left.days_until_due - right.days_until_due;
      }
      return Number(right.amount_rsd) - Number(left.amount_rsd);
    });

  return {
    total_monthly_rsd: totalMonthlyRsd,
    total_bills: serializedBills.length,
    upcoming_bills: upcomingBills.slice(0, 5),
    overdue_bills_count: overdueBillsCount,
  };
}
