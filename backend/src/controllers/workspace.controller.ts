// Controller for handling workspace-related API endpoints and business logic.
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { changeRoleSchema, createWorkspaceSchema, updateWorkspaceSchema, workspaceIdSchema } from "../validation/workspace.validation";
import { HTTPSTATUS } from "../config/http.config";
import { changeMemberRoleService, createWorkspaceService, deleteWorkspaceService, getAllWorkspacesUserIsMemberService, getWorkspaceAnalyticsService, getWorkspaceByIdService, getWorkspaceMembersService, updateWorkspaceByIdService } from "../services/workspace.service";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import { json } from "stream/consumers";
import Notification from "../models/notification.model";
import { io } from "../index";
import { WorkspaceDocument } from "../models/workspace.model";
import mongoose from 'mongoose';
import Activity from "../models/activity.model";
import { format } from "date-fns";


export const createWorkspaceController = asyncHandler(
    async(req: Request, res:Response) => {
        const body= createWorkspaceSchema.parse(req.body); 

        const userId = req.user?._id; 
        const {workspace} = await createWorkspaceService(userId, body); 
        const workspaceId = (workspace as WorkspaceDocument)._id?.toString();
        if (!workspaceId) throw new Error("Workspace ID is missing");
        console.log("Creating notification (workspace)", { userId, workspaceId, type: 'workspace', message: `Workspace '${(workspace as WorkspaceDocument).name}' created` });
        // Create notification
        const notification = await Notification.create({
          userId,
          workspaceId,
          type: 'workspace',
          message: `Workspace {{${(workspace as WorkspaceDocument).name}}} created`,
        });
        io.to(workspaceId).emit('notification', notification);
        await Activity.create({
          userId,
          type: 'workspace_create',
          message: `🏢 Workspace Created\n📋 ${(workspace as WorkspaceDocument).name}\n📅 ${format(new Date(), "PPpp")}\n👤 Created by ${req.user?.name || 'User'}\n📝 ${(workspace as WorkspaceDocument).description || 'No description provided'}`,
        });
         return res.status(HTTPSTATUS.CREATED).json({
            message:"Workspace created successfully", 
            workspace, 
         }); 


    }
); 

/**Controller : get all workspaces the user is a part of  */
export const getAllWorkspacesUserIsMemberController = asyncHandler(
    async (req:Request, res: Response) => {
        const userId =  req.user?._id; 

        const {workspaces} = await getAllWorkspacesUserIsMemberService(userId); 

        return res.status(HTTPSTATUS.OK).json({
          message: "User workspaces fetched successfully", 
          workspaces,   
        })
    }
); 

export const getWorkspaceByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = workspaceIdSchema.parse(req.params.id); 
        const userId = req.user?._id; 


        await getMemberRoleInWorkspace(userId, workspaceId); 

        const {workspace} = await getWorkspaceByIdService(workspaceId); 

        return res.status(HTTPSTATUS.OK).json({
            message: "Workspace fetched successfully", 
            workspace, 
        })


    }
); 

export const getWorkspaceMembersController = asyncHandler(
    async(req:Request, res:Response) => {
        const workspaceId = workspaceIdSchema.parse(req.params.id); 
        const userId = req.user?._id; 
        const {role} = await getMemberRoleInWorkspace(userId, workspaceId);   
        roleGuard(role,[Permissions.VIEW_ONLY]); 

      const {members, roles} = await getWorkspaceMembersService(workspaceId);

      return res.status(HTTPSTATUS.OK).json({
        message: "Workspace members retrived successfully",
        members,
        roles,
      });
    }
);

export const getWorkspaceAnalyticsController = asyncHandler (
    async(req:Request, res:Response) => {
      const workspaceId = workspaceIdSchema.parse(req.params.id); 
      const userId = req.user?._id; 

      const {role} = await getMemberRoleInWorkspace(userId, workspaceId);   
      roleGuard(role,[Permissions.VIEW_ONLY]); 

      const {analytics}= await getWorkspaceAnalyticsService(workspaceId); 

      return res.status(HTTPSTATUS.OK).json({
        message: "Workspace analytics retrived successfully",
        analytics,
      });

    }
); 


