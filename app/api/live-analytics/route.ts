// app/api/live-analytics/route.ts
import { readJson } from '../../../lib/request';
import { fetchPostHogAnalytics } from '../../../lib/live-analytics';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await readJson(request, 4096) as {
      host?: unknown;
      projectId?: unknown;
      apiKey?: unknown;
    };

    const apiKey = (typeof body?.apiKey === 'string' && body.apiKey.trim()) || process.env.POSTHOG_API_KEY || '';
    const projectId = (typeof body?.projectId === 'string' && body.projectId.trim()) || process.env.POSTHOG_PROJECT_ID || '';
    const host = (typeof body?.host === 'string' && body.host.trim()) || process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!apiKey) {
      return Response.json({ error: 'PostHog API key is required. Add it in Settings or .env.local.' }, { status: 400 });
    }

    if (!projectId) {
      return Response.json({ error: 'PostHog Project ID is required. Add it in Settings or .env.local.' }, { status: 400 });
    }

    const analytics = await fetchPostHogAnalytics(host, projectId, apiKey, request.signal);
    return Response.json(analytics);
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to query live analytics.'
    }, { status: 400 });
  }
}
