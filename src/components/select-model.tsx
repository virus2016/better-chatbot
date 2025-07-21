"use client";

import { appStore } from "@/app/store";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ChatModel } from "app-types/chat";
import { CheckIcon, ChevronDown } from "lucide-react";
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
import { GeminiIcon } from "ui/gemini-icon";
import { GrokIcon } from "ui/grok-icon";
import { OpenAIIcon } from "ui/openai-icon";
import { OpenRouterIcon } from "ui/openrouter-icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {props.children || (
          <Button
            variant={"secondary"}
            size={"sm"}
            className="data-[state=open]:bg-input! hover:bg-input! "
          >
            <p className="mr-auto">
              {model?.model ?? (
                <span className="text-muted-foreground">model</span>
              )}
            </p>
            <ChevronDown className="size-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[280px]" align={props.align || "end"}>
        <Command
          className="rounded-lg relative shadow-md h-80"
          value={JSON.stringify(model)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showToolsOnly}
                onChange={(e) => setShowToolsOnly(e.target.checked)}
                className="accent-primary"
              />
              Show only models with tool support
            </label>
          </div>
          <CommandInput placeholder="search model..." />
          <CommandList className="p-2">
            <CommandEmpty>No results found.</CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <span className="animate-spin mr-2">⏳</span>
                <span>Loading models...</span>
              </div>
            ) : (
              providers?.map((provider, i) => {
                // For OpenRouter, group models alphabetically and truncate long names
                let models = provider.models;
                if (provider.provider === "openrouter") {
                  models = [...models].sort((a, b) =>
                    (a.uiName ?? a.name).localeCompare(b.uiName ?? b.name),
                  );
                  if (showToolsOnly) {
                    models = models.filter((m) => m.supportsTools);
                  }
                }
                return (
                  <Fragment key={provider.provider}>
                    <CommandGroup
                      heading={<ProviderHeader provider={provider.provider} />}
                      className="pb-4 group"
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {models.map((item) => (
                        <CommandItem
                          key={item.uiName || item.name}
                          className="cursor-pointer"
                          onSelect={() => {
                            setModel({
                              provider: provider.provider,
                              model: item.uiName || item.name,
                            });
                            props.onSelect({
                              provider: provider.provider,
                              model: item.uiName || item.name,
                            });
                            setOpen(false);
                          }}
                          value={item.uiName || item.name}
                        >
                          {model?.provider === provider.provider &&
                          model?.model === (item.uiName || item.name) ? (
                            <CheckIcon className="size-3" />
                          ) : (
                            <div className="ml-3" />
                          )}
                          <span
                            className="pr-2 max-w-[180px] truncate"
                            title={
                              item.uiName && item.uiName.length > 28
                                ? item.uiName
                                : undefined
                            }
                          >
                            {item.uiName && item.uiName.length > 28
                              ? item.uiName.slice(0, 25) + "…"
                              : (item.uiName ?? item.name)}
                          </span>
                          {provider.provider === "openrouter" && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {item.contextLength
                                ? `${item.contextLength / 1000}K ctx`
                                : ""}
                              {item.pricing?.prompt ? (
                                <>
                                  {" "}
                                  · ${item.pricing.prompt}/
                                  {item.pricing.unit || "1K"} in
                                </>
                              ) : null}
                              {item.pricing?.completion ? (
                                <>
                                  {" "}
                                  · ${item.pricing.completion}/
                                  {item.pricing.unit || "1K"} out
                                </>
                              ) : null}
                            </span>
                          )}
                          {provider.provider === "openrouter" &&
                            item.description && (
                              <span className="block text-xs text-muted-foreground mt-1 max-w-[220px] truncate">
                                {item.description}
                              </span>
                            )}
                          {item.supportsTools === false && (
                            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                              No tools
                            </div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {i < providers?.length - 1 && <CommandSeparator />}
                  </Fragment>
                );
              })
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ProviderHeader = memo(function ProviderHeader({
  provider,
}: { provider: string }) {
  return (
    <div className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors duration-300">
      {provider === "openai" ? (
        <OpenAIIcon className="size-3 text-foreground" />
      ) : provider === "xai" ? (
        <GrokIcon className="size-3" />
      ) : provider === "anthropic" ? (
        <ClaudeIcon className="size-3" />
      ) : provider === "google" ? (
        <GeminiIcon className="size-3" />
      ) : provider === "openrouter" ? (
        <OpenRouterIcon className="size-3" />
      ) : null}
      {provider}
    </div>
  );
});
