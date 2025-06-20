import { Router } from 'express';
import notificationRoutes from './notifications';
import participantRoutes from './participants';

const router = Router();

router.use('/notifications', notificationRoutes);
router.use('/participants', participantRoutes);

export default router;