const reasons: Record<string, string> = {
  P1000: 'Database authentication failed',
  P1001: 'Database host is unreachable',
  P1002: 'Database connection timed out',
  P1003: 'Database does not exist',
  P1010: 'Database access denied',
  P1011: 'Database TLS connection failed',
  P1012: 'Database configuration validation failed',
  P1013: 'Database URL is invalid',
};

export function databaseErrorDetails(error: unknown) {
  const failure = error as { name?: string; code?: string; errorCode?: string; message?: string } | null;
  const reported = failure?.errorCode ?? failure?.code;
  const code = typeof reported === 'string' && /^P\d{4}$/.test(reported) ? reported : undefined;
  const initialization = failure?.name === 'PrismaClientInitializationError';
  const reason = (code && reasons[code]) || (initialization
    ? /can't reach database server/i.test(failure?.message ?? '')
      ? reasons.P1001
      : 'Prisma could not initialize the database connection'
    : undefined);

  // Log only a recognized code and fixed text, never the original exception.
  return { code, name: initialization ? 'PrismaClientInitializationError' : undefined, reason };
}
