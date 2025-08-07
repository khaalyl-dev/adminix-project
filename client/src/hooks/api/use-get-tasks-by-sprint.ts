import { useQuery } from "@tanstack/react-query";
import { getTasksBySprintQueryFn } from "@/lib/api";

export const useGetTasksBySprintQuery = ({
  workspaceId,
  projectId,
  sprintId,
  enabled = true,
}: {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ["tasks-by-sprint", workspaceId, projectId, sprintId],
    queryFn: () => getTasksBySprintQueryFn({ workspaceId, projectId, sprintId }),
    enabled: enabled && !!workspaceId && !!projectId && !!sprintId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 