import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { formatDateOnly, parseDateOnly } from '../utils/billing.js';
import { logError } from '../utils/logger.js';

const router = Router();

function formatMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
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

function getBillDateForMonth(bill, monthInfo) {
  if (bill.recurrence === 'monthly') {
    const fallbackDate = parseDateOnly(bill.next_due_date);
    const dueDay = bill.due_day || fallbackDate?.getUTCDate();
    return getMonthlyOccurrenceDate(dueDay, monthInfo.year, monthInfo.monthIndex);
  }

  const nextDueDate = parseDateOnly(bill.next_due_date);
  if (!nextDueDate || nextDueDate.getUTCMonth() !== monthInfo.monthIndex) {
    return null;
  }

  return formatDateOnly(createSafeDate(monthInfo.year, monthInfo.monthIndex, nextDueDate.getUTCDate()));
}

function getIncomeDateForMonth(income, monthInfo) {
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

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

router.get('/tok', requireAuth, async (req, res) => {
  try {
    const monthInfo = parseMonthParam(req.query.month || formatMonthKey(new Date()));
    if (!monthInfo) {
      return res.status(400).json({ error: 'Parametar month mora biti u formatu YYYY-MM.' });
    }

    const monthRange = buildMonthRange(monthInfo);
    const [bills, incomes, contributions] = await Promise.all([
      db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc'),
      db('incomes').where({ user_id: req.userId }).orderBy('created_at', 'desc'),
      db('goal_contributions')
        .leftJoin('savings_goals', 'goal_contributions.goal_id', 'savings_goals.id')
        .select('goal_contributions.*', 'savings_goals.name as goal_name')
        .where('goal_contributions.user_id', req.userId)
        .whereBetween('goal_contributions.contribution_date', [monthRange.start, monthRange.end])
        .orderBy('goal_contributions.contribution_date', 'asc'),
    ]);

    const items = [];

    for (const income of incomes) {
      const date = getIncomeDateForMonth(income, monthInfo);
      if (!date) continue;
      items.push({
        date,
        kind: 'income',
        title: income.name,
        subtitle: income.recurrence === 'monthly' ? 'Redovni prihod' : income.recurrence === 'yearly' ? 'Godisnji prihod' : 'Jednokratni prihod',
        amount_rsd: Number(Number(income.amount_rsd || 0).toFixed(2)),
        cash_effect_rsd: Number(Number(income.amount_rsd || 0).toFixed(2)),
      });
    }

    for (const bill of bills) {
      const date = getBillDateForMonth(bill, monthInfo);
      if (!date) continue;
      const amount = Number(Number(bill.amount_rsd || 0).toFixed(2));
      items.push({
        date,
        kind: 'expense',
        title: bill.name,
        subtitle: bill.category || 'Obaveza',
        amount_rsd: amount,
        cash_effect_rsd: Number((-amount).toFixed(2)),
      });
    }

    for (const contribution of contributions) {
      const amount = Number(Number(contribution.amount_rsd || 0).toFixed(2));
      items.push({
        date: formatDateOnly(parseDateOnly(contribution.contribution_date)),
        kind: 'goal',
        title: contribution.goal_name || 'Cilj stednje',
        subtitle: 'Uplata ka cilju',
        amount_rsd: amount,
        cash_effect_rsd: Number((-amount).toFixed(2)),
      });
    }

    items.sort((left, right) => left.date.localeCompare(right.date) || right.cash_effect_rsd - left.cash_effect_rsd);

    const dailyMap = new Map();
    for (const item of items) {
      const current = dailyMap.get(item.date) || { date: item.date, income_rsd: 0, expense_rsd: 0, goal_rsd: 0, net_rsd: 0, items: [] };
      if (item.kind === 'income') current.income_rsd += item.amount_rsd;
      if (item.kind === 'expense') current.expense_rsd += item.amount_rsd;
      if (item.kind === 'goal') current.goal_rsd += item.amount_rsd;
      current.net_rsd = Number((current.income_rsd - current.expense_rsd - current.goal_rsd).toFixed(2));
      current.items.push(item);
      dailyMap.set(item.date, current);
    }

    res.json({
      month: monthInfo.key,
      month_label: new Intl.DateTimeFormat('sr-RS', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(monthRange.start),
      days: [...dailyMap.values()],
      totals: {
        income_rsd: Number(items.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount_rsd, 0).toFixed(2)),
        expense_rsd: Number(items.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount_rsd, 0).toFixed(2)),
        goal_rsd: Number(items.filter((item) => item.kind === 'goal').reduce((sum, item) => sum + item.amount_rsd, 0).toFixed(2)),
      },
    });
  } catch (err) {
    logError('Neuspesno ucitavanje toka novca.', err, { ruta: 'plan/tok', userId: req.userId });
    res.status(500).json({ error: 'Neuspesno ucitavanje toka novca.' });
  }
});

router.get('/izvoz', requireAuth, async (req, res) => {
  try {
    const type = req.query.type;
    let rows = [];
    let filename = 'izvoz.csv';

    if (type === 'obaveze') {
      const bills = await db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc');
      rows = [
        ['Naziv', 'Kategorija', 'Iznos', 'Ponavljanje', 'Dan dospeca', 'Sledeci datum', 'Napomena'],
        ...bills.map((bill) => [bill.name, bill.category || '', bill.amount_rsd, bill.recurrence, bill.due_day || '', bill.next_due_date || '', bill.notes || '']),
      ];
      filename = 'obaveze.csv';
    } else if (type === 'prihodi') {
      const incomes = await db('incomes').where({ user_id: req.userId }).orderBy('created_at', 'desc');
      rows = [
        ['Naziv', 'Iznos', 'Ponavljanje', 'Dan u mesecu', 'Sledeci datum', 'Napomena'],
        ...incomes.map((income) => [income.name, income.amount_rsd, income.recurrence, income.day_of_month || '', income.next_income_date || '', income.note || '']),
      ];
      filename = 'prihodi.csv';
    } else if (type === 'uplate') {
      const payments = await db('payments')
        .leftJoin('bills', 'payments.bill_id', 'bills.id')
        .select('payments.*', 'bills.name as bill_name')
        .where('payments.user_id', req.userId)
        .orderBy('payments.paid_at', 'desc');
      rows = [
        ['Obaveza', 'Iznos', 'Datum dospeca', 'Placeno', 'Napomena'],
        ...payments.map((payment) => [payment.bill_name || '', payment.amount_rsd, payment.due_date || '', payment.paid_at || '', payment.note || '']),
      ];
      filename = 'uplate.csv';
    } else if (type === 'ciljevi') {
      const goals = await db('savings_goals').where({ user_id: req.userId }).orderBy('created_at', 'desc');
      rows = [
        ['Naziv', 'Ciljani iznos', 'Pocetni iznos', 'Mesecni plan', 'Ciljani datum', 'Napomena'],
        ...goals.map((goal) => [goal.name, goal.target_amount_rsd, goal.starting_amount_rsd, goal.monthly_contribution_goal_rsd || '', goal.target_date || '', goal.note || '']),
      ];
      filename = 'ciljevi.csv';
    } else {
      return res.status(400).json({ error: 'Tip izvoza mora biti obaveze, prihodi, uplate ili ciljevi.' });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buildCsv(rows));
  } catch (err) {
    logError('Neuspesno generisanje izvoza.', err, { ruta: 'plan/izvoz', userId: req.userId, type: req.query.type });
    res.status(500).json({ error: 'Neuspesno generisanje izvoza.' });
  }
});

export default router;
