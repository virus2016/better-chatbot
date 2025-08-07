// models.ts
import { createOllama } from "ollama-ai-provider-v2";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";
import { getOpenRouterProviderConfig } from "./openrouter";
import { getOllamaProviderConfig } from "./ollama";
import { getOpenAIProviderConfig } from "./openai";

const _ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
});

const staticModels = {
  openai: {
    "gpt-4.1": openai("gpt-4.1"),
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "4o": openai("gpt-4o"),
    "4o-mini": openai("gpt-4o-mini"),
    "o4-mini": openai("o4-mini", {
      reasoningEffort: "medium",
    }),
  },
  google: {
    "gemini-2.0-flash-lite": google("gemini-2.0-flash-lite"),
    "gemini-2.5-flash": google("gemini-2.5-flash", {}),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
  },
  anthropic: {
    "claude-4-sonnet": anthropic("claude-4-sonnet-20250514"),
    "claude-4-opus": anthropic("claude-4-opus-20250514"),
    "claude-3-7-sonnet": anthropic("claude-3-7-sonnet-latest"),
  },
  xai: {
    "grok-3": xai("grok-3-latest"),
    "grok-3-mini": xai("grok-3-mini-latest"),
  },
  ollama: {
    // "gemma3:1b": ollama("gemma3:1b"),
    // "gemma3:4b": ollama("gemma3:4b"),
    // "gemma3:12b": ollama("gemma3:12b"),
  },
  openRouter: {
    // "qwen3-8b:free": openrouter("qwen/qwen3-8b:free"),
    // "qwen3-14b:free": openrouter("qwen/qwen3-14b:free"),
  },
};

// Models that do not support tool calling (static)
const staticUnsupportedModels = new Set([
  staticModels.openai["o4-mini"],
  staticModels.google["gemini-2.0-flash-lite"],
  // staticModels.ollama["gemma3:1b"],
  // staticModels.ollama["gemma3:4b"],
  // staticModels.ollama["gemma3:12b"],
  // staticModels.openRouter["qwen3-8b:free"],
  // staticModels.openRouter["qwen3-14b:free"],
]);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

// --- Dynamic OpenRouter integration ---
let openRouterDynamicModels: Record<string, LanguageModel> = {};
let openRouterDynamicUnsupportedModels: Set<LanguageModel> = new Set();

// --- Dynamic OpenAI integration ---
let openaiDynamicModels: Record<string, LanguageModel> = {};
let openaiDynamicUnsupportedModels: Set<LanguageModel> = new Set();

// --- Dynamic Ollama integration ---
let ollamaDynamicModels: Record<string, LanguageModel> = {};
let ollamaDynamicUnsupportedModels: Set<LanguageModel> = new Set();

async function loadOpenRouterModels() {
  try {
    const config = await getOpenRouterProviderConfig();
    const provider = openrouter;
    openRouterDynamicModels = {};
    openRouterDynamicUnsupportedModels = new Set();

    config.models.forEach((m) => {
      const model = provider(m.apiName);
      openRouterDynamicModels[m.uiName] = model;
      if (!m.supportsTools) {
        openRouterDynamicUnsupportedModels.add(model);
      }
    });
  } catch (_err) {
    // Error already logged in openrouter.ts
    openRouterDynamicModels = {};
    openRouterDynamicUnsupportedModels = new Set();
  }
}

async function loadOllamaModels() {
  try {
    console.info("[Ollama] Calling getOllamaProviderConfig...");
    const config = await getOllamaProviderConfig();
    console.info("[Ollama] Provider config received", config);

    const provider = createOllama({
      baseURL: config.baseUrl + "/api",
    });

    //   OllamaChatLanguageModel {                                                                                                                           better-chatbot 5:56:34 PM
    // modelId: 'qwen3:14b',
    // settings: {},
    // config:
    //  { baseURL: 'http://localhost:11434/api',
    //    fetch: undefined,
    //    headers: [Function: getHeaders],
    //    provider: 'ollama.chat' },
    // specificationVersion: 'v1',
    // defaultObjectGenerationMode: 'json',
    // supportsImageUrls: false }
    ollamaDynamicModels = {};
    ollamaDynamicUnsupportedModels = new Set();

    config.models.forEach((m) => {
      console.info(`[Ollama] Registering model: ${m.apiName}`);
      const model = provider(m.apiName);
      ollamaDynamicModels[m.uiName] = model;
      if (!m.supportsTools) {
        ollamaDynamicUnsupportedModels.add(model);
      }
    });
    console.info("[Ollama] ollamaDynamicModels", ollamaDynamicModels);
    console.info(
      "[Ollama] ollamaDynamicUnsupportedModels",
      ollamaDynamicUnsupportedModels,
    );
  } catch (_err) {
    console.error("[Ollama] Error in loadOllamaModels", _err);
    // Error already logged in ollama.ts
    ollamaDynamicModels = {};
    ollamaDynamicUnsupportedModels = new Set();
  }
}

