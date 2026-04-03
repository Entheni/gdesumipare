import test from 'node:test';
import assert from 'node:assert/strict';

import { validateBillPayload, validateCredentials } from './validation.js';

test('validateCredentials normalizes email and accepts valid password', () => {
  const credentials = validateCredentials({
    email: ' USER@Example.com ',
    password: 'supersecret',
  });

  assert.deepEqual(credentials, {
    email: 'user@example.com',
    password: 'supersecret',
  });
});

test('validateCredentials rejects short passwords', () => {
  assert.throws(
    () => validateCredentials({ email: 'user@example.com', password: 'short' }),
    /Lozinka mora imati najmanje 8 karaktera\./
  );
});

test('validateBillPayload sanitizes a valid create payload', () => {
  const bill = validateBillPayload({
    name: '  Netflix  ',
    category: '  Entertainment ',
    amount_rsd: '999.995',
    recurrence: 'monthly',
    due_day: '10',
    next_due_date: '2026-04-10',
    notes: '  Family plan ',
  });

  assert.deepEqual(bill, {
    name: 'Netflix',
    category: 'Entertainment',
    amount_rsd: 1000,
    recurrence: 'monthly',
    due_day: 10,
    next_due_date: '2026-04-10',
    notes: 'Family plan',
  });
});

test('validateBillPayload rejects unknown fields on update', () => {
  assert.throws(
    () => validateBillPayload({ user_id: 123 }, { partial: true }),
    /Nepoznata polja: user_id\./
  );
});

test('validateBillPayload rejects invalid recurrence and invalid due_day', () => {
  assert.throws(
    () => validateBillPayload({ name: 'EPS', amount_rsd: 1200, recurrence: 'weekly' }),
    /Ponavljanje mora biti "monthly" ili "yearly"\./
  );

  assert.throws(
    () =>
      validateBillPayload({
        name: 'EPS',
        amount_rsd: 1200,
        recurrence: 'monthly',
        due_day: 35,
      }),
    /Dan dospeća mora biti ceo broj između 1 i 31\./
  );
});

test('validateBillPayload rejects impossible dates', () => {
  assert.throws(
    () =>
      validateBillPayload({
        name: 'EPS',
        amount_rsd: 1200,
        recurrence: 'monthly',
        next_due_date: '2026-02-31',
      }),
    /Datum dospeća mora biti ispravan datum\./
  );
});

test('validateBillPayload requires recurrence-specific due information', () => {
  assert.throws(
    () => validateBillPayload({ name: 'Infostan', amount_rsd: 3200, recurrence: 'monthly' }),
    /Za mesečne obaveze unesite dan dospeća ili datum dospeća\./
  );

  assert.throws(
    () => validateBillPayload({ name: 'Hosting', amount_rsd: 12000, recurrence: 'yearly', due_day: 12 }),
    /Za godišnje obaveze unesite datum dospeća\./
  );
});
