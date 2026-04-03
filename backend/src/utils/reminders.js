import db from '../db/knex.js';
import { getDaysUntilDue, getNextDueDate } from './billing.js';
import { hasMailConfig, sendReminderEmail } from './mail.js';

export async function sendDueReminders({ userId = null, referenceDate = new Date() } = {}) {
  if (!hasMailConfig()) {
    throw new Error('Email reminders are not configured');
  }

  const usersQuery = db('users')
    .select('id', 'email', 'reminders_enabled', 'reminder_days')
    .where({ reminders_enabled: true });

  if (userId) {
    usersQuery.andWhere({ id: userId });
  }

  const users = await usersQuery;
  const results = [];

  for (const user of users) {
    const bills = await db('bills').where({ user_id: user.id });

    for (const bill of bills) {
      const dueDate = getNextDueDate(bill, referenceDate);
      const daysUntilDue = getDaysUntilDue(dueDate, referenceDate);

      if (dueDate == null || daysUntilDue == null || daysUntilDue < 0 || daysUntilDue > user.reminder_days) {
        continue;
      }

      const existingNotification = await db('notifications')
        .where({
          user_id: user.id,
          bill_id: bill.id,
          due_date: dueDate,
        })
        .first();

      if (existingNotification) {
        continue;
      }

      await sendReminderEmail({
        to: user.email,
        billName: bill.name,
        amountRsd: bill.amount_rsd,
        dueDate,
        reminderDays: user.reminder_days,
      });

      await db('notifications').insert({
        user_id: user.id,
        bill_id: bill.id,
        due_date: dueDate,
        sent_at: db.fn.now(),
      });

      results.push({
        user_id: user.id,
        bill_id: bill.id,
        email: user.email,
        due_date: dueDate,
      });
    }
  }

  return {
    sent_count: results.length,
    reminders: results,
  };
}
