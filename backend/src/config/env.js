function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getJwtSecret() {
  if (process.env.NODE_ENV === 'test') {
    return process.env.JWT_SECRET || 'test-secret';
  }

  return requireEnv('JWT_SECRET');
}

export function getDatabaseConnection() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'gdesumipare',
  };
}
