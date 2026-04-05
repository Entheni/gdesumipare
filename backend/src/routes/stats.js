import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { buildOverview, formatDateOnly, getDaysUntilDue, getMonthlyAmount, parseDateOnly } from '../utils/billing.js';
import { logError } from '../utils/logger.js';
import { getTierCapabilities } from '../utils/plans.js';
import { buildBudgetSummary } from '../utils/budgets.js';
import { buildGoalsSummary } from '../utils/goals.js';

const router = Router();

function formatMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function createLastMonths(count, referenceDate = new Date()) {
  const months = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - offset, 1));
    months.push({
      key: formatMonthKey(date),
      label: new Intl.DateTimeFormat('sr-RS', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(date),
    });
  }
  return months;
}

function createSafeDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, Math.min(day, new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate())));
}

function parseMonthParam(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) {
    return null;
  }

  return { year, monthIndex: month - 1, key: value };
}

function buildMonthRange({ year, monthIndex }) {
  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 0)),
  };
}

function getMonthlyOccurrenceDate(dayOfMonth, year, monthIndex) {
  if (!dayOfMonth) return null;
  return formatDateOnly(createSafeDate(year, monthIndex, Number(dayOfMonth)));
}

function getBillSnapshotDate(bill, monthInfo) {
  if (bill.recurrence === 'monthly') {
    const fallbackDate = parseDateOnly(bill.next_due_date);
    const dueDay = bill.due_day || fallbackDate?.getUTCDate();
    return getMonthlyOccurrenceDate(dueDay, monthInfo.year, monthInfo.monthIndex);
  }

  if (bill.recurrence === 'yearly') {
    const nextDueDate = parseDateOnly(bill.next_due_date);
    if (!nextDueDate || nextDueDate.getUTCMonth() !== monthInfo.monthIndex) {
      return null;
    }
    return formatDateOnly(createSafeDate(monthInfo.year, monthInfo.monthIndex, nextDueDate.getUTCDate()));
  }

  return null;
}

function getIncomeSnapshotDate(income, monthInfo) {
  if (income.recurrence === 'monthly') {
    const fallbackDate = parseDateOnly(income.next_income_date);
    const dayOfMonth = income.day_of_month || fallbackDate?.getUTCDate();
    return getMonthlyOccurrenceDate(dayOfMonth, monthInfo.year, monthInfo.monthIndex);
  }

  const nextIncomeDate = parseDateOnly(income.next_income_date);
  if (!nextIncomeDate) {
    return null;
  }

  if (income.recurrence === 'yearly') {
    if (nextIncomeDate.getUTCMonth() !== monthInfo.monthIndex) {
      return null;
    }
    return formatDateOnly(createSafeDate(monthInfo.year, monthInfo.monthIndex, nextIncomeDate.getUTCDate()));
  }

  if (
    income.recurrence === 'one_time' &&
    nextIncomeDate.getUTCFullYear() === monthInfo.year &&
    nextIncomeDate.getUTCMonth() === monthInfo.monthIndex
  ) {
    return formatDateOnly(nextIncomeDate);
  }

  return null;
}

function sumAmount(items, field = 'amount_rsd') {
  return Number(items.reduce((sum, item) => sum + Number(item[field] || 0), 0).toFixed(2));
}

function getIncomeMonthlyAmount(income) {
  const amount = Number(income.amount_rsd || 0);
  if (income.recurrence === 'yearly') return amount / 12;
  if (income.recurrence === 'one_time') return 0;
  return amount;
}

function normalizeMonthsParam(value) {
  const months = Number(value);
  if (!Number.isInteger(months) || months < 1) return 1;
  return Math.min(months, 12);
}

function getBillAmountForMonth(bill, monthInfo) {
  const dueDate = getBillSnapshotDate(bill, monthInfo);
  return dueDate ? Number(Number(bill.amount_rsd || 0).toFixed(2)) : 0;
}

function getIncomeAmountForMonth(income, monthInfo) {
  const incomeDate = getIncomeSnapshotDate(income, monthInfo);
  return incomeDate ? Number(Number(income.amount_rsd || 0).toFixed(2)) : 0;
}

