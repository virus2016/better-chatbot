import { createTRPCRouter } from './trpc';
import { chatRouter } from './routers/chat';
import { mcpRouter } from './routers/mcp';
import { workflowRouter } from './routers/workflow';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chat: chatRouter,
  mcp: mcpRouter,
  workflow: workflowRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;