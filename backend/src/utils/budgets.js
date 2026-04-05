import { getMonthlyAmount } from './billing.js';

function normalizeNumber(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeCategory(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  return value.trim();
}

export function getBudgetKey(category) {
  return normalizeCategory(category) || '__overall__';
}

export function buildBudgetSummary(targets = [], bills = []) {
  const monthlyExpenseRsd = normalizeNumber(
    bills.reduce((sum, bill) => sum + getMonthlyAmount(bill.amount_rsd, bill.recurrence), 0),
  );

  const spentByCategory = new Map();
  for (const bill of bills) {
    const category = normalizeCategory(bill.category) || 'Ostalo';
    const amount = getMonthlyAmount(bill.amount_rsd, bill.recurrence);
    spentByCategory.set(category, normalizeNumber((spentByCategory.get(category) || 0) + amount));
  }

  const targetsByCategory = new Map();
  for (const target of targets) {
    const key = getBudgetKey(target.category);
    targetsByCategory.set(key, target);
  }

  const categoryNames = new Set([
    ...[...targetsByCategory.values()].map((target) => normalizeCategory(target.category)).filter(Boolean),
    ...spentByCategory.keys(),
  ]);

  const categories = [...categoryNames]
    .map((category) => {
      const target = targetsByCategory.get(getBudgetKey(category));
      const spent = normalizeNumber(spentByCategory.get(category) || 0);
      const limit = target ? normalizeNumber(target.monthly_limit_rsd) : null;
      const remaining = limit == null ? null : normalizeNumber(limit - spent);
      const progressPercent = limit && limit > 0 ? Number(((spent / limit) * 100).toFixed(1)) : null;
      return {
        id: target?.id || null,
        category,
        monthly_limit_rsd: limit,
        spent_rsd: spent,
        remaining_rsd: remaining,
        is_over_limit: limit != null ? spent > limit : false,
        progress_percent: progressPercent,
      };
    })
    .sort((left, right) => {
      if (left.is_over_limit !== right.is_over_limit) {
        return left.is_over_limit ? -1 : 1;
      }
      return (right.spent_rsd || 0) - (left.spent_rsd || 0);
    });

  const overallTarget = targetsByCategory.get('__overall__');
  const totalLimitRsd = overallTarget ? normalizeNumber(overallTarget.monthly_limit_rsd) : null;
  const totalRemainingRsd = totalLimitRsd == null ? null : normalizeNumber(totalLimitRsd - monthlyExpenseRsd);
  const totalProgressPercent = totalLimitRsd && totalLimitRsd > 0
    ? Number(((monthlyExpenseRsd / totalLimitRsd) * 100).toFixed(1))
    : null;

  return {
    total: {
      id: overallTarget?.id || null,
      monthly_limit_rsd: totalLimitRsd,
      spent_rsd: monthlyExpenseRsd,
      remaining_rsd: totalRemainingRsd,
      is_over_limit: totalLimitRsd != null ? monthlyExpenseRsd > totalLimitRsd : false,
      progress_percent: totalProgressPercent,
    },
    categories,
    over_limit_categories: categories.filter((item) => item.is_over_limit),
  };
}
