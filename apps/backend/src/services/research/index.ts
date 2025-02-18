import { deepResearch, writeFinalReport, type ResearchProgress } from './deep-research';
import { generateFeedback } from './feedback';

export type { ResearchProgress };

export const ResearchService = {
  deepResearch,
  writeFinalReport,
  generateFeedback,
}; 