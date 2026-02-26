const isDev = process.env.NODE_ENV === 'development';

function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack || ''}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
}

export const logger = {
  debug(...args: unknown[]) {
    if (isDev) {
      console.debug(`[${new Date().toISOString()}] [DEBUG]`, ...args);
    }
  },
  info(...args: unknown[]) {
    console.info(`[${new Date().toISOString()}] [INFO]`, ...args);
  },
  warn(...args: unknown[]) {
    console.warn(`[${new Date().toISOString()}] [WARN]`, ...args);
  },
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const timestamp = `[${new Date().toISOString()}]`;
    if (error instanceof Error) {
      console.error(
        `${timestamp} [ERROR] ${message}: ${error.message}`,
        error.stack || '',
        context ? formatArgs([context]) : ''
      );
    } else if (error !== undefined) {
      console.error(
        `${timestamp} [ERROR] ${message}: ${String(error)}`,
        context ? formatArgs([context]) : ''
      );
    } else {
      console.error(`${timestamp} [ERROR] ${message}`);
    }
  },
};
