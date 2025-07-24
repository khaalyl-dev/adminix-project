// use-get-workspace-members.tsx
// This file provides a custom React hook for fetching workspace member data from the API using React Query.
import { getMembersInWorkspaceQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";


const useGetWorkspaceMembers = (workspaceId:string) => {
 const query = useQuery({
    queryKey: ["members",workspaceId], 
    queryFn:() => getMembersInWorkspaceQueryFn(workspaceId), 
    staleTime: Infinity, 
 });
    return query; 
}

export default useGetWorkspaceMembers