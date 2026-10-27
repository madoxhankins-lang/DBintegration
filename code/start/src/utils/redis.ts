import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6380',
});

redis.on('error', (err) => console.error('Redis Error:', err));