async function loadOpenAIModels() {
  try {
    console.info("[OpenAI] Calling getOpenAIProviderConfig...");
    const config = await getOpenAIProviderConfig();
    console.info("[OpenAI] Provider config received", config);

    const provider = openai;
    openaiDynamicModels = {};
    openaiDynamicUnsupportedModels = new Set();

    config.models.forEach((m) => {
      console.info(`[OpenAI] Registering model: ${m.apiName}`);
      const model = provider(m.apiName);
      openaiDynamicModels[m.uiName] = model;
      if (!m.supportsTools) {
        openaiDynamicUnsupportedModels.add(model);
      }
    });
    console.info("[OpenAI] openaiDynamicModels", openaiDynamicModels);
    console.info(
      "[OpenAI] openaiDynamicUnsupportedModels",
      openaiDynamicUnsupportedModels,
    );
  } catch (_err) {
    console.error("[OpenAI] Error in loadOpenAIModels", _err);
    // Error already logged in openai.ts
    openaiDynamicModels = {};
    openaiDynamicUnsupportedModels = new Set();
  }
}

// --- Factory for async model provider ---
export async function getCustomModelProvider(): Promise<{
  modelsInfo: {
    provider: string;
    models: any[]; // OpenRouter/Ollama/OpenAI: enhanced, others: { name, isToolCallUnsupported }
  }[];
  getModel: (model?: ChatModel) => LanguageModel;
  isToolCallUnsupportedModel: (model: LanguageModel) => boolean;
}> {
  await loadOpenRouterModels();
  await loadOpenAIModels();
  await loadOllamaModels();
  let openRouterMeta: any[] = [];
  let openaiMeta: any[] = [];
  let ollamaMeta: any[] = [];
  try {
    const openRouterConfig = await getOpenRouterProviderConfig();
    openRouterMeta = openRouterConfig.models;
  } catch {}
  try {
    const openaiConfig = await getOpenAIProviderConfig();
    openaiMeta = openaiConfig.models;
  } catch {}
  try {
    const ollamaConfig = await getOllamaProviderConfig();
    ollamaMeta = ollamaConfig.models;
  } catch {}

  const allModels = {
    ...openaiCompatibleModels,
    ...staticModels,
    openai: {
      ...staticModels.openai,
      ...openaiDynamicModels,
    },
    openRouter: {
      ...staticModels.openRouter,
      ...openRouterDynamicModels,
    },
    ollama: {
      ...staticModels.ollama,
      ...ollamaDynamicModels,
    },
  };

  const allUnsupportedModels = new Set([
    ...openaiCompatibleUnsupportedModels,
    ...staticUnsupportedModels,
    ...openaiDynamicUnsupportedModels,
    ...openRouterDynamicUnsupportedModels,
    ...ollamaDynamicUnsupportedModels,
  ]);

  const isToolCallUnsupportedModel = (model: LanguageModel) => {
    return allUnsupportedModels.has(model);
  };

  const firstProvider = Object.keys(allModels)[0];
  const firstModel = Object.keys(allModels[firstProvider])[0];
  const fallbackModel = allModels[firstProvider][firstModel];

  return {
    modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
      provider,
      models: Object.entries(models).map(([name, model]) => {
        // For OpenAI, attach enhanced metadata if available
        if (provider === "openai" && openaiDynamicModels[name]) {
          const meta = openaiMeta.find((m) => m.uiName === name);
          return meta
            ? {
                ...meta,
                name,
                isToolCallUnsupported: isToolCallUnsupportedModel(model),
              }
            : {
                name,
                isToolCallUnsupported: isToolCallUnsupportedModel(model),
              };
        }
        // For OpenRouter, attach enhanced metadata if available
        if (provider === "openRouter" && openRouterDynamicModels[name]) {
          const meta = openRouterMeta.find((m) => m.uiName === name);
          return meta
            ? {
                ...meta,
                name,
                isToolCallUnsupported: isToolCallUnsupportedModel(model),
              }
            : {
                name,
                isToolCallUnsupported: isToolCallUnsupportedModel(model),
              };
        }
        // For Ollama, attach enhanced metadata if available
        if (provider === "ollama" && ollamaDynamicModels[name]) {
          const meta = ollamaMeta.find((m) => m.uiName === name);
          return meta
            ? {
                ...meta,
                name,
                isToolCallUnsupported: isToolCallUnsupportedModel(model),
              }
            : {
                name,
                isToolCallUnsupported: isToolCallUnsupportedModel(model),
              };
        }
        // Other providers: keep simple structure
        return {
          name,
          isToolCallUnsupported: isToolCallUnsupportedModel(model),
        };
      }),
    })),
    getModel: (model?: ChatModel): LanguageModel => {
      if (!model) return fallbackModel;
      return allModels[model.provider]?.[model.model] || fallbackModel;
    },
    isToolCallUnsupportedModel,
  };
}
