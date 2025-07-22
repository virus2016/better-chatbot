"use client";
import { appStore } from "@/app/store";
import { api } from "@/utils/trpc";
import { handleErrorWithToast } from "ui/shared-toast";

export function useMcpList(enabled: boolean = true) {
  return api.mcp.getList.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled,
    onError: handleErrorWithToast,
    onSuccess: (data) => {
      appStore.setState({ mcpList: data });
    },
  });
}
