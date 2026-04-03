import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { logError, sanitizeBody } from '../utils/logger.js';
import { ValidationError } from '../utils/validation.js';

const router = Router();

function normalizeRequiredText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`Polje "${field}" je obavezno.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ValidationError(`Polje "${field}" može imati najviše ${maxLength} karaktera.`);
  }
  return normalized;
}

function normalizeAmount(value) {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError('Iznos prihoda mora biti pozitivan broj.');
  }
  return Number(amount.toFixed(2));
}

function normalizeOptionalText(value, field, maxLength) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`Polje "${field}" mora biti tekst.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ValidationError(`Polje "${field}" može imati najviše ${maxLength} karaktera.`);
  }
  return normalized || null;
}

function normalizeDate(value, field) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`Polje "${field}" mora biti ispravan datum.`);
  }
  return value;
}

function normalizeRecurrence(value) {
  if (!['monthly', 'yearly', 'one_time'].includes(value)) {
    throw new ValidationError('Ponavljanje prihoda mora biti monthly, yearly ili one_time.');
  }
  return value;
}

function normalizeDayOfMonth(value) {
  if (value == null || value === '') return null;
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new ValidationError('Dan prihoda mora biti ceo broj između 1 i 31.');
  }
  return day;
}

function validateIncomePayload(payload = {}, { partial = false } = {}) {
  const allowedFields = ['name', 'amount_rsd', 'recurrence', 'day_of_month', 'next_income_date', 'note'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  const income = {};

  if (!partial || Object.hasOwn(payload, 'name')) {
    income.name = normalizeRequiredText(payload.name, 'name', 255);
  }
  if (!partial || Object.hasOwn(payload, 'amount_rsd')) {
    income.amount_rsd = normalizeAmount(payload.amount_rsd);
  }
  if (!partial || Object.hasOwn(payload, 'recurrence')) {
    income.recurrence = normalizeRecurrence(payload.recurrence);
  }
  if (!partial || Object.hasOwn(payload, 'day_of_month')) {
    income.day_of_month = normalizeDayOfMonth(payload.day_of_month);
  }
  if (!partial || Object.hasOwn(payload, 'next_income_date')) {
    income.next_income_date = normalizeDate(payload.next_income_date, 'next_income_date');
  }
  if (!partial || Object.hasOwn(payload, 'note')) {
    income.note = normalizeOptionalText(payload.note, 'note', 1000);
  }

  if (income.recurrence === 'monthly' && !income.day_of_month && !income.next_income_date) {
    throw new ValidationError('Za mesečni prihod unesite dan u mesecu ili sledeći datum priliva.');
  }

  if ((income.recurrence === 'yearly' || income.recurrence === 'one_time') && !income.next_income_date) {
    throw new ValidationError('Za ovaj prihod unesite sledeći datum priliva.');
  }

  if (partial && Object.keys(income).length === 0) {
    throw new ValidationError('Pošaljite bar jedno polje za izmenu prihoda.');
  }

  return income;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const incomes = await db('incomes').where({ user_id: req.userId }).orderBy('created_at', 'desc');
    res.json({ incomes });
  } catch (err) {
    logError('Neuspešno učitavanje prihoda.', err, { ruta: 'prihodi', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje prihoda.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = validateIncomePayload(req.body);
    const [income] = await db('incomes')
      .insert({ user_id: req.userId, ...payload })
      .returning('*');
    res.status(201).json({ income });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspešno kreiranje prihoda.', err, { ruta: 'prihodi', userId: req.userId, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešno kreiranje prihoda.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await db('incomes').where({ id: req.params.id, user_id: req.userId }).first();
    if (!existing) {
      return res.status(404).json({ error: 'Prihod nije pronađen.' });
    }
    const payload = validateIncomePayload({ ...existing, ...req.body });
    const [income] = await db('incomes')
      .where({ id: req.params.id, user_id: req.userId })
      .update(payload)
      .returning('*');
    res.json({ income });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspešna izmena prihoda.', err, { ruta: 'prihodi/:id', userId: req.userId, incomeId: req.params.id, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešna izmena prihoda.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await db('incomes').where({ id: req.params.id, user_id: req.userId }).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Prihod nije pronađen.' });
    }
    res.status(204).send();
  } catch (err) {
    logError('Neuspešno brisanje prihoda.', err, { ruta: 'prihodi/:id', userId: req.userId, incomeId: req.params.id });
    res.status(500).json({ error: 'Neuspešno brisanje prihoda.' });
  }
});

export default router;
