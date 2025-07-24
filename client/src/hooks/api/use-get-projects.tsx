// use-get-projects.tsx
// This file provides a custom React hook for fetching project data from the API using React Query.
import { getProjectsInWorkspaceQueryFn } from "@/lib/api";
import { AllProjectPayloadType } from "@/types/api.type";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const useGetProjectsInWorkspaceQuery = ({workspaceId, 
    pageSize, 
    pageNumber,
    skip = false 
}: AllProjectPayloadType)=>{ 
  const query = useQuery({
    queryKey:["allprojects",workspaceId, pageNumber,pageSize], 
    queryFn: () => getProjectsInWorkspaceQueryFn({
        workspaceId,
        pageSize, 
        pageNumber
    }), 
    staleTime: Infinity, 
    placeholderData: skip ? undefined : keepPreviousData, 
    enabled: !skip,  
  }); 

  return query ; 
  
}

export default useGetProjectsInWorkspaceQuery