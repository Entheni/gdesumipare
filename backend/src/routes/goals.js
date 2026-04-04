import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { buildGoalsSummary } from '../utils/goals.js';
import { ValidationError } from '../utils/validation.js';
import { logError, sanitizeBody } from '../utils/logger.js';
import { getMonthlyAmount } from '../utils/billing.js';
import { getTierCapabilities } from '../utils/plans.js';

const router = Router();

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

function getIncomeMonthlyAmount(income) {
  const amount = Number(income.amount_rsd || 0);
  if (income.recurrence === 'yearly') return amount / 12;
  if (income.recurrence === 'one_time') return 0;
  return amount;
}

function normalizeAmount(value, fieldName) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError(`Polje ${fieldName} mora biti broj veći od 0.`);
  }
  return Number(amount.toFixed(2));
}

function normalizeOptionalAmount(value, fieldName) {
  if (value == null || value === '') {
    return null;
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ValidationError(`Polje ${fieldName} mora biti broj 0 ili veći.`);
  }
  return Number(amount.toFixed(2));
}

function normalizeDate(value, fieldName, { required = false } = {}) {
  if (!value) {
    if (required) {
      throw new ValidationError(`Polje ${fieldName} je obavezno.`);
    }
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`Polje ${fieldName} mora biti datum u formatu YYYY-MM-DD.`);
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new ValidationError(`Polje ${fieldName} mora biti ispravan datum.`);
  }

  return value;
}

function normalizeGoalPayload(payload = {}) {
  const allowedFields = ['name', 'target_amount_rsd', 'starting_amount_rsd', 'monthly_contribution_goal_rsd', 'target_date', 'note'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  if (typeof payload.name !== 'string' || !payload.name.trim()) {
    throw new ValidationError('Naziv cilja je obavezan.');
  }

  return {
    name: payload.name.trim(),
    target_amount_rsd: normalizeAmount(payload.target_amount_rsd, 'target_amount_rsd'),
    starting_amount_rsd: normalizeOptionalAmount(payload.starting_amount_rsd, 'starting_amount_rsd') || 0,
    monthly_contribution_goal_rsd: normalizeOptionalAmount(
      payload.monthly_contribution_goal_rsd,
      'monthly_contribution_goal_rsd',
    ),
    target_date: normalizeDate(payload.target_date, 'target_date'),
    note: typeof payload.note === 'string' && payload.note.trim() ? payload.note.trim() : null,
  };
}

function normalizeContributionPayload(payload = {}) {
  const allowedFields = ['amount_rsd', 'contribution_date', 'note'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  return {
    amount_rsd: normalizeAmount(payload.amount_rsd, 'amount_rsd'),
    contribution_date: normalizeDate(payload.contribution_date || formatToday(), 'contribution_date', { required: true }),
    note: typeof payload.note === 'string' && payload.note.trim() ? payload.note.trim() : null,
  };
}

async function loadGoalsResponse(userId) {
  const [user, goals, contributions, bills, incomes] = await Promise.all([
    db('users').select('subscription_tier').where({ id: userId }).first(),
    db('savings_goals').where({ user_id: userId, is_archived: false }).orderBy('created_at', 'asc'),
    db('goal_contributions').where({ user_id: userId }).orderBy('contribution_date', 'desc').orderBy('created_at', 'desc'),
    db('bills').where({ user_id: userId }),
    db('incomes').where({ user_id: userId }),
  ]);

  const monthlyExpenseRsd = Number(
    bills.reduce((sum, bill) => sum + getMonthlyAmount(bill.amount_rsd, bill.recurrence), 0).toFixed(2),
  );
  const monthlyIncomeRsd = Number(
    incomes.reduce((sum, income) => sum + getIncomeMonthlyAmount(income), 0).toFixed(2),
  );
  const projectedMonthlySavingsRsd = Number((monthlyIncomeRsd - monthlyExpenseRsd).toFixed(2));
  const result = buildGoalsSummary(goals, contributions, { projectedMonthlySavingsRsd });
  const capabilities = getTierCapabilities(user?.subscription_tier);

  return {
    capabilities,
    summary: result.summary,
    goals: result.goals,
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const response = await loadGoalsResponse(req.userId);
    res.json(response);
  } catch (err) {
    logError('Neuspesno ucitavanje ciljeva stednje.', err, { ruta: 'ciljevi', userId: req.userId });
    res.status(500).json({ error: 'Neuspesno ucitavanje ciljeva stednje.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const goal = normalizeGoalPayload(req.body);
    const user = await db('users').select('subscription_tier').where({ id: req.userId }).first();
    const capabilities = getTierCapabilities(user?.subscription_tier);
    if (capabilities.max_savings_goals != null) {
      const currentCount = await db('savings_goals').where({ user_id: req.userId, is_archived: false }).count('* as count').first();
      if (Number(currentCount?.count || 0) >= capabilities.max_savings_goals) {
        return res
          .status(403)
          .json({ error: 'Free paket podrzava jedan aktivan cilj stednje. Za vise ciljeva predji na Plus.' });
      }
    }

    await db('savings_goals').insert({
      user_id: req.userId,
      ...goal,
    });

    const response = await loadGoalsResponse(req.userId);
    res.status(201).json(response);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspesno kreiranje cilja stednje.', err, {
      ruta: 'ciljevi',
      userId: req.userId,
      body: sanitizeBody(req.body),
    });
    res.status(500).json({ error: 'Neuspesno kreiranje cilja stednje.' });
  }
});

router.post('/:id/uplate', requireAuth, async (req, res) => {
  try {
    const goal = await db('savings_goals').where({ id: req.params.id, user_id: req.userId, is_archived: false }).first();
    if (!goal) {
      return res.status(404).json({ error: 'Cilj nije pronadjen.' });
    }

    const contribution = normalizeContributionPayload(req.body);
    await db('goal_contributions').insert({
      goal_id: goal.id,
      user_id: req.userId,
      ...contribution,
    });

    const response = await loadGoalsResponse(req.userId);
    res.status(201).json(response);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspesno evidentiranje uplate ka cilju.', err, {
      ruta: 'ciljevi/uplate',
      userId: req.userId,
      goalId: req.params.id,
      body: sanitizeBody(req.body),
    });
    res.status(500).json({ error: 'Neuspesno evidentiranje uplate ka cilju.' });
  }
});

router.delete('/uplate/:id', requireAuth, async (req, res) => {
  try {
    const contribution = await db('goal_contributions').where({ id: req.params.id, user_id: req.userId }).first();
    if (!contribution) {
      return res.status(404).json({ error: 'Uplata nije pronadjena.' });
    }

    await db('goal_contributions').where({ id: contribution.id }).delete();
    const response = await loadGoalsResponse(req.userId);
    res.json(response);
  } catch (err) {
    logError('Neuspesno brisanje uplate ka cilju.', err, {
      ruta: 'ciljevi/uplate',
      userId: req.userId,
      contributionId: req.params.id,
    });
    res.status(500).json({ error: 'Neuspesno brisanje uplate ka cilju.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const goal = await db('savings_goals').where({ id: req.params.id, user_id: req.userId }).first();
    if (!goal) {
      return res.status(404).json({ error: 'Cilj nije pronadjen.' });
    }

    await db('savings_goals').where({ id: goal.id }).delete();
    const response = await loadGoalsResponse(req.userId);
    res.json(response);
  } catch (err) {
    logError('Neuspesno brisanje cilja stednje.', err, {
      ruta: 'ciljevi',
      userId: req.userId,
      goalId: req.params.id,
    });
    res.status(500).json({ error: 'Neuspesno brisanje cilja stednje.' });
  }
});

export default router;
