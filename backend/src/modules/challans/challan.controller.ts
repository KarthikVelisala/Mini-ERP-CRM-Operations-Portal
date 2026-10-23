import { requireUser } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/http';
import type {
  CancelChallanInput,
  CreateChallanInput,
  ListChallansQuery,
  UpdateChallanInput,
} from './challan.schema';
import * as challanService from './challan.service';

export const listChallansController = asyncHandler(async (req, res) => {
  const { items, meta } = await challanService.listChallans(
    req.query as unknown as ListChallansQuery,
  );
  sendSuccess(res, items, 200, meta);
});

export const challanSummaryController = asyncHandler(async (_req, res) => {
  sendSuccess(res, await challanService.getChallanSummary());
});

export const getChallanController = asyncHandler(async (req, res) => {
  sendSuccess(res, await challanService.getChallanById(req.params.id));
});

export const createChallanController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const challan = await challanService.createChallan(req.body as CreateChallanInput, user.id);
  sendCreated(res, challan);
});

export const updateChallanController = asyncHandler(async (req, res) => {
  const challan = await challanService.updateChallan(req.params.id, req.body as UpdateChallanInput);
  sendSuccess(res, challan);
});

export const confirmChallanController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  sendSuccess(res, await challanService.confirmChallan(req.params.id, user.id));
});

export const cancelChallanController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const challan = await challanService.cancelChallan(
    req.params.id,
    (req.body ?? {}) as CancelChallanInput,
    user.id,
  );
  sendSuccess(res, challan);
});
