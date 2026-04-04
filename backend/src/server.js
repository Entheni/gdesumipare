import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import billsRoutes from './routes/bills.js';
import incomesRoutes from './routes/incomes.js';
import remindersRoutes from './routes/reminders.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';
import goalsRoutes from './routes/goals.js';
import { logInfo } from './utils/logger.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Healthcheck
app.use((req, _res, next) => {
  logInfo('HTTP zahtev', { metod: req.method, putanja: req.path });
  next();
});

app.get('/api/zdravlje', (_req, res) => {
  res.json({ status: 'ok', servis: 'gdesumipare-api' });
});

// API routes
app.use('/api/autentikacija', authRoutes);
app.use('/api/obaveze', billsRoutes);
app.use('/api/prihodi', incomesRoutes);
app.use('/api/podsetnici', remindersRoutes);
app.use('/api/podesavanja', settingsRoutes);
app.use('/api/statistika', statsRoutes);
app.use('/api/ciljevi', goalsRoutes);

// Legacy aliases
app.use('/api/auth', authRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/incomes', incomesRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/goals', goalsRoutes);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', servis: 'gdesumipare-api' });
});

app.listen(port, () => {
  logInfo('API pokrenut.', { url: `http://localhost:${port}` });
});
