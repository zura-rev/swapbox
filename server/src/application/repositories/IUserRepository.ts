export interface IUserRepository {
  search(q: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<any | null>;
  findByEmailOrUsername(email: string, username: string): Promise<any | null>;
  create(data: { email: string; password: string; username: string; displayName: string }): Promise<any>;
  update(id: string, data: Record<string, any>): Promise<any>;
  updateRating(id: string, rating: number, totalReviews: number): Promise<any>;
  findPublicProfile(id: string): Promise<any | null>;
}
