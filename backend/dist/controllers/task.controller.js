"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskAIPredictionsController = exports.getTasksBySprintController = exports.deleteTaskCommentController = exports.editTaskCommentController = exports.postTaskCommentController = exports.getTaskCommentsController = exports.deleteTaskController = exports.getTaskByIdController = exports.getAllTasksController = exports.updateTaskController = exports.createTaskController = void 0;
// Controller for handling task-related API endpoints and business logic.
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const project_validation_1 = require("../validation/project.validation");
const workspace_validation_1 = require("../validation/workspace.validation");
const sprint_validation_1 = require("../validation/sprint.validation");
const roleGuard_1 = require("../utils/roleGuard");
const http_config_1 = require("../config/http.config");
const role_enum_1 = require("../enums/role.enum");
const task_validation_1 = require("../validation/task.validation");
const member_service_1 = require("../services/member.service");
const task_service_1 = require("../services/task.service");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const index_1 = require("../index");
const comment_model_1 = __importDefault(require("../models/comment.model"));
const activity_model_1 = __importDefault(require("../models/activity.model"));
const task_model_1 = __importDefault(require("../models/task.model"));
const app_error_1 = require("../utils/app.error");
const date_fns_1 = require("date-fns");
exports.createTaskController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const body = task_validation_1.createTaskSchema.parse(req.body);
    const projectId = project_validation_1.projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.CREATE_TASK]);
    const { task } = await (0, task_service_1.createTaskService)(workspaceId, projectId, userId, body);
    // Create notification
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId,
        type: 'task',
        message: `Task {{${task.title}}} created`,
    });
    index_1.io.to(workspaceId.toString()).emit('notification', notification);
    await activity_model_1.default.create({
        projectId: projectId,
        userId: userId,
        type: 'task_create',
        message: `✅ **Task Created**\n📋 ${task.title}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Created by ${req.user?.name || 'User'}\n🎯 Priority: ${task.priority || 'Medium'}\n📝 Status: ${task.status || 'To Do'}`,
    });
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Task created successfully",
        task,
    });
});
exports.updateTaskController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const taskId = task_validation_1.taskIdSchema.parse(req.params.id);
    const projectId = project_validation_1.projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const body = task_validation_1.updateTaskSchema.parse(req.body);
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.EDIT_TASK]);
    // Fetch old task for comparison
    const oldTask = await task_model_1.default.findById(taskId);
    if (!oldTask) {
        throw new app_error_1.NotFoundException("Task not found.");
    }
    const { updatedTask } = await (0, task_service_1.updateTaskService)(workspaceId, projectId, taskId, body);
    // Create notification
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId,
        type: 'task',
        message: `Task '${updatedTask.title}' updated`,
    });
    index_1.io.to(workspaceId.toString()).emit('notification', notification);
    // Build activity message with attribute changes
    let changes = [];
    if (body.title && body.title !== oldTask.title) {
        changes.push(`title from "${oldTask.title}" to "${body.title}"`);
    }
    if (body.description && body.description !== oldTask.description) {
        changes.push(`description from "${oldTask.description || ''}" to "${body.description}"`);
    }
    if (body.priority && body.priority !== oldTask.priority) {
        changes.push(`priority from "${oldTask.priority}" to "${body.priority}"`);
    }
    if (body.status && body.status !== oldTask.status) {
        changes.push(`status from "${oldTask.status}" to "${body.status}"`);
    }
    if (body.assignedTo && (!oldTask.assignedTo || body.assignedTo.toString() !== oldTask.assignedTo.toString())) {
        changes.push(`assignedTo from "${oldTask.assignedTo || ''}" to "${body.assignedTo}"`);
    }
    if (body.dueDate && oldTask.dueDate && new Date(body.dueDate).toISOString() !== oldTask.dueDate.toISOString()) {
        changes.push(`dueDate from "${oldTask.dueDate.toISOString()}" to "${new Date(body.dueDate).toISOString()}"`);
    }
    const activityMsg = changes.length > 0
        ? `🔄 **Task Updated**\n📋 ${updatedTask.title}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Updated by ${req.user?.name || 'User'}\n📝 Changes: ${changes.join(', ')}`
        : `🔄 **Task Updated**\n📋 ${updatedTask.title}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Updated by ${req.user?.name || 'User'}`;
    await activity_model_1.default.create({
        projectId: projectId,
        userId: userId,
        type: 'task_update',
        message: activityMsg,
    });
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Task updated successfully",
        task: updatedTask,
    });
});
exports.getAllTasksController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const filters = {
        projectId: req.query.projectId,
        status: req.query.status
            ? req.query.status?.split(",")
            : undefined,
        priority: req.query.priority
            ? req.query.priority?.split(",")
            : undefined,
        assignedTo: req.query.assignedTo
            ? req.query.assignedTo?.split(",")
            : undefined,
        keyword: req.query.keyword,
        dueDate: req.query.dueDate,
        sprintId: req.query.sprintId,
    };
    const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
    };
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.VIEW_ONLY]);
    const result = await (0, task_service_1.getAllTasksService)(workspaceId, filters, pagination);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "All tasks fetched successfully",
        ...result,
    });
});
exports.getTaskByIdController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const taskId = task_validation_1.taskIdSchema.parse(req.params.id);
    const projectId = project_validation_1.projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.VIEW_ONLY]);
    const task = await (0, task_service_1.getTaskByIdService)(workspaceId, projectId, taskId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Task fetched successfully",
        task,
    });
});
exports.deleteTaskController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const taskId = task_validation_1.taskIdSchema.parse(req.params.id);
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = project_validation_1.projectIdSchema.parse(req.params.projectId);
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.DELETE_TASK]);
    // Fetch the task before deleting to get its title
    const oldTask = await task_model_1.default.findById(taskId);
    if (!oldTask) {
        throw new app_error_1.NotFoundException("Task not found.");
    }
    await (0, task_service_1.deleteTaskService)(workspaceId, taskId);
    // Create notification
    const notification = await notification_model_1.default.create({
        userId,
        workspaceId,
        type: 'task',
        message: `Task deleted`,
    });
    index_1.io.to(workspaceId.toString()).emit('notification', notification);
    await activity_model_1.default.create({
        projectId: projectId,
        userId: userId,
        type: 'task_delete',
        message: `🗑️ **Task Deleted**\n📋 ${oldTask.title}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Deleted by ${req.user?.name || 'User'}\n⚠️ Task ID: ${taskId}`,
    });
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Task deleted successfully",
    });
});
exports.getTaskCommentsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id: taskId } = req.params;
    const comments = await comment_model_1.default.find({ taskId })
        .sort({ createdAt: 1 })
        .populate('userId', 'name profilePicture');
    res.status(200).json({ comments });
});
exports.postTaskCommentController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id: taskId } = req.params;
    const userId = req.user?._id;
    const { message } = req.body;
    if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Message is required' });
    }
    const comment = await comment_model_1.default.create({
        taskId,
        userId,
        message,
    });
    await comment.populate('userId', 'name profilePicture');
    // Log activity
    const task = await task_model_1.default.findById(taskId);
    await activity_model_1.default.create({
        projectId: task?.project,
        userId,
        type: 'comment_create',
        message: `💬 **Comment Added**\n📋 ${task?.title || 'Task'}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Commented by ${req.user?.name || 'User'}\n💭 ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
    });
    res.status(201).json({ comment });
});
exports.editTaskCommentController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id: taskId, commentId } = req.params;
    const userId = req.user?._id;
    const { message } = req.body;
    if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Message is required' });
    }
    const comment = await comment_model_1.default.findOne({ _id: commentId, taskId });
    if (!comment)
        return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'You can only edit your own comments' });
    }
    comment.message = message;
    await comment.save();
    await comment.populate('userId', 'name profilePicture');
    // Log activity
    const task = await task_model_1.default.findById(taskId);
    await activity_model_1.default.create({
        projectId: task?.project,
        userId,
        type: 'comment_edit',
        message: `✏️ **Comment Edited**\n📋 ${task?.title || 'Task'}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Edited by ${req.user?.name || 'User'}\n💭 ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
    });
    res.status(200).json({ comment });
});
exports.deleteTaskCommentController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id: taskId, commentId } = req.params;
    const userId = req.user?._id;
    const comment = await comment_model_1.default.findOne({ _id: commentId, taskId });
    if (!comment)
        return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    await comment.deleteOne();
    // Log activity
    const task = await task_model_1.default.findById(taskId);
    await activity_model_1.default.create({
        projectId: task?.project,
        userId,
        type: 'comment_delete',
        message: `🗑️ **Comment Deleted**\n📋 ${task?.title || 'Task'}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Deleted by ${req.user?.name || 'User'}\n💭 Comment removed`,
    });
    res.status(204).send();
});
exports.getTasksBySprintController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = project_validation_1.projectIdSchema.parse(req.params.projectId);
    const sprintId = sprint_validation_1.sprintIdSchema.parse(req.params.sprintId);
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.VIEW_PROJECT, role_enum_1.Permissions.VIEW_ONLY]);
    const result = await (0, task_service_1.getTasksBySprintService)(workspaceId, projectId, sprintId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Tasks retrieved successfully",
        ...result,
    });
});
exports.updateTaskAIPredictionsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const taskId = task_validation_1.taskIdSchema.parse(req.params.id);
    const projectId = project_validation_1.projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspace_validation_1.workspaceIdSchema.parse(req.params.workspaceId);
    const body = req.body;
    const { role } = await (0, member_service_1.getMemberRoleInWorkspace)(userId, workspaceId);
    (0, roleGuard_1.roleGuard)(role, [role_enum_1.Permissions.EDIT_TASK]);
    const { updatedTask } = await (0, task_service_1.updateTaskAIPredictionsService)(workspaceId, projectId, taskId, {
        aiComplexity: body.aiComplexity,
        aiRisk: body.aiRisk,
        aiPriority: body.aiPriority,
    });
    await activity_model_1.default.create({
        projectId: projectId,
        userId: userId,
        type: 'task_update',
        message: `AI predictions updated for task: ${updatedTask.title}`,
    });
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Task AI predictions updated successfully",
        task: updatedTask,
    });
});