export const changeWorkspaceMemberRoleController = asyncHandler(
async(req:Request, res:Response) => {
  const workspaceId = workspaceIdSchema.parse(req.params.id); 
  const {memberId, roleId} = changeRoleSchema.parse(req.body); 

  const userId = req.user?._id; 

  const {role} = await getMemberRoleInWorkspace(userId, workspaceId);   
  roleGuard(role,[Permissions.CHANGE_MEMBER_ROLE]);

  const {member} = await changeMemberRoleService(
    workspaceId, 
    memberId, 
    roleId
  ); 

  return res.status(HTTPSTATUS.OK).json({
    message: "Member Role changed successfully",
    member, 
  })
}
);

export const updateWorkspaceByIdController = asyncHandler (
  async (req: Request, res:Response ) => {

    const workspaceId = workspaceIdSchema.parse(req.params.id); 
    const {name, description} = updateWorkspaceSchema.parse(req.body); 

    const userId = req.user?._id; 
    const {role} = await getMemberRoleInWorkspace(userId, workspaceId); 
    roleGuard(role, [Permissions.EDIT_WORKSPACE]); 

    const {workspace} = await updateWorkspaceByIdService(
      workspaceId, 
      name, 
      description,
    ); 
    // Create notification
    if (!workspaceId) throw new Error("Workspace ID is missing");
    console.log("Creating notification (workspace)", { userId, workspaceId, type: 'workspace', message: `Workspace '${(workspace as WorkspaceDocument).name}' updated` });
    const notification = await Notification.create({
      userId,
      workspaceId,
      type: 'workspace',
      message: `Workspace {{${(workspace as WorkspaceDocument).name}}} updated`,
    });
    io.to(workspaceId).emit('notification', notification);
            await Activity.create({
          userId,
          type: 'workspace_update',
          message: `🔄 Workspace Updated\n📋 ${(workspace as WorkspaceDocument).name}\n📅 ${format(new Date(), "PPpp")}\n👤 Updated by ${req.user?.name || 'User'}`,
        });

    return res.status(HTTPSTATUS.OK).json({
      message:"Workspace updated successfully", 
      workspace
    })

  } 
); 

export const deleteWorkspaceByIdController = asyncHandler(
  async (req: Request, res:Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id); 
    const userId = req.user?._id; 

    const {role} = await getMemberRoleInWorkspace(userId,workspaceId); 
    roleGuard(role, [Permissions.DELETE_WORKSPACE]); 

    const {currentWorkspace} = await deleteWorkspaceService(
      workspaceId, 
      userId
    ); 
    // Create notification
    if (!workspaceId) throw new Error("Workspace ID is missing");
    console.log("Creating notification (workspace)", { userId, workspaceId, type: 'workspace', message: `Workspace deleted` });
    const notification = await Notification.create({
      userId,
      workspaceId: workspaceId.toString(),
      type: 'workspace',
      message: `Workspace deleted`,
    });
    io.to(workspaceId).emit('notification', notification);

    return res.status(HTTPSTATUS.OK).json({
      message:"Workspace deleted successfully", 
      currentWorkspace, 
    });
  }
); 

export const getWorkspaceNotificationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: 'Invalid workspaceId' });
    }
    try {
      const notifications = await Notification.find({ workspaceId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name profilePicture');
      return res.status(200).json({
        message: "Notifications fetched successfully",
        notifications,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ message: 'Failed to fetch notifications', error: errorMessage });
    }
  }
); 

export const markAllNotificationsAsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: 'Invalid workspaceId' });
    }
    await Notification.updateMany({ workspaceId, read: false }, { $set: { read: true } });
    return res.status(200).json({ message: 'All notifications marked as read' });
  }
); 