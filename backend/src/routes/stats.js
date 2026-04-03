import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

router.get('/monthly', requireAuth, async (req, res) => {
  try {
    const rows = await db('bills')
      .select('category')
      .sum({ total_rsd: 'amount_rsd' })
      .where({ user_id: req.userId })
      .groupBy('category')
      .orderBy('category');
    res.json({ categories: rows });
  } catch {
    res.status(500).json({ error: 'failed to load monthly stats' });
  }
});

export default router;
