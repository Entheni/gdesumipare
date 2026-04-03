import { Router } from 'express';
import db from '../db/knex.js';
import { requireAuth } from '../utils/auth.js';
import { ValidationError } from '../utils/validation.js';
import { logError, sanitizeBody } from '../utils/logger.js';

const router = Router();

function normalizeSettingsPayload(payload = {}, { partial = false } = {}) {
  const allowedFields = ['reminders_enabled', 'reminder_days', 'theme_preference'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  const settings = {};

  if (!partial || Object.hasOwn(payload, 'reminders_enabled')) {
    if (typeof payload.reminders_enabled !== 'boolean') {
      throw new ValidationError('Polje reminders_enabled mora biti true ili false.');
    }
    settings.reminders_enabled = payload.reminders_enabled;
  }

  if (!partial || Object.hasOwn(payload, 'reminder_days')) {
    const reminderDays = Number(payload.reminder_days);
    if (!Number.isInteger(reminderDays) || reminderDays < 0 || reminderDays > 30) {
      throw new ValidationError('Broj dana za podsetnik mora biti ceo broj između 0 i 30.');
    }
    settings.reminder_days = reminderDays;
  }

  if (!partial || Object.hasOwn(payload, 'theme_preference')) {
    if (!['system', 'light', 'dark'].includes(payload.theme_preference)) {
      throw new ValidationError('Tema mora biti system, light ili dark.');
    }
    settings.theme_preference = payload.theme_preference;
  }

  if (partial && Object.keys(settings).length === 0) {
    throw new ValidationError('Pošaljite bar jedno podešavanje za izmenu.');
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
  } catch (err) {
    logError('Neuspešno učitavanje podešavanja.', err, { ruta: 'podesavanja', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje podešavanja.' });
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
    logError('Neuspešno čuvanje podešavanja.', err, { ruta: 'podesavanja', userId: req.userId, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešno čuvanje podešavanja.' });
  }
});

export default router;
