import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { createLogger } from "../utils/logger";

const logger = createLogger("ErrorHandler");

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  stack?: string;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 已知业务错误
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
    }

    logger.warn(`AppError: ${err.code}`, { message: err.message, status: err.statusCode });
    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma 错误处理
  if (err.name === "PrismaClientKnownRequestError") {
    const code = (err as unknown as Record<string, unknown>).code as string;
    const meta = (err as unknown as Record<string, unknown>).meta as Record<string, unknown> | undefined;

    // P2002: Unique constraint violation
    if (code === "P2002") {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: "UNIQUE_CONSTRAINT_VIOLATION",
          message: `Resource already exists: ${meta?.target || "unknown field"}`,
          details: meta,
        },
      };
      res.status(409).json(response);
      return;
    }

    // P2025: Record not found
    if (code === "P2025") {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Record not found",
          details: meta,
        },
      };
      res.status(404).json(response);
      return;
    }

    // P2003: Foreign key constraint failed
    if (code === "P2003") {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: "FOREIGN_KEY_CONSTRAINT",
          message: "Related resource does not exist",
          details: meta,
        },
      };
      res.status(400).json(response);
      return;
    }
  }

  // Prisma validation error
  if (err.name === "PrismaClientValidationError") {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Database validation failed",
        details: { originalError: err.message },
      },
    };
    res.status(400).json(response);
    return;
  }

  // 未知错误
  logger.error("Unhandled error", { message: err.message, stack: err.stack });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    },
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}

// 404 handler
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
}
