import { Router } from 'express';
import { authController } from '../../container';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', auth, (req, res) => authController.logout(req as any, res));
router.get('/me', auth, (req, res) => authController.me(req as any, res));

export default router;
