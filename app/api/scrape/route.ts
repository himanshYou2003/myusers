import { readJson } from '../../../lib/request';
import { scrapeWebsite } from '../../../lib/scraper';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const body = await readJson(request, 4096) as { url?: unknown };
    if (!body || typeof body !== 'object') throw new Error('Provide a website URL.');
    if (typeof body.url !== 'string' || !body.url.trim() || body.url.length > 2048) return Response.json({ error: 'Enter a website URL.' }, { status: 400 });
    return Response.json(await scrapeWebsite(body.url.trim(), request.signal), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to extract this website.' }, { status: 400 });
  }
}

