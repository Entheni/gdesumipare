import { Router } from 'express';
import db from '../db/knex.js';
import { hashPassword, requireAuth, verifyPassword } from '../utils/auth.js';
import { ValidationError, normalizeEmail, normalizePassword } from '../utils/validation.js';
import { logError, sanitizeBody } from '../utils/logger.js';
import { getTierCapabilities, normalizeSubscriptionTier } from '../utils/plans.js';

const router = Router();

function normalizeSettingsPayload(payload = {}, { partial = false } = {}) {
  const allowedFields = ['reminders_enabled', 'reminder_days', 'theme_preference', 'subscription_tier'];
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

  if (!partial || Object.hasOwn(payload, 'subscription_tier')) {
    settings.subscription_tier = normalizeSubscriptionTier(payload.subscription_tier);
  }

  if (partial && Object.keys(settings).length === 0) {
    throw new ValidationError('Pošaljite bar jedno podešavanje za izmenu.');
  }

  return settings;
}

function normalizeProfilePayload(payload = {}) {
  const allowedFields = ['display_name', 'email'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  const profile = {};

  if (Object.hasOwn(payload, 'display_name')) {
    if (payload.display_name == null || payload.display_name === '') {
      profile.display_name = null;
    } else if (typeof payload.display_name !== 'string') {
      throw new ValidationError('Ime za prikaz mora biti tekst.');
    } else {
      const displayName = payload.display_name.trim();
      if (displayName.length > 255) {
        throw new ValidationError('Ime za prikaz može imati najviše 255 karaktera.');
      }
      profile.display_name = displayName || null;
    }
  }

  if (Object.hasOwn(payload, 'email')) {
    profile.email = normalizeEmail(payload.email);
  }

  if (Object.keys(profile).length === 0) {
    throw new ValidationError('Pošaljite bar jedno polje profila za izmenu.');
  }

  return profile;
}

function normalizePasswordPayload(payload = {}) {
  const allowedFields = ['current_password', 'new_password'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  if (typeof payload.current_password !== 'string' || !payload.current_password) {
    throw new ValidationError('Trenutna lozinka je obavezna.');
  }

  return {
    current_password: payload.current_password,
    new_password: normalizePassword(payload.new_password),
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await db('users')
      .select('email', 'display_name', 'reminders_enabled', 'reminder_days', 'theme_preference', 'subscription_tier')
      .where({ id: req.userId })
      .first();

    res.json({
      settings: user || {
        email: '',
        display_name: null,
        reminders_enabled: true,
        reminder_days: 3,
        theme_preference: 'system',
        subscription_tier: 'free',
      },
      capabilities: getTierCapabilities(user?.subscription_tier),
    });
  } catch (err) {
    logError('Neuspešno učitavanje podešavanja.', err, { ruta: 'podesavanja', userId: req.userId });
    res.status(500).json({ error: 'Neuspešno učitavanje podešavanja.' });
  }
});

router.put('/profil', requireAuth, async (req, res) => {
  try {
    const profile = normalizeProfilePayload(req.body);

    if (profile.email) {
      const existingUser = await db('users')
        .where({ email: profile.email })
        .whereNot({ id: req.userId })
        .first();

      if (existingUser) {
        return res.status(409).json({ error: 'Email adresa je već zauzeta.' });
      }
    }

    const [user] = await db('users')
      .where({ id: req.userId })
      .update(profile)
      .returning(['email', 'display_name', 'reminders_enabled', 'reminder_days', 'theme_preference', 'subscription_tier']);

    res.json({ settings: user });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspešno čuvanje profila.', err, { ruta: 'podesavanja/profil', userId: req.userId, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešno čuvanje profila.' });
  }
});

router.put('/lozinka', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = normalizePasswordPayload(req.body);
    const user = await db('users').select('password_hash').where({ id: req.userId }).first();
    if (!user) {
      return res.status(404).json({ error: 'Korisnik nije pronađen.' });
    }

    const isValid = await verifyPassword(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Trenutna lozinka nije ispravna.' });
    }

    const password_hash = await hashPassword(new_password);
    await db('users').where({ id: req.userId }).update({ password_hash });

    res.json({ message: 'Lozinka je uspešno promenjena.' });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspešna promena lozinke.', err, { ruta: 'podesavanja/lozinka', userId: req.userId, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešna promena lozinke.' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const settings = normalizeSettingsPayload(req.body, { partial: true });
    const [user] = await db('users')
      .where({ id: req.userId })
      .update(settings)
      .returning(['reminders_enabled', 'reminder_days', 'theme_preference', 'subscription_tier']);

    res.json({ settings: user, capabilities: getTierCapabilities(user?.subscription_tier) });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logError('Neuspešno čuvanje podešavanja.', err, { ruta: 'podesavanja', userId: req.userId, body: sanitizeBody(req.body) });
    res.status(500).json({ error: 'Neuspešno čuvanje podešavanja.' });
  }
});

export default router;
