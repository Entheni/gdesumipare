import { Router } from 'express';
import { requireAuth } from '../utils/auth.js';
import { sendDueReminders } from '../utils/reminders.js';

const router = Router();

router.post('/run', requireAuth, async (req, res) => {
  try {
    const result = await sendDueReminders({ userId: req.userId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'failed to run reminders' });
  }
});

export default router;
