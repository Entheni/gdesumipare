import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { ValidationError, validateBillPayload } from '../utils/validation.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc');
    res.json({ bills });
  } catch {
    res.status(500).json({ error: 'failed to load bills' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const billPayload = validateBillPayload(req.body);
    const [bill] = await db('bills')
      .insert({ user_id: req.userId, ...billPayload })
      .returning('*');
    res.status(201).json({ bill });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'failed to create bill' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const billPayload = validateBillPayload(req.body, { partial: true });
    const [bill] = await db('bills').where({ id, user_id: req.userId }).update(billPayload).returning('*');
    if (!bill) return res.status(404).json({ error: 'not found' });
    res.json({ bill });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'failed to update bill' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('bills').where({ id, user_id: req.userId }).del();
    if (!deleted) return res.status(404).json({ error: 'not found' });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'failed to delete bill' });
  }
});

export default router;
