import { createTRPCRouter, publicProcedure } from '../trpc';
import { getSession } from '@/lib/auth/server';
import { workflowRepository } from '@/lib/db/repository';

export const workflowRouter = createTRPCRouter({
  getTools: publicProcedure.query(async () => {
    const session = await getSession();
    const workflows = await workflowRepository.selectExecuteAbility(
      session.user.id,
    );
    return workflows;
  }),
});