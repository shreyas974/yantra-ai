import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({ test: { environment: 'node', include: ['tests/integration/**/*.test.ts'], fileParallelism: false, hookTimeout: 30000, testTimeout: 30000 }, resolve: { alias: { '@': path.resolve(__dirname, '.') } } });
