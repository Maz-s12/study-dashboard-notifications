import { Router } from 'express';
import interestedRoutes from './interested';
import notificationRoutes from './notifications';
import sendBookingRoutes from './sendbooking';

const router = Router();

router.use('/interested', interestedRoutes);
router.use('/notifications', notificationRoutes);
router.use('/sendbooking', sendBookingRoutes);

export default router;