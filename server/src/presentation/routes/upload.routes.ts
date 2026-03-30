import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../../container';
import { auth } from '../middleware/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

const router = Router();

router.post('/item-image', auth, upload.single('image'), (req, res) => uploadController.uploadItemImage(req as any, res));
router.post('/avatar', auth, upload.single('avatar'), (req, res) => uploadController.uploadAvatar(req as any, res));

export default router;
