import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/http';
import { dashboardQuerySchema, type DashboardQuery } from './dashboard.schema';
import { getDashboard } from './dashboard.service';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

/**
 * GET /api/dashboard — the whole operations overview in one payload.
 * Every authenticated role may view it; the figures are read-only.
 */
dashboardRouter.get(
  '/',
  validate({ query: dashboardQuerySchema }),
  asyncHandler(async (req, res) => {
    sendSuccess(res, await getDashboard(req.query as unknown as DashboardQuery));
  }),
);
