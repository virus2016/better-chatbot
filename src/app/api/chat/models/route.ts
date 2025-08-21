import { getCustomModelProvider } from "lib/ai/models";

export const GET = async () => {
  try {
    const provider = await getCustomModelProvider();
    return Response.json(provider.modelsInfo);
  } catch (_err: any) {
    // Fallback: return static OpenAI-compatible models only
    return Response.json({
      error: "Failed to load dynamic models, fallback to static.",
      models: [],
    });
  }
};
