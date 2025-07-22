"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsReadController = exports.getWorkspaceNotificationsController = exports.deleteWorkspaceByIdController = exports.updateWorkspaceByIdController = exports.changeWorkspaceMemberRoleController = exports.getWorkspaceAnalyticsController = exports.getWorkspaceMembersController = exports.getWorkspaceByIdController = exports.getAllWorkspacesUserIsMemberController = exports.createWorkspaceController = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const workspace_validation_1 = require("../validation/workspace.validation");
const http_config_1 = require("../config/http.config");
const workspace_service_1 = require("../services/workspace.service");
const member_service_1 = require("../services/member.service");
const roleGuard_1 = require("../utils/roleGuard");
const role_enum_1 = require("../enums/role.enum");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const index_1 = require("../index");
const mongoose_1 = __importDefault(require("mongoose"));
exports.createWorkspaceController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = workspace_validation_1.createWorkspaceSchema.parse(req.body);
    const userId = req.user?._id;
    const { workspace } = await (0, workspace_service_1.createWorkspaceService)(userId, body);
    const workspaceId = workspace._id?.toString();
    if (!workspaceId)
        throw new Error("Workspace ID is missing");
    console.log("Creating notification (workspace)", { userId, workspaceId, type: 'workspace', message: `Workspace '${workspace.name}' created` });
    // Create notification
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId,
        type: 'workspace',
        message: `Workspace '${workspace.name}' created`,
    });
    index_1.io.to(workspaceId).emit('notification', notification);
    return res.status(http_config_1.HTTPSTATUS.CREATED).json({
        message: "Workspace created successfully",
        workspace,
    });
});
/**Controller : get all workspaces the user is a part of  */
exports.getAllWorkspacesUserIsMemberController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const { workspaces } = await (0, workspace_service_1.getAllWorkspacesUserIsMemberService)(userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User workspaces fetched successfully",
        workspaces,
    });
});
exports.getWorkspaceByIdController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    const { workspace } = await (0, workspace_service_1.getWorkspaceByIdService)(workspaceId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Workspace fetched successfully",
        workspace,
    });
});
exports.getWorkspaceMembersController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.VIEW_ONLY]);
    const { members, roles } = await (0, workspace_service_1.getWorkspaceMembersService)(workspaceId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Workspace members retrived successfully",
        members,
        roles,
    });
});
exports.getWorkspaceAnalyticsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.VIEW_ONLY]);
    const { analytics } = await (0, workspace_service_1.getWorkspaceAnalyticsService)(workspaceId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Workspace analytics retrived successfully",
        analytics,
    });
});
exports.changeWorkspaceMemberRoleController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.id);
    const { memberId, roleId } = workspace_validation_1.changeRoleSchema.parse(req.body);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.CHANGE_MEMBER_ROLE]);
    const { member } = await (0, workspace_service_1.changeMemberRoleService)(workspaceId, memberId, roleId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Member Role changed successfully",
        member,
    });
});
exports.updateWorkspaceByIdController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.id);
    const { name, description } = workspace_validation_1.updateWorkspaceSchema.parse(req.body);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.EDIT_WORKSPACE]);
    const { workspace } = await (0, workspace_service_1.updateWorkspaceByIdService)(workspaceId, name, description);
    // Create notification
    if (!workspaceId)
        throw new Error("Workspace ID is missing");
    console.log("Creating notification (workspace)", { userId, workspaceId, type: 'workspace', message: `Workspace '${workspace.name}' updated` });
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId,
        type: 'workspace',
        message: `Workspace '${workspace.name}' updated`,
    });
    index_1.io.to(workspaceId).emit('notification', notification);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Workspace updated successfully",
        workspace
    });
});
exports.deleteWorkspaceByIdController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.DELETE_WORKSPACE]);
    const { currentWorkspace } = await (0, workspace_service_1.deleteWorkspaceService)(workspaceId, userId);
    // Create notification
    if (!workspaceId)
        throw new Error("Workspace ID is missing");
    console.log("Creating notification (workspace)", { userId, workspaceId, type: 'workspace', message: `Workspace deleted` });
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId: workspaceId.toString(),
        type: 'workspace',
        message: `Workspace deleted`,
    });
    index_1.io.to(workspaceId).emit('notification', notification);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Workspace deleted successfully",
        currentWorkspace,
    });
});
exports.getWorkspaceNotificationsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = req.params.id;
    if (!mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({ message: 'Invalid workspaceId' });
    }
    try {
        const notifications = await notification_model_1.default.find({ workspaceId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name profilePicture');
        return res.status(200).json({
            message: "Notifications fetched successfully",
            notifications,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ message: 'Failed to fetch notifications', error: errorMessage });
    }
});
exports.markAllNotificationsAsReadController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = req.params.id;
    if (!mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({ message: 'Invalid workspaceId' });
    }
    await notification_model_1.default.updateMany({ workspaceId, read: false }, { $set: { read: true } });
    return res.status(200).json({ message: 'All notifications marked as read' });
});
