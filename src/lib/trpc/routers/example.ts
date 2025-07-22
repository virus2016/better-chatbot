import { z } from "zod";
import { procedure, router } from "../trpc";

export const exampleRouter = router({
  hello: procedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `Hello ${opts.input.text}!`,
      };
    }),

  getById: procedure.input(z.object({ id: z.string() })).query(async (opts) => {
    // Example: fetch from database or external API
    return {
      id: opts.input.id,
      name: `Item ${opts.input.id}`,
      createdAt: new Date(),
    };
  }),

  create: procedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async (opts) => {
      // Example: save to database
      const newItem = {
        id: Math.random().toString(36).slice(2),
        name: opts.input.name,
        description: opts.input.description,
        createdAt: new Date(),
      };

      return newItem;
    }),
});
