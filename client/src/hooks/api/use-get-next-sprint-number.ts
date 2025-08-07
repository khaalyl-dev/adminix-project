import { useQuery } from "@tanstack/react-query";
import { getNextSprintNumberQueryFn } from "@/lib/api";

export const useGetNextSprintNumberQuery = ({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) => {
  return useQuery({
    queryKey: ["next-sprint-number", workspaceId, projectId],
    queryFn: () => getNextSprintNumberQueryFn({ workspaceId, projectId }),
    enabled: !!workspaceId && !!projectId,
  });
}; 