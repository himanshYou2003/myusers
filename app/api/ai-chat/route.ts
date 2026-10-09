// app/api/ai-chat/route.ts
import { readJson } from '../../../lib/request';
import { chatWithAIPersona } from '../../../lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await readJson(request, 65536) as {
      message?: unknown;
      persona?: { name?: unknown; role?: unknown; archetype?: unknown };
      site?: { headline?: unknown; subhead?: unknown; pricing?: unknown; cta?: unknown };
      apiKey?: unknown;
    };

    if (!body || typeof body !== 'object' || typeof body.message !== 'string' || !body.message.trim()) {
      return Response.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const persona = {
      name: typeof body.persona?.name === 'string' ? body.persona.name : 'Target Buyer',
      role: typeof body.persona?.role === 'string' ? body.persona.role : 'Evaluator',
      archetype: typeof body.persona?.archetype === 'string' ? body.persona.archetype : 'general',
      painPoint: typeof (body.persona as any)?.painPoint === 'string' ? (body.persona as any).painPoint : undefined,
      status: typeof (body.persona as any)?.status === 'string' ? (body.persona as any).status : undefined
    };

    const site = {
      headline: typeof body.site?.headline === 'string' ? body.site.headline : '',
      subhead: typeof body.site?.subhead === 'string' ? body.site.subhead : '',
      pricing: typeof body.site?.pricing === 'string' ? body.site.pricing : '',
      cta: typeof body.site?.cta === 'string' ? body.site.cta : '',
      manifest: (body.site as any)?.manifest
    };

    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : undefined;

    const answer = await chatWithAIPersona(body.message.trim(), persona, site, apiKey, request.signal);
    return Response.json({ answer });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Chat failed.'
    }, { status: 400 });
  }
}
