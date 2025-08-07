import { useQuery } from "@tanstack/react-query";
import { getSprintsQueryFn } from "@/lib/api";

export default function useGetSprintsQuery({
  workspaceId,
  projectId,
  skip = false,
}: {
  workspaceId: string;
  projectId: string;
  skip?: boolean;
}) {
  return useQuery({
    queryKey: ["sprints", workspaceId, projectId],
    queryFn: () => getSprintsQueryFn({ workspaceId, projectId }),
    enabled: !skip && !!workspaceId && !!projectId,
  });
} 