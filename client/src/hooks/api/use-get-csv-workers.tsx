// use-get-csv-workers.tsx
// This file provides a custom React hook for fetching CSV worker data from the API using React Query.
import { getCSVWorkersQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetCSVWorkers = (workspaceId: string) => {
  const query = useQuery({
    queryKey: ["csv-workers", workspaceId],
    queryFn: () => getCSVWorkersQueryFn(workspaceId),
    staleTime: Infinity,
  });
  return query;
};

export default useGetCSVWorkers; 