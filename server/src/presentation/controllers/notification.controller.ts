import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { GetNotificationsUseCase } from '../../application/use-cases/notification/GetNotificationsUseCase';
import type { MarkAllReadUseCase } from '../../application/use-cases/notification/MarkAllReadUseCase';
import type { MarkOneReadUseCase } from '../../application/use-cases/notification/MarkOneReadUseCase';
import type { DeleteNotificationUseCase } from '../../application/use-cases/notification/DeleteNotificationUseCase';

export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markAllReadUseCase: MarkAllReadUseCase,
    private readonly markOneReadUseCase: MarkOneReadUseCase,
    private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
  ) {}

  async list(req: AuthRequest, res: Response) {
    try {
      const notifications = await this.getNotificationsUseCase.execute(req.userId!);
      res.json(notifications);
    } catch {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async markAllRead(req: AuthRequest, res: Response) {
    try {
      await this.markAllReadUseCase.execute(req.userId!);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async markOneRead(req: AuthRequest, res: Response) {
    try {
      await this.markOneReadUseCase.execute(req.params.id as string, req.userId!);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async deleteOne(req: AuthRequest, res: Response) {
    try {
      await this.deleteNotificationUseCase.deleteOne(req.params.id as string, req.userId!);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async deleteAll(req: AuthRequest, res: Response) {
    try {
      await this.deleteNotificationUseCase.deleteAll(req.userId!);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }
}
