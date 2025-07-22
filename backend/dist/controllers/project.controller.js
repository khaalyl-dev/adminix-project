"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProjectFileController = exports.getProjectFilesController = exports.unpinProjectActivityController = exports.pinProjectActivityController = exports.postProjectActivityController = exports.getProjectActivitiesController = exports.deleteProjectController = exports.updateProjectController = exports.getProjectAnalyticsController = exports.getProjectByIdAndWorkspaceIdController = exports.getAllProjectsInWorkspaceController = exports.createProjectController = exports.upload = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const project_validation_1 = require("../validation/project.validation");
const workspace_validation_1 = require("../validation/workspace.validation");
const member_service_1 = require("../services/member.service");
const roleGuard_1 = require("../utils/roleGuard");
const role_enum_1 = require("../enums/role.enum");
const project_service_1 = require("../services/project.service");
const http_config_1 = require("../config/http.config");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const index_1 = require("../index");
const activity_model_1 = __importDefault(require("../models/activity.model"));
const file_model_1 = __importDefault(require("../models/file.model"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Use Express.Multer.File for file type
// Multer setup
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
exports.upload = (0, multer_1.default)({ storage });
exports.createProjectController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = project_validation_1.createProjectSchema.parse(req.body);
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.CREATE_PROJECT]);
    const { project } = await (0, project_service_1.createProjectService)(userId, workspaceId, body);
    // Create notification
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId,
        type: 'project',
        message: `Project '${project.name}' created`,
    });
    index_1.io.to(workspaceId.toString()).emit('notification', notification);
    await activity_model_1.default.create({
        projectId: project._id,
        userId: userId,
        type: 'project_create',
        message: `Project created: ${project.name}`,
    });
    return res.status(http_config_1.HTTPSTATUS.CREATED).json({
        message: "Project created successfully",
        project,
    });
});
exports.getAllProjectsInWorkspaceController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.VIEW_ONLY]);
    const pageSize = parseInt(req.query.pageSize) || 10;
    const pageNumber = parseInt(req.query.pageNumber) || 1;
    const { projects, totalCount, totalPages, skip } = await (0, project_service_1.getProjectsInWorkspaceService)(workspaceId, pageSize, pageNumber);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Project fetched successfully",
        projects,
        pagination: {
            totalCount,
            pageSize,
            pageNumber,
            totalPages,
            skip,
            limit: pageSize,
        },
    });
});
exports.getProjectByIdAndWorkspaceIdController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const projectId = project_validation_1.projectIdSchema.parse(req.params.id);
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.VIEW_ONLY]);
    const { project } = await (0, project_service_1.getProjectByIdAndWorkspaceIdService)(workspaceId, projectId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Project fetched successfully",
        project,
    });
});
exports.getProjectAnalyticsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const projectId = project_validation_1.projectIdSchema.parse(req.params.id);
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.VIEW_ONLY]);
    const { analytics } = await (0, project_service_1.getProjectAnalyticsService)(workspaceId, projectId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Project analytics retrieved successfully",
        analytics,
    });
});
exports.updateProjectController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = project_validation_1.projectIdSchema.parse(req.params.id);
    const body = project_validation_1.updateProjectSchema.parse(req.body);
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.EDIT_PROJECT]);
    // Fetch old project for comparison
    const oldProject = await (0, project_service_1.getProjectByIdAndWorkspaceIdService)(workspaceId, projectId);
    const old = oldProject.project;
    const { project } = await (0, project_service_1.updateProjectService)(workspaceId, projectId, body);
    // Create notification
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId,
        type: 'project',
        message: `Project '${project.name}' updated`,
    });
    index_1.io.to(workspaceId.toString()).emit('notification', notification);
    // Build activity message with attribute changes
    let changes = [];
    if (body.name && body.name !== old.name) {
        changes.push(`name from "${old.name}" to "${body.name}"`);
    }
    if (body.description && body.description !== old.description) {
        changes.push(`description from "${old.description || ''}" to "${body.description}"`);
    }
    if (body.emoji && body.emoji !== old.emoji) {
        changes.push(`emoji from "${old.emoji || ''}" to "${body.emoji}"`);
    }
    const activityMsg = changes.length > 0
        ? `Project updated: ${changes.join(', ')}`
        : `Project updated: ${project.name}`;
    await activity_model_1.default.create({
        projectId: project._id,
        userId: userId,
        type: 'project_update',
        message: activityMsg,
    });
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Project updated successfully",
        project,
    });
});
exports.deleteProjectController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = project_validation_1.projectIdSchema.parse(req.params.id);
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.DELETE_PROJECT]);
    const project = await (0, project_service_1.deleteProjectService)(workspaceId, projectId);
    // Create notification
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId,
        type: 'project',
        message: `Project '${project.name}' deleted`,
    });
    index_1.io.to(workspaceId.toString()).emit('notification', notification);
    await activity_model_1.default.create({
        projectId: project._id,
        userId: userId,
        type: 'project_delete',
        message: `Project deleted: ${project.name}`,
    });
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: 'Project deleted successfully',
        project,
    });
});
exports.getProjectActivitiesController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id: projectId } = req.params;
    const activities = await activity_model_1.default.find({ projectId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name profilePicture');
    res.status(200).json({ activities });
});
exports.postProjectActivityController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id: projectId } = req.params;
    const userId = req.user?._id;
    const { type, message, meta } = req.body;
    if (!type || !message) {
        return res.status(400).json({ message: 'Type and message are required' });
    }
    const activity = await activity_model_1.default.create({
        projectId,
        userId,
        type,
        message,
        meta,
    });
    await activity.populate('userId', 'name profilePicture');
    res.status(201).json({ activity });
});
exports.pinProjectActivityController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { activityId } = req.params;
    const activity = await activity_model_1.default.findByIdAndUpdate(activityId, { pinned: true }, { new: true });
    if (!activity)
        return res.status(404).json({ message: 'Activity not found' });
    res.status(200).json({ activity });
});
exports.unpinProjectActivityController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { activityId } = req.params;
    const activity = await activity_model_1.default.findByIdAndUpdate(activityId, { pinned: false }, { new: true });
    if (!activity)
        return res.status(404).json({ message: 'Activity not found' });
    res.status(200).json({ activity });
});
exports.getProjectFilesController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id: projectId } = req.params;
    const files = await file_model_1.default.find({ projectId }).sort({ uploadedAt: -1 });
    res.status(200).json({ files });
});
exports.uploadProjectFileController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id: projectId } = req.params;
    const userId = req.user?._id;
    const file = req.file;
    const name = req.body.name || (file ? file.originalname : undefined);
    if (!file || !name)
        return res.status(400).json({ message: 'File and name are required' });
    const url = `/uploads/${file.filename}`;
    const savedFile = await file_model_1.default.create({ projectId, userId, name, url });
    res.status(201).json({ file: savedFile });
});
