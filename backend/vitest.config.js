import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/__tests__/**', 'src/utils/logger.js'],
    },
    // Set env vars before any module is imported so module-level process.env reads work
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-that-is-long-enough-for-hs256',
      JWT_ACCESS_EXPIRE: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret-also-long-enough',
      JWT_REFRESH_EXPIRE: '7d',
      REVENUECAT_WEBHOOK_SECRET: 'test-webhook-secret',
      ENCRYPTION_KEY: 'test-encryption-key-32-bytes!!!!!',
    },
  },
});
