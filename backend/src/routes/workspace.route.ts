// Express route definitions for workspace-related API endpoints.
import { Router } from "express";
import { changeWorkspaceMemberRoleController,
     createWorkspaceController,
      deleteWorkspaceByIdController,
       getAllWorkspacesUserIsMemberController,
        getWorkspaceAnalyticsController, getWorkspaceByIdController, getWorkspaceMembersController, updateWorkspaceByIdController, getWorkspaceNotificationsController, markAllNotificationsAsReadController } from "../controllers/workspace.controller";


const workspaceRoutes = Router(); 

workspaceRoutes.post("/create/new", createWorkspaceController); 
workspaceRoutes.put("/update/:id", updateWorkspaceByIdController); 
workspaceRoutes.put(
"/change/member/role/:id",
changeWorkspaceMemberRoleController); 

workspaceRoutes.delete("/delete/:id", deleteWorkspaceByIdController); 

workspaceRoutes.get("/all", getAllWorkspacesUserIsMemberController);

workspaceRoutes.get("/members/:id", getWorkspaceMembersController); 
workspaceRoutes.get("/analytics/:id", getWorkspaceAnalyticsController); 
workspaceRoutes.get('/:id/notifications', getWorkspaceNotificationsController);
workspaceRoutes.patch('/:id/notifications/mark-all-read', markAllNotificationsAsReadController);

workspaceRoutes.get("/:id", getWorkspaceByIdController); 


export default workspaceRoutes; 