import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

/**
 * Middleware factory for request body validation using Zod
 * @param schema - Zod schema to validate against
 */
export function validateBody<T>(schema: ZodSchema<T>): (req: Request, _res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new BadRequestError(`Validation error: ${messages}`));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Middleware factory for request query validation using Zod
 * @param schema - Zod schema to validate against
 */
export function validateQuery<T>(schema: ZodSchema<T>): (req: Request, _res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result as Record<string, unknown>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new BadRequestError(`Query validation error: ${messages}`));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Middleware factory for request params validation using Zod
 * @param schema - Zod schema to validate against
 */
export function validateParams<T>(schema: ZodSchema<T>): (req: Request, _res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params);
      req.params = result as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new BadRequestError(`Params validation error: ${messages}`));
      } else {
        next(error);
      }
    }
  };
}
