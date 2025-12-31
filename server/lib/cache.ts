/**
 * Cache Layer with TTL and Optional File Persistence
 * 
 * Uses in-memory LRU-style cache with optional JSON file persistence
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheConfig {
  ttlMs: number;
  maxSize: number;
  persistencePath?: string;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttlMs: 6 * 60 * 60 * 1000, // 6 hours
  maxSize: 500,
  persistencePath: path.resolve(process.cwd(), '.cache', 'igmetryx-cache.json'),
};

class Cache<T> {
  private store: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = new Map();
    this.loadFromDisk();
  }

  /**
   * Generate cache key from data
   */
  static generateKey(...parts: (string | number | undefined)[]): string {
    const keyString = parts
      .filter(Boolean)
      .map(p => String(p).trim().toLowerCase())
      .join('|');
    return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 32);
  }

  /**
   * Get entry from cache
   */
  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set entry in cache
   */
  set(key: string, data: T): void {
    // Clean expired entries if cache is getting large
    if (this.store.size >= this.config.maxSize) {
      this.cleanExpired();
      // If still too large, remove oldest entries
      if (this.store.size >= this.config.maxSize) {
        const entries = Array.from(this.store.entries())
          .sort((a, b) => a[1].createdAt - b[1].createdAt);
        const toRemove = entries.slice(0, Math.floor(this.config.maxSize * 0.2)); // Remove 20%
        toRemove.forEach(([k]) => this.store.delete(k));
      }
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + this.config.ttlMs,
      createdAt: Date.now(),
    });

    this.saveToDisk();
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete entry
   */
  delete(key: string): void {
    this.store.delete(key);
    this.saveToDisk();
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
    this.saveToDisk();
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.store.values());
    const valid = entries.filter(e => now <= e.expiresAt);
    const expired = entries.filter(e => now > e.expiresAt);

    return {
      total: this.store.size,
      valid: valid.length,
      expired: expired.length,
    };
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Save cache to disk
   */
  private saveToDisk(): void {
    if (!this.config.persistencePath) {
      return;
    }

    try {
      const dir = path.dirname(this.config.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Array.from(this.store.entries()).map(([key, entry]) => ({
        key,
        data: entry.data,
        expiresAt: entry.expiresAt,
        createdAt: entry.createdAt,
      }));

      fs.writeFileSync(this.config.persistencePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.warn('[Cache] Failed to save to disk:', error);
    }
  }

  /**
   * Load cache from disk
   */
  private loadFromDisk(): void {
    if (!this.config.persistencePath || !fs.existsSync(this.config.persistencePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.config.persistencePath, 'utf8');
      const data = JSON.parse(content) as Array<{
        key: string;
        data: T;
        expiresAt: number;
        createdAt: number;
      }>;

      const now = Date.now();
      let loaded = 0;

      for (const item of data) {
        // Only load non-expired entries
        if (item.expiresAt > now) {
          this.store.set(item.key, {
            data: item.data,
            expiresAt: item.expiresAt,
            createdAt: item.createdAt,
          });
          loaded++;
        }
      }

      if (loaded > 0) {
        console.log(`[Cache] Loaded ${loaded} entries from disk`);
      }
    } catch (error) {
      console.warn('[Cache] Failed to load from disk:', error);
    }
  }
}

export { Cache, CacheConfig };

