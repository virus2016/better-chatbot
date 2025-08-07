import { z } from "zod";

const openaiModelSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  owned_by: z.string(),
  supports_tools: z.boolean().optional(),
});

const openaiModelsResponseSchema = z.object({
  object: z.string(),
  data: z.array(openaiModelSchema),
});

const openaiProviderConfigSchema = z.object({
  models: z.array(
    z.object({
      apiName: z.string(),
      uiName: z.string(),
      supportsTools: z.boolean(),
    }),
  ),
});

export type OpenAIProviderConfig = z.infer<typeof openaiProviderConfigSchema>;

export async function getOpenAIProviderConfig(): Promise<OpenAIProviderConfig> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  try {
    const response = await fetch(`${baseURL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = openaiModelsResponseSchema.parse(await response.json());

    // Filter for chat models and map to our config format
    const chatModels = data.data
      .filter(
        (model) =>
          model.id.includes("gpt") ||
          model.id.includes("o1") ||
          model.id.includes("o3") ||
          model.id.includes("o4"),
      )
      .map((model) => ({
        apiName: model.id,
        uiName: model.id,
        supportsTools: model.supports_tools ?? true, // Default to true for OpenAI models
      }));

    return {
      models: chatModels,
    };
  } catch (error) {
    console.error("[OpenAI] Error fetching models:", error);
    throw error;
  }
}
