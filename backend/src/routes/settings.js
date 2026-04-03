import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { ValidationError } from '../utils/validation.js';

const router = Router();

function normalizeSettingsPayload(payload = {}, { partial = false } = {}) {
  const allowedFields = ['reminders_enabled', 'reminder_days', 'theme_preference'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    throw new ValidationError(`unknown fields: ${unknownFields.join(', ')}`);
  }

  const settings = {};

  if (!partial || Object.hasOwn(payload, 'reminders_enabled')) {
    if (typeof payload.reminders_enabled !== 'boolean') {
      throw new ValidationError('reminders_enabled must be a boolean');
    }
    settings.reminders_enabled = payload.reminders_enabled;
  }

  if (!partial || Object.hasOwn(payload, 'reminder_days')) {
    const reminderDays = Number(payload.reminder_days);
    if (!Number.isInteger(reminderDays) || reminderDays < 0 || reminderDays > 30) {
      throw new ValidationError('reminder_days must be an integer between 0 and 30');
    }
    settings.reminder_days = reminderDays;
  }

  if (!partial || Object.hasOwn(payload, 'theme_preference')) {
    if (!['system', 'light', 'dark'].includes(payload.theme_preference)) {
      throw new ValidationError('theme_preference must be one of: system, light, dark');
    }
    settings.theme_preference = payload.theme_preference;
  }

  if (partial && Object.keys(settings).length === 0) {
    throw new ValidationError('at least one setting is required');
  }

  return settings;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await db('users')
      .select('reminders_enabled', 'reminder_days', 'theme_preference')
      .where({ id: req.userId })
      .first();

    res.json({
      settings: user || {
        reminders_enabled: true,
        reminder_days: 3,
        theme_preference: 'system',
      },
    });
  } catch {
    res.status(500).json({ error: 'failed to load settings' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const settings = normalizeSettingsPayload(req.body, { partial: true });
    const [user] = await db('users')
      .where({ id: req.userId })
      .update(settings)
      .returning(['reminders_enabled', 'reminder_days', 'theme_preference']);

    res.json({ settings: user });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'failed to save settings' });
  }
});

export default router;
