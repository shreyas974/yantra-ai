import { afterEach, expect, it, vi } from 'vitest';
import { emailDeliveryConfigured } from '@/lib/email';

afterEach(() => vi.unstubAllEnvs());

it('allows local file transport during development', () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('EMAIL_MODE', 'file');
  expect(emailDeliveryConfigured()).toBe(true);
});

it('requires a configured sending service in production', () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('EMAIL_MODE', 'file');
  expect(emailDeliveryConfigured()).toBe(false);
  vi.stubEnv('EMAIL_MODE', 'resend');
  vi.stubEnv('RESEND_API_KEY', '');
  vi.stubEnv('EMAIL_FROM', '');
  expect(emailDeliveryConfigured()).toBe(false);
  vi.stubEnv('RESEND_API_KEY', 'test-provider-key');
  vi.stubEnv('EMAIL_FROM', 'YANTRA <event@example.invalid>');
  expect(emailDeliveryConfigured()).toBe(true);
});
