import { appStore } from "@/app/store";
import { api } from "@/utils/trpc";

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
  return api.chat.getModels.useQuery(undefined, {
    staleTime: 60_000, // 1 minute for fresher data
    refetchOnWindowFocus: false,
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
