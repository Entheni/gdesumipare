import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { ValidationError, validateBillPayload } from '../utils/validation.js';
import { serializeBill } from '../utils/billing.js';
import { logError, sanitizeBody } from '../utils/logger.js';

const router = Router();
const EDITABLE_BILL_FIELDS = ['name', 'category', 'amount_rsd', 'recurrence', 'due_day', 'next_due_date', 'notes'];

function pickEditableBillFields(bill) {
  return Object.fromEntries(EDITABLE_BILL_FIELDS.map((field) => [field, bill[field] ?? null]));
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc');
    res.json({ bills: bills.map((bill) => serializeBill(bill)) });
  } catch (err) {
    logError('Neuspešno učitavanje obaveza.', err, { ruta: 'obaveze', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje obaveza.' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const bill = await db('bills').where({ id: req.params.id, user_id: req.userId }).first();
    if (!bill) return res.status(404).json({ error: 'Obaveza nije pronađena.' });
    res.json({ bill: serializeBill(bill) });
  } catch (err) {
    logError('Neuspešno učitavanje obaveze.', err, { ruta: 'obaveze/:id', userId: req.userId, billId: req.params.id });
    res.status(500).json({ error: 'Neuspešno učitavanje obaveze.' });
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
    logError('Neuspešno kreiranje obaveze.', err, { ruta: 'obaveze', userId: req.userId, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešno kreiranje obaveze.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existingBill = await db('bills').where({ id, user_id: req.userId }).first();
    if (!existingBill) return res.status(404).json({ error: 'Obaveza nije pronađena.' });

    const billPayload = validateBillPayload({ ...pickEditableBillFields(existingBill), ...req.body });
    const [bill] = await db('bills').where({ id, user_id: req.userId }).update(billPayload).returning('*');
    res.json({ bill: serializeBill(bill) });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspešna izmena obaveze.', err, { ruta: 'obaveze/:id', userId: req.userId, billId: req.params.id, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešna izmena obaveze.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('bills').where({ id, user_id: req.userId }).del();
    if (!deleted) return res.status(404).json({ error: 'Obaveza nije pronađena.' });
    res.status(204).send();
  } catch (err) {
    logError('Neuspešno brisanje obaveze.', err, { ruta: 'obaveze/:id', userId: req.userId, billId: req.params.id });
    res.status(500).json({ error: 'Neuspešno brisanje obaveze.' });
  }
});

export default router;
