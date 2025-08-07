import { useQuery } from "@tanstack/react-query";
import { getSprintsQueryFn } from "@/lib/api";

export const useGetSprintsByProjectQuery = ({
  workspaceId,
  projectId,
  enabled = true,
}: {
  workspaceId: string;
  projectId: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ["sprints-by-project", workspaceId, projectId],
    queryFn: () => getSprintsQueryFn({ workspaceId, projectId }),
    enabled: enabled && !!workspaceId && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 