// app/api/pagespeed/route.ts
import { readJson } from '../../../lib/request';
import { fetchRealPageSpeedMetrics } from '../../../lib/pagespeed';
import { parsePublicUrl } from '../../../lib/scraper';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await readJson(request, 4096) as { url?: unknown; apiKey?: unknown };
    if (!body || typeof body !== 'object' || typeof body.url !== 'string' || !body.url.trim()) {
      return Response.json({ error: 'Provide a valid website URL.' }, { status: 400 });
    }

    const publicUrl = parsePublicUrl(body.url.trim());
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : undefined;

    const metrics = await fetchRealPageSpeedMetrics(publicUrl.href, apiKey, request.signal);
    return Response.json(metrics, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Unable to query PageSpeed metrics.'
    }, { status: 400 });
  }
}
