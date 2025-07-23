// Express route definitions for project-related API endpoints.
import { Router } from "express";
import { createProjectController,
    deleteProjectController,
    getAllProjectsInWorkspaceController,
    getProjectAnalyticsController,
    getProjectByIdAndWorkspaceIdController, 
    updateProjectController,
    getProjectActivitiesController,
    postProjectActivityController,
    pinProjectActivityController,
    unpinProjectActivityController,
    getProjectFilesController,
    uploadProjectFileController,
    upload,
    downloadProjectFileController,
    deleteProjectFileController } from "../controllers/project.controller";
import path from "path";
import fs from "fs";


const projectRoutes = Router(); 

projectRoutes.post("/workspace/:workspaceId/create", createProjectController);


projectRoutes.put(
  "/:id/workspace/:workspaceId/update",
  updateProjectController
);

projectRoutes.delete(
  "/:id/workspace/:workspaceId/delete",
  deleteProjectController
);
projectRoutes.get(
    "/workspace/:workspaceId/all",
    getAllProjectsInWorkspaceController); 
projectRoutes.get(
    "/:id/workspace/:workspaceId/analytics",
    getProjectAnalyticsController);   
projectRoutes.get('/:id/activities', getProjectActivitiesController);
projectRoutes.post('/:id/activities', postProjectActivityController);
projectRoutes.patch('/activities/:activityId/pin', pinProjectActivityController);
projectRoutes.patch('/activities/:activityId/unpin', unpinProjectActivityController);
projectRoutes.get('/:id/files', getProjectFilesController);
projectRoutes.post('/:id/files', upload.single('file'), uploadProjectFileController);

// Download endpoint for project files (now by fileId)
projectRoutes.get('/files/download/:fileId', downloadProjectFileController);
projectRoutes.delete('/files/:fileId', deleteProjectFileController);

projectRoutes.get(
    "/:id/workspace/:workspaceId",
    getProjectByIdAndWorkspaceIdController);     



export default projectRoutes ; 