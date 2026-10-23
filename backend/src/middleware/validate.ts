import type { RequestHandler } from 'express';
import { ZodError, type AnyZodObject, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

const formatIssues = (error: ZodError, source: string) =>
  error.issues.map((issue) => ({
    source,
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));

/**
 * Validates and *replaces* the request body/query/params with the parsed data,
 * so controllers receive fully typed, coerced and trimmed values.
 */
export const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (req, _res, next) => {
    const issues: ReturnType<typeof formatIssues> = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) {
        req.params = result.data as typeof req.params;
      } else {
        issues.push(...formatIssues(result.error, 'params'));
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) {
        // Express 5 exposes `query` as a getter; assign defensively.
        Object.defineProperty(req, 'query', { value: result.data, writable: true });
      } else {
        issues.push(...formatIssues(result.error, 'query'));
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) {
        req.body = result.data;
      } else {
        issues.push(...formatIssues(result.error, 'body'));
      }
    }

    if (issues.length > 0) {
      next(ApiError.validation('The submitted data is invalid', issues));
      return;
    }

    next();
  };
};
