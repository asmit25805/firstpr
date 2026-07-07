import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.status >= 500) console.error('[server error]', err.message);
    res.status(err.status).json({ error: err.publicMessage });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('[unhandled error]', message);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}
