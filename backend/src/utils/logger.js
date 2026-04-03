function timestamp() {
  return new Date().toISOString();
}

export function logInfo(message, context = {}) {
  console.log(`[${timestamp()}] INFO ${message}`, context);
}

export function logError(message, error, context = {}) {
  console.error(`[${timestamp()}] ERROR ${message}`, {
    ...context,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
  });
}

export function sanitizeBody(body = {}) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  if ('password' in sanitized) {
    sanitized.password = '[SKRIVENO]';
  }
  if ('password_hash' in sanitized) {
    sanitized.password_hash = '[SKRIVENO]';
  }
  return sanitized;
}
