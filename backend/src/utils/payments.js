import { ValidationError } from './validation.js';
import { formatDateOnly, getFollowingDueDate, getNextDueDate, parseDateOnly } from './billing.js';

function normalizePositiveAmount(value, fallbackAmount) {
  if (value == null || value === '') {
    return Number(Number(fallbackAmount).toFixed(2));
  }

  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError('Iznos uplate mora biti pozitivan broj.');
  }

  return Number(amount.toFixed(2));
}

function normalizeOptionalNote(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') {
    throw new ValidationError('Napomena mora biti tekst.');
  }
  const note = value.trim();
  if (note.length > 1000) {
    throw new ValidationError('Napomena može imati najviše 1000 karaktera.');
  }
  return note || null;
}

function normalizePaidAt(value) {
  if (value == null || value === '') {
    return new Date().toISOString();
  }

  const paidAt = new Date(value);
  if (Number.isNaN(paidAt.getTime())) {
    throw new ValidationError('Datum i vreme uplate nisu ispravni.');
  }

  return paidAt.toISOString();
}

export function validatePaymentPayload(payload = {}, bill) {
  const allowedFields = ['amount_rsd', 'due_date', 'paid_at', 'note'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  const dueDate = payload.due_date || getNextDueDate(bill);
  if (!parseDateOnly(dueDate)) {
    throw new ValidationError('Datum dospeća za uplatu nije ispravan.');
  }

  return {
    amount_rsd: normalizePositiveAmount(payload.amount_rsd, bill.amount_rsd),
    due_date: formatDateOnly(parseDateOnly(dueDate)),
    paid_at: normalizePaidAt(payload.paid_at),
    note: normalizeOptionalNote(payload.note),
  };
}

export function getAdvancedDueDate(bill, paidDueDate) {
  const nextDueDate = getFollowingDueDate(bill, paidDueDate);
  if (!nextDueDate) {
    throw new ValidationError('Nije moguće izračunati sledeći datum dospeća.');
  }

  return nextDueDate;
}

export function serializePayment(payment) {
  return {
    ...payment,
    due_date: payment.due_date ? formatDateOnly(parseDateOnly(payment.due_date)) : null,
    paid_at: payment.paid_at ? new Date(payment.paid_at).toISOString() : null,
  };
}
