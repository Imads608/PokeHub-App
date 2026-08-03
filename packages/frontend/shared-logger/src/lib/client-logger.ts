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

/** A single buffered log record captured for debugging/export. */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data: unknown[];
}

/** Max number of entries kept in memory before the oldest are dropped. */
const MAX_BUFFERED_ENTRIES = 1000;

/** Ring buffer of every log entry that passed the level filter. */
const logBuffer: LogEntry[] = [];

function bufferEntry(entry: LogEntry) {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFERED_ENTRIES) {
    logBuffer.splice(0, logBuffer.length - MAX_BUFFERED_ENTRIES);
  }
}

/**
 * Empty the in-memory log buffer. Call this to scope `pokehubLogs()` output to
 * a fresh context (e.g. the start of a new battle) without waiting for a full
 * page reload.
 */
export function clearLogBuffer() {
  logBuffer.length = 0;
}

/**
 * Bounds applied when serializing log data for export. Battle log calls pass
 * very large objects (e.g. the whole @pkmn/client Battle instance), so we cap
 * depth/breadth/length to keep `pokehubLogs()` output compact and paste-able.
 * The live console still receives the full objects for interactive inspection.
 */
const SERIALIZE_MAX_DEPTH = 4;
const SERIALIZE_MAX_ARRAY = 20;
const SERIALIZE_MAX_KEYS = 40;
const SERIALIZE_MAX_STRING = 500;

/**
 * Produce a size-bounded, circular-safe plain copy of a value for export.
 * Truncates deep nesting, long arrays/objects, and long strings, replacing the
 * omitted parts with short markers.
 */
function truncateForLog(
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`;
  }
  if (typeof value === 'string') {
    return value.length > SERIALIZE_MAX_STRING
      ? `${value.slice(0, SERIALIZE_MAX_STRING)}… (+${
          value.length - SERIALIZE_MAX_STRING
        } chars)`
      : value;
  }
  if (value === null || typeof value !== 'object') return value;

  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (seen.has(value)) return '[Circular]';

  if (depth >= SERIALIZE_MAX_DEPTH) {
    return Array.isArray(value) ? '[Array]' : '[Object]';
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const items = value
        .slice(0, SERIALIZE_MAX_ARRAY)
        .map((v) => truncateForLog(v, depth + 1, seen));
      if (value.length > SERIALIZE_MAX_ARRAY) {
        items.push(`… (+${value.length - SERIALIZE_MAX_ARRAY} more)`);
      }
      return items;
    }

    const out: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>);
    for (const key of keys.slice(0, SERIALIZE_MAX_KEYS)) {
      out[key] = truncateForLog(
        (value as Record<string, unknown>)[key],
        depth + 1,
        seen
      );
    }
    if (keys.length > SERIALIZE_MAX_KEYS) {
      out['…'] = `(+${keys.length - SERIALIZE_MAX_KEYS} more keys)`;
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

/**
 * Serialize a value for export: circular-safe, size-bounded, and compact
 * (single line, no indentation) so exported logs stay small.
 */
function safeStringify(value: unknown): string {
  return JSON.stringify(truncateForLog(value, 0, new WeakSet<object>()));
}

function formatData(data: unknown[]): string {
  return data
    .map((d) => {
      if (typeof d === 'string') return d;
      try {
        return safeStringify(d) ?? String(d);
      } catch {
        return String(d);
      }
    })
    .join(' ');
}

/** Render the buffered entries as a copy-pasteable plain-text block. */
function formatEntries(entries: LogEntry[]): string {
  return entries
    .map((e) => {
      const head = `${e.timestamp} [${e.context}] ${e.level.toUpperCase()} ${e.message}`;
      const body = e.data.length > 0 ? ` ${formatData(e.data)}` : '';
      return `${head}${body}`;
    })
    .join('\n');
}

/**
 * Console helper exposed on `window.pokehubLogs` for grabbing the in-memory
 * log buffer while debugging. Calling it prints and returns the full text so
 * it can be copied straight out of the devtools console.
 */
export interface LogInspector {
  (): string;
  /** Structured copy of the buffered entries. */
  entries: () => LogEntry[];
  /** The buffer rendered as plain text (same value the inspector returns). */
  text: () => string;
  /** Copy the buffered logs to the clipboard. */
  copy: () => Promise<void>;
  /** Empty the buffer. */
  clear: () => void;
}

function createInspector(): LogInspector {
  const inspector = (() => {
    const text = formatEntries(logBuffer);
    // Print so the multi-line block renders unescaped in the console, and
    // return it so it can also be captured programmatically.
    console.log(text);
    return text;
  }) as LogInspector;

  inspector.entries = () => logBuffer.slice();
  inspector.text = () => formatEntries(logBuffer);
  inspector.copy = async () => {
    const text = formatEntries(logBuffer);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error('Clipboard API is unavailable in this context');
    }
  };
  inspector.clear = () => {
    clearLogBuffer();
  };

  return inspector;
}

declare global {
  // eslint-disable-next-line no-var
  var pokehubLogs: LogInspector | undefined;
}

/**
 * Expose the inspector on `window.pokehubLogs` so `pokehubLogs()` is available
 * in the devtools console. Idempotent and safe to call repeatedly; a no-op on
 * the server (no `window`) and once already installed.
 */
function ensureInspectorExposed() {
  if (typeof window !== 'undefined' && !window.pokehubLogs) {
    window.pokehubLogs = createInspector();
  }
}

// Expose as soon as the module loads in the browser.
ensureInspectorExposed();

export interface ClientLogger {
  debug: (message: string, ...data: unknown[]) => void;
  info: (message: string, ...data: unknown[]) => void;
  warn: (message: string, ...data: unknown[]) => void;
  error: (message: string, ...data: unknown[]) => void;
}

export function createClientLogger(context: string): ClientLogger {
  const prefix = `[${context}]`;

  // Ensure the inspector is installed even if this module first evaluated
  // before `window` existed (e.g. SSR eval order).
  ensureInspectorExposed();

  function log(level: LogLevel, message: string, ...data: unknown[]) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Always capture into the buffer, regardless of the console display level,
    // so `pokehubLogs()` has the full history ready to export without the user
    // first enabling verbose logging and reproducing the bug.
    bufferEntry({ timestamp, level, context, message, data });

    // The localStorage level filter only gates what gets printed to the console.
    if (LOG_LEVELS[level] < LOG_LEVELS[getMinLevel()]) return;

    const method = CONSOLE_METHODS[level];
    const style = LEVEL_STYLES[level];

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
