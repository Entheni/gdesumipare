import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBudgetSummary } from './budgets.js';

test('buildBudgetSummary calculates total and per-category limits', () => {
  const summary = buildBudgetSummary(
    [
      { id: 1, category: null, monthly_limit_rsd: 100000 },
      { id: 2, category: 'Kirija', monthly_limit_rsd: 45000 },
      { id: 3, category: 'Hrana', monthly_limit_rsd: 25000 },
    ],
    [
      { category: 'Kirija', amount_rsd: 40000, recurrence: 'monthly' },
      { category: 'Hrana', amount_rsd: 30000, recurrence: 'monthly' },
      { category: 'Internet', amount_rsd: 2500, recurrence: 'monthly' },
    ],
  );

  assert.equal(summary.total.spent_rsd, 72500);
  assert.equal(summary.total.remaining_rsd, 27500);
  assert.equal(summary.total.is_over_limit, false);
  assert.equal(summary.over_limit_categories.length, 1);
  assert.equal(summary.over_limit_categories[0].category, 'Hrana');
});
