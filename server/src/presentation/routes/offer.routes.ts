import { Router } from 'express';
import { offerController } from '../../container';
import { auth } from '../middleware/auth.middleware';
import { offerLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.get('/received', auth, (req, res) => offerController.listReceived(req as any, res));
router.get('/sent', auth, (req, res) => offerController.listSent(req as any, res));
router.post('/', auth, offerLimiter, (req, res) => offerController.create(req as any, res));
router.post('/:id/accept', auth, (req, res) => offerController.accept(req as any, res));
router.post('/:id/reject', auth, (req, res) => offerController.reject(req as any, res));

export default router;
