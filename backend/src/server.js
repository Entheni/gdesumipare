import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import billsRoutes from './routes/bills.js';
import remindersRoutes from './routes/reminders.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gdesumipare-api' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});
