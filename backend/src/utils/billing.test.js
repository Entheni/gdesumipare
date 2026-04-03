import test from 'node:test';
import assert from 'node:assert/strict';

import { buildOverview, getNextDueDate, serializeBill } from './billing.js';

test('getNextDueDate resolves next monthly due date from due_day', () => {
  const dueDate = getNextDueDate(
    { recurrence: 'monthly', due_day: 5, next_due_date: null },
    new Date('2026-04-10T12:00:00Z')
  );

  assert.equal(dueDate, '2026-05-05');
});

test('serializeBill computes monthly amount for yearly bills', () => {
  const bill = serializeBill(
    {
      id: 1,
      name: 'Hosting',
      amount_rsd: 12000,
      recurrence: 'yearly',
      next_due_date: '2026-11-15',
      due_day: null,
    },
    new Date('2026-04-04T12:00:00Z')
  );

  assert.equal(bill.monthly_amount_rsd, 1000);
  assert.equal(bill.computed_next_due_date, '2026-11-15');
});

test('buildOverview separates overdue from upcoming bills', () => {
  const overview = buildOverview(
    [
      {
        id: 1,
        name: 'EPS',
        amount_rsd: 3000,
        recurrence: 'monthly',
        due_day: 1,
        next_due_date: '2026-04-01',
      },
      {
        id: 2,
        name: 'Netflix',
        amount_rsd: 999,
        recurrence: 'monthly',
        due_day: 20,
        next_due_date: null,
      },
    ],
    new Date('2026-04-10T12:00:00Z')
  );

  assert.equal(overview.total_bills, 2);
  assert.equal(overview.overdue_bills_count, 1);
  assert.equal(overview.upcoming_bills.length, 1);
  assert.equal(overview.upcoming_bills[0].name, 'Netflix');
});
