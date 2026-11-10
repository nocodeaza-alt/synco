import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
import path from 'path'

// Load .env.local so Supabase keys are available during tests
config({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  test: {
    // Run tests sequentially to avoid RLS race conditions on shared DB rows
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 30_000,     // Supabase round-trips can take a few seconds
    hookTimeout: 20_000,
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    reporters: ['verbose'],
    // Env vars are loaded above via dotenv; list critical ones here so
    // Vitest surfaces a clear error if .env.local is missing
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
