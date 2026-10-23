import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  cancelChallanController,
  challanSummaryController,
  confirmChallanController,
  createChallanController,
  getChallanController,
  listChallansController,
  updateChallanController,
} from './challan.controller';
import {
  cancelChallanSchema,
  challanIdParamSchema,
  createChallanSchema,
  listChallansQuerySchema,
  updateChallanSchema,
} from './challan.schema';

export const challanRouter = Router();

challanRouter.use(authenticate);

/** GET /api/challans — paginated list with status, customer, date and text filters. */
challanRouter.get(
  '/',
  authorize('challan:read'),
  validate({ query: listChallansQuerySchema }),
  listChallansController,
);

/** GET /api/challans/summary — counts and value by status. */
challanRouter.get('/summary', authorize('challan:read'), challanSummaryController);

/** POST /api/challans — create as draft, or confirm and dispatch immediately. */
challanRouter.post(
  '/',
  authorize('challan:write'),
  validate({ body: createChallanSchema }),
  createChallanController,
);

/** GET /api/challans/:id — full challan with snapshotted lines and stock movements. */
challanRouter.get(
  '/:id',
  authorize('challan:read'),
  validate({ params: challanIdParamSchema }),
  getChallanController,
);

/** PATCH /api/challans/:id — edit a draft challan. */
challanRouter.patch(
  '/:id',
  authorize('challan:write'),
  validate({ params: challanIdParamSchema, body: updateChallanSchema }),
  updateChallanController,
);

/** POST /api/challans/:id/confirm — confirm the challan and reduce stock. */
challanRouter.post(
  '/:id/confirm',
  authorize('challan:confirm'),
  validate({ params: challanIdParamSchema }),
  confirmChallanController,
);

/** POST /api/challans/:id/cancel — cancel, returning dispatched stock if confirmed. */
challanRouter.post(
  '/:id/cancel',
  authorize('challan:cancel'),
  validate({ params: challanIdParamSchema, body: cancelChallanSchema }),
  cancelChallanController,
);
