export interface Repository<T> {
  findAll(): Promise<T[]>;
  findOne(item: { id: string }): Promise<T | null>;
  add(item: Partial<T>): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T | null>;
  remove(item: { id: string }): Promise<boolean>;
}