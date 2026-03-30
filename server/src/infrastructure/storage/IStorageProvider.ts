export interface StorageUploadOptions {
  folder: string;
  publicId?: string;
}

export interface StorageUploadResult {
  url: string;
  publicId: string;
}

export interface IStorageProvider {
  upload(buffer: Buffer, options: StorageUploadOptions): Promise<StorageUploadResult>;
  delete(publicId: string): Promise<void>;
}
