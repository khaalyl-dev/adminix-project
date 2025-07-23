import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { createProjectSchema, projectIdSchema, updateProjectSchema } from "../validation/project.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import { createProjectService, deleteProjectService, getProjectAnalyticsService, getProjectByIdAndWorkspaceIdService, getProjectsInWorkspaceService, updateProjectService } from "../services/project.service";
import { HTTPSTATUS } from "../config/http.config";
import Notification from "../models/notification.model";
import { io } from "../index";
import Activity from '../models/activity.model';
import File from '../models/file.model';
import multer from 'multer';
import path from 'path';
import { Request as ExpressRequest } from 'express';
import { FileFilterCallback } from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { config } from '../config/app.config';
import { ObjectId } from 'mongodb';
import stream from 'stream';
// Use Express.Multer.File for file type


// Use plain multer with memory storage
const upload = multer({ storage: multer.memoryStorage() });
export { upload };


export const createProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createProjectSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_PROJECT]);

    const { project } = await createProjectService(userId, workspaceId, body);
    // Create notification
    const notification = await Notification.create({
      userId,
      workspaceId,
      type: 'project',
      message: `Project '${project.name}' created`,
    });
    io.to(workspaceId.toString()).emit('notification', notification);

    await Activity.create({
      projectId: project._id,
      userId: userId,
      type: 'project_create',
      message: `Project created: ${project.name}`,
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Project created successfully",
      project,
    });
  }
);

export const getAllProjectsInWorkspaceController = asyncHandler(
    async(req:Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const pageSize = parseInt(req.query.pageSize as string ) || 10 ; 
    const pageNumber = parseInt(req.query.pageNumber as string ) || 1 ; 

    const {projects, totalCount, totalPages , skip} =
     await getProjectsInWorkspaceService( workspaceId, pageSize, pageNumber);

     return res.status(HTTPSTATUS.OK).json({
        message: "Project fetched successfully",
        projects, 
        pagination: {
            totalCount, 
            pageSize, 
            pageNumber, 
            totalPages, 
            skip,
            limit:pageSize, 
        },
     });
    }
);

export const getProjectByIdAndWorkspaceIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { project } = await getProjectByIdAndWorkspaceIdService(
      workspaceId,
      projectId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project fetched successfully",
      project,
    });
  }
);


export const getProjectAnalyticsController = asyncHandler (
  async(req: Request, res: Response) => { 
     const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const {analytics} = await getProjectAnalyticsService(
     workspaceId,
      projectId,  
    ); 
    return res.status(HTTPSTATUS.OK).json({
      message:"Project analytics retrieved successfully",
      analytics, 
    });
  }
); 

export const updateProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);
    const body = updateProjectSchema.parse(req.body);
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_PROJECT]);

    // Fetch old project for comparison
    const oldProject = await getProjectByIdAndWorkspaceIdService(workspaceId, projectId);
    const old = oldProject.project;

    const { project } = await updateProjectService(
      workspaceId,
      projectId,
      body
    );
    // Create notification
    const notification = await Notification.create({
      userId,
      workspaceId,
      type: 'project',
      message: `Project '${project.name}' updated`,
    });
    io.to(workspaceId.toString()).emit('notification', notification);

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

    await Activity.create({
      projectId: project._id,
      userId: userId,
      type: 'project_update',
      message: activityMsg,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Project updated successfully",
      project,
    });
  }
);

export const deleteProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_PROJECT]);
    const project = await deleteProjectService(workspaceId, projectId);
    // Create notification
    const notification = await Notification.create({
      userId,
      workspaceId,
      type: 'project',
      message: `Project '${project.name}' deleted`,
    });
    io.to(workspaceId.toString()).emit('notification', notification);
    await Activity.create({
      projectId: project._id,
      userId: userId,
      type: 'project_delete',
      message: `Project deleted: ${project.name}`,
    });
    return res.status(HTTPSTATUS.OK).json({
      message: 'Project deleted successfully',
      project,
    });
  }
);

