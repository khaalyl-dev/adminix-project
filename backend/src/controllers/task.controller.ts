// Controller for handling task-related API endpoints and business logic.
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request ,  Response, } from "express";
import { projectIdSchema } from "../validation/project.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { roleGuard } from "../utils/roleGuard";
import { HTTPSTATUS } from "../config/http.config";
import { Permissions } from "../enums/role.enum";
import { createTaskSchema, taskIdSchema, updateTaskSchema } from "../validation/task.validation";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { createTaskService, deleteTaskService, getAllTasksService, getTaskByIdService, updateTaskService } from "../services/task.service";
import Notification from "../models/notification.model";
import { io } from "../index";
import Comment from '../models/comment.model';
import Activity from '../models/activity.model';
import TaskModel from '../models/task.model';
import { NotFoundException } from "../utils/app.error";


export const createTaskController = asyncHandler(
    async(req: Request, res: Response) => {
const userId = req.user?._id;

    const body = createTaskSchema.parse(req.body);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_TASK]);

    const { task } = await createTaskService(
      workspaceId,
      projectId,
      userId,
      body
    );
    // Create notification
    const notification = await Notification.create({
      userId,
      workspaceId,
      type: 'task',
      message: `Task {{${task.title}}} created`,
    });
    io.to(workspaceId.toString()).emit('notification', notification);

    await Activity.create({
      projectId: projectId,
      userId: userId,
      type: 'task_create',
      message: `Task created: {{${task.title}}}`,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Task created successfully",
      task,
    });
  }   
); 


export const updateTaskController = asyncHandler(
    async(req: Request, res: Response) => {
        const userId = req.user?._id;
        const taskId = taskIdSchema.parse(req.params.id);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
        const body = updateTaskSchema.parse(req.body);
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.EDIT_TASK]);

        // Fetch old task for comparison
        const oldTask = await TaskModel.findById(taskId);
        if (!oldTask) {
          throw new NotFoundException("Task not found.");
        }

        const { updatedTask } = await updateTaskService(
          workspaceId,
          projectId,
          taskId,
          body
        );
        // Create notification
        const notification = await Notification.create({
          userId,
          workspaceId,
          type: 'task',
          message: `Task '${updatedTask.title}' updated`,
        });
        io.to(workspaceId.toString()).emit('notification', notification);

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
          ? `Task updated: ${changes.join(', ')}`
          : `Task updated: ${updatedTask.title}`;

        await Activity.create({
          projectId: projectId,
          userId: userId,
          type: 'task_update',
          message: activityMsg,
        });

        return res.status(HTTPSTATUS.OK).json({
          message: "Task updated successfully",
          task: updatedTask,
        });
    }
);

export const getAllTasksController = asyncHandler(
  async(req: Request, res: Response) => {
    const userId = req.user?._id; 

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId); 
    const filters = {
      projectId: req.query.projectId as string | undefined, 
      status: req.query.status
      ?(req.query.status as string)?.split(",")
      : undefined, 
       priority: req.query.priority
        ? (req.query.priority as string)?.split(",")
        : undefined,
      assignedTo: req.query.assignedTo
        ? (req.query.assignedTo as string)?.split(",")
        : undefined,
      keyword: req.query.keyword as string | undefined,
      dueDate: req.query.dueDate as string | undefined,
    }; 
     const pagination = {
      pageSize: parseInt(req.query.pageSize as string) || 10,
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
    };
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);
    const result = await getAllTasksService(workspaceId, filters, pagination);

    return res.status(HTTPSTATUS.OK).json({
      message: "All tasks fetched successfully",
      ...result,
    });
  }
); 

export const getTaskByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const task = await getTaskByIdService(
      workspaceId,
      projectId,
      taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task fetched successfully",
      task,
    });
  }
); 

export const deleteTaskController = asyncHandler(
  async(req: Request, res: Response) => {
    const userId = req.user?._id; 
    
    const taskId = taskIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.projectId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_TASK]);

    await deleteTaskService(workspaceId, taskId);
    // Create notification
    const notification = await Notification.create({
      userId,
      workspaceId,
      type: 'task',
      message: `Task deleted`,
    });
    io.to(workspaceId.toString()).emit('notification', notification);

    await Activity.create({
      projectId: projectId,
      userId: userId,
      type: 'task_delete',
      message: `Task deleted: ${taskId}`,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Task deleted successfully",
    });

  }
); 

export const getTaskCommentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: taskId } = req.params;
    const comments = await Comment.find({ taskId })
      .sort({ createdAt: 1 })
      .populate('userId', 'name profilePicture');
    res.status(200).json({ comments });
  }
);

export const postTaskCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: taskId } = req.params;
    const userId = req.user?._id;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const comment = await Comment.create({
      taskId,
      userId,
      message,
    });
    await comment.populate('userId', 'name profilePicture');
    // Log activity
    const task = await TaskModel.findById(taskId);
    await Activity.create({
      projectId: task?.project,
      userId,
      type: 'comment_create',
      message: `Commented: ${message}`,
    });
    res.status(201).json({ comment });
  }
); 

export const editTaskCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: taskId, commentId } = req.params;
    const userId = req.user?._id;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const comment = await Comment.findOne({ _id: commentId, taskId });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }
    comment.message = message;
    await comment.save();
    await comment.populate('userId', 'name profilePicture');
    // Log activity
    const task = await TaskModel.findById(taskId);
    await Activity.create({
      projectId: task?.project,
      userId,
      type: 'comment_edit',
      message: `Edited a comment: ${message}`,
    });
    res.status(200).json({ comment });
  }
);

export const deleteTaskCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: taskId, commentId } = req.params;
    const userId = req.user?._id;
    const comment = await Comment.findOne({ _id: commentId, taskId });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    await comment.deleteOne();
    // Log activity
    const task = await TaskModel.findById(taskId);
    await Activity.create({
      projectId: task?.project,
      userId,
      type: 'comment_delete',
      message: `Deleted a comment`,
    });
    res.status(204).send();
  }
); 