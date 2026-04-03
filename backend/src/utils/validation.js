const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_RECURRENCES = new Set(['monthly', 'yearly']);

export class ValidationError extends Error {}

function normalizeOptionalText(value, maxLength) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new ValidationError('Vrednost mora biti tekst.');
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(`Maksimalna dužina je ${maxLength} karaktera.`);
  }

  return trimmed;
}

function normalizeRequiredText(value, field, maxLength) {
  const normalized = normalizeOptionalText(value, maxLength);
  if (!normalized) {
    throw new ValidationError(`Polje "${field}" je obavezno.`);
  }
  return normalized;
}

function normalizeAmount(value) {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError('Iznos mora biti pozitivan broj.');
  }

  return Number(amount.toFixed(2));
}

function normalizeDueDay(value) {
  if (value == null || value === '') {
    return null;
  }

  const dueDay = Number(value);
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw new ValidationError('Dan dospeća mora biti ceo broj između 1 i 31.');
  }

  return dueDay;
}

function normalizeDate(value) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError('Datum dospeća mora biti ispravan datum.');
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ValidationError('Datum dospeća mora biti ispravan datum.');
  }

  return value;
}

function normalizeRecurrence(value) {
  if (!ALLOWED_RECURRENCES.has(value)) {
    throw new ValidationError('Ponavljanje mora biti "monthly" ili "yearly".');
  }

  return value;
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') {
    throw new ValidationError('Email je obavezan.');
  }

  const email = value.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError('Email adresa nije ispravna.');
  }

  return email;
}

export function normalizePassword(value) {
  if (typeof value !== 'string' || value.length < 8) {
    throw new ValidationError('Lozinka mora imati najmanje 8 karaktera.');
  }

  return value;
}

export function validateCredentials(payload = {}) {
  return {
    email: normalizeEmail(payload.email),
    password: normalizePassword(payload.password),
  };
}

export function validateBillPayload(payload = {}, { partial = false } = {}) {
  const allowedFields = ['name', 'category', 'amount_rsd', 'recurrence', 'due_day', 'next_due_date', 'notes'];
  const unknownFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    throw new ValidationError(`Nepoznata polja: ${unknownFields.join(', ')}.`);
  }

  const bill = {};

  if (!partial || Object.hasOwn(payload, 'name')) {
    bill.name = normalizeRequiredText(payload.name, 'name', 255);
  }

  if (!partial || Object.hasOwn(payload, 'category')) {
    bill.category = normalizeOptionalText(payload.category, 100);
  }

  if (!partial || Object.hasOwn(payload, 'amount_rsd')) {
    bill.amount_rsd = normalizeAmount(payload.amount_rsd);
  }

  if (!partial || Object.hasOwn(payload, 'recurrence')) {
    bill.recurrence = normalizeRecurrence(payload.recurrence);
  }

  if (!partial || Object.hasOwn(payload, 'due_day')) {
    bill.due_day = normalizeDueDay(payload.due_day);
  }

  if (!partial || Object.hasOwn(payload, 'next_due_date')) {
    bill.next_due_date = normalizeDate(payload.next_due_date);
  }

  if (!partial || Object.hasOwn(payload, 'notes')) {
    bill.notes = normalizeOptionalText(payload.notes, 1000);
  }

  if (bill.recurrence === 'monthly' && !bill.due_day && !bill.next_due_date) {
    throw new ValidationError('Za mesečne obaveze unesite dan dospeća ili datum dospeća.');
  }

  if (bill.recurrence === 'yearly' && !bill.next_due_date) {
    throw new ValidationError('Za godišnje obaveze unesite datum dospeća.');
  }

  if (partial && Object.keys(bill).length === 0) {
    throw new ValidationError('Potrebno je poslati bar jedno polje za izmenu.');
  }

  return bill;
}
