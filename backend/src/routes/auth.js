import { Router } from 'express';
import db from '../db/knex.js';
import { hashPassword, verifyPassword, signToken } from '../utils/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await db('users').where({ email }).first();
    if (existing) return res.status(409).json({ error: 'email already in use' });
    const password_hash = await hashPassword(password);
    const [user] = await db('users').insert({ email, password_hash }).returning(['id', 'email']);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'login failed' });
  }
});

export default router;
