import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const bills = await db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc');
  res.json({ bills });
});

router.post('/', requireAuth, async (req, res) => {
  const { name, category, amount_rsd, recurrence, due_day, next_due_date, notes } = req.body || {};
  if (!name || !amount_rsd || !recurrence) return res.status(400).json({ error: 'name, amount_rsd, recurrence required' });
  const [bill] = await db('bills')
    .insert({ user_id: req.userId, name, category, amount_rsd, recurrence, due_day, next_due_date, notes })
    .returning('*');
  res.status(201).json({ bill });
});

router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const [bill] = await db('bills').where({ id, user_id: req.userId }).update(req.body).returning('*');
  if (!bill) return res.status(404).json({ error: 'not found' });
  res.json({ bill });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const deleted = await db('bills').where({ id, user_id: req.userId }).del();
  if (!deleted) return res.status(404).json({ error: 'not found' });
  res.status(204).send();
});

export default router;
