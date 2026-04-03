import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { ValidationError, validateBillPayload } from '../utils/validation.js';
import { serializeBill } from '../utils/billing.js';

const router = Router();
const EDITABLE_BILL_FIELDS = ['name', 'category', 'amount_rsd', 'recurrence', 'due_day', 'next_due_date', 'notes'];

function pickEditableBillFields(bill) {
  return Object.fromEntries(EDITABLE_BILL_FIELDS.map((field) => [field, bill[field] ?? null]));
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc');
    res.json({ bills: bills.map((bill) => serializeBill(bill)) });
  } catch {
    res.status(500).json({ error: 'failed to load bills' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const bill = await db('bills').where({ id: req.params.id, user_id: req.userId }).first();
    if (!bill) return res.status(404).json({ error: 'not found' });
    res.json({ bill: serializeBill(bill) });
  } catch {
    res.status(500).json({ error: 'failed to load bill' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const billPayload = validateBillPayload(req.body);
    const [bill] = await db('bills')
      .insert({ user_id: req.userId, ...billPayload })
      .returning('*');
    res.status(201).json({ bill: serializeBill(bill) });
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
    const existingBill = await db('bills').where({ id, user_id: req.userId }).first();
    if (!existingBill) return res.status(404).json({ error: 'not found' });

    const billPayload = validateBillPayload({ ...pickEditableBillFields(existingBill), ...req.body });
    const [bill] = await db('bills').where({ id, user_id: req.userId }).update(billPayload).returning('*');
    res.json({ bill: serializeBill(bill) });
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
