import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      // Test-only secrets — never used in production
      JWT_SECRET: 'vitest-test-secret-not-for-production',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/Replaysafe_test',
      NODE_ENV: 'test',
    },
  },
})
