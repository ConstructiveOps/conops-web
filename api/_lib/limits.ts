// Counters for the rate limits and caps. Serverless functions keep no memory
// between requests and run as many copies, so the counts live in Upstash Redis
// (Vercel Marketplace). Visitors are identified only by a scrambled code made
// from their address, a secret salt and today's date; it changes every day and
// every counter deletes itself within 24 hours. No message text is stored.
//
// Without Redis settings (a developer's machine) an in-memory counter is used.

import { createHash } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { env } from './config.js';

export interface Counter {
  /** Adds one and returns the new count. The key expires ttlSeconds after it is first created. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  /** Sets the key if it does not exist yet. True the first time only. */
  setOnce(key: string, ttlSeconds: number): Promise<boolean>;
  /** True when counts are shared by every copy of the function (Redis). */
  readonly shared: boolean;
}

class RedisCounter implements Counter {
  readonly shared = true;
  constructor(private redis: Redis) {}
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const p = this.redis.pipeline();
    p.set(key, 0, { nx: true, ex: ttlSeconds });
    p.incr(key);
    const [, n] = await p.exec<[unknown, number]>();
    return n;
  }
  async setOnce(key: string, ttlSeconds: number): Promise<boolean> {
    return (await this.redis.set(key, 1, { nx: true, ex: ttlSeconds })) === 'OK';
  }
}

export class MemoryCounter implements Counter {
  readonly shared = false;
  private store = new Map<string, { n: number; until: number }>();
  constructor(private now: () => number = Date.now) {}
  private live(key: string) {
    const e = this.store.get(key);
    if (e && e.until > this.now()) return e;
    this.store.delete(key);
    return undefined;
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const e = this.live(key) ?? { n: 0, until: this.now() + ttlSeconds * 1000 };
    e.n += 1;
    this.store.set(key, e);
    return e.n;
  }
  async setOnce(key: string, ttlSeconds: number): Promise<boolean> {
    if (this.live(key)) return false;
    this.store.set(key, { n: 1, until: this.now() + ttlSeconds * 1000 });
    return true;
  }
}

let cached: Counter | undefined;

/** Redis when configured (Vercel adds KV_REST_API_* when the store is connected), else in-memory. */
export function getCounter(): Counter {
  if (cached) return cached;
  const url = env('KV_REST_API_URL') ?? env('UPSTASH_REDIS_REST_URL');
  const token = env('KV_REST_API_TOKEN') ?? env('UPSTASH_REDIS_REST_TOKEN');
  cached = url && token ? new RedisCounter(new Redis({ url, token })) : new MemoryCounter();
  return cached;
}

/** For tests. */
export function setCounter(c: Counter | undefined): void {
  cached = c;
}

export function today(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Scrambled, salted visitor code that changes daily. The address itself is never stored. */
export function visitorId(ip: string, now = new Date()): string {
  const salt = env('RATE_LIMIT_SALT') ?? 'conops-web-local-salt';
  return createHash('sha256').update(`${salt}|${today(now)}|${ip}`).digest('hex').slice(0, 32);
}

export const LIMITS = {
  contactPerHour: 5,
  contactPerDay: 10,
  chatPerConversation: 12,
  chatPerVisitorPerDay: 40,
  chatSiteWidePerDay: 1000,
  chatMessageChars: 1000,
} as const;

const HOUR = 3600;
const DAY = 86400;

/** Counts one contact-form submission; returns false when over the limit. */
export async function allowContact(counter: Counter, vid: string): Promise<boolean> {
  const hour = await counter.incr(`contact:h:${vid}`, HOUR);
  const day = await counter.incr(`contact:d:${vid}`, DAY);
  return hour <= LIMITS.contactPerHour && day <= LIMITS.contactPerDay;
}

export type ChatLimit = 'conversation' | 'daily' | 'site';

/** Counts one chat message; returns which cap was hit, or null when allowed. */
export async function chatLimitHit(counter: Counter, vid: string, conversationId: string, now = new Date()): Promise<ChatLimit | null> {
  const site = await counter.incr(`chat:site:${today(now)}`, 2 * DAY);
  if (site > LIMITS.chatSiteWidePerDay) return 'site';
  const daily = await counter.incr(`chat:d:${vid}`, DAY);
  if (daily > LIMITS.chatPerVisitorPerDay) return 'daily';
  const conv = await counter.incr(`chat:conv:${conversationId}`, DAY);
  if (conv > LIMITS.chatPerConversation) return 'conversation';
  return null;
}

/** At most one lead per chat conversation. */
export function claimChatLead(counter: Counter, conversationId: string): Promise<boolean> {
  return counter.setOnce(`chat:lead:${conversationId}`, DAY);
}
