"use client";

import { appStore } from "@/app/store";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ChatModel } from "app-types/chat";
import {
  CheckIcon,
  Search,
  Sparkles,
  Filter,
  ExternalLink,
} from "lucide-react";
import { Fragment, memo, PropsWithChildren, useEffect, useState } from "react";
import { Button } from "ui/button";
import { ClaudeIcon } from "ui/claude-icon";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";
import { Dialog, DialogContent } from "ui/dialog";
import { GeminiIcon } from "ui/gemini-icon";
import { GrokIcon } from "ui/grok-icon";
import { OpenAIIcon } from "ui/openai-icon";
import { OpenRouterIcon } from "ui/openrouter-icon";
import { OllamaIcon } from "ui/ollama-icon";

interface SelectModelProps {
  onSelect: (model: ChatModel) => void;
  align?: "start" | "end";
  defaultModel?: ChatModel;
}

export const SelectModel = (props: PropsWithChildren<SelectModelProps>) => {
  const [open, setOpen] = useState(false);
  const { data: providers, isLoading } = useChatModels();
  const [model, setModel] = useState(props.defaultModel);
  const [showToolsOnly, setShowToolsOnly] = useState(false);

  useEffect(() => {
    setModel(props.defaultModel ?? appStore.getState().chatModel);
  }, [props.defaultModel]);

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (provider: string, modelName: string) => {
    const selectedModel = { provider, model: modelName };
    setModel(selectedModel);
    props.onSelect(selectedModel);
    setOpen(false);
  };

  const selectedProvider = providers?.find(
    (p) => p.provider === model?.provider,
  );
  const selectedModelObj = selectedProvider?.models.find(
    (m) => (m.uiName || m.name) === model?.model,
  );

  return (
    <>
      {/* Trigger Button */}
      {props.children ? (
        <div onClick={() => setOpen(true)}>{props.children}</div>
      ) : (
        <Button
          variant="outline"
          className="justify-start gap-3 min-w-[200px] hover:bg-accent/50 transition-colors"
          onClick={() => setOpen(true)}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              {model?.provider && (
                <div className="flex-shrink-0">
                  {model.provider === "openai" ? (
                    <OpenAIIcon className="size-4" />
                  ) : model.provider === "xai" ? (
                    <GrokIcon className="size-4" />
                  ) : model.provider === "anthropic" ? (
                    <ClaudeIcon className="size-4" />
                  ) : model.provider === "google" ? (
                    <GeminiIcon className="size-4" />
                  ) : model.provider === "openrouter" ? (
                    <OpenRouterIcon className="size-4" />
                  ) : model.provider === "ollama" ? (
                    <OllamaIcon className="size-4" />
                  ) : null}
                </div>
              )}
              <Search className="size-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {model?.model || "Select model"}
              </span>
              {selectedModelObj && (
                <span className="text-xs text-muted-foreground truncate">
                  {selectedProvider?.provider}
                  {selectedModelObj.supportsTools && " • Tools"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              ⌘M
            </kbd>
          </div>
        </Button>
      )}

      {/* Command Palette Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl h-[600px] p-0 gap-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Choose Your AI Model</h2>
              </div>
              <div className="text-xs text-muted-foreground">
                Browse{" "}
                {providers?.reduce((acc, p) => acc + p.models.length, 0) || 0}{" "}
                models
              </div>
            </div>

            <Command className="flex-1 flex flex-col">
              {/* Search and Filter */}
              <div className="flex items-center gap-2 p-4 border-b">
                <div className="flex-1">
                  <CommandInput
                    placeholder="Search models by name..."
                    className="border-none bg-background"
                  />
                </div>
                <Button
                  variant={showToolsOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowToolsOnly(!showToolsOnly)}
                  className="gap-2 whitespace-nowrap"
                >
                  <Filter className="size-4" />
                  Tools Only
                  {showToolsOnly && <CheckIcon className="size-3" />}
                </Button>
              </div>

              <CommandList className="flex-1 overflow-auto p-2">
                <CommandEmpty className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No models found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </CommandEmpty>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full" />
                      <span>Loading models...</span>
                    </div>
                  </div>
                ) : (
                  providers?.map((provider, i) => {
                    // Filter and sort models
                    let models = provider.models;

                    // Apply tools filter
                    if (showToolsOnly) {
                      models = models.filter((m) => m.supportsTools !== false);
                    }

                    // Sort models alphabetically
                    models = [...models].sort((a, b) =>
                      (a.uiName ?? a.name).localeCompare(b.uiName ?? b.name),
                    );

                    if (models.length === 0) return null;

                    return (
                      <Fragment key={provider.provider}>
                        <CommandGroup className="mb-6">
                          <div className="px-2 py-3 mb-2">
                            <ProviderHeader
                              provider={provider.provider}
                              count={models.length}
                            />
                          </div>
                          <div className="space-y-1">
                            {models.map((item) => {
                              const isSelected =
                                model?.provider === provider.provider &&
                                model?.model === (item.uiName || item.name);

                              return (
                                <CommandItem
                                  key={`${provider.provider}-${item.uiName || item.name}`}
                                  className="cursor-pointer rounded-lg p-3 mx-1 data-[selected=true]:bg-accent/50"
                                  onSelect={() =>
                                    handleSelect(
                                      provider.provider,
                                      item.uiName || item.name,
                                    )
                                  }
                                  value={item.uiName || item.name}
                                >
                                  <div className="flex items-start gap-3 w-full">
                                    {/* Selection indicator */}
                                    <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                                      {isSelected ? (
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                          <CheckIcon className="size-3 text-primary-foreground" />
                                        </div>
                                      ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-muted" />
                                      )}
                                    </div>

                                    {/* Model info */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm truncate">
                                          {item.uiName ?? item.name}
                                        </h4>

                                        {/* Badges */}
                                        <div className="flex gap-1 shrink-0">
                                          {item.supportsTools !== false && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                              <Sparkles className="size-3" />
                                              Tools
                                            </span>
                                          )}
                                          {item.supportsTools === false && (
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                                              No Tools
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Context and Pricing */}
                                      {(item.contextLength || item.pricing) && (
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          {item.contextLength && (
                                            <span className="flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-current" />
                                              {item.contextLength >= 1000000
                                                ? `${(item.contextLength / 1000000).toFixed(1)}M`
                                                : `${Math.round(item.contextLength / 1000)}K`}{" "}
                                              context
                                            </span>
                                          )}
                                          {item.pricing && (
                                            <span className="flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-current" />
                                              {item.pricing.prompt === 0 &&
                                              item.pricing.unit === "free"
                                                ? "Free"
                                                : `$${item.pricing.prompt}/${item.pricing.unit || "1K"}`}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Description */}
                                      {item.description && (
                                        <div className="text-xs text-muted-foreground">
                                          <p className="line-clamp-1 leading-relaxed">
                                            {item.description.length > 80
                                              ? `${item.description.slice(0, 80)}...`
                                              : item.description}
                                          </p>
                                          {item.description.length > 80 &&
                                            provider.provider ===
                                              "openRouter" && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // For OpenRouter models, link to their model page
                                                  window.open(
                                                    `https://openrouter.ai/models/${item.name}`,
                                                    "_blank",
                                                  );
                                                }}
                                                className="inline-flex items-center gap-1 mt-1 text-primary hover:underline"
                                              >
                                                More details
                                                <ExternalLink className="size-3" />
                                              </button>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </div>
                        </CommandGroup>
                        {i < providers.length - 1 && (
                          <div className="mx-2 my-4">
                            <CommandSeparator />
                          </div>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </CommandList>
            </Command>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ProviderHeader = memo(function ProviderHeader({
  provider,
  count,
}: { provider: string; count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {provider === "openai" ? (
          <OpenAIIcon className="size-4 text-foreground" />
        ) : provider === "xai" ? (
          <GrokIcon className="size-4" />
        ) : provider === "anthropic" ? (
          <ClaudeIcon className="size-4" />
        ) : provider === "google" ? (
          <GeminiIcon className="size-4" />
        ) : provider === "openrouter" ? (
          <OpenRouterIcon className="size-4" />
        ) : provider === "ollama" ? (
          <OllamaIcon className="size-4" />
        ) : null}
        <h3 className="font-semibold text-sm capitalize text-foreground">
          {provider === "openai"
            ? "OpenAI"
            : provider === "xai"
              ? "xAI"
              : provider === "anthropic"
                ? "Anthropic"
                : provider === "google"
                  ? "Google"
                  : provider === "openrouter"
                    ? "OpenRouter"
                    : provider === "ollama"
                      ? "Ollama"
                      : provider}
        </h3>
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {count} model{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
});
