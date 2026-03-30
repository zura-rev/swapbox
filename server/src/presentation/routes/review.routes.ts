import { Router } from 'express';
import { reviewController } from '../../container';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', auth, (req, res) => reviewController.create(req as any, res));
router.get('/user/:id', (req, res) => reviewController.getUserReviews(req, res));

export default router;
