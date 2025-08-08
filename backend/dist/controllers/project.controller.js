"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProjectFileController = exports.downloadProjectFileController = exports.uploadProjectFileController = exports.getProjectFilesController = exports.unpinProjectActivityController = exports.pinProjectActivityController = exports.postProjectActivityController = exports.getProjectActivitiesController = exports.deleteProjectController = exports.updateProjectController = exports.getProjectAnalyticsController = exports.getProjectByIdAndWorkspaceIdController = exports.getAllProjectsInWorkspaceController = exports.createProjectController = exports.upload = void 0;
// Controller for handling project-related API endpoints and business logic.
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
const mongoose_1 = __importDefault(require("mongoose"));
const date_fns_1 = require("date-fns");
// Use GridFSBucket and ObjectId from mongoose.mongo to avoid type conflicts
const { GridFSBucket, ObjectId } = mongoose_1.default.mongo;
// Use plain multer with memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});
exports.upload = upload;
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
        message: `Project {{${project.name}}} created`,
    });
    index_1.io.to(workspaceId.toString()).emit('notification', notification);
    await activity_model_1.default.create({
        projectId: project._id,
        userId: userId,
        type: 'project_create',
        message: `🏗️ **Project Created**\n📋 ${project.name}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Created by ${req.user?.name || 'User'}\n📝 ${project.description || 'No description provided'}`,
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
        ? `🔄 **Project Updated**\n📋 ${project.name}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Updated by ${req.user?.name || 'User'}\n📝 Changes: ${changes.join(', ')}`
        : `🔄 **Project Updated**\n📋 ${project.name}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Updated by ${req.user?.name || 'User'}`;
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
        message: `🗑️ **Project Deleted**\n📋 ${project.name}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Deleted by ${req.user?.name || 'User'}\n⚠️ All project data has been permanently removed`,
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
    if (!file || !name) {
        return res.status(400).json({ message: 'File and name are required' });
    }
    try {
        // Get database connection
        const db = mongoose_1.default.connection.db;
        if (!db) {
            return res.status(500).json({ message: 'Database not initialized' });
        }
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        // Use a Promise to handle the async GridFS upload
        const uploadFile = new Promise((resolve, reject) => {
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
        const savedFile = await file_model_1.default.create({
            projectId,
            userId,
            name,
            fileId: fileId,
            size: file.size,
            mimeType: file.mimetype,
            originalName: file.originalname,
        });
        // Fetch project and user for notifications
        const projectModel = await (await Promise.resolve().then(() => __importStar(require('../models/project.model')))).default;
        const userModel = await (await Promise.resolve().then(() => __importStar(require('../models/user.model')))).default;
        const project = await projectModel.findById(projectId);
        const user = await userModel.findById(userId);
        const workspaceId = project?.workspace;
        // Create notification
        if (workspaceId) {
            const notification = await notification_model_1.default.create({
                userId,
                workspaceId,
                type: 'project',
                message: `File '${name}' uploaded to project ${project?.name || ''} by ${user?.name || 'someone'}`,
            });
            index_1.io.to(workspaceId.toString()).emit('notification', notification);
        }
        // Create activity log
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        await activity_model_1.default.create({
            projectId,
            userId,
            type: 'file_upload',
            message: `📁 **File Uploaded**\n📋 ${name}\n📅 ${(0, date_fns_1.format)(new Date(), "PPpp")}\n👤 Uploaded by ${req.user?.name || 'User'}\n💾 Size: ${fileSizeInMB} MB\n📂 File ID: ${fileId}`,
            meta: { fileId: fileId, name, size: file.size },
        });
        res.status(201).json({
            file: savedFile,
            message: 'File uploaded successfully'
        });
    }
    catch (err) {
        console.error('Upload controller error:', err);
        return res.status(500).json({
            message: 'Internal server error',
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});
exports.downloadProjectFileController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { fileId } = req.params;
    try {
        // Get database connection
        const db = mongoose_1.default.connection.db;
        if (!db) {
            return res.status(500).json({ message: 'Database not initialized' });
        }
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const _id = new ObjectId(fileId);
        // Find the file metadata first
        const fileDoc = await file_model_1.default.findOne({ fileId: _id });
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
        const downloadFile = new Promise((resolve, reject) => {
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
    }
    catch (err) {
        console.error('Download controller error:', err);
        // Only send error response if headers haven't been sent
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Download failed',
                error: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    }
});
exports.deleteProjectFileController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { fileId } = req.params;
    try {
        const db = mongoose_1.default.connection.db;
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
        const deletedFile = await file_model_1.default.findOneAndDelete({ fileId: _id });
        if (!deletedFile) {
            console.warn('File deleted from GridFS but not found in File collection');
        }
        res.status(200).json({
            message: 'File deleted successfully',
            fileId: fileId
        });
    }
    catch (err) {
        console.error('Delete controller error:', err);
        return res.status(400).json({
            message: 'Failed to delete file',
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});
