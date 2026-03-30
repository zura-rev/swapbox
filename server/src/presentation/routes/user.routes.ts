import { Router } from 'express';
import { userController } from '../../container';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.put('/me', auth, (req, res) => userController.updateProfile(req as any, res));
router.get('/search', (req, res) => userController.search(req, res));
router.get('/:id', (req, res) => userController.getProfile(req, res));

export default router;
