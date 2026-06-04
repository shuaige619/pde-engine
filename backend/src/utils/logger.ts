type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      metadata,
    };

    // Structured JSON logging for production
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(entry));
      return;
    }

    // Pretty logging for development
    const colorMap: Record<LogLevel, string> = {
      debug: "\x1b[36m",
      info: "\x1b[32m",
      warn: "\x1b[33m",
      error: "\x1b[31m",
    };
    const reset = "\x1b[0m";
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
    console.log(
      `${colorMap[level]}[${entry.timestamp}] [${level.toUpperCase()}] [${this.service}]${reset} ${message}${metaStr}`
    );
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }
}

export function createLogger(service: string): Logger {
  return new Logger(service);
}
