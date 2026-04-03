import 'dotenv/config';
import { sendDueReminders } from '../utils/reminders.js';

try {
  const result = await sendDueReminders();
  console.log(`Sent ${result.sent_count} reminder(s).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
