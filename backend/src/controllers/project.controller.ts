// Controller for handling project-related API endpoints and business logic.
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
import { Readable } from 'stream';
import { format } from "date-fns";

// Use GridFSBucket and ObjectId from mongoose.mongo to avoid type conflicts
const { GridFSBucket, ObjectId } = mongoose.mongo;
import { config } from '../config/app.config';

// Use plain multer with memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});
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
      message: `Project {{${project.name}}} created`,
    });
    io.to(workspaceId.toString()).emit('notification', notification);

    await Activity.create({
      projectId: project._id,
      userId: userId,
      type: 'project_create',
      message: `🏗️ Project Created\n📋 ${project.name}\n📅 ${format(new Date(), "PPpp")}\n👤 Created by ${req.user?.name || 'User'}\n📝 ${project.description || 'No description provided'}`,
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
      ? `🔄 Project Updated\n📋 ${project.name}\n📅 ${format(new Date(), "PPpp")}\n👤 Updated by ${req.user?.name || 'User'}\n📝 Changes: ${changes.join(', ')}`
      : `🔄 Project Updated\n📋 ${project.name}\n📅 ${format(new Date(), "PPpp")}\n👤 Updated by ${req.user?.name || 'User'}`;

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
      message: `🗑️ Project Deleted\n📋 ${project.name}\n📅 ${format(new Date(), "PPpp")}\n👤 Deleted by ${req.user?.name || 'User'}\n⚠️ All project data has been permanently removed`,
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

    if (!file || !name) {
      return res.status(400).json({ message: 'File and name are required' });
    }

    try {
      // Get database connection
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ message: 'Database not initialized' });
      }

      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

      // Use a Promise to handle the async GridFS upload
      const uploadFile = new Promise<mongoose.Types.ObjectId>((resolve, reject) => {
        // Create upload stream with proper metadata
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
          metadata: { 
            projectId,
            userId,
            originalName: file.originalname,
            size: file.size,
            uploadedAt: new Date()
          }
        });

        // Handle upload errors
        uploadStream.on('error', (err) => {
          console.error('GridFS upload error:', err);
          reject(err);
        });

        // Handle successful upload
        uploadStream.on('finish', () => {
          console.log('File uploaded successfully to GridFS:', uploadStream.id);
          resolve(uploadStream.id);
        });

        // Write the buffer directly to the upload stream
        uploadStream.end(file.buffer);
      });

      // Wait for the upload to complete
      const fileId = await uploadFile;

      // Save file metadata to File collection
      const savedFile = await File.create({
        projectId,
        userId,
        name,
        fileId: fileId,
        size: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname,
      });

      // Fetch project and user for notifications
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
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      await Activity.create({
        projectId,
        userId,
        type: 'file_upload',
        message: `📁 File Uploaded\n📋 ${name}\n📅 ${format(new Date(), "PPpp")}\n👤 Uploaded by ${req.user?.name || 'User'}\n💾 Size: ${fileSizeInMB} MB`,
        meta: { fileId: fileId, name, size: file.size },
      });

      res.status(201).json({ 
        file: savedFile,
        message: 'File uploaded successfully'
      });

    } catch (err) {
      console.error('Upload controller error:', err);
      return res.status(500).json({ 
        message: 'Internal server error', 
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
);

export const downloadProjectFileController = asyncHandler(
  async (req: Request, res: Response) => {
    const { fileId } = req.params;

    try {
      // Get database connection
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ message: 'Database not initialized' });
      }

      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
      const _id = new ObjectId(fileId);

      // Find the file metadata first
      const fileDoc = await File.findOne({ fileId: _id });
      if (!fileDoc) {
        return res.status(404).json({ message: 'File record not found' });
      }

      // Check if file exists in GridFS
      const files = await bucket.find({ _id }).toArray();
      if (files.length === 0) {
        return res.status(404).json({ message: 'File not found in GridFS' });
      }

      const gridFile = files[0];
      const filename = fileDoc.name || gridFile.filename || 'downloaded-file';
      const contentType = gridFile.contentType || fileDoc.mimeType || 'application/octet-stream';

      // Log file info for debugging
      console.log('Downloading file:', {
        filename,
        contentType,
        size: gridFile.length,
        fileId: _id.toString()
      });

      // Set proper headers before starting the stream
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', gridFile.length.toString());
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Create a promise to handle the download stream
      const downloadFile = new Promise<void>((resolve, reject) => {
        const downloadStream = bucket.openDownloadStream(_id);

        downloadStream.on('error', (err) => {
          console.error('Download stream error:', err);
          reject(err);
        });

        downloadStream.on('end', () => {
          console.log('File download completed successfully:', filename);
          resolve();
        });

        // Pipe the download stream to response
        downloadStream.pipe(res);
      });

      // Wait for download to complete
      await downloadFile;

    } catch (err) {
      console.error('Download controller error:', err);
      
      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: 'Download failed',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  }
);

export const deleteProjectFileController = asyncHandler(
  async (req: Request, res: Response) => {
    const { fileId } = req.params;

    try {
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ message: 'Database not initialized' });
      }

      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
      const _id = new ObjectId(fileId);

      // Check if file exists before deletion
      const files = await bucket.find({ _id }).toArray();
      if (files.length === 0) {
        return res.status(404).json({ message: 'File not found in GridFS' });
      }

      // Delete from GridFS
      await bucket.delete(_id);

      // Delete from File model
      const deletedFile = await File.findOneAndDelete({ fileId: _id });
      if (!deletedFile) {
        console.warn('File deleted from GridFS but not found in File collection');
      }

      res.status(200).json({ 
        message: 'File deleted successfully',
        fileId: fileId
      });

    } catch (err) {
      console.error('Delete controller error:', err);
      return res.status(400).json({ 
        message: 'Failed to delete file', 
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
);