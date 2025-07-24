// use-workspace-id.ts
// This file provides a custom React hook for retrieving the current workspace ID from the route or context.
import { useParams } from "react-router-dom";

const useWorkspaceId = () => {
  const params = useParams();
  return params.workspaceId as string;
};

export default useWorkspaceId;
