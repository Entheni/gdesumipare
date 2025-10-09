import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

router.get('/monthly', requireAuth, async (req, res) => {
  const rows = await db('bills')
    .select('category')
    .sum({ total_rsd: 'amount_rsd' })
    .where({ user_id: req.userId })
    .groupBy('category')
    .orderBy('category');
  res.json({ categories: rows });
});

export default router;
