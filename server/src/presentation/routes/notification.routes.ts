import { Router } from 'express';
import { notificationController } from '../../container';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', auth, (req, res) => notificationController.list(req as any, res));
router.patch('/read-all', auth, (req, res) => notificationController.markAllRead(req as any, res));
router.patch('/:id/read', auth, (req, res) => notificationController.markOneRead(req as any, res));
router.delete('/all', auth, (req, res) => notificationController.deleteAll(req as any, res));
router.delete('/:id', auth, (req, res) => notificationController.deleteOne(req as any, res));

export default router;
