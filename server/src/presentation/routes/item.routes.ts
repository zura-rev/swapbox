import { Router } from 'express';
import { itemController } from '../../container';
import { auth, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, (req, res) => itemController.list(req as any, res));
router.get('/saved', auth, (req, res) => itemController.getSaved(req as any, res));
router.get('/:id', optionalAuth, (req, res) => itemController.getOne(req as any, res));
router.post('/', auth, (req, res) => itemController.create(req as any, res));
router.put('/:id', auth, (req, res) => itemController.update(req as any, res));
router.delete('/:id', auth, (req, res) => itemController.remove(req as any, res));
router.post('/:id/save', auth, (req, res) => itemController.toggleSave(req as any, res));
router.post('/:id/complete', auth, (req, res) => itemController.complete(req as any, res));

export default router;
