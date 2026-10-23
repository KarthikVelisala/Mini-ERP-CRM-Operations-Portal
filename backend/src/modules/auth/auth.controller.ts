import { requireUser } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/http';
import type { LoginInput } from './auth.schema';
import * as authService from './auth.service';

export const loginController = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body as LoginInput);
  sendSuccess(res, result);
});

export const meController = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const user = await authService.getProfile(id);
  sendSuccess(res, { user });
});
