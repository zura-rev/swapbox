import { Router } from 'express';
import { captchaController } from '../../container';

const router = Router();

router.get('/', (req, res) => captchaController.generate(req, res));

export default router;
