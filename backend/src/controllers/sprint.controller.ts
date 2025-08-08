// Controller for handling sprint-related API endpoints and business logic.
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { projectIdSchema } from "../validation/project.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { roleGuard } from "../utils/roleGuard";
import { HTTPSTATUS } from "../config/http.config";
import { Permissions } from "../enums/role.enum";
import { createSprintSchema, sprintIdSchema, updateSprintSchema } from "../validation/sprint.validation";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { 
    createSprintService, 
    deleteSprintService, 
    getAllSprintsService, 
    getSprintByIdService, 
    updateSprintService,
    getNextSprintNumberService
} from "../services/sprint.service";
import Notification from "../models/notification.model";
import { io } from "../index";
import Activity from '../models/activity.model';
import { format } from "date-fns";

export const createSprintController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        const body = createSprintSchema.parse(req.body);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.CREATE_TASK, Permissions.VIEW_ONLY]); // Allow VIEW_ONLY users to create sprints

        const { sprint } = await createSprintService(
            workspaceId,
            projectId,
            userId,
            body
        );

        // Create notification
        const notification = await Notification.create({
            userId,
            workspaceId,
            type: 'sprint',
            message: `Sprint {{${sprint.name}}} created`,
        });
        io.to(workspaceId.toString()).emit('notification', notification);

        await Activity.create({
            projectId: projectId,
            userId: userId,
            type: 'sprint_create',
            message: `🚀 Sprint Created\n📋 ${sprint.name}\n📅 ${format(new Date(), "PPpp")}\n👤 Created by ${req.user?.name || 'User'}`,
        });

        return res.status(HTTPSTATUS.OK).json({
            message: "Sprint created successfully",
            sprint,
        });
    }
);

export const updateSprintController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        const body = updateSprintSchema.parse(req.body);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
        const sprintId = sprintIdSchema.parse(req.params.sprintId);

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.EDIT_TASK, Permissions.VIEW_ONLY]); // Allow VIEW_ONLY users to update sprints

        const { updatedSprint } = await updateSprintService(
            workspaceId,
            projectId,
            sprintId,
            body
        );

        await Activity.create({
            projectId: projectId,
            userId: userId,
            type: 'sprint_update',
            message: `🔄 Sprint Updated\n📋 ${updatedSprint.name}\n📅 ${format(new Date(), "PPpp")}\n👤 Updated by ${req.user?.name || 'User'}`,
        });

        return res.status(HTTPSTATUS.OK).json({
            message: "Sprint updated successfully",
            sprint: updatedSprint,
        });
    }
);

export const getAllSprintsController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        const projectId = projectIdSchema.parse(req.params.projectId);
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.VIEW_PROJECT, Permissions.VIEW_ONLY]); // Allow VIEW_ONLY users to view sprints

        const filters = {
            status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as string[] : undefined,
            keyword: req.query.keyword as string | undefined,
        };

        const pagination = {
            pageSize: parseInt(req.query.pageSize as string) || 10,
            pageNumber: parseInt(req.query.pageNumber as string) || 1,
        };

        const result = await getAllSprintsService(
            workspaceId,
            projectId,
            filters,
            pagination
        );

        return res.status(HTTPSTATUS.OK).json({
            message: "Sprints retrieved successfully",
            ...result,
        });
    }
);

export const getSprintByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        const projectId = projectIdSchema.parse(req.params.projectId);
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
        const sprintId = sprintIdSchema.parse(req.params.sprintId);

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.VIEW_PROJECT, Permissions.VIEW_ONLY]); // Allow VIEW_ONLY users to view sprints

        const sprint = await getSprintByIdService(
            workspaceId,
            projectId,
            sprintId
        );

        return res.status(HTTPSTATUS.OK).json({
            message: "Sprint retrieved successfully",
            sprint,
        });
    }
);

export const deleteSprintController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        const projectId = projectIdSchema.parse(req.params.projectId);
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
        const sprintId = sprintIdSchema.parse(req.params.sprintId);

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.DELETE_TASK, Permissions.VIEW_ONLY]); // Allow VIEW_ONLY users to delete sprints

        // Get the deleteTasks option from query parameters
        const deleteTasks = req.query.deleteTasks === 'true';

        const result = await deleteSprintService(
            workspaceId,
            projectId,
            sprintId,
            { deleteTasks }
        );

        await Activity.create({
            projectId: projectId,
            userId: userId,
            type: 'sprint_delete',
            message: `🗑️ Sprint Deleted\n📅 ${format(new Date(), "PPpp")}\n👤 Deleted by ${req.user?.name || 'User'}${deleteTasks ? '\n⚠️ All associated tasks were also deleted' : ''}`,
        });

        return res.status(HTTPSTATUS.OK).json({
            message: result.message,
        });
    }
);

export const getNextSprintNumberController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        const projectId = projectIdSchema.parse(req.params.projectId);
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.VIEW_PROJECT, Permissions.VIEW_ONLY]); // Allow VIEW_ONLY users to get next sprint number

        const result = await getNextSprintNumberService(
            workspaceId,
            projectId
        );

        return res.status(HTTPSTATUS.OK).json({
            message: "Next sprint number retrieved successfully",
            ...result,
        });
    }
); 