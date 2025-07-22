"use client";
import { api } from "@/utils/trpc";
import { appStore } from "@/app/store";

export function useWorkflowToolList(enabled: boolean = true) {
  return api.workflow.getTools.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled,
    onSuccess: (data) => {
      appStore.setState({ workflowToolList: data });
    },
  });
}
