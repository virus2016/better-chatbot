// src/lib/ai/openrouter.ts

import { LanguageModel } from "ai";
import logger from "logger";
import { ChatModel } from "app-types/chat";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models";
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

type OpenRouterModelRaw = {
  id: string;
  name: string;
  supported_features?: string[];
  supported_parameters?: string[];
  context_length?: number;
  max_completion_tokens?: number;
  pricing?: {
    prompt?: number;
    completion?: number;
    unit?: string;
  };
  modalities?: {
    input?: string[];
    output?: string[];
  };
  description?: string;
};

type OpenRouterModel = {
  apiName: string;
  uiName: string;
  supportsTools: boolean;
  contextLength?: number;
  maxCompletionTokens?: number;
  pricing?: {
    prompt?: number;
    completion?: number;
    unit?: string;
  };
  modalities?: {
    input?: string[];
    output?: string[];
  };
  description?: string;
};

let cache: {
  models: OpenRouterModel[] | null;
  expires: number;
} = {
  models: null,
  expires: 0,
};

async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  // Use cache if valid
  const now = Date.now();
  if (cache.models && cache.expires > now) {
    return cache.models;
  }

  try {
    const headers: Record<string, string> = {};
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(OPENROUTER_API_URL, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.error(
        `[OpenRouter] Failed to fetch models: ${res.status} ${res.statusText}`,
      );
      throw new Error("OpenRouter API error");
    }

    const data = await res.json();
    let modelsRaw: any[] = [];
    if (Array.isArray(data.models)) {
      modelsRaw = data.models;
    } else if (Array.isArray(data.data)) {
      modelsRaw = data.data;
    } else if (Array.isArray(data)) {
      modelsRaw = data;
    } else {
      logger.error("[OpenRouter] Unexpected response format", data);
      throw new Error("OpenRouter API format error");
    }

    const models: OpenRouterModel[] = modelsRaw.map(
      (m: OpenRouterModelRaw) => ({
        apiName: m.id,
        uiName: m.name,
        supportsTools:
          (Array.isArray(m.supported_features) &&
            m.supported_features.includes("tools")) ||
          (Array.isArray(m.supported_parameters) &&
            m.supported_parameters.includes("tools")) ||
          false,
        contextLength: m.context_length,
        maxCompletionTokens: m.max_completion_tokens,
        pricing: m.pricing,
        modalities: m.modalities,
        description: m.description,
      }),
    );

    // Cache result
    cache = {
      models,
      expires: now + CACHE_TTL_MS,
    };

    return models;
  } catch (err: any) {
    logger.error("[OpenRouter] Model fetch failed", err);
    // Fallback: return empty array, do not cache error
    return [];
  }
}

// Utility to get models in OpenAI-compatible format for provider system
export async function getOpenRouterProviderConfig(): Promise<{
  provider: string;
  models: OpenRouterModel[];
  apiKey?: string;
  baseUrl: string;
}> {
  const models = await fetchOpenRouterModels();
  return {
    provider: "openrouter",
    models,
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: "https://openrouter.ai/api/v1",
  };
}
// TEMP TEST: Log OpenRouter models and tool support
if (require.main === module) {
  fetchOpenRouterModels().then((models) => {
    for (const m of models) {
      console.log(`${m.apiName}: supportsTools=${m.supportsTools}`);
    }
  });
}
