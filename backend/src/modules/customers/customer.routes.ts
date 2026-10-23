import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  addFollowUpController,
  createCustomerController,
  getCustomerController,
  listCustomersController,
  listFollowUpsController,
  updateCustomerController,
} from './customer.controller';
import {
  createCustomerSchema,
  createFollowUpSchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  listFollowUpsQuerySchema,
  updateCustomerSchema,
} from './customer.schema';

export const customerRouter = Router();

// Every customer route requires a signed-in user.
customerRouter.use(authenticate);

/** GET /api/customers — paginated list with search and status/type filters. */
customerRouter.get(
  '/',
  authorize('customer:read'),
  validate({ query: listCustomersQuerySchema }),
  listCustomersController,
);

/** POST /api/customers — register a new customer or lead. */
customerRouter.post(
  '/',
  authorize('customer:write'),
  validate({ body: createCustomerSchema }),
  createCustomerController,
);

/** GET /api/customers/:id — full detail with recent follow-ups and challans. */
customerRouter.get(
  '/:id',
  authorize('customer:read'),
  validate({ params: customerIdParamSchema }),
  getCustomerController,
);

/** PATCH /api/customers/:id — partial update of an existing customer. */
customerRouter.patch(
  '/:id',
  authorize('customer:write'),
  validate({ params: customerIdParamSchema, body: updateCustomerSchema }),
  updateCustomerController,
);

/** GET /api/customers/:id/follow-ups — paginated follow-up history. */
customerRouter.get(
  '/:id/follow-ups',
  authorize('customer:read'),
  validate({ params: customerIdParamSchema, query: listFollowUpsQuerySchema }),
  listFollowUpsController,
);

/** POST /api/customers/:id/follow-ups — log a follow-up note. */
customerRouter.post(
  '/:id/follow-ups',
  authorize('followup:write'),
  validate({ params: customerIdParamSchema, body: createFollowUpSchema }),
  addFollowUpController,
);
