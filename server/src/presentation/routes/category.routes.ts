import { Router } from 'express';
import { categoryController } from '../../container';

const router = Router();

router.get('/', (req, res) => categoryController.list(req, res));

export default router;