export const getProjectActivitiesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: projectId } = req.params;
    const activities = await Activity.find({ projectId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name profilePicture');
    res.status(200).json({ activities });
  }
);

export const postProjectActivityController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: projectId } = req.params;
    const userId = req.user?._id;
    const { type, message, meta } = req.body;
    if (!type || !message) {
      return res.status(400).json({ message: 'Type and message are required' });
    }
    const activity = await Activity.create({
      projectId,
      userId,
      type,
      message,
      meta,
    });
    await activity.populate('userId', 'name profilePicture');
    res.status(201).json({ activity });
  }
);

export const pinProjectActivityController = asyncHandler(
  async (req: Request, res: Response) => {
    const { activityId } = req.params;
    const activity = await Activity.findByIdAndUpdate(activityId, { pinned: true }, { new: true });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.status(200).json({ activity });
  }
);

export const unpinProjectActivityController = asyncHandler(
  async (req: Request, res: Response) => {
    const { activityId } = req.params;
    const activity = await Activity.findByIdAndUpdate(activityId, { pinned: false }, { new: true });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.status(200).json({ activity });
  }
);

export const getProjectFilesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: projectId } = req.params;
    const files = await File.find({ projectId }).sort({ uploadedAt: -1 });
    res.status(200).json({ files });
  }
);

export const uploadProjectFileController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: projectId } = req.params;
    const userId = req.user?._id;
    const file = req.file;
    const name = req.body.name || (file ? file.originalname : undefined);
    if (!file || !name) return res.status(400).json({ message: 'File and name are required' });

    // Stream file buffer to GridFS
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { projectId }
    });
    uploadStream.end(file.buffer);
    uploadStream.on('error', (err) => {
      return res.status(500).json({ message: 'Error uploading file', error: err.message });
    });
    uploadStream.on('finish', async () => {
      const savedFile = await File.create({
        projectId,
        userId,
        name,
        fileId: uploadStream.id, // use the id from the stream
      });
      // Fetch project and user to get workspaceId, project name, and uploader name
      const projectModel = await (await import('../models/project.model')).default;
      const userModel = await (await import('../models/user.model')).default;
      const project = await projectModel.findById(projectId);
      const user = await userModel.findById(userId);
      const workspaceId = project?.workspace;
      // Create notification
      if (workspaceId) {
        const notification = await Notification.create({
          userId,
          workspaceId,
          type: 'project',
          message: `File '${name}' uploaded to project ${project?.name || ''} by ${user?.name || 'someone'}`,
        });
        io.to(workspaceId.toString()).emit('notification', notification);
      }
      // Create activity log
      await Activity.create({
        projectId,
        userId,
        type: 'file_upload',
        message: `File uploaded: ${name}`,
        meta: { fileId: uploadStream.id, name },
      });
      res.status(201).json({ file: savedFile });
    });
  }
);

export const downloadProjectFileController = asyncHandler(
  async (req: Request, res: Response) => {
    const { fileId } = req.params;
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    try {
      const _id = new ObjectId(fileId);
      // Find the file metadata to get the original name
      const fileDoc = await File.findOne({ fileId: _id });
      const filename = fileDoc?.name || 'downloaded-file';
      const downloadStream = bucket.openDownloadStream(_id);
      downloadStream.on('error', () => res.status(404).json({ message: 'File not found' }));
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
      downloadStream.pipe(res);
    } catch (err) {
      res.status(400).json({ message: 'Invalid file ID' });
    }
  }
);

export const deleteProjectFileController = asyncHandler(
  async (req: Request, res: Response) => {
    const { fileId } = req.params;
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    try {
      const _id = new ObjectId(fileId);
      // Delete from GridFS
      await bucket.delete(_id);
      // Delete from File model
      await File.findOneAndDelete({ fileId: _id });
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
      res.status(400).json({ message: 'Failed to delete file', error: err instanceof Error ? err.message : err });
    }
  }
);