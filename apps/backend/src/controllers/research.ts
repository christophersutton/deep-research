import { Hono } from 'hono/quick';
import { z } from 'zod';
import { ResearchService } from '../services/research';

const router = new Hono();

const researchSchema = z.object({
  query: z.string(),
  breadth: z.number().int().min(1).max(10).default(4),
  depth: z.number().int().min(1).max(5).default(2),
});

router.post('/research', async (c) => {
  const data = await c.req.json();
  const result = researchSchema.safeParse(data);
  
  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  const { query, breadth, depth } = result.data;

  // Generate feedback questions
  const followUpQuestions = await ResearchService.generateFeedback({
    query,
    numQuestions: 3,
  });

  // Start research
  const { learnings, visitedUrls } = await ResearchService.deepResearch({
    query,
    breadth,
    depth,
    onProgress: (progress) => {
      // TODO: Implement progress updates via WebSocket or SSE
      console.log('Research Progress:', progress);
    },
  });

  // Generate final report
  const report = await ResearchService.writeFinalReport({
    prompt: query,
    learnings,
    visitedUrls,
  });

  return c.json({
    followUpQuestions,
    report,
    learnings,
    visitedUrls,
  });
});

export default router; 