import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { loginController, meController } from './auth.controller';
import { loginSchema } from './auth.schema';

export const authRouter = Router();

/** POST /api/auth/login — exchange credentials for a JWT access token. */
authRouter.post('/login', validate({ body: loginSchema }), loginController);

/** GET /api/auth/me — profile of the currently authenticated user. */
authRouter.get('/me', authenticate, meController);
