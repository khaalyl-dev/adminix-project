// use-get-workspace.tsx
// This file provides a custom React hook for fetching workspace data from the API using React Query.
import { getWorkspaceByIdQueryFn } from "@/lib/api";
import { CustomError } from "@/types/custom-error.type";
import { useQuery } from "@tanstack/react-query";

const useGetWorkspaceQuery = (workspaceId: string) => {
    const query = useQuery<any, CustomError>({
        queryKey:["workspace",workspaceId],
        queryFn:() =>getWorkspaceByIdQueryFn(workspaceId), 
        staleTime:0, 
        retry:2, 
        enabled: !!workspaceId,
    }); 

    return query; 
};

export default useGetWorkspaceQuery;
