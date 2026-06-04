import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { createLogger } from "../utils/logger";

const logger = createLogger("Validator");

export function validateBody(schema: ZodSchema<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const issues = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        logger.warn("Validation failed", { issues });

        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body validation failed",
            details: { issues },
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const issues = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "URL parameters validation failed",
            details: { issues },
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const issues = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Query parameters validation failed",
            details: { issues },
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
