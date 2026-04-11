const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

function formatMessage(level: Level, message: string, meta?: object) {
  const timestamp = new Date().toISOString();
  const base = { timestamp, level, message };
  return JSON.stringify(meta ? { ...base, ...meta } : base);
}

export const logger = {
  debug: (message: string, meta?: object) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatMessage("debug", message, meta));
    }
  },
  info: (message: string, meta?: object) => {
    console.info(formatMessage("info", message, meta));
  },
  warn: (message: string, meta?: object) => {
    console.warn(formatMessage("warn", message, meta));
  },
  error: (message: string, meta?: object) => {
    console.error(formatMessage("error", message, meta));
  },
};
