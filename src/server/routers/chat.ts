import { z } from 'zod';
import { observable } from '@trpc/server/observable';
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

  // Example subscription for real-time chat updates
  onChatUpdate: publicProcedure
    .input(z.object({ threadId: z.string() }))
    .subscription(({ input }) => {
      return observable<{ threadId: string; message: string; timestamp: Date }>((emit) => {
        // This is a placeholder implementation
        // In a real app, you'd listen to actual chat events
        const interval = setInterval(() => {
          emit.next({
            threadId: input.threadId,
            message: `Update for thread ${input.threadId}`,
            timestamp: new Date(),
          });
        }, 5000);

        // Return cleanup function
        return () => {
          clearInterval(interval);
        };
      });
    }),
});