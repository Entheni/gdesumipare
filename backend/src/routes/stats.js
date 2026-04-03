import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { buildOverview, getMonthlyAmount } from '../utils/billing.js';
import { logError } from '../utils/logger.js';

const router = Router();

router.get('/mesecno', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId });
    const grouped = new Map();

    for (const bill of bills) {
      const key = bill.category || null;
      const current = grouped.get(key) || 0;
      grouped.set(key, current + getMonthlyAmount(bill.amount_rsd, bill.recurrence));
    }

    const categories = [...grouped.entries()]
      .map(([category, total]) => ({
        category,
        total_rsd: Number(total.toFixed(2)),
      }))
      .sort((left, right) => (left.category || '').localeCompare(right.category || ''));

    res.json({ categories });
  } catch (err) {
    logError('Neuspešno učitavanje mesečne statistike.', err, { ruta: 'statistika/mesecno', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje mesečne statistike.' });
  }
});

router.get('/pregled', requireAuth, async (req, res) => {
  try {
    const bills = await db('bills').where({ user_id: req.userId }).orderBy('created_at', 'desc');
    res.json(buildOverview(bills));
  } catch (err) {
    logError('Neuspešno učitavanje pregleda statistike.', err, { ruta: 'statistika/pregled', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje pregleda statistike.' });
  }
});

export default router;
