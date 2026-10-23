import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Catch-all for unmatched routes so the client always gets a structured 404. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
};

const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));

/**
 * Translates every failure into a consistent response shape:
 * `{ success: false, error: { code, message, details? } }`.
 * Unexpected errors never expose stack traces or driver internals.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    const body: ErrorResponseBody = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    if (err.details !== undefined) {
      body.error.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The submitted data is invalid',
        details: formatZodError(err),
      },
    } satisfies ErrorResponseBody);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 -> unique constraint, P2025 -> record required but not found.
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? (err.meta?.target as string[]).join(', ') : 'value';
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RECORD',
          message: `A record with this ${target} already exists`,
        },
      } satisfies ErrorResponseBody);
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      } satisfies ErrorResponseBody);
      return;
    }
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Request body is not valid JSON' },
    } satisfies ErrorResponseBody);
    return;
  }

  if (!env.isTest) {
    // Full detail stays in the server logs, never in the response.
    console.error('[unhandled-error]', err);
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong. Please try again.',
    },
  } satisfies ErrorResponseBody);
};
