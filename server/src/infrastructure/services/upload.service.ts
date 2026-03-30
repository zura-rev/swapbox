import sharp from 'sharp';
import path from 'path';
import { randomUUID } from 'crypto';
import type { IUserRepository } from '../../application/repositories/IUserRepository';

export class UploadService {
  constructor(private readonly userRepo: IUserRepository) {}

  async processItemImage(buffer: Buffer, sortOrder: number, isPrimary: boolean) {
    const filename = `${randomUUID()}.webp`;
    const filepath = path.join(__dirname, '../../../uploads', filename);

    await sharp(buffer)
      .resize(800, 600, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    return { url: `/uploads/${filename}`, filename, sortOrder, isPrimary };
  }

  async processAvatar(buffer: Buffer, userId: string) {
    const filename = `avatar-${userId}.webp`;
    const filepath = path.join(__dirname, '../../../uploads', filename);

    await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(filepath);

    await this.userRepo.update(userId, { avatarUrl: `/uploads/${filename}` });
    return { url: `/uploads/${filename}` };
  }
}
