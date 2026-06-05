type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}

type LogMetadata = Record<string, unknown>;

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private normalizeArgs(
    first: string | LogMetadata,
    second?: string | LogMetadata
  ): { message: string; metadata?: LogMetadata } {
    if (typeof first === "string") {
      return {
        message: first,
        metadata: typeof second === "object" && second !== null ? second : undefined,
      };
    }

    return {
      message: typeof second === "string" ? second : "",
      metadata: first,
    };
  }

  private log(level: LogLevel, first: string | LogMetadata, second?: string | LogMetadata): void {
    const { message, metadata } = this.normalizeArgs(first, second);
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

  debug(message: string | LogMetadata, metadata?: string | LogMetadata): void {
    this.log("debug", message, metadata);
  }

  info(message: string | LogMetadata, metadata?: string | LogMetadata): void {
    this.log("info", message, metadata);
  }

  warn(message: string | LogMetadata, metadata?: string | LogMetadata): void {
    this.log("warn", message, metadata);
  }

  error(message: string | LogMetadata, metadata?: string | LogMetadata): void {
    this.log("error", message, metadata);
  }

  fatal(message: string | LogMetadata, metadata?: string | LogMetadata): void {
    this.log("error", message, metadata);
  }

  child(metadata: Record<string, unknown>): Logger {
    const moduleName = typeof metadata.module === "string" ? metadata.module : "Child";
    return new Logger(`${this.service}:${moduleName}`);
  }
}

export function createLogger(service: string): Logger {
  return new Logger(service);
}

const logger = createLogger("PDE");

export default logger;
