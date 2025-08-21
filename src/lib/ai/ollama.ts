// src/lib/ai/ollama.ts

import logger from "logger";

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

type OllamaModelRaw = {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
};

type OllamaModel = {
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
  size?: number;
  modifiedAt?: string;
};

let cache: {
  models: OllamaModel[] | null;
  expires: number;
} = {
  models: null,
  expires: 0,
};

function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
}

async function fetchOllamaModels(): Promise<OllamaModel[]> {
  // Use cache if valid
  const now = Date.now();
  if (cache.models && cache.expires > now) {
    logger.info("[Ollama] Returning models from cache", cache.models);
    return cache.models;
  }

  logger.info("[Ollama] Fetching models from Ollama API...");
  try {
    const baseUrl = getOllamaBaseUrl();
    const apiUrl = `${baseUrl}/api/tags`;

    logger.info(`[Ollama] API URL: ${apiUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    logger.info(`[Ollama] Response status: ${res.status}`);

    if (!res.ok) {
      logger.error(
        `[Ollama] Failed to fetch models: ${res.status} ${res.statusText}`,
      );
      throw new Error("Ollama API error");
    }

    const data = await res.json();
    logger.info("[Ollama] Raw response data", data);

    let modelsRaw: any[] = [];
    if (Array.isArray(data.models)) {
      modelsRaw = data.models;
    } else if (Array.isArray(data)) {
      modelsRaw = data;
    } else {
      logger.error("[Ollama] Unexpected response format", data);
      throw new Error("Ollama API format error");
    }

    logger.info("[Ollama] Parsed modelsRaw", modelsRaw);

    const models: OllamaModel[] = modelsRaw.map((m: OllamaModelRaw) => {
      // Determine tool support based on model name
      const supportsTools = determineToolSupport(m.name);

      return {
        apiName: m.name,
        uiName: m.name,
        supportsTools,
        // Ollama doesn't provide context length in API, use reasonable defaults based on model
        contextLength: getContextLengthEstimate(m.name),
        maxCompletionTokens: undefined, // Ollama doesn't specify this
        pricing: {
          prompt: 0,
          completion: 0,
          unit: "free", // Local models are free
        },
        modalities: {
          input: ["text"],
          output: ["text"],
        },
        description: `Local Ollama model: ${m.name}`,
        size: m.size,
        modifiedAt: m.modified_at,
      };
    });

    logger.info("[Ollama] Final models array", models);

    // Cache result
    cache = {
      models,
      expires: now + CACHE_TTL_MS,
    };

    logger.info("[Ollama] Models cached", cache);

    return models;
  } catch (err: any) {
    logger.error("[Ollama] Model fetch failed", err);
    // Fallback: return empty array, do not cache error
    return [];
  }
}

function determineToolSupport(modelName: string): boolean {
  // Most modern models support tools, but some older or specialized models don't
  const modelLower = modelName.toLowerCase();

  // Known models that don't support tools
  const unsupportedPatterns = [
    /^(embedding|nomic-embed)/,
    /^(all-minilm)/,
    /^(sentence-transformers)/,
  ];

  for (const pattern of unsupportedPatterns) {
    if (pattern.test(modelLower)) {
      return false;
    }
  }

  // Most chat models support tools by default
  return true;
}

function getContextLengthEstimate(modelName: string): number {
  const modelLower = modelName.toLowerCase();

  // Common context length estimates based on model patterns
  if (modelLower.includes("llama3") || modelLower.includes("llama-3")) {
    return 128000; // Llama 3 models typically have 128k context
  }
  if (modelLower.includes("llama2") || modelLower.includes("llama-2")) {
    return 4096; // Llama 2 models typically have 4k context
  }
  if (modelLower.includes("gemma")) {
    return 8192; // Gemma models typically have 8k context
  }
  if (modelLower.includes("mistral")) {
    return 32768; // Mistral models often have 32k context
  }
  if (modelLower.includes("qwen")) {
    return 32768; // Qwen models often have 32k context
  }
  if (modelLower.includes("phi")) {
    return 131072; // Phi models often have larger context
  }

  // Default fallback
  return 4096;
}

// Utility to get models in compatible format for provider system
export async function getOllamaProviderConfig(): Promise<{
  provider: string;
  models: OllamaModel[];
  baseUrl: string;
}> {
  const models = await fetchOllamaModels();
  return {
    provider: "ollama",
    models,
    baseUrl: getOllamaBaseUrl(),
  };
}

// TEMP TEST: Log Ollama models and tool support
if (require.main === module) {
  fetchOllamaModels().then((models) => {
    for (const m of models) {
      console.log(`${m.apiName}: supportsTools=${m.supportsTools}`);
    }
  });
}
