import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { ValidationError } from '../utils/validation.js';
import { logError, sanitizeBody } from '../utils/logger.js';
import { buildBudgetSummary, getBudgetKey } from '../utils/budgets.js';

const router = Router();

function normalizeCategory(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('Kategorija budzeta mora biti tekst.');
  }
  const normalized = value.trim();
  if (normalized.length > 100) {
    throw new ValidationError('Kategorija budzeta moze imati najvise 100 karaktera.');
  }
  return normalized || null;
}

function normalizeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError('Mesecni limit budzeta mora biti broj veci od 0.');
  }
  return Number(amount.toFixed(2));
}

function validateBudgetPayload(payload = {}) {
  const allowedFields = ['category', 'monthly_limit_rsd'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  return {
    category: normalizeCategory(payload.category),
    monthly_limit_rsd: normalizeAmount(payload.monthly_limit_rsd),
  };
}

async function loadBudgetResponse(userId) {
  const [targets, bills] = await Promise.all([
    db('budget_targets').where({ user_id: userId }).orderBy('category', 'asc'),
    db('bills').where({ user_id: userId }),
  ]);

  return {
    targets: targets.map((target) => ({
      id: target.id,
      category: target.category,
      monthly_limit_rsd: Number(Number(target.monthly_limit_rsd || 0).toFixed(2)),
    })),
    summary: buildBudgetSummary(targets, bills),
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await loadBudgetResponse(req.userId));
  } catch (err) {
    logError('Neuspesno ucitavanje budzeta.', err, { ruta: 'budzeti', userId: req.userId });
    res.status(500).json({ error: 'Neuspesno ucitavanje budzeta.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = validateBudgetPayload(req.body);
    const targets = await db('budget_targets').where({ user_id: req.userId });
    const existing = targets.find((target) => getBudgetKey(target.category) === getBudgetKey(payload.category));

    if (existing) {
      await db('budget_targets').where({ id: existing.id, user_id: req.userId }).update(payload);
    } else {
      await db('budget_targets').insert({ user_id: req.userId, ...payload });
    }

    res.status(201).json(await loadBudgetResponse(req.userId));
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspesno cuvanje budzeta.', err, { ruta: 'budzeti', userId: req.userId, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspesno cuvanje budzeta.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await db('budget_targets').where({ id: req.params.id, user_id: req.userId }).delete();
    if (!deleted) {
      return res.status(404).json({ error: 'Budzet nije pronadjen.' });
    }
    res.json(await loadBudgetResponse(req.userId));
  } catch (err) {
    logError('Neuspesno brisanje budzeta.', err, { ruta: 'budzeti/:id', userId: req.userId, budgetId: req.params.id });
    res.status(500).json({ error: 'Neuspesno brisanje budzeta.' });
  }
});

export default router;
