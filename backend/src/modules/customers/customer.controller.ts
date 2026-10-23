import { requireUser } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/http';
import type { PaginationQuery } from '../../utils/pagination';
import type {
  CreateCustomerInput,
  CreateFollowUpInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from './customer.schema';
import * as customerService from './customer.service';

export const listCustomersController = asyncHandler(async (req, res) => {
  const { items, meta } = await customerService.listCustomers(
    req.query as unknown as ListCustomersQuery,
  );
  sendSuccess(res, items, 200, meta);
});

export const getCustomerController = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  sendSuccess(res, customer);
});

export const createCustomerController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const customer = await customerService.createCustomer(req.body as CreateCustomerInput, user.id);
  sendCreated(res, customer);
});

export const updateCustomerController = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(
    req.params.id,
    req.body as UpdateCustomerInput,
  );
  sendSuccess(res, customer);
});

export const listFollowUpsController = asyncHandler(async (req, res) => {
  const { items, meta } = await customerService.listFollowUps(
    req.params.id,
    req.query as unknown as PaginationQuery,
  );
  sendSuccess(res, items, 200, meta);
});

export const addFollowUpController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const followUp = await customerService.addFollowUp(
    req.params.id,
    req.body as CreateFollowUpInput,
    user.id,
  );
  sendCreated(res, followUp);
});