router.get('/mesecno', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId });
    const grouped = new Map();

    for (const bill of bills) {
      const key = bill.category || null;
      const current = grouped.get(key) || 0;
      grouped.set(key, current + getMonthlyAmount(bill.amount_rsd, bill.recurrence));
    }

    const categories = [...grouped.entries()]
      .map(([category, total]) => ({
        category,
        total_rsd: Number(total.toFixed(2)),
      }))
      .sort((left, right) => (left.category || '').localeCompare(right.category || ''));

    res.json({ categories });
  } catch (err) {
    logError('Neuspešno učitavanje mesečne statistike.', err, { ruta: 'statistika/mesecno', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje mesečne statistike.' });
  }
});

router.get('/pregled', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc');
    const incomes = await db('incomes').where({ user_id: req.userId });
    const overview = buildOverview(bills);
    const monthlyIncomeRsd = Number(incomes.reduce((sum, income) => sum + getIncomeMonthlyAmount(income), 0).toFixed(2));
    const projectedSavingsRsd = Number((monthlyIncomeRsd - overview.total_monthly_rsd).toFixed(2));

    res.json({
      ...overview,
      monthly_income_rsd: monthlyIncomeRsd,
      projected_savings_rsd: projectedSavingsRsd,
      savings_rate_percent: monthlyIncomeRsd > 0 ? Number(((projectedSavingsRsd / monthlyIncomeRsd) * 100).toFixed(1)) : 0,
    });
  } catch (err) {
    logError('Neuspešno učitavanje pregleda statistike.', err, { ruta: 'statistika/pregled', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje pregleda statistike.' });
  }
});

router.get('/trendovi', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId });
    const incomes = await db('incomes').where({ user_id: req.userId });
    const payments = await db('payments').where({ user_id: req.userId }).orderBy('paid_at', 'asc');
    const months = createLastMonths(6);
    const paidByMonth = new Map(months.map((month) => [month.key, 0]));

    for (const payment of payments) {
      const paidAt = new Date(payment.paid_at);
      if (Number.isNaN(paidAt.getTime())) continue;
      const key = formatMonthKey(new Date(Date.UTC(paidAt.getUTCFullYear(), paidAt.getUTCMonth(), 1)));
      if (!paidByMonth.has(key)) continue;
      paidByMonth.set(key, paidByMonth.get(key) + Number(payment.amount_rsd));
    }

    const currentMonthTotal = bills.reduce((sum, bill) => sum + getMonthlyAmount(bill.amount_rsd, bill.recurrence), 0);
    const currentMonthIncome = incomes.reduce((sum, income) => sum + getIncomeMonthlyAmount(income), 0);
    const previousMonthTotal = months.length >= 2 ? paidByMonth.get(months[months.length - 2].key) || 0 : 0;
    const latestMonthTotal = months.length ? paidByMonth.get(months[months.length - 1].key) || 0 : 0;

    res.json({
      monthly_paid: months.map((month) => ({
        key: month.key,
        label: month.label,
        total_rsd: Number((paidByMonth.get(month.key) || 0).toFixed(2)),
      })),
      income_vs_expense: {
        income_rsd: Number(currentMonthIncome.toFixed(2)),
        expected_expense_rsd: Number(currentMonthTotal.toFixed(2)),
        projected_savings_rsd: Number((currentMonthIncome - currentMonthTotal).toFixed(2)),
      },
      current_month_commitment_rsd: Number(currentMonthTotal.toFixed(2)),
      latest_month_paid_rsd: Number(latestMonthTotal.toFixed(2)),
      previous_month_paid_rsd: Number(previousMonthTotal.toFixed(2)),
    });
  } catch (err) {
    logError('Neuspešno učitavanje trendova.', err, { ruta: 'statistika/trendovi', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje trendova.' });
  }
});

