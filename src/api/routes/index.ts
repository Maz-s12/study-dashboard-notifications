import { Router } from 'express';
import notificationRoutes from './notifications';
import participantRoutes from './participants';
import settingsRoutes from './settings';

const router = Router();

router.use('/notifications', notificationRoutes);
router.use('/participants', participantRoutes);
router.use('/settings', settingsRoutes);

export default router;