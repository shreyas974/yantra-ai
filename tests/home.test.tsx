import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const { config, stats } = vi.hoisted(() => ({ config: vi.fn(), stats: vi.fn() }));
vi.mock('@/lib/event-config', () => ({ getEventConfigMap: config, getPublicStats: stats }));
import Home from '@/app/page';
describe('Public event content', () => {
    it('renders actual returned counts and preserves unannounced details', async () => { config.mockResolvedValue({ tracks: '[]', sponsors: '[]', faqs: '[]', min_team_size: '2', max_team_size: '5' }); stats.mockResolvedValue({ participants: 17, teams: 3 }); const html = renderToStaticMarkup(await Home()); expect(html).toContain('YANTRA'); expect(html).not.toContain('CHAD'); expect(html).toContain('17'); expect(html).toContain('Verified participants'); expect(html).toContain('Problem statements will be announced soon. Stay tuned!'); expect(html).toContain('To be announced'); expect(html).toContain('Official competition tracks are not yet finalized'); });
    it('shows unavailable counts without fabricating zero statistics', async () => { config.mockRejectedValue(Error('Database unavailable')); stats.mockRejectedValue(Error('Database unavailable')); const html = renderToStaticMarkup(await Home()); expect(html).toContain('Live count unavailable'); expect(html).not.toContain('<strong>0</strong>'); });
});
