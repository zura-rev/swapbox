import sharp from 'sharp';
import { randomUUID } from 'crypto';
import type { IUserRepository } from '../../application/repositories/IUserRepository';
import type { IStorageProvider } from '../storage/IStorageProvider';

export class UploadService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly storage: IStorageProvider,
  ) {}

  async processItemImage(buffer: Buffer, sortOrder: number, isPrimary: boolean) {
    const processed = await sharp(buffer)
      .resize(800, 600, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const result = await this.storage.upload(processed, {
      folder: 'swapbox/items',
      publicId: randomUUID(),
    });

    // filename stores publicId so it can be used for deletion later
    return { url: result.url, filename: result.publicId, sortOrder, isPrimary };
  }

  async processAvatar(buffer: Buffer, userId: string) {
    const processed = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const result = await this.storage.upload(processed, {
      folder: 'swapbox/avatars',
      publicId: `avatar-${userId}`,
    });

    await this.userRepo.update(userId, { avatarUrl: result.url });
    return { url: result.url };
  }
}
