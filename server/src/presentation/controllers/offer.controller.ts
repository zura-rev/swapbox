import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { CreateOfferUseCase } from '../../application/use-cases/offer/CreateOfferUseCase';
import type { GetOffersUseCase } from '../../application/use-cases/offer/GetOffersUseCase';
import type { AcceptOfferUseCase } from '../../application/use-cases/offer/AcceptOfferUseCase';
import type { RejectOfferUseCase } from '../../application/use-cases/offer/RejectOfferUseCase';
import { CaptchaController } from './captcha.controller';

export class OfferController {
  constructor(
    private readonly createOfferUseCase: CreateOfferUseCase,
    private readonly getOffersUseCase: GetOffersUseCase,
    private readonly acceptOfferUseCase: AcceptOfferUseCase,
    private readonly rejectOfferUseCase: RejectOfferUseCase,
    private readonly captchaController: CaptchaController,
  ) {}

  async create(req: AuthRequest, res: Response) {
    try {
      const { itemId, message, captchaId, captchaAnswer, images } = req.body;
      if (!itemId) return res.status(400).json({ error: 'itemId საჭიროა' });
      if (req.body._hp) return res.status(400).json({ error: 'invalid' });
      if (!captchaId || !captchaAnswer) return res.status(400).json({ error: 'captcha საჭიროა' });
      if (!this.captchaController.validate(captchaId, captchaAnswer)) {
        return res.status(400).json({ error: 'captcha არასწორია' });
      }

      const offer = await this.createOfferUseCase.execute(req.userId!, itemId, message, images);
      res.status(201).json(offer);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  async accept(req: AuthRequest, res: Response) {
    try {
      const offer = await this.acceptOfferUseCase.execute(req.params.id as string, req.userId!);
      res.json(offer);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  async reject(req: AuthRequest, res: Response) {
    try {
      const offer = await this.rejectOfferUseCase.execute(req.params.id as string, req.userId!);
      res.json(offer);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  async listReceived(req: AuthRequest, res: Response) {
    try {
      const offers = await this.getOffersUseCase.listReceived(req.userId!);
      res.json(offers);
    } catch (err: any) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async listSent(req: AuthRequest, res: Response) {
    try {
      const offers = await this.getOffersUseCase.listSent(req.userId!);
      res.json(offers);
    } catch (err: any) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }
}
