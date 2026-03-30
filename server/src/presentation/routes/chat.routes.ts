import { Router } from 'express';
import { chatController } from '../../container';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', auth, (req, res) => chatController.list(req as any, res));
router.get('/blocked', auth, (req, res) => chatController.listBlocked(req as any, res));
router.get('/blocked/:userId', auth, (req, res) => chatController.isBlocked(req as any, res));
router.get('/:id/messages', auth, (req, res) => chatController.getMessages(req as any, res));
router.post('/', auth, (req, res) => chatController.getOrCreate(req as any, res));
router.post('/:id/messages', auth, (req, res) => chatController.sendMessage(req as any, res));
router.delete('/:id/messages/:msgId', auth, (req, res) => chatController.deleteMessage(req as any, res));
router.patch('/:id/messages/:msgId', auth, (req, res) => chatController.editMessage(req as any, res));
router.post('/block/:userId', auth, (req, res) => chatController.blockUser(req as any, res));
router.delete('/block/:userId', auth, (req, res) => chatController.unblockUser(req as any, res));

export default router;
