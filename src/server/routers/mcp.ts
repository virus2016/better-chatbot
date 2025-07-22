import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { mcpClientsManager } from '@/lib/ai/mcp/mcp-manager';
import { selectMcpClientAction } from '@/app/api/mcp/actions';

export const mcpRouter = createTRPCRouter({
  getList: publicProcedure.query(async () => {
    const list = await mcpClientsManager.getClients();
    const result = list.map(({ client, id }) => {
      return {
        ...client.getInfo(),
        id,
      };
    });
    return result;
  }),

  getClient: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return selectMcpClientAction(input.id);
    }),
});