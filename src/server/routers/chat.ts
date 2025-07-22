import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { getCustomModelProvider } from '@/lib/ai/models';

export const chatRouter = createTRPCRouter({
  getModels: publicProcedure.query(async () => {
    try {
      const provider = await getCustomModelProvider();
      return provider.modelsInfo;
    } catch (_err: any) {
      // Fallback: return static OpenAI-compatible models only
      return {
        error: "Failed to load dynamic models, fallback to static.",
        models: [],
      };
    }
  }),
});