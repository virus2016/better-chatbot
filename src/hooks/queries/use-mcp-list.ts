"use client";
import { appStore } from "@/app/store";
import useSWR, { SWRConfiguration } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { fetcher, objectFlow } from "lib/utils";

export function useMcpList(options?: SWRConfiguration) {
  return useSWR("/api/mcp/list", fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 0,
    focusThrottleInterval: 1000 * 60 * 5,
    fallbackData: [],
    onError: handleErrorWithToast,
    onSuccess: (data) => {
      const ids = data.map((v) => v.id);
      appStore.setState((prev) => ({
        mcpList: data,
        allowedMcpServers: objectFlow(prev.allowedMcpServers || {}).filter(
          (_, key) => ids.includes(key),
        ),
      }));
    },
    ...options,
  });
}
