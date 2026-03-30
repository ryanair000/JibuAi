import { Router } from 'express';

import { getAdminResource, patchAdminConversation } from '../controllers/adminController';

export const adminRouter = Router();

adminRouter.patch('/conversations', patchAdminConversation);
adminRouter.get('/:resource', getAdminResource);
