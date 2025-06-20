import { Router } from 'express';
import notificationRoutes from './notifications';
import sendBookingRoutes from './sendbooking';

const router = Router();

router.use('/notifications', notificationRoutes);
router.use('/sendbooking', sendBookingRoutes);

export default router;