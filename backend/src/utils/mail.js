import nodemailer from 'nodemailer';

function getMailTransportConfig() {
  if (process.env.EMAIL_HOST) {
    return {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: process.env.EMAIL_USER
        ? {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          }
        : undefined,
    };
  }

  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return {
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }

  return null;
}

export function hasMailConfig() {
  return Boolean(getMailTransportConfig());
}

function getTransport() {
  const config = getMailTransportConfig();
  if (!config) {
    throw new Error('Missing email transport configuration');
  }

  return nodemailer.createTransport(config);
}

export async function sendReminderEmail({ to, billName, amountRsd, dueDate, reminderDays }) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await transport.sendMail({
    from,
    to,
    subject: `Podsetnik: ${billName} dospeva ${dueDate}`,
    text: [
      `Podsetnik za obavezu: ${billName}`,
      `Iznos: ${Number(amountRsd).toFixed(2)} RSD`,
      `Datum dospeća: ${dueDate}`,
      `Podsetnik je poslat ${reminderDays} dana unapred.`,
    ].join('\n'),
  });
}
