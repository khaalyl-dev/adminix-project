"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Express route definitions for project-related API endpoints.
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const projectRoutes = (0, express_1.Router)();
// Project CRUD routes
projectRoutes.post("/workspace/:workspaceId/create", project_controller_1.createProjectController);
projectRoutes.put("/:id/workspace/:workspaceId/update", project_controller_1.updateProjectController);
projectRoutes.delete("/:id/workspace/:workspaceId/delete", project_controller_1.deleteProjectController);
projectRoutes.get("/workspace/:workspaceId/all", project_controller_1.getAllProjectsInWorkspaceController);
projectRoutes.get("/:id/workspace/:workspaceId/analytics", project_controller_1.getProjectAnalyticsController);
projectRoutes.get("/:id/workspace/:workspaceId", project_controller_1.getProjectByIdAndWorkspaceIdController);
// Activity routes
projectRoutes.get('/:id/activities', project_controller_1.getProjectActivitiesController);
projectRoutes.post('/:id/activities', project_controller_1.postProjectActivityController);
projectRoutes.patch('/activities/:activityId/pin', project_controller_1.pinProjectActivityController);
projectRoutes.patch('/activities/:activityId/unpin', project_controller_1.unpinProjectActivityController);
// File routes
projectRoutes.get('/:id/files', project_controller_1.getProjectFilesController);
projectRoutes.post('/:id/files', project_controller_1.upload.single('file'), project_controller_1.uploadProjectFileController);
// Download endpoint for project files (now by fileId)
projectRoutes.get('/files/download/:fileId', project_controller_1.downloadProjectFileController);
projectRoutes.delete('/files/:fileId', project_controller_1.deleteProjectFileController);
exports.default = projectRoutes;
