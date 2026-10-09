// app/api/ai-analyze/route.ts
import { readJson } from '../../../lib/request';
import { evaluateCopyWithGemini } from '../../../lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await readJson(request, 65536) as {
      headline?: unknown;
      subhead?: unknown;
      pricing?: unknown;
      cta?: unknown;
      url?: unknown;
      apiKey?: unknown;
      manifest?: unknown;
    };

    if (!body || typeof body !== 'object' || typeof body.headline !== 'string' || !body.headline.trim()) {
      return Response.json({ error: 'Headline is required for AI evaluation.' }, { status: 400 });
    }

    const result = await evaluateCopyWithGemini({
      headline: body.headline.trim(),
      subhead: typeof body.subhead === 'string' ? body.subhead.trim() : '',
      pricing: typeof body.pricing === 'string' ? body.pricing.trim() : '',
      cta: typeof body.cta === 'string' ? body.cta.trim() : '',
      url: typeof body.url === 'string' ? body.url.trim() : '',
      manifest: body.manifest as any
    }, typeof body.apiKey === 'string' ? body.apiKey.trim() : undefined, request.signal);

    return Response.json(result);
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'AI analysis failed.'
    }, { status: 400 });
  }
}
