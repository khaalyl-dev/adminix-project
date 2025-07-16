import { PermissionType } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withPermission = (
  WrappedComponent: React.ComponentType,
  requirePermission:PermissionType 

) => {

  const WithPermission = (props:any) => {
    const {user, hasPermission, isLoading} = useAuthContext()
    const navigate = useNavigate()
    const workspaceId = useWorkspaceId()

    useEffect(() =>{
     if(!user || !hasPermission(requirePermission)) {
      navigate(`/workspace/${workspaceId}`); 
     }
    },[user, hasPermission, navigate, workspaceId]); 

    if(isLoading) {
      return <div>Loading...</div>
    }

    // check if user has the required permission
    if(!user || !hasPermission(requirePermission)) {
      return; 
    }
    // if the user has permission, render the wrapped content
    return <WrappedComponent {...props}/>
  }; 
  return WithPermission;
};

export default withPermission;
