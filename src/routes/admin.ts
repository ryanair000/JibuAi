import { Router } from 'express';

import { getAdminResource } from '../controllers/adminController';

export const adminRouter = Router();

adminRouter.get('/:resource', getAdminResource);
