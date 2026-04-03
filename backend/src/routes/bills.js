import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { ValidationError, validateBillPayload } from '../utils/validation.js';
import { serializeBill } from '../utils/billing.js';
import { logError, sanitizeBody } from '../utils/logger.js';
import { getAdvancedDueDate, serializePayment, validatePaymentPayload } from '../utils/payments.js';

const router = Router();
const EDITABLE_BILL_FIELDS = ['name', 'category', 'amount_rsd', 'recurrence', 'due_day', 'next_due_date', 'notes'];

function pickEditableBillFields(bill) {
  return Object.fromEntries(EDITABLE_BILL_FIELDS.map((field) => [field, bill[field] ?? null]));
}

async function attachPaymentSummary(bills) {
  if (!bills.length) return [];

  const billIds = bills.map((bill) => bill.id);
  const payments = await db('payments')
    .whereIn('bill_id', billIds)
    .orderBy('paid_at', 'desc')
    .orderBy('id', 'desc');

  const latestByBillId = new Map();
  const countByBillId = new Map();

  for (const payment of payments) {
    if (!latestByBillId.has(payment.bill_id)) {
      latestByBillId.set(payment.bill_id, payment);
    }
    countByBillId.set(payment.bill_id, (countByBillId.get(payment.bill_id) || 0) + 1);
  }

  return bills.map((bill) => {
    const latestPayment = latestByBillId.get(bill.id);
    return serializeBill({
      ...bill,
      latest_payment_due_date: latestPayment?.due_date || null,
      latest_payment_paid_at: latestPayment?.paid_at || null,
      latest_payment_amount_rsd: latestPayment?.amount_rsd || null,
      payments_count: countByBillId.get(bill.id) || 0,
    });
  });
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc');
    res.json({ bills: await attachPaymentSummary(bills) });
  } catch (err) {
    logError('Neuspešno učitavanje obaveza.', err, { ruta: 'obaveze', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje obaveza.' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const bill = await db('bills').where({ id: req.params.id, user_id: req.userId }).first();
    if (!bill) return res.status(404).json({ error: 'Obaveza nije pronađena.' });
    const [serializedBill] = await attachPaymentSummary([bill]);
    res.json({ bill: serializedBill });
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
    const [serializedBill] = await attachPaymentSummary([bill]);
    res.status(201).json({ bill: serializedBill });
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
    const [serializedBill] = await attachPaymentSummary([bill]);
    res.json({ bill: serializedBill });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspešna izmena obaveze.', err, { ruta: 'obaveze/:id', userId: req.userId, billId: req.params.id, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešna izmena obaveze.' });
  }
});

router.get('/:id/uplate', requireAuth, async (req, res) => {
  try {
    const bill = await db('bills').where({ id: req.params.id, user_id: req.userId }).first();
    if (!bill) return res.status(404).json({ error: 'Obaveza nije pronađena.' });

    const payments = await db('payments')
      .where({ bill_id: req.params.id, user_id: req.userId })
      .orderBy('paid_at', 'desc')
      .orderBy('id', 'desc');

    res.json({ payments: payments.map(serializePayment) });
  } catch (err) {
    logError('Neuspešno učitavanje uplata.', err, { ruta: 'obaveze/:id/uplate', userId: req.userId, billId: req.params.id });
    res.status(500).json({ error: 'Neuspešno učitavanje uplata.' });
  }
});

router.post('/:id/uplate', requireAuth, async (req, res) => {
  try {
    const bill = await db('bills').where({ id: req.params.id, user_id: req.userId }).first();
    if (!bill) return res.status(404).json({ error: 'Obaveza nije pronađena.' });

    const paymentPayload = validatePaymentPayload(req.body, bill);
    const nextDueDate = getAdvancedDueDate(bill, paymentPayload.due_date);

    const result = await db.transaction(async (trx) => {
      const [payment] = await trx('payments')
        .insert({
          user_id: req.userId,
          bill_id: bill.id,
          amount_rsd: paymentPayload.amount_rsd,
          due_date: paymentPayload.due_date,
          paid_at: paymentPayload.paid_at,
          note: paymentPayload.note,
        })
        .returning('*');

      const [updatedBill] = await trx('bills')
        .where({ id: bill.id, user_id: req.userId })
        .update({ next_due_date: nextDueDate })
        .returning('*');

      return { payment, updatedBill };
    });

    const [serializedBill] = await attachPaymentSummary([result.updatedBill]);
    res.status(201).json({
      payment: serializePayment(result.payment),
      bill: serializedBill,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspešno evidentiranje uplate.', err, { ruta: 'obaveze/:id/uplate', userId: req.userId, billId: req.params.id, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešno evidentiranje uplate.' });
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
