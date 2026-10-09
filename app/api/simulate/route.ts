import { readJson } from '../../../lib/request';
import { generateMiroFishSwarm } from '../../../lib/personas';
import { MiroFishSimulationEngine } from '../../../lib/graph-engine';
import { validateCopy } from '../../../lib/site';
export async function POST(request: Request) {
  try {
    const copy = validateCopy(await readJson(request, 20000));
    const { nodes, edges } = generateMiroFishSwarm(50);
    const engine = new MiroFishSimulationEngine(nodes, edges);
    return Response.json({ method: 'deterministic-heuristic', metrics: engine.evaluateCopy(copy), nodes, edges, messages: engine.messages }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Invalid page copy.' }, { status: 400 });
  }
}

