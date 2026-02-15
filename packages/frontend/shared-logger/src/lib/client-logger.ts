'use client';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color: #8b8b8b',
  info: 'color: #2196f3',
  warn: 'color: #ff9800',
  error: 'color: #f44336; font-weight: bold',
};

const CONSOLE_METHODS: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> =
  {
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
  };

function getMinLevel(): LogLevel {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('POKEHUB_LOG_LEVEL');
    if (stored && stored in LOG_LEVELS) return stored as LogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
}

export interface ClientLogger {
  debug: (message: string, ...data: unknown[]) => void;
  info: (message: string, ...data: unknown[]) => void;
  warn: (message: string, ...data: unknown[]) => void;
  error: (message: string, ...data: unknown[]) => void;
}

export function createClientLogger(context: string): ClientLogger {
  const prefix = `[${context}]`;

  function log(level: LogLevel, message: string, ...data: unknown[]) {
    if (LOG_LEVELS[level] < LOG_LEVELS[getMinLevel()]) return;

    const method = CONSOLE_METHODS[level];
    const style = LEVEL_STYLES[level];
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    if (data.length > 0) {
      console[method](`%c${timestamp} ${prefix}`, style, message, ...data);
    } else {
      console[method](`%c${timestamp} ${prefix}`, style, message);
    }
  }

  return {
    debug: (message, ...data) => log('debug', message, ...data),
    info: (message, ...data) => log('info', message, ...data),
    warn: (message, ...data) => log('warn', message, ...data),
    error: (message, ...data) => log('error', message, ...data),
  };
}