router.get('/snapshot', requireAuth, async (req, res) => {
  try {
    const user = await db('users').select('subscription_tier').where({ id: req.userId }).first();
    const capabilities = getTierCapabilities(user?.subscription_tier);
    const requestedMonth = parseMonthParam(req.query.month);
    if (!requestedMonth) {
      return res.status(400).json({ error: 'Parametar month mora biti u formatu YYYY-MM.' });
    }
    const currentMonthKey = formatMonthKey(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)));
    if (!capabilities.can_use_snapshot_history && requestedMonth.key !== currentMonthKey) {
      return res.status(403).json({ error: 'Istorija snapshot pregleda je dostupna od Plus paketa.' });
    }

    const monthRange = buildMonthRange(requestedMonth);
    const monthLabel = new Intl.DateTimeFormat('sr-RS', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(monthRange.start);

    const [bills, incomes, payments] = await Promise.all([
      db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc'),
      db('incomes').where({ user_id: req.userId }).orderBy('created_at', 'desc'),
      db('payments')
        .where({ user_id: req.userId })
        .whereBetween('due_date', [monthRange.start, monthRange.end])
        .orderBy('due_date', 'asc')
        .orderBy('paid_at', 'asc'),
    ]);

    const paidByBillAndDate = new Map();
    for (const payment of payments) {
      const parsedDueDate = parseDateOnly(payment.due_date);
      if (!parsedDueDate) continue;
      const dueDate = formatDateOnly(parsedDueDate);
      const key = `${payment.bill_id}:${dueDate}`;
      paidByBillAndDate.set(key, (paidByBillAndDate.get(key) || 0) + Number(payment.amount_rsd || 0));
    }

    const dueBills = bills
      .map((bill) => {
        const dueDate = getBillSnapshotDate(bill, requestedMonth);
        if (!dueDate) return null;
        const paidAmountRsd = Number((paidByBillAndDate.get(`${bill.id}:${dueDate}`) || 0).toFixed(2));
        const amountRsd = Number(Number(bill.amount_rsd || 0).toFixed(2));
        const isPaid = paidAmountRsd >= amountRsd;
        return {
          id: bill.id,
          name: bill.name,
          category: bill.category || null,
          recurrence: bill.recurrence,
          amount_rsd: amountRsd,
          due_date: dueDate,
          paid_amount_rsd: paidAmountRsd,
          remaining_amount_rsd: Number(Math.max(amountRsd - paidAmountRsd, 0).toFixed(2)),
          is_paid: isPaid,
          status_label: isPaid ? 'Placeno' : 'Ceka uplatu',
          days_until_due: getDaysUntilDue(dueDate),
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.due_date.localeCompare(right.due_date) || right.amount_rsd - left.amount_rsd);

    const monthIncomes = incomes
      .map((income) => {
        const incomeDate = getIncomeSnapshotDate(income, requestedMonth);
        if (!incomeDate) return null;
        return {
          id: income.id,
          name: income.name,
          recurrence: income.recurrence,
          amount_rsd: Number(Number(income.amount_rsd || 0).toFixed(2)),
          income_date: incomeDate,
          note: income.note || null,
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.income_date.localeCompare(right.income_date) || right.amount_rsd - left.amount_rsd);

    const plannedExpenseRsd = sumAmount(dueBills);
    const paidExpenseRsd = sumAmount(dueBills, 'paid_amount_rsd');
    const remainingExpenseRsd = Number(Math.max(plannedExpenseRsd - paidExpenseRsd, 0).toFixed(2));
    const plannedIncomeRsd = sumAmount(monthIncomes);
    const projectedSavingsRsd = Number((plannedIncomeRsd - plannedExpenseRsd).toFixed(2));
    const paidBillsCount = dueBills.filter((bill) => bill.is_paid).length;

    res.json({
      capabilities,
      month: requestedMonth.key,
      month_label: monthLabel,
      planned_income_rsd: plannedIncomeRsd,
      planned_expense_rsd: plannedExpenseRsd,
      paid_expense_rsd: paidExpenseRsd,
      remaining_expense_rsd: remainingExpenseRsd,
      projected_savings_rsd: projectedSavingsRsd,
      savings_rate_percent: plannedIncomeRsd > 0 ? Number(((projectedSavingsRsd / plannedIncomeRsd) * 100).toFixed(1)) : 0,
      bills_due_count: dueBills.length,
      bills_paid_count: paidBillsCount,
      unpaid_bills_count: Math.max(dueBills.length - paidBillsCount, 0),
      due_bills: dueBills,
      incomes: monthIncomes,
    });
  } catch (err) {
    logError('Neuspesno ucitavanje snapshot pregleda.', err, { ruta: 'statistika/snapshot', userId: req.userId });
    res.status(500).json({ error: 'Neuspesno ucitavanje snapshot pregleda.' });
  }
});

router.get('/analitika', requireAuth, async (req, res) => {
  try {
    const user = await db('users').select('subscription_tier').where({ id: req.userId }).first();
    const capabilities = getTierCapabilities(user?.subscription_tier);
    const monthsCount = capabilities.can_use_advanced_charts ? normalizeMonthsParam(req.query.months) : 1;
    const months = createLastMonths(monthsCount);
    const monthInfos = months.map((month) => parseMonthParam(month.key));

    const [bills, incomes] = await Promise.all([
      db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc'),
      db('incomes').where({ user_id: req.userId }).orderBy('created_at', 'desc'),
    ]);

    const expenseCategorySet = new Set();
    const incomeSourceSet = new Set();

    const expenseSeriesByCategory = new Map();
    const incomeSeriesBySource = new Map();
    const monthlyTotals = months.map((month, index) => {
      const monthInfo = monthInfos[index];
      let incomeRsd = 0;
      let expenseRsd = 0;

      for (const bill of bills) {
        const category = bill.category || 'Ostalo';
        const amount = getBillAmountForMonth(bill, monthInfo);
        if (!amount) continue;
        expenseCategorySet.add(category);
        if (!expenseSeriesByCategory.has(category)) {
          expenseSeriesByCategory.set(category, months.map((item) => ({ key: item.key, label: item.label, total_rsd: 0 })));
        }
        expenseSeriesByCategory.get(category)[index].total_rsd = Number(amount.toFixed(2));
        expenseRsd += amount;
      }

      for (const income of incomes) {
        const source = income.name || 'Prihod';
        const amount = getIncomeAmountForMonth(income, monthInfo);
        if (!amount) continue;
        incomeSourceSet.add(source);
        if (!incomeSeriesBySource.has(source)) {
          incomeSeriesBySource.set(source, months.map((item) => ({ key: item.key, label: item.label, total_rsd: 0 })));
        }
        incomeSeriesBySource.get(source)[index].total_rsd = Number(amount.toFixed(2));
        incomeRsd += amount;
      }

      return {
        key: month.key,
        label: month.label,
        income_rsd: Number(incomeRsd.toFixed(2)),
        expense_rsd: Number(expenseRsd.toFixed(2)),
        savings_rsd: Number((incomeRsd - expenseRsd).toFixed(2)),
      };
    });

    const latestMonth = monthlyTotals[monthlyTotals.length - 1] || { income_rsd: 0, expense_rsd: 0, savings_rsd: 0 };
    const expenseBreakdown = [...expenseSeriesByCategory.entries()]
      .map(([category, values]) => ({
        category,
        total_rsd: Number(values.reduce((sum, item) => sum + Number(item.total_rsd || 0), 0).toFixed(2)),
      }))
      .sort((left, right) => right.total_rsd - left.total_rsd);

    res.json({
      capabilities,
      months: monthsCount,
      available_expense_categories: [...expenseCategorySet].sort((left, right) => left.localeCompare(right)),
      available_income_sources: [...incomeSourceSet].sort((left, right) => left.localeCompare(right)),
      monthly_totals: monthlyTotals,
      expense_breakdown: expenseBreakdown,
      expense_series_by_category: Object.fromEntries(expenseSeriesByCategory),
      income_series_by_source: Object.fromEntries(incomeSeriesBySource),
      latest_month: latestMonth,
    });
  } catch (err) {
    logError('Neuspesno ucitavanje analitike.', err, { ruta: 'statistika/analitika', userId: req.userId });
    res.status(500).json({ error: 'Neuspesno ucitavanje analitike.' });
  }
});

router.get('/signali', requireAuth, async (req, res) => {
  try {
    const [bills, incomes, budgetTargets, goals, contributions] = await Promise.all([
      db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc'),
      db('incomes').where({ user_id: req.userId }).orderBy('created_at', 'desc'),
      db('budget_targets').where({ user_id: req.userId }),
      db('savings_goals').where({ user_id: req.userId, is_archived: false }),
      db('goal_contributions').where({ user_id: req.userId }),
    ]);

    const overview = buildOverview(bills);
    const monthlyIncomeRsd = Number(incomes.reduce((sum, income) => sum + getIncomeMonthlyAmount(income), 0).toFixed(2));
    const projectedSavingsRsd = Number((monthlyIncomeRsd - overview.total_monthly_rsd).toFixed(2));
    const budgetSummary = buildBudgetSummary(budgetTargets, bills);
    const goalsSummary = buildGoalsSummary(goals, contributions, { projectedMonthlySavingsRsd: projectedSavingsRsd });
    const upcomingSoon = overview.upcoming_bills.filter((bill) => bill.days_until_due != null && bill.days_until_due <= 7);

    const signals = [];

    if (overview.overdue_bills_count > 0) {
      signals.push({
        id: 'overdue',
        severity: 'danger',
        title: `Kasni ${overview.overdue_bills_count} obaveza`,
        description: 'Prvo zatvori kasnjenja da troskovi ne krenu da se gomilaju.',
        action_label: 'Idi na obaveze',
        action_to: '/obaveze',
      });
    }

    if (projectedSavingsRsd < 0) {
      signals.push({
        id: 'negative-savings',
        severity: 'danger',
        title: 'Mesec ti trenutno ide u minus',
        description: `Projekcija je ${projectedSavingsRsd.toFixed(2)} RSD. Proveri troskove, budzete ili prihode.`,
        action_label: 'Otvori snapshot',
        action_to: '/snapshot',
      });
    }

    if (budgetSummary.total.is_over_limit) {
      signals.push({
        id: 'budget-total',
        severity: 'warning',
        title: 'Presao si ukupni mesecni budzet',
        description: `Planirano ${budgetSummary.total.monthly_limit_rsd?.toFixed(2)} RSD, trenutno ${budgetSummary.total.spent_rsd.toFixed(2)} RSD.`,
        action_label: 'Otvori plan',
        action_to: '/plan',
      });
    } else if (budgetSummary.over_limit_categories.length > 0) {
      const category = budgetSummary.over_limit_categories[0];
      signals.push({
        id: 'budget-category',
        severity: 'warning',
        title: `Kategorija "${category.category}" je preko plana`,
        description: `Limit ${category.monthly_limit_rsd?.toFixed(2)} RSD, trosak ${category.spent_rsd.toFixed(2)} RSD.`,
        action_label: 'Pogledaj budzete',
        action_to: '/plan',
      });
    }

    if (goalsSummary.summary.active_goals_count > 0 && goalsSummary.summary.on_track_goals_count < goalsSummary.summary.active_goals_count) {
      signals.push({
        id: 'goals-off-track',
        severity: 'info',
        title: 'Bar jedan cilj stednje kasni za planom',
        description: 'Promeni tempo uplate ili forecast u simulatoru pre nego sto cilj ode previse daleko.',
        action_label: 'Otvori ciljeve',
        action_to: '/ciljevi',
      });
    }

    if (upcomingSoon.length > 0) {
      const nextBill = upcomingSoon[0];
      signals.push({
        id: 'upcoming',
        severity: 'neutral',
        title: `Uskoro stize ${nextBill.name}`,
        description: `${nextBill.amount_rsd} RSD za ${Math.max(nextBill.days_until_due, 0)} dana.`,
        action_label: 'Idi na pregled',
        action_to: '/pregled',
      });
    }

    res.json({
      summary: {
        monthly_income_rsd: monthlyIncomeRsd,
        projected_savings_rsd: projectedSavingsRsd,
        overdue_bills_count: overview.overdue_bills_count,
        upcoming_soon_count: upcomingSoon.length,
        over_budget_categories_count: budgetSummary.over_limit_categories.length,
        goals_off_track_count: Math.max(goalsSummary.summary.active_goals_count - goalsSummary.summary.on_track_goals_count, 0),
      },
      signals: signals.slice(0, 5),
    });
  } catch (err) {
    logError('Neuspesno ucitavanje pametnih signala.', err, { ruta: 'statistika/signali', userId: req.userId });
    res.status(500).json({ error: 'Neuspesno ucitavanje pametnih signala.' });
  }
});

export default router;
