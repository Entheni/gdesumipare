import { Router } from 'express';
import { requireAuth } from '../utils/auth.js';
import { sendDueReminders } from '../utils/reminders.js';
import { logError } from '../utils/logger.js';

const router = Router();

router.post('/pokreni', requireAuth, async (req, res) => {
  try {
    const result = await sendDueReminders({ userId: req.userId });
    res.json(result);
  } catch (err) {
    logError('Neuspešno pokretanje podsetnika.', err, { ruta: 'podsetnici/pokreni', userId: req.userId });
    res.status(500).json({ error: err instanceof Error ? err.message : 'Neuspešno pokretanje podsetnika.' });
  }
});

export default router;
