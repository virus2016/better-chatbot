import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";
import useSWR from "swr";

export type EnhancedModel = {
  name: string;
  isToolCallUnsupported: boolean;
  uiName?: string;
  supportsTools?: boolean;
  contextLength?: number;
  pricing?: any;
  description?: string;
};

export const useChatModels = () => {
  return useSWR<
    {
      provider: string;
      models: EnhancedModel[];
    }[]
  >("/api/chat/models", fetcher, {
    dedupingInterval: 60_000, // 1 minute for fresher data
    revalidateOnFocus: false,
    revalidateIfStale: true,
    fallbackData: [],
    onSuccess: (data) => {
      const status = appStore.getState();
      if (!status.chatModel) {
        const firstProvider = data[0]?.provider;
        const model = data[0]?.models[0]?.name;
        if (firstProvider && model) {
          appStore.setState({ chatModel: { provider: firstProvider, model } });
        }
      }
    },
    onError: (err) => {
      console.error("Failed to fetch models", err);
    },
  });
};
