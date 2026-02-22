import { LRUCache } from '@/lib/utils';

interface IdempotencyEntry<T> {
  status: number;
  payload: T;
}

const store = new LRUCache<IdempotencyEntry<unknown>>(512, 900);

export function getIdempotentResponse<T>(key: string): IdempotencyEntry<T> | null {
  return store.get(key) as IdempotencyEntry<T> | null;
}

export function setIdempotentResponse<T>(key: string, entry: IdempotencyEntry<T>): void {
  store.set(key, entry);
}
